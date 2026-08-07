import 'dotenv/config';
import express, { Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';
import { z } from 'zod';
import { query } from './db.js';
import { auth, AuthRequest } from './middleware/auth.js';
import { memoryService } from './services/MemoryService.js';
import { googleRouter } from './routes/googleIntegrations.js';
import { googleAccounts } from './services/GoogleAccountService.js';
import { calendarTool } from './tools/CalendarTool.js';
import { gmailTool } from './tools/GmailTool.js';
import { tasksRouter } from './routes/tasks.js';
import { moneyRouter } from './routes/money.js';
import { assistantPersonalities, buildAssistantStylePrompt, responseLengths } from './assistantStyle.js';

const app = express(); app.use(cors()); app.use(express.json({ limit: '1mb' }));
const secret = process.env.JWT_SECRET || 'development-only';
const credentials = z.object({ email: z.string().email(), password: z.string().min(8) });
const asyncRoute = (handler: (req: AuthRequest, res: Response) => Promise<unknown>) => async (req: AuthRequest, res: Response) => { try { await handler(req, res); } catch (error) { console.error(error); res.status(500).json({ error: 'Something went wrong. Please try again.' }); } };

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/integrations/google/callback', async (req,res)=>{try{const {userId}=googleAccounts.decodeState(String(req.query.state||''));await googleAccounts.exchange(userId,z.string().min(1).parse(req.query.code));res.redirect('myassistant://google-connected');}catch{res.redirect('myassistant://google-connected?error=1');}});
app.post('/api/auth/register', asyncRoute(async (req, res) => { const parsed = credentials.extend({ firstName: z.string().trim().min(1).max(80) }).safeParse(req.body); if (!parsed.success) { res.status(400).json({ error: 'Please provide a name, valid email, and password of at least 8 characters.' }); return; } const { firstName, email, password } = parsed.data; const hash = await bcrypt.hash(password, 12); try { const result = await query<{ id: string; first_name: string; email: string }>('INSERT INTO users(first_name,email,password_hash) VALUES($1,LOWER($2),$3) RETURNING id,first_name,email', [firstName,email,hash]); await query('INSERT INTO profiles(user_id) VALUES($1)', [result.rows[0].id]); const token = jwt.sign({ userId: result.rows[0].id }, secret, { expiresIn: '30d' }); res.status(201).json({ token, user: result.rows[0] }); } catch (e: any) { if (e.code === '23505') { res.status(409).json({ error: 'An account with that email already exists.' }); return; } throw e; } }));
app.post('/api/auth/login', asyncRoute(async (req, res) => { const parsed = credentials.safeParse(req.body); if (!parsed.success) { res.status(400).json({ error: 'Enter a valid email and password.' }); return; } const r = await query<{ id:string; first_name:string; email:string; password_hash:string }>('SELECT * FROM users WHERE email=LOWER($1)', [parsed.data.email]); const user = r.rows[0]; if (!user || !await bcrypt.compare(parsed.data.password, user.password_hash)) { res.status(401).json({ error: 'That email or password is not correct.' }); return; } res.json({ token: jwt.sign({ userId: user.id }, secret, { expiresIn: '30d' }), user: { id:user.id, firstName:user.first_name, email:user.email } }); }));

app.post('/api/chat/guest', asyncRoute(async(req,res)=>{ if(!process.env.OPENAI_API_KEY){res.status(503).json({error:'The assistant is not configured yet.'});return;} const body=z.object({message:z.string().trim().min(1).max(10000),history:z.array(z.object({role:z.enum(['user','assistant']),content:z.string().max(10000)})).max(10).optional(),assistantPersonality:z.enum(assistantPersonalities).optional(),responseLength:z.enum(responseLengths).optional()}).parse(req.body); const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY}); const style=buildAssistantStylePrompt({assistant_personality:body.assistantPersonality,response_length:body.responseLength}); const history=(body.history||[]).filter((_,index,array)=>!(index===array.length-1&&array[index].role==='user'&&array[index].content===body.message)); const completion=await openai.chat.completions.create({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',messages:[{role:'system',content:`${SYSTEM}\n\n${style}`},...history,{role:'user',content:body.message}]});res.json({response:completion.choices[0]?.message.content||'I am sorry, I could not form a response.',conversationId:'guest'}); }));

app.use('/api', auth);
app.use('/api/integrations/google', googleRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/money', moneyRouter);
app.get('/api/profile', asyncRoute(async (req,res) => { const r = await query<any>('SELECT u.first_name,p.country,p.assistant_personality,p.response_length,p.primary_help_category FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.id=$1',[req.userId]); if (!r.rows[0]) { res.status(404).json({error:'Profile not found.'}); return; } const p=r.rows[0]; res.json({firstName:p.first_name,country:p.country||'',assistantPersonality:p.assistant_personality,responseLength:p.response_length,primaryHelpCategory:p.primary_help_category||''}); }));
app.put('/api/profile', asyncRoute(async (req,res) => { const body=z.object({firstName:z.string().trim().min(1).optional(),country:z.string().trim().max(100).optional(),assistantPersonality:z.enum(assistantPersonalities).optional(),responseLength:z.enum(responseLengths).optional(),primaryHelpCategory:z.string().max(80).optional()}).parse(req.body); if(body.firstName) await query('UPDATE users SET first_name=$2 WHERE id=$1',[req.userId,body.firstName]); await query('UPDATE profiles SET country=COALESCE($2,country),assistant_personality=COALESCE($3,assistant_personality),response_length=COALESCE($4,response_length),primary_help_category=COALESCE($5,primary_help_category),updated_at=NOW() WHERE user_id=$1',[req.userId,body.country,body.assistantPersonality,body.responseLength,body.primaryHelpCategory]); const r=await query<any>('SELECT u.first_name,p.* FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.id=$1',[req.userId]); const p=r.rows[0]; res.json({firstName:p.first_name,country:p.country||'',assistantPersonality:p.assistant_personality,responseLength:p.response_length,primaryHelpCategory:p.primary_help_category||''}); }));
app.delete('/api/profile', asyncRoute(async(req,res)=>{await query('DELETE FROM users WHERE id=$1',[req.userId]);res.status(204).end();}));
app.put('/api/widget/preferences',asyncRoute(async(req,res)=>{const preferences=z.object({type:z.enum(['dailyBrief','money','calendar','tasks','minimal']),showMoney:z.boolean(),showCalendar:z.boolean(),showEmail:z.boolean(),showTasks:z.boolean(),showGreeting:z.boolean(),privacyMode:z.boolean()}).parse(req.body);await query('INSERT INTO widget_preferences(user_id,preferences,updated_at) VALUES($1,$2,NOW()) ON CONFLICT(user_id) DO UPDATE SET preferences=$2,updated_at=NOW()',[req.userId,JSON.stringify(preferences)]);res.json(preferences);}));
app.get('/api/memories', asyncRoute(async(req,res)=>res.json(await memoryService.getMemories(req.userId!))));
app.post('/api/memories', asyncRoute(async(req,res)=>{ const body=z.object({category:z.string().min(1).max(100),value:z.string().min(1).max(1000),source:z.string().max(40).optional(),confirmedByUser:z.literal(true)}).parse(req.body); res.status(201).json(await memoryService.addMemory(req.userId!,body)); }));
app.put('/api/memories/:id', asyncRoute(async(req,res)=>{ const body=z.object({category:z.string().min(1).max(100).optional(),value:z.string().min(1).max(1000).optional()}).parse(req.body); const item=await memoryService.updateMemory(req.userId!,req.params.id as string,body); if(!item){res.status(404).json({error:'Memory not found.'});return;} res.json(item); }));
app.delete('/api/memories/:id', asyncRoute(async(req,res)=>{await memoryService.deleteMemory(req.userId!,req.params.id as string);res.status(204).end();}));
app.delete('/api/memories', asyncRoute(async(req,res)=>{await memoryService.clearMemories(req.userId!);res.status(204).end();}));

async function connectedContext(userId:string,message:string){
  const lower=message.toLowerCase();
  try {
    if(/what.*(today|calendar)|schedule.*today/.test(lower)){const events=await calendarTool.today(userId);return `Requested calendar events today: ${JSON.stringify(events)}`;}
    if(/what.*tomorrow|schedule.*tomorrow/.test(lower)){const events=await calendarTool.tomorrow(userId);return `Requested calendar events tomorrow: ${JSON.stringify(events)}`;}
    if(/(email|mail).*(from|by)|did .*email me|find .*email/.test(lower)){const messages=await gmailTool.search(userId,message.slice(0,200));return `Relevant email search results: ${JSON.stringify(messages.map(({id,from,subject,date,snippet})=>({id,from,subject,date,snippet})))}`;}
  } catch { return 'The requested connected service could not be reached. Ask the user to reconnect it in Connected Services.'; }
  return '';
}
async function moneyContext(userId:string,message:string){
  if(!/(money|spend|spending|budget|bill|afford|saving|paycheck)/i.test(message)) return '';
  try {
    const [budget,bills,transactions]=await Promise.all([query<any>('SELECT * FROM budgets WHERE user_id=$1',[userId]),query<any>('SELECT name,amount,next_due_date FROM recurring_bills WHERE user_id=$1 AND active=true ORDER BY next_due_date',[userId]),query<any>("SELECT amount,type,transaction_date FROM transactions WHERE user_id=$1 AND transaction_date>=date_trunc('month',CURRENT_DATE) ORDER BY transaction_date DESC",[userId])]);
    const b=budget.rows[0]; if(!b)return 'The Money service needs more setup information.';
    const {calculateBudgetSummary}=await import('./services/BudgetService.js');
    const summary=calculateBudgetSummary({payFrequency:b.pay_frequency,typicalTakeHome:Number(b.typical_take_home),nextPayDate:String(b.next_pay_date).slice(0,10),monthlySavingsTarget:Number(b.monthly_savings_target)},bills.rows.map((x:any)=>({name:x.name,amount:Number(x.amount),nextDueDate:String(x.next_due_date).slice(0,10)})),transactions.rows.map((x:any)=>({amount:Number(x.amount),type:x.type,transactionDate:String(x.transaction_date).slice(0,10)})));
    return `Deterministic Money estimate for this question only: ${JSON.stringify({summary,bills:bills.rows.slice(0,5)})}. Call it an estimate, use plain language, and do not recalculate it or call it a bank balance.`;
  } catch { return 'Money details could not be loaded. Do not guess.'; }
}
const SYSTEM=`You are a practical personal assistant designed for people who may not be familiar with AI.
Use clear, everyday language. Avoid technical jargon unless requested. Do not overwhelm the user.
Give actionable answers. Do not claim to know personal facts unless they were provided in the current request or confirmed user memory.
If uncertain, say so clearly. Do not automatically save personal information as memory.
Never imply that something was saved. A memory is saved only through a separate, explicit user confirmation.
When a user asks to create, change, complete, postpone, rename, reprioritize, or delete a task or reminder, clearly summarize the proposed action and ask for confirmation. Never claim or attempt that an action happened until the user explicitly confirms it. Connected email and calendar information may inspire suggestions, but never creates tasks automatically.`;
app.post('/api/chat', asyncRoute(async(req,res)=>{ if(!process.env.OPENAI_API_KEY){res.status(503).json({error:'The assistant is not configured yet.'});return;} const body=z.object({message:z.string().trim().min(1).max(10000),conversationId:z.string().uuid().optional(),history:z.array(z.object({role:z.enum(['user','assistant']),content:z.string().max(10000)})).max(10).optional()}).parse(req.body); const profileResult=await query<any>('SELECT u.first_name,p.* FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.id=$1',[req.userId]); const profile=profileResult.rows[0]; const isMoney=/(money|spend|spending|budget|bill|afford|saving|paycheck)/i.test(body.message); const memories=isMoney?[]:await memoryService.getRelevantMemories(req.userId!,body.message); const integrationContext=isMoney?await moneyContext(req.userId!,body.message):await connectedContext(req.userId!,body.message); const context=`Request-only information: ${integrationContext||'none needed'}. ${buildAssistantStylePrompt(profile)} Country: ${profile?.country||'not provided'}. Confirmed relevant memories: ${memories.length?memories.map(m=>`${m.category}: ${m.value}`).join('; '):'none'}.`; let conversationId=body.conversationId; if(conversationId){const own=await query('SELECT id FROM conversations WHERE id=$1 AND user_id=$2',[conversationId,req.userId]);if(!own.rowCount)conversationId=undefined;} if(!conversationId){const c=await query<{id:string}>('INSERT INTO conversations(user_id,title) VALUES($1,$2) RETURNING id',[req.userId,body.message.slice(0,60)]);conversationId=c.rows[0].id;} await query('INSERT INTO messages(conversation_id,role,content) VALUES($1,$2,$3)',[conversationId,'user',body.message]); const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY}); const history=(body.history||[]).filter((_,index,array)=>!(index===array.length-1&&array[index].role==='user'&&array[index].content===body.message)); const completion=await openai.chat.completions.create({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',messages:[{role:'system',content:`${SYSTEM}\n\n${context}`},...history,{role:'user',content:body.message}]}); const response=completion.choices[0]?.message.content||'I am sorry, I could not form a response.'; await query('INSERT INTO messages(conversation_id,role,content) VALUES($1,$2,$3)',[conversationId,'assistant',response]); await query('UPDATE conversations SET updated_at=NOW() WHERE id=$1',[conversationId]);res.json({response,conversationId}); }));
app.use((_req,res)=>res.status(404).json({error:'Not found.'}));
const port=Number(process.env.PORT)||3000; if(process.env.NODE_ENV!=='test') app.listen(port,()=>console.log(`MyAssistant API listening on ${port}`));
export { app, SYSTEM };

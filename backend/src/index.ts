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

const app = express(); app.use(cors()); app.use(express.json({ limit: '1mb' }));
const secret = process.env.JWT_SECRET || 'development-only';
const credentials = z.object({ email: z.string().email(), password: z.string().min(8) });
const asyncRoute = (handler: (req: AuthRequest, res: Response) => Promise<void>) => async (req: AuthRequest, res: Response) => { try { await handler(req, res); } catch (error) { console.error(error); res.status(500).json({ error: 'Something went wrong. Please try again.' }); } };

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/integrations/google/callback', async (req,res)=>{try{const {userId}=googleAccounts.decodeState(String(req.query.state||''));await googleAccounts.exchange(userId,z.string().min(1).parse(req.query.code));res.redirect('myassistant://google-connected');}catch{res.redirect('myassistant://google-connected?error=1');}});
app.post('/api/auth/register', asyncRoute(async (req, res) => { const parsed = credentials.extend({ firstName: z.string().trim().min(1).max(80) }).safeParse(req.body); if (!parsed.success) { res.status(400).json({ error: 'Please provide a name, valid email, and password of at least 8 characters.' }); return; } const { firstName, email, password } = parsed.data; const hash = await bcrypt.hash(password, 12); try { const result = await query<{ id: string; first_name: string; email: string }>('INSERT INTO users(first_name,email,password_hash) VALUES($1,LOWER($2),$3) RETURNING id,first_name,email', [firstName,email,hash]); await query('INSERT INTO profiles(user_id) VALUES($1)', [result.rows[0].id]); const token = jwt.sign({ userId: result.rows[0].id }, secret, { expiresIn: '30d' }); res.status(201).json({ token, user: result.rows[0] }); } catch (e: any) { if (e.code === '23505') { res.status(409).json({ error: 'An account with that email already exists.' }); return; } throw e; } }));
app.post('/api/auth/login', asyncRoute(async (req, res) => { const parsed = credentials.safeParse(req.body); if (!parsed.success) { res.status(400).json({ error: 'Enter a valid email and password.' }); return; } const r = await query<{ id:string; first_name:string; email:string; password_hash:string }>('SELECT * FROM users WHERE email=LOWER($1)', [parsed.data.email]); const user = r.rows[0]; if (!user || !await bcrypt.compare(parsed.data.password, user.password_hash)) { res.status(401).json({ error: 'That email or password is not correct.' }); return; } res.json({ token: jwt.sign({ userId: user.id }, secret, { expiresIn: '30d' }), user: { id:user.id, firstName:user.first_name, email:user.email } }); }));

app.post('/api/chat/guest', asyncRoute(async(req,res)=>{ if(!process.env.OPENAI_API_KEY){res.status(503).json({error:'The assistant is not configured yet.'});return;} const body=z.object({message:z.string().trim().min(1).max(10000),history:z.array(z.object({role:z.enum(['user','assistant']),content:z.string().max(10000)})).max(10).optional()}).parse(req.body); const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY}); const completion=await openai.chat.completions.create({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',messages:[{role:'system',content:SYSTEM},...(body.history||[])]});res.json({response:completion.choices[0]?.message.content||'I am sorry, I could not form a response.',conversationId:'guest'}); }));

app.use('/api', auth);
app.use('/api/integrations/google', googleRouter);
app.get('/api/profile', asyncRoute(async (req,res) => { const r = await query<any>('SELECT u.first_name,p.country,p.preferred_response_style,p.primary_help_category FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.id=$1',[req.userId]); if (!r.rows[0]) { res.status(404).json({error:'Profile not found.'}); return; } const p=r.rows[0]; res.json({firstName:p.first_name,country:p.country||'',preferredResponseStyle:p.preferred_response_style,primaryHelpCategory:p.primary_help_category||''}); }));
app.put('/api/profile', asyncRoute(async (req,res) => { const body=z.object({firstName:z.string().trim().min(1).optional(),country:z.string().trim().max(100).optional(),preferredResponseStyle:z.enum(['Short and simple','Normal','Detailed']).optional(),primaryHelpCategory:z.string().max(80).optional()}).parse(req.body); if(body.firstName) await query('UPDATE users SET first_name=$2 WHERE id=$1',[req.userId,body.firstName]); await query('UPDATE profiles SET country=COALESCE($2,country),preferred_response_style=COALESCE($3,preferred_response_style),primary_help_category=COALESCE($4,primary_help_category),updated_at=NOW() WHERE user_id=$1',[req.userId,body.country,body.preferredResponseStyle,body.primaryHelpCategory]); const r=await query<any>('SELECT u.first_name,p.* FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.id=$1',[req.userId]); const p=r.rows[0]; res.json({firstName:p.first_name,country:p.country||'',preferredResponseStyle:p.preferred_response_style,primaryHelpCategory:p.primary_help_category||''}); }));
app.delete('/api/profile', asyncRoute(async(req,res)=>{await query('DELETE FROM users WHERE id=$1',[req.userId]);res.status(204).end();}));
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
const SYSTEM=`You are a practical personal assistant designed for people who may not be familiar with AI.
Use clear, everyday language. Avoid technical jargon unless requested. Do not overwhelm the user.
Give actionable answers. Do not claim to know personal facts unless they were provided in the current request or confirmed user memory.
If uncertain, say so clearly. Do not automatically save personal information as memory.
Never imply that something was saved. A memory is saved only through a separate, explicit user confirmation.`;
app.post('/api/chat', asyncRoute(async(req,res)=>{ if(!process.env.OPENAI_API_KEY){res.status(503).json({error:'The assistant is not configured yet.'});return;} const body=z.object({message:z.string().trim().min(1).max(10000),conversationId:z.string().uuid().optional(),history:z.array(z.object({role:z.enum(['user','assistant']),content:z.string().max(10000)})).max(10).optional()}).parse(req.body); const profileResult=await query<any>('SELECT u.first_name,p.* FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.id=$1',[req.userId]); const profile=profileResult.rows[0]; const memories=await memoryService.getRelevantMemories(req.userId!,body.message); const integrationContext=await connectedContext(req.userId!,body.message); const context=`Connected information for this request only: ${integrationContext||'none needed'}. Answer style: ${profile?.preferred_response_style||'Normal'}. Country: ${profile?.country||'not provided'}. Confirmed relevant memories: ${memories.length?memories.map(m=>`${m.category}: ${m.value}`).join('; '):'none'}.`; let conversationId=body.conversationId; if(conversationId){const own=await query('SELECT id FROM conversations WHERE id=$1 AND user_id=$2',[conversationId,req.userId]);if(!own.rowCount)conversationId=undefined;} if(!conversationId){const c=await query<{id:string}>('INSERT INTO conversations(user_id,title) VALUES($1,$2) RETURNING id',[req.userId,body.message.slice(0,60)]);conversationId=c.rows[0].id;} await query('INSERT INTO messages(conversation_id,role,content) VALUES($1,$2,$3)',[conversationId,'user',body.message]); const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY}); const completion=await openai.chat.completions.create({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',messages:[{role:'system',content:`${SYSTEM}\n\n${context}`},...(body.history||[])]}); const response=completion.choices[0]?.message.content||'I am sorry, I could not form a response.'; await query('INSERT INTO messages(conversation_id,role,content) VALUES($1,$2,$3)',[conversationId,'assistant',response]); await query('UPDATE conversations SET updated_at=NOW() WHERE id=$1',[conversationId]);res.json({response,conversationId}); }));
app.use((_req,res)=>res.status(404).json({error:'Not found.'}));
const port=Number(process.env.PORT)||3000; if(process.env.NODE_ENV!=='test') app.listen(port,()=>console.log(`MyAssistant API listening on ${port}`));
export { app, SYSTEM };

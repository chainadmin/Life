import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { WidgetBridge } from './WidgetBridge';
import { EmailMessage, WidgetData, WidgetPreferences } from '../types';

export const WIDGET_PREFERENCES_KEY='widget:preferences:v1';
export const defaultWidgetPreferences:WidgetPreferences={type:'dailyBrief',showMoney:true,showCalendar:true,showEmail:true,showTasks:true,showGreeting:true,privacyMode:true};
export async function getWidgetPreferences(){const value=await AsyncStorage.getItem(WIDGET_PREFERENCES_KEY);return value?{...defaultWidgetPreferences,...JSON.parse(value)}:defaultWidgetPreferences;}
export async function saveWidgetPreferences(preferences:WidgetPreferences){
  await AsyncStorage.setItem(WIDGET_PREFERENCES_KEY,JSON.stringify(preferences));
  const session=await AsyncStorage.getItem('session');
  if(session&&session!=='guest') api.saveWidgetPreferences(preferences).catch(()=>{});
  await WidgetDataService.refresh();
}
const needsAttention=(m:EmailMessage)=>!/(no-?reply|newsletter|digest|receipt|notification|promotion)/i.test(`${m.from} ${m.subject}`)&&/(\?|please|could you|can you|reply|confirm|approval|review)/i.test(`${m.subject} ${m.snippet}`);
const sameDay=(value:string,date:Date)=>new Date(value).toDateString()===date.toDateString();
const greetingFor=(date:Date)=>date.getHours()<12?'Good Morning':date.getHours()<18?'Good Afternoon':'Good Evening';
export const WidgetDataService={
  async refresh():Promise<WidgetData>{
    const preferences=await getWidgetPreferences(); const now=new Date();
    const [money,events,emails,tasks]=await Promise.all([
      api.moneySummary().catch(()=>null),api.calendarToday().catch(()=>[]),api.gmailUnread().catch(()=>[]),api.getTasks().catch(()=>[]),
    ]);
    const open=tasks.filter(t=>!t.completed); const due=open.filter(t=>t.dueDate&&sameDay(t.dueDate,now)).length;
    const overdue=open.filter(t=>t.dueDate&&new Date(t.dueDate)<now&&!sameDay(t.dueDate,now)).length;
    const next=[...events].filter(e=>new Date(e.start)>=now).sort((a,b)=>+new Date(a.start)-+new Date(b.start))[0];
    const amount=money?.availableToday??null;
    const data:WidgetData={greeting:greetingFor(now),updatedAt:now.toISOString(),money:{enabled:preferences.showMoney,availableToday:amount,text:preferences.privacyMode?'Budget updated':amount==null?'Budget not set':`$${Math.round(amount).toLocaleString()} available today`},calendar:{enabled:preferences.showCalendar,eventCount:events.length,nextEventTime:next?.start??null,nextEventTitle:preferences.privacyMode?(next?'Event':null):(next?.title??null)},email:{enabled:preferences.showEmail,attentionCount:emails.filter(needsAttention).length},tasks:{enabled:preferences.showTasks,dueToday:due,overdue}};
    await WidgetBridge.updateWidgetData(data); await WidgetBridge.reloadWidgets(); return data;
  }
};

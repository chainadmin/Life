import { googleCalendar } from '../services/GoogleCalendarService.js';
export class CalendarTool { today(userId:string){return googleCalendar.getTodayEvents(userId);} tomorrow(userId:string){return googleCalendar.getTomorrowEvents(userId);} freeTime(userId:string,date:string){return googleCalendar.getFreeTime(userId,date);} }
export const calendarTool=new CalendarTool();

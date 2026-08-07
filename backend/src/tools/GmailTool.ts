import { gmailService } from '../services/GmailService.js';
export class GmailTool { recent(userId:string,limit=5){return gmailService.getRecentInbox(userId,limit);} unread(userId:string){return gmailService.getUnreadMessages(userId);} search(userId:string,query:string){return gmailService.searchMessages(userId,query);} }
export const gmailTool=new GmailTool();

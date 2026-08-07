import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarEvent, EmailMessage, IntegrationStatus, Memory, Profile, RootTaskDraft, Task } from '../types';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem('session');
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}
export const api = {
  register: (body: object) => request<{ token: string; user: object }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: object) => request<{ token: string; user: object }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getProfile: () => request<Profile>('/profile'), updateProfile: (body: object) => request<Profile>('/profile', { method: 'PUT', body: JSON.stringify(body) }),
  getMemories: () => request<Memory[]>('/memories'), addMemory: (body: object) => request<Memory>('/memories', { method: 'POST', body: JSON.stringify(body) }),
  updateMemory: (id: string, body: object) => request<Memory>(`/memories/${id}`, { method: 'PUT', body: JSON.stringify(body) }), deleteMemory: (id: string) => request<void>(`/memories/${id}`, { method: 'DELETE' }),
  clearMemories: () => request<void>('/memories', { method: 'DELETE' }), deleteAccount: () => request<void>('/profile', { method: 'DELETE' }),
  integrationStatus:()=>request<IntegrationStatus>('/integrations/google/status'), connectGoogle:(feature:'calendar'|'gmail',calendarActions=false)=>request<{url:string}>('/integrations/google/connect',{method:'POST',body:JSON.stringify({feature,calendarActions})}), disconnectGoogle:(feature:'calendar'|'gmail')=>request<void>(`/integrations/google/${feature}`,{method:'DELETE'}),
  calendarToday:()=>request<CalendarEvent[]>('/integrations/google/calendar/today'),calendarTomorrow:()=>request<CalendarEvent[]>('/integrations/google/calendar/tomorrow'),calendarFree:(date:string)=>request<{start:string;end:string}[]>(`/integrations/google/calendar/free-time?date=${encodeURIComponent(date)}`),createCalendarEvent:(body:object)=>request<CalendarEvent>('/integrations/google/calendar/events',{method:'POST',body:JSON.stringify(body)}),
  gmailRecent:()=>request<EmailMessage[]>('/integrations/google/gmail/recent'),gmailUnread:()=>request<EmailMessage[]>('/integrations/google/gmail/unread'),gmailSearch:(q:string)=>request<EmailMessage[]>(`/integrations/google/gmail/search?q=${encodeURIComponent(q)}`),gmailMessage:(id:string)=>request<EmailMessage>(`/integrations/google/gmail/message/${encodeURIComponent(id)}`),suggestReply:(messageId:string)=>request<{to:string;subject:string;body:string}>('/integrations/google/gmail/suggest-reply',{method:'POST',body:JSON.stringify({messageId})}),saveDraft:(body:object)=>request('/integrations/google/gmail/draft',{method:'POST',body:JSON.stringify(body)}),
  getTasks:()=>request<Task[]>('/tasks'),createTask:(body:RootTaskDraft)=>request<Task>('/tasks',{method:'POST',body:JSON.stringify(body)}),updateTask:(id:string,body:Partial<RootTaskDraft>)=>request<Task>(`/tasks/${id}`,{method:'PUT',body:JSON.stringify(body)}),deleteTask:(id:string)=>request<void>(`/tasks/${id}`,{method:'DELETE'}),completeTask:(id:string,completed=true)=>request<Task>('/tasks/complete',{method:'POST',body:JSON.stringify({id,completed})}),postponeTask:(id:string,dueDate:string,reminderDate?:string|null)=>request<Task>('/tasks/postpone',{method:'POST',body:JSON.stringify({id,dueDate,reminderDate})}),
  chat: async (body: object) => request<{ response: string; conversationId: string }>((await AsyncStorage.getItem('session')) === 'guest' ? '/chat/guest' : '/chat', { method: 'POST', body: JSON.stringify(body) })
};

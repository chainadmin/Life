import AsyncStorage from '@react-native-async-storage/async-storage';
import { Memory, Profile } from '../types';
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
  chat: async (body: object) => request<{ response: string; conversationId: string }>((await AsyncStorage.getItem('session')) === 'guest' ? '/chat/guest' : '/chat', { method: 'POST', body: JSON.stringify(body) })
};

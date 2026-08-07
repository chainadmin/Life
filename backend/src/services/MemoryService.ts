import { query } from '../db.js';
export type MemoryRow = { id: string; user_id: string; category: string; value: string; source: string; confirmed_by_user: boolean; created_at: Date; updated_at: Date };
const publicMemory = (m: MemoryRow) => ({ id: m.id, category: m.category, value: m.value, source: m.source, confirmedByUser: m.confirmed_by_user, createdAt: m.created_at, updatedAt: m.updated_at });
export class MemoryService {
  async getMemories(userId: string) { const r = await query<MemoryRow>('SELECT * FROM memories WHERE user_id=$1 AND confirmed_by_user=true ORDER BY updated_at DESC', [userId]); return r.rows.map(publicMemory); }
  async addMemory(userId: string, input: { category: string; value: string; source?: string; confirmedByUser: boolean }) { if (!input.confirmedByUser) throw new Error('Memory must be confirmed by the user'); const r = await query<MemoryRow>('INSERT INTO memories (user_id,category,value,source,confirmed_by_user) VALUES ($1,$2,$3,$4,true) RETURNING *', [userId, input.category, input.value, input.source || 'user']); return publicMemory(r.rows[0]); }
  async updateMemory(userId: string, id: string, input: { category?: string; value?: string }) { const r = await query<MemoryRow>('UPDATE memories SET category=COALESCE($3,category), value=COALESCE($4,value), updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *', [id, userId, input.category, input.value]); return r.rows[0] ? publicMemory(r.rows[0]) : null; }
  async deleteMemory(userId: string, id: string) { await query('DELETE FROM memories WHERE id=$1 AND user_id=$2', [id, userId]); }
  async clearMemories(userId: string) { await query('DELETE FROM memories WHERE user_id=$1', [userId]); }
  async getRelevantMemories(userId: string, userQuery: string) { const all = await this.getMemories(userId); const words = new Set(userQuery.toLowerCase().match(/[a-z]{3,}/g) || []); const scored = all.map(m => ({ m, score: `${m.category} ${m.value}`.toLowerCase().split(/\W+/).filter(w => words.has(w)).length })).filter(x => x.score > 0).sort((a,b) => b.score-a.score).slice(0, 8).map(x => x.m); return scored; }
}
export const memoryService = new MemoryService();

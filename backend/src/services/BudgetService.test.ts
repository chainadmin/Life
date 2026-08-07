import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBudgetSummary, canAfford } from './BudgetService.js';
test('returns a cautious missing-data response',()=>{const r=calculateBudgetSummary(null,[],[],new Date('2026-08-07T12:00:00Z'));assert.equal(r.availableToday,null);assert.equal(r.confidence,'low');});
test('subtracts bills, savings, and recorded expenses deterministically',()=>{const r=calculateBudgetSummary({payFrequency:'weekly',typicalTakeHome:1000,nextPayDate:'2026-08-11',monthlySavingsTarget:310},[{name:'Electric',amount:100,nextDueDate:'2026-08-10'}],[{amount:50,type:'expense',transactionDate:'2026-08-07'}],new Date('2026-08-07T12:00:00'));assert.equal(r.availableUntilNextPay,800);assert.equal(r.availableToday,160);assert.equal(r.nextBill?.name,'Electric');});
test('affordability preserves the deterministic remainder',()=>{const r=canAfford(300,{availableToday:100,availableUntilNextPay:342,nextPayDate:'2026-08-11',nextBill:null,plainEnglishSummary:'',confidence:'medium'});assert.equal(r.remaining,42);assert.match(r.message,/\$42/);});

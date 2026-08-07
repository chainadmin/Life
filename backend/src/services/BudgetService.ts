export type BudgetInput = {
  typicalTakeHome: number;
  payFrequency: 'weekly' | 'every_2_weeks' | 'twice_monthly' | 'monthly' | 'other';
  nextPayDate: string;
  monthlySavingsTarget: number;
};
export type BillInput = { id?: string; name: string; amount: number; nextDueDate: string; active?: boolean };
export type TransactionInput = { amount: number; type: 'expense' | 'income'; transactionDate: string };

export type BudgetSummary = {
  availableToday: number | null;
  availableUntilNextPay: number | null;
  nextPayDate: string | null;
  nextBill: BillInput | null;
  plainEnglishSummary: string;
  confidence: 'low' | 'medium';
};

const day = 86_400_000;
const money = (value: number) => Math.max(0, Math.round(value * 100) / 100);

/** Deterministic planning estimate. This never represents a confirmed bank balance. */
export function calculateBudgetSummary(budget: BudgetInput | null, bills: BillInput[], transactions: TransactionInput[], now = new Date()): BudgetSummary {
  if (!budget || !budget.typicalTakeHome || !budget.nextPayDate) return { availableToday: null, availableUntilNextPay: null, nextPayDate: null, nextBill: null, plainEnglishSummary: 'I need a little more budget information before I can estimate this.', confidence: 'low' };
  const payDate = new Date(`${budget.nextPayDate}T23:59:59`);
  if (Number.isNaN(+payDate) || payDate < now) return { availableToday: null, availableUntilNextPay: null, nextPayDate: budget.nextPayDate, nextBill: null, plainEnglishSummary: 'Update your next payday so I can estimate what is available.', confidence: 'low' };
  const upcoming = bills.filter(b => b.active !== false && new Date(`${b.nextDueDate}T00:00:00`) <= payDate && new Date(`${b.nextDueDate}T23:59:59`) >= now).sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  const since = new Date(now.getFullYear(), now.getMonth(), 1);
  const spending = transactions.filter(t => t.type === 'expense' && new Date(t.transactionDate) >= since && new Date(t.transactionDate) <= payDate).reduce((sum, t) => sum + Number(t.amount), 0);
  const extraIncome = transactions.filter(t => t.type === 'income' && new Date(t.transactionDate) >= now && new Date(t.transactionDate) <= payDate).reduce((sum, t) => sum + Number(t.amount), 0);
  const monthlyDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, Math.ceil((+payDate - +now) / day));
  const savingsBeforePay = Number(budget.monthlySavingsTarget || 0) * Math.min(1, daysRemaining / monthlyDays);
  const availableUntilNextPay = money(Number(budget.typicalTakeHome) + extraIncome - upcoming.reduce((sum, b) => sum + Number(b.amount), 0) - savingsBeforePay - spending);
  const availableToday = money(availableUntilNextPay / daysRemaining);
  return { availableToday, availableUntilNextPay, nextPayDate: budget.nextPayDate, nextBill: upcoming[0] || null, plainEnglishSummary: `Based on what you entered, you have roughly $${Math.round(availableToday).toLocaleString()} available today.`, confidence: bills.length ? 'medium' : 'low' };
}

export function canAfford(amount: number, summary: BudgetSummary) {
  if (summary.availableUntilNextPay == null) return { canAfford: null, remaining: null, message: 'I need a little more budget information before I can estimate this.' };
  const remaining = Math.round((summary.availableUntilNextPay - amount) * 100) / 100;
  if (remaining >= 0) return { canAfford: true, remaining, message: `You could buy it, but it would leave you with about $${Math.round(remaining).toLocaleString()} for flexible spending until your next paycheck.` };
  return { canAfford: false, remaining, message: `I’d wait until your next paycheck. You are about $${Math.round(Math.abs(remaining)).toLocaleString()} short after the bills and savings you entered.` };
}

export interface BankConnectionService { connectBank(): Promise<never>; disconnectBank(): Promise<never>; syncAccounts(): Promise<never>; syncTransactions(): Promise<never>; getAccounts(): Promise<never>; }
const unavailable = async (): Promise<never> => { throw new Error('Bank connections are not enabled yet.'); };
export const bankConnectionService: BankConnectionService = { connectBank: unavailable, disconnectBank: unavailable, syncAccounts: unavailable, syncTransactions: unavailable, getAccounts: unavailable };

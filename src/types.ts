export type AnswerStyle = 'Short and simple' | 'Normal' | 'Detailed';
export type Profile = { firstName: string; country: string; preferredResponseStyle: AnswerStyle; primaryHelpCategory: string };
export type Memory = { id: string; category: string; value: string; source: string; confirmedByUser: boolean };
export type Message = { id: string; role: 'user' | 'assistant'; content: string };
export type RootStackParamList = { Welcome: undefined; Login: undefined; Register: undefined; FirstSetup: { firstName?: string; token?: string; guest?: boolean } | undefined; Main: undefined; Guided: { category: string }; Chat: { category?: string; prompt?: string } | undefined };
export type TabParamList = { Home: undefined; Memory: undefined; Settings: undefined };

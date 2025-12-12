export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
}

export interface AccountSummary {
  accountHolder: string;
  accountNumber: string;
  statementPeriod: string;
  currency: string;
  totalIncome: number;
  totalExpenses: number;
  openingBalance: number;
  closingBalance: number;
}

export interface ParsedStatement {
  summary: AccountSummary;
  transactions: Transaction[];
  insights: string[]; // Key patterns identified by AI
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  DASHBOARD = 'DASHBOARD',
  ERROR = 'ERROR'
}
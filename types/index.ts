export interface User {
  id: number;
  username: string;
  passwordHash: string;
  name: string;
}

export interface Client {
  id: number;
  userId: number;
  name: string;
  phone: string;
  email: string;
  company: string;
  industry: string;
}

export interface Prospect {
  id: number;
  userId: number;
  name: string;
  phone: string;
  email: string;
  company: string;
  status: "New" | "Contacted" | "Qualified" | "Won";
  followUpDate: string;
}

export interface Sale {
  id: number;
  clientId: number;
  date: string;
  amount: number;
  productOrService: string;
}

export interface FollowUp {
  id: number;
  entityId: number;
  isClient: 0 | 1;
  date: string;
  notes: string;
  isCompleted: 0 | 1;
}

export interface PhoneNumber {
  id: number;
  userId: number;
  number: string;
  lastCalledDate: string;
  isProspect: 0 | 1;
  prospectId: number | null;
}

export interface CallLog {
  id: number;
  phoneNumberId: number;
  date: string;
  feedback: "Successful" | "Busy" | "Not Answered" | "DNC" | "Connected-Lead";
  duration: number;
  shortNotes: string;
  nextFollowUpDate: string | null;
}

export interface DailyCallStats {
  totalCalls: number;
  successful: number;
  busy: number;
  notAnswered: number;
  dnc: number;
  leads: number;
}

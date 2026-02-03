
export enum UserRole {
  ADMIN = 'ADMIN',
  AGENT = 'ASSISTANT'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  password?: string;
  lastLogin?: string;
}

export enum MaintenanceStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum EntryType {
  REVENUE = 'REVENUE',
  EXPENSE_SIMPLE = 'EXPENSE',
  EXPENSE_MAINTENANCE = 'MAINTENANCE'
}

export interface MaintenanceConfig {
  type: string;
  intervalKm: number;
  // Previously nextNotifyKm, now a specific odometer target
  nextDueKm: number;
  lastPerformedKm?: number;
}

export interface Vehicle {
  id: string;
  name: string;
  model?: string;
  year?: number;
  registrationNumber?: string;
  photo?: string;
  image?: string;
  registrationDate: string;
  purchasePrice: number;
  salePrice?: number;
  lastMileage: number;
  isArchived: boolean;
  maintenanceConfigs: MaintenanceConfig[];
}

export interface FinancialEntry {
  id: string;
  vehicleId?: string;
  date: string;
  amount: number;
  type: EntryType;
  description: string; // Replaces designation
  mileageAtEntry?: number;
  status?: MaintenanceStatus;
  maintenanceType?: string;
  agentName?: string;
  proofPhoto?: string;
  info?: string; // For backward compatibility with some components

  // Backward compatibility optional fields
  designation?: string;
  userName?: string;
  createdAt?: string;

}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId: string; // Admin ID or Agent ID
  text: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  vehicleId: string;
  vehicleName: string;
  type: string;
  message: string;
  targetKm: number;
  createdAt: string;
  isRead: boolean;
  isCritical: boolean;
}

export interface GlobalExpense {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
}


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
  isActive?: boolean;
}

export interface HistoricalStats {
  id: string;
  accumulatedRevenue: number;
  accumulatedExpenses: number;
  accumulatedProfit: number;
  lastPurgeDate: string;
}

export enum MaintenanceStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum EntryType {
  REVENUE = 'REVENUE',
  EXPENSE_SIMPLE = 'EXPENSE',
  EXPENSE_MAINTENANCE = 'MAINTENANCE',
  FUNDING = 'FUNDING'
}

export interface MaintenanceConfig {
  type: string;
  intervalKm: number;
  nextDueKm: number;
  lastPerformedKm?: number;
}

export interface Vehicle {
  id: string;
  name: string;
  registrationNumber: string;
  model?: string;
  year?: number;
  photo?: string;
  image?: string;
  registrationDate: string;
  purchasePrice: number;
  lastMileage: number;
  mileageUpdatedBy?: string;
  isArchived: boolean;
  salePrice?: number;
  saleDate?: string;
  simulatedSalePrice?: number;
  maintenanceConfigs: MaintenanceConfig[];
  documents?: VehicleDocument[];
}

export interface VehicleDocument {
  id: string;
  type: string;
  expirationDate: string;
  photo?: string;
  alertDaysBefore: number;
}

export interface CashDesk {
  id: string;
  userId: string;
  userName: string;
  balance: number;
  createdAt: string;
}

export interface FinancialEntry {
  id: string;
  vehicleId?: string;
  cashDeskId?: string;
  date: string;
  amount: number;
  type: EntryType;
  description: string;
  mileageAtEntry?: number;
  status?: MaintenanceStatus;
  maintenanceType?: string;
  agentName?: string;
  proofPhoto?: string;
  info?: string;
  designation?: string;
  userName?: string;
  signature?: string;
  createdAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId: string;
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
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
}

export interface GlobalExpense {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
  proofPhoto?: string;
  agentName?: string;
  cashDeskId?: string;
}


export enum UserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT'
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
  EXPENSE_SIMPLE = 'EXPENSE_SIMPLE',
  EXPENSE_MAINTENANCE = 'EXPENSE_MAINTENANCE'
}

export interface MaintenanceConfig {
  type: string;
  intervalKm: number;
  lastKm: number;
  nextNotifyKm: number;
}

export interface Vehicle {
  id: string;
  name: string;
  photo: string;
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
  date: string; // ISO String for filtering by day
  createdAt: string; // Real creation time
  amount: number;
  type: EntryType;
  designation: string;
  clientName?: string;
  info?: string;
  userName: string;
  proofPhoto?: string;
  mileageAtEntry?: number;
  status?: MaintenanceStatus; 
  maintenanceType?: string;
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

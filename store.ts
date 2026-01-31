import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Vehicle, FinancialEntry, Notification, User, UserRole, MaintenanceStatus, EntryType } from './types.ts';

const SUPABASE_URL = 'https://zxxrazexrwokihbzhina.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Nr7EYzoE9HkOyncjhPTLSw_R6Dm0-1W';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const getLocal = (key: string, def: any) => {
  try {
    const data = localStorage.getItem(`anistour_${key}`);
    return data ? JSON.parse(data) : def;
  } catch (e) {
    return def;
  }
};

const setLocal = (key: string, data: any) => {
  try {
    localStorage.setItem(`anistour_${key}`, JSON.stringify(data));
  } catch (e) {}
};

export function useFleetStore() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getLocal('vehicles', []));
  const [entries, setEntries] = useState<FinancialEntry[]>(() => getLocal('entries', []));
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>(() => getLocal('users', []));
  const [appLogo, setAppLogoState] = useState<string>(() => getLocal('logo', ''));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const fetchData = useCallback(async () => {
    setIsCloudSyncing(true);
    try {
      const { data: vData } = await supabase.from('vehicles').select('*');
      if (vData) { setVehicles(vData); setLocal('vehicles', vData); }

      const { data: eData } = await supabase.from('entries').select('*').order('date', { ascending: false });
      if (eData) { setEntries(eData); setLocal('entries', eData); }

      const { data: uData } = await supabase.from('users').select('*');
      if (uData && uData.length > 0) { 
        setUsers(uData); 
        setLocal('users', uData); 
      } else {
        const admin = { id: 'admin_1', name: 'Admin Anistour', role: UserRole.ADMIN, email: 'anisbelhadjamara@gmail.com', password: 'Azerty2026' };
        setUsers([admin]);
        setLocal('users', [admin]);
      }
      setIsDataLoaded(true);
    } catch (error) {
      console.error("Cloud Sync Error:", error);
      setIsDataLoaded(true);
    } finally {
      setIsCloudSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const newNotifs: Notification[] = [];
    vehicles.forEach(v => {
      if (v.isArchived) return;
      v.maintenanceConfigs?.forEach(cfg => {
        const kmLeft = cfg.nextNotifyKm - v.lastMileage;
        if (kmLeft <= 500) {
          newNotifs.push({
            id: `notif-${v.id}-${cfg.type}`,
            vehicleId: v.id,
            vehicleName: v.name,
            type: cfg.type,
            message: kmLeft <= 0 ? `URGENT : ${cfg.type} à faire !` : `Rappel : ${cfg.type} dans ${kmLeft} KM`,
            targetKm: cfg.nextNotifyKm,
            createdAt: new Date().toISOString(),
            isRead: false,
            isCritical: kmLeft <= 0
          });
        }
      });
    });
    setNotifications(newNotifs);
  }, [vehicles]);

  const addVehicle = async (v: Vehicle) => {
    setVehicles(prev => [...prev, v]);
    await supabase.from('vehicles').insert([v]);
  };

  const addEntry = async (e: FinancialEntry) => {
    setEntries(prev => [e, ...prev]);
    if (e.vehicleId && e.mileageAtEntry) {
      const updatedVehicles = vehicles.map(v => 
        v.id === e.vehicleId && e.mileageAtEntry! > v.lastMileage 
        ? { ...v, lastMileage: e.mileageAtEntry! } 
        : v
      );
      setVehicles(updatedVehicles);
      await supabase.from('vehicles').update({ lastMileage: e.mileageAtEntry }).eq('id', e.vehicleId);
    }
    await supabase.from('entries').insert([e]);
  };

  const approveMaintenance = async (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry || !entry.vehicleId) return;

    const vehicle = vehicles.find(v => v.id === entry.vehicleId);
    if (vehicle) {
      const newConfigs = vehicle.maintenanceConfigs.map(cfg => {
        if (cfg.type === entry.maintenanceType) {
          const lastKm = entry.mileageAtEntry || vehicle.lastMileage;
          const interval = cfg.intervalKm || 7000;
          return { ...cfg, lastKm, nextNotifyKm: lastKm + interval };
        }
        return cfg;
      });
      setVehicles(prev => prev.map(v => v.id === entry.vehicleId ? { ...v, maintenanceConfigs: newConfigs } : v));
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, status: MaintenanceStatus.APPROVED } : e));
      await supabase.from('vehicles').update({ maintenanceConfigs: newConfigs }).eq('id', entry.vehicleId);
      await supabase.from('entries').update({ status: MaintenanceStatus.APPROVED }).eq('id', entryId);
    }
  };

  const archiveVehicle = async (id: string, salePrice: number) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, isArchived: true, salePrice } : v));
    await supabase.from('vehicles').update({ isArchived: true, salePrice }).eq('id', id);
  };

  const getFinancialStats = () => {
    const validEntries = entries.filter(e => e.status !== MaintenanceStatus.REJECTED);
    const revenue = validEntries.filter(e => e.type === EntryType.REVENUE).reduce((sum, e) => sum + e.amount, 0);
    const expenses = validEntries.filter(e => e.type === EntryType.EXPENSE_SIMPLE || (e.type === EntryType.EXPENSE_MAINTENANCE && e.status === MaintenanceStatus.APPROVED)).reduce((sum, e) => sum + e.amount, 0);
    const purchaseTotal = vehicles.reduce((sum, v) => sum + v.purchasePrice, 0);
    const salesTotal = vehicles.filter(v => v.isArchived).reduce((sum, v) => sum + (v.salePrice || 0), 0);
    const netProfit = revenue - expenses - (purchaseTotal - salesTotal);
    
    let firstDate = new Date();
    vehicles.forEach(v => {
      const d = new Date(v.registrationDate);
      if (d < firstDate) firstDate = d;
    });
    const diffMonths = Math.max(1, Math.floor((new Date().getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
    
    return { revenue, expenses, netProfit, monthlyProfit: netProfit / diffMonths, activeCount: vehicles.filter(v => !v.isArchived).length };
  };

  return {
    vehicles, entries, notifications, users, appLogo, currentUser, isCloudSyncing, isDataLoaded,
    setCurrentUser, setAppLogo: (logo: string) => { setAppLogoState(logo); setLocal('logo', logo); },
    addVehicle, addEntry, approveMaintenance, 
    rejectMaintenance: async (id: string) => {
       setEntries(prev => prev.map(e => e.id === id ? { ...e, status: MaintenanceStatus.REJECTED } : e));
       await supabase.from('entries').update({ status: MaintenanceStatus.REJECTED }).eq('id', id);
    },
    archiveVehicle, addUser: async (u: User) => { setUsers(prev => [...prev, u]); await supabase.from('users').insert([u]); },
    deleteUser: async (id: string) => { setUsers(prev => prev.filter(u => u.id !== id)); await supabase.from('users').delete().eq('id', id); },
    getFinancialStats, resetPassword: async (uid: string, pass: string) => {
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, password: pass } : u));
      await supabase.from('users').update({ password: pass }).eq('id', uid);
    }
  };
}
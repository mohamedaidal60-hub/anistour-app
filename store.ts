import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Vehicle, FinancialEntry, Notification, User, UserRole, MaintenanceStatus, EntryType, GlobalExpense, Message } from './types.ts';

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
  } catch (e) { }
};

export function useFleetStore() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getLocal('vehicles', []));
  const [entries, setEntries] = useState<FinancialEntry[]>(() => getLocal('entries', []));
  const [globalExpenses, setGlobalExpenses] = useState<GlobalExpense[]>(() => getLocal('global_expenses', []));
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>(() => getLocal('users', []));
  const [appLogo, setAppLogoState] = useState<string>(() => getLocal('logo', ''));
  const [currentUser, setCurrentUserState] = useState<User | null>(() => getLocal('current_user', null));
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Wrapper to save user persistence
  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    setLocal('current_user', user);
  };

  const fetchData = useCallback(async () => {
    setIsCloudSyncing(true);
    try {
      const { data: vData } = await supabase.from('vehicles').select('*');
      if (vData) {
        setVehicles(vData);
        setLocal('vehicles', vData);
      }

      const { data: eData } = await supabase.from('entries').select('*').order('date', { ascending: false });
      if (eData) {
        setEntries(eData);
        setLocal('entries', eData);
      }

      const { data: gData } = await supabase.from('global_expenses').select('*').order('date', { ascending: false });
      if (gData) {
        setGlobalExpenses(gData);
        setLocal('global_expenses', gData);
      }

      const { data: mData } = await supabase.from('messages').select('*').order('timestamp', { ascending: true });
      if (mData) {
        setMessages(mData);
      }

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

    // Supabase Realtime Subscriptions for multi-user sync
    const vehiclesChannel = supabase
      .channel('vehicles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, (payload) => {
        console.log('Vehicle change detected:', payload);
        fetchData(); // Refresh all data when vehicles change
      })
      .subscribe();

    const entriesChannel = supabase
      .channel('entries_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, (payload) => {
        console.log('Entry change detected:', payload);
        fetchData(); // Refresh all data when entries change
      })
      .subscribe();

    const expensesChannel = supabase
      .channel('expenses_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_expenses' }, (payload) => {
        console.log('Global expense change detected:', payload);
        fetchData(); // Refresh all data when expenses change
      })
      .subscribe();

    const messagesChannel = supabase
      .channel('messages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        console.log('Message detected:', payload);
        fetchData();
      })
      .subscribe();

    const usersChannel = supabase
      .channel('users_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        console.log('User change detected:', payload);
        fetchData(); // Refresh all data when users change
      })
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(vehiclesChannel);
      supabase.removeChannel(entriesChannel);
      supabase.removeChannel(expensesChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(usersChannel);
    };
  }, [fetchData]);

  // Keep localStorage in sync as cache only (removed auto-persist on every state change)
  // localStorage will only update when data comes from Supabase

  useEffect(() => {
    const newNotifs: Notification[] = [];
    vehicles.forEach(v => {
      if (v.isArchived) return;
      v.maintenanceConfigs?.forEach(cfg => {
        // Logic: Alert if within 500km of the target
        const kmLeft = cfg.nextDueKm - v.lastMileage;
        if (kmLeft <= 500) {
          newNotifs.push({
            id: `notif-${v.id}-${cfg.type}`,
            vehicleId: v.id,
            vehicleName: v.name,
            type: cfg.type,
            message: kmLeft <= 0
              ? `URGENT : ${cfg.type} dépassé de ${Math.abs(kmLeft)} KM !`
              : `Rappel : ${cfg.type} prévu à ${cfg.nextDueKm} KM (dans ${kmLeft} KM)`,
            targetKm: cfg.nextDueKm,
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

  const updateVehicle = async (updatedV: Vehicle) => {
    setVehicles(prev => prev.map(v => v.id === updatedV.id ? updatedV : v));
    await supabase.from('vehicles').update(updatedV).eq('id', updatedV.id);
  };

  const updateVehicleMileage = async (vehicleId: string, newMileage: number, agentName: string) => {
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, lastMileage: newMileage, mileageUpdatedBy: agentName } : v));
    await supabase.from('vehicles').update({ lastMileage: newMileage, mileageUpdatedBy: agentName }).eq('id', vehicleId);
  };

  const addEntry = async (e: FinancialEntry) => {
    // Attach agent name if not present
    if (!e.agentName && currentUser) e.agentName = currentUser.name;

    setEntries(prev => [e, ...prev]);

    // Update vehicle mileage if this entry has higher mileage
    if (e.vehicleId && e.mileageAtEntry) {
      const vehicle = vehicles.find(v => v.id === e.vehicleId);
      if (vehicle && e.mileageAtEntry > vehicle.lastMileage) {
        const updatedVehicle = { ...vehicle, lastMileage: e.mileageAtEntry };
        setVehicles(prev => prev.map(v => v.id === e.vehicleId ? updatedVehicle : v));
        await supabase.from('vehicles').update({ lastMileage: e.mileageAtEntry }).eq('id', e.vehicleId);
      }
    }
    await supabase.from('entries').insert([e]);
  };

  const addGlobalExpense = async (e: GlobalExpense) => {
    setGlobalExpenses(prev => [e, ...prev]);
    await supabase.from('global_expenses').insert([e]);
  };

  const approveMaintenance = async (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry || !entry.vehicleId) return;

    const vehicle = vehicles.find(v => v.id === entry.vehicleId);
    if (vehicle) {
      const newConfigs = vehicle.maintenanceConfigs.map(cfg => {
        if (cfg.type === entry.maintenanceType) {
          // Maintenance done. Next target is roughly Current + Interval
          // We assume the mileageAtEntry is correct for when it was done
          const doneAt = entry.mileageAtEntry || vehicle.lastMileage;
          const nextTarget = doneAt + cfg.intervalKm;
          return { ...cfg, lastPerformedKm: doneAt, nextDueKm: nextTarget };
        }
        return cfg;
      });

      const updatedVehicle = { ...vehicle, maintenanceConfigs: newConfigs };
      setVehicles(prev => prev.map(v => v.id === entry.vehicleId ? updatedVehicle : v));
      await supabase.from('vehicles').update({ maintenanceConfigs: newConfigs }).eq('id', entry.vehicleId);

      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, status: MaintenanceStatus.APPROVED } : e));
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

    // Vehicle specifics
    const vehicleExpenses = validEntries.filter(e => e.type !== EntryType.REVENUE).reduce((sum, e) => sum + e.amount, 0);

    // Global expenses
    const globalTotal = globalExpenses.reduce((sum, e) => sum + e.amount, 0);

    const purchaseTotal = vehicles.reduce((sum, v) => sum + v.purchasePrice, 0);
    const salesTotal = vehicles.filter(v => v.isArchived).reduce((sum, v) => sum + (v.salePrice || 0), 0);

    const totalExpenses = vehicleExpenses + globalTotal;
    const netProfit = revenue - totalExpenses - (purchaseTotal - salesTotal);

    // Cost per vehicle logic
    const activeVehicles = vehicles.filter(v => !v.isArchived);
    const costPerVehicle = activeVehicles.length > 0 ? (globalTotal / activeVehicles.length) : 0;

    let firstDate = new Date();
    vehicles.forEach(v => {
      const d = new Date(v.registrationDate);
      if (d < firstDate) firstDate = d;
    });
    const diffMonths = Math.max(1, Math.floor((new Date().getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));

    return {
      revenue,
      vehicleExpenses,
      globalExpenses: globalTotal,
      totalExpenses,
      netProfit,
      monthlyProfit: netProfit / diffMonths,
      costPerVehicle, // New metric
      activeCount: activeVehicles.length
    };
  };

  return {
    vehicles,
    entries,
    globalExpenses,
    messages,
    notifications,
    users,
    appLogo,
    currentUser,
    isCloudSyncing,
    isDataLoaded,
    setCurrentUser,
    setAppLogo: (logo: string) => { setAppLogoState(logo); setLocal('logo', logo); },
    addVehicle,
    updateVehicle,
    updateVehicleMileage,
    addEntry,
    addGlobalExpense,
    approveMaintenance,
    rejectMaintenance: async (id: string) => {
      setEntries(prev => prev.map(e => e.id === id ? { ...e, status: MaintenanceStatus.REJECTED } : e));
      await supabase.from('entries').update({ status: MaintenanceStatus.REJECTED }).eq('id', id);
    },
    archiveVehicle,
    addUser: async (u: User) => { setUsers(prev => [...prev, u]); await supabase.from('users').insert([u]); },
    deleteUser: async (id: string) => { setUsers(prev => prev.filter(u => u.id !== id)); await supabase.from('users').delete().eq('id', id); },
    deleteEntry: async (id: string) => {
      setEntries(prev => prev.filter(e => e.id !== id));
      await supabase.from('entries').delete().eq('id', id);
    },
    updateEntry: async (entry: FinancialEntry) => {
      setEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
      await supabase.from('entries').update(entry).eq('id', entry.id);
    },
    getFinancialStats,
    resetPassword: async (uid: string, pass: string) => {
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, password: pass } : u));
      await supabase.from('users').update({ password: pass }).eq('id', uid);
    },
    sendMessage: async (m: Message) => {
      setMessages(prev => [...prev, m]);
      await supabase.from('messages').insert([m]);
    }
  };
}
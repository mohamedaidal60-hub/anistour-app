import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Vehicle, FinancialEntry, Notification, User, UserRole, MaintenanceStatus, EntryType, GlobalExpense, Message, CashDesk } from './types.ts';

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
  const [messages, setMessages] = useState<Message[]>(() => getLocal('messages', []));
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>(() => getLocal('users', []));
  const [cashDesks, setCashDesks] = useState<CashDesk[]>(() => getLocal('cash_desks', []));
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
        setLocal('messages', mData);
      }

      const { data: cData } = await supabase.from('cash_desks').select('*');
      if (cData) {
        setCashDesks(cData);
        setLocal('cash_desks', cData);
      }

      const { data: nData } = await supabase.from('notifications').select('*').order('createdAt', { ascending: false });
      if (nData) {
        setNotifications(nData);
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

    // Supabase Realtime Subscriptions
    const channels = [
      'vehicles', 'entries', 'global_expenses', 'messages', 'users', 'cash_desks', 'notifications'
    ].map(table =>
      supabase.channel(`${table}_changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => fetchData())
        .subscribe()
    );

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [fetchData]);

  // Derived alerts (internal check)
  useEffect(() => {
    const checkAlerts = async () => {
      const newNotifs: Notification[] = [];
      vehicles.forEach(v => {
        if (v.isArchived) return;
        v.maintenanceConfigs?.forEach(cfg => {
          const kmLeft = cfg.nextDueKm - v.lastMileage;
          if (kmLeft <= 500) {
            const notifId = `notif-${v.id}-${cfg.type}-${cfg.nextDueKm}`;
            const exists = notifications.find(n => n.id === notifId);
            if (!exists) {
              newNotifs.push({
                id: notifId,
                vehicleId: v.id,
                vehicleName: v.name,
                type: cfg.type,
                message: kmLeft <= 0
                  ? `URGENT : ${cfg.type} dépassé de ${Math.abs(kmLeft)} KM !`
                  : `Rappel : ${cfg.type} prévu à ${cfg.nextDueKm} KM (dans ${kmLeft} KM)`,
                targetKm: cfg.nextDueKm,
                createdAt: new Date().toISOString(),
                isRead: false,
                isCritical: kmLeft <= 0,
                isArchived: false
              });
            }
          }
        });
      });
      if (newNotifs.length > 0) {
        await supabase.from('notifications').insert(newNotifs);
      }
    };
    checkAlerts();
  }, [vehicles, notifications]);

  const updateCashDeskBalance = async (deskId: string, amount: number, type: EntryType) => {
    const desk = cashDesks.find(d => d.id === deskId);
    if (!desk) return;

    let newBalance = desk.balance;
    if (type === EntryType.REVENUE || type === EntryType.FUNDING) {
      newBalance += amount;
    } else {
      newBalance -= amount;
    }

    setCashDesks(prev => prev.map(d => d.id === deskId ? { ...d, balance: newBalance } : d));
    await supabase.from('cash_desks').update({ balance: newBalance }).eq('id', deskId);
  };

  const addVehicle = async (v: Vehicle) => {
    setVehicles(prev => [...prev, v]);
    const { error } = await supabase.from('vehicles').insert([v]);
    if (error) {
      console.error("DB Error (Vehicle):", error);
      alert("Erreur lors de l'enregistrement du véhicule dans le cloud.");
    }
  };

  const updateVehicle = async (updatedV: Vehicle) => {
    setVehicles(prev => prev.map(v => v.id === updatedV.id ? updatedV : v));
    const { error } = await supabase.from('vehicles').update(updatedV).eq('id', updatedV.id);
    if (error) console.error("DB Error (Update Vehicle):", error);
  };

  const addEntry = async (e: FinancialEntry) => {
    if (!e.agentName && currentUser) e.agentName = currentUser.name;
    const entryToSave = { ...e, createdAt: e.createdAt || new Date().toISOString() };

    setEntries(prev => [entryToSave, ...prev]);

    if (e.vehicleId && e.mileageAtEntry) {
      const vehicle = vehicles.find(v => v.id === e.vehicleId);
      if (vehicle && e.mileageAtEntry > vehicle.lastMileage) {
        await updateVehicleMileage(vehicle.id, e.mileageAtEntry, e.agentName || 'Système');
      }
    }

    if (e.cashDeskId) {
      await updateCashDeskBalance(e.cashDeskId, e.amount, e.type);
    }

    const { error } = await supabase.from('entries').insert([entryToSave]);
    if (error) {
      console.error("DB Error (Entry):", error);
      alert("Erreur critique : L'opération n'a pas pu être enregistrée dans la base de données.");
    }
  };

  const addGlobalExpense = async (ge: GlobalExpense) => {
    setGlobalExpenses(prev => [ge, ...prev]);
    const { error } = await supabase.from('global_expenses').insert([ge]);
    if (error) console.error("DB Error (Global Expense):", error);
  };

  const updateGlobalExpense = async (ge: GlobalExpense) => {
    setGlobalExpenses(prev => prev.map(e => e.id === ge.id ? ge : e));
    const { error } = await supabase.from('global_expenses').update(ge).eq('id', ge.id);
    if (error) console.error("DB Error (Update Global Expense):", error);
  };

  const deleteGlobalExpense = async (id: string) => {
    setGlobalExpenses(prev => prev.filter(e => e.id !== id));
    const { error } = await supabase.from('global_expenses').delete().eq('id', id);
    if (error) console.error("DB Error (Delete Global Expense):", error);
  };

  const updateVehicleMileage = async (vehicleId: string, newMileage: number, agentName: string) => {
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, lastMileage: newMileage, mileageUpdatedBy: agentName } : v));
    await supabase.from('vehicles').update({ lastMileage: newMileage, mileageUpdatedBy: agentName }).eq('id', vehicleId);
  };

  const approveMaintenance = async (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry || !entry.vehicleId) return;

    const vehicle = vehicles.find(v => v.id === entry.vehicleId);
    if (vehicle) {
      const newConfigs = (vehicle.maintenanceConfigs || []).map(cfg => {
        if (cfg.type === entry.maintenanceType) {
          const doneAt = entry.mileageAtEntry || vehicle.lastMileage;
          return { ...cfg, lastPerformedKm: doneAt, nextDueKm: doneAt + cfg.intervalKm };
        }
        return cfg;
      });
      await updateVehicle({ ...vehicle, maintenanceConfigs: newConfigs });

      // Auto-archive corresponding notification
      const notifId = `notif-${vehicle.id}-${entry.maintenanceType}-${entry.mileageAtEntry}`; // Attempting to match
      const relatedNotif = notifications.find(n => n.vehicleId === vehicle.id && n.type === entry.maintenanceType && !n.isArchived);
      if (relatedNotif) {
        await archiveNotification(relatedNotif.id, 'Système (Auto-Approval)');
      }

      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, status: MaintenanceStatus.APPROVED } : e));
      await supabase.from('entries').update({ status: MaintenanceStatus.APPROVED }).eq('id', entryId);
    }
  };

  const archiveNotification = async (notifId: string, author: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isArchived: true, archivedAt: new Date().toISOString(), archivedBy: author } : n));
    await supabase.from('notifications').update({
      isArchived: true,
      archivedAt: new Date().toISOString(),
      archivedBy: author
    }).eq('id', notifId);
  };

  const getFinancialStats = () => {
    const validEntries = entries.filter(e => e.status !== MaintenanceStatus.REJECTED);
    const revenue = validEntries.filter(e => e.type === EntryType.REVENUE).reduce((sum, e) => sum + (e.amount || 0), 0);
    const vehicleExpenses = validEntries.filter(e => e.type !== EntryType.REVENUE && e.type !== EntryType.FUNDING).reduce((sum, e) => sum + (e.amount || 0), 0);
    const globalTotal = globalExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const purchaseTotalOfSold = vehicles.filter(v => v.isArchived).reduce((sum, v) => sum + (v.purchasePrice || 0), 0);
    const salesTotal = vehicles.filter(v => v.isArchived).reduce((sum, v) => sum + (v.salePrice || 0), 0);
    const totalExpenses = vehicleExpenses + globalTotal;
    // Perte Vente = Prix Achat - Prix Vente
    // Bénéfice Net Global = Bénéfice - Perte Vente
    const lossOnPastSales = purchaseTotalOfSold - salesTotal;
    const netProfit = revenue - totalExpenses - lossOnPastSales;

    const activeVehicles = vehicles.filter(v => !v.isArchived);
    // Mature vehicles = vehicles past their purchase month for average calculations
    const matureVehicles = activeVehicles.filter(v => {
      const reg = new Date(v.registrationDate);
      const now = new Date();
      return (now.getFullYear() - reg.getFullYear()) * 12 + (now.getMonth() - reg.getMonth()) > 0;
    });
    const costPerVehicle = matureVehicles.length > 0 ? (globalTotal / matureVehicles.length) : (activeVehicles.length > 0 ? (globalTotal / activeVehicles.length) : 0);

    let firstDate = new Date();
    if (vehicles.length > 0) {
      vehicles.forEach(v => {
        const d = new Date(v.registrationDate);
        if (d < firstDate) firstDate = d;
      });
    }

    const now = new Date();
    // Use the same logic: Skip the current month of first registration
    const diffMonths = (now.getFullYear() - firstDate.getFullYear()) * 12 + (now.getMonth() - firstDate.getMonth());
    const finalMonths = Math.max(1, diffMonths);

    return {
      revenue, expenses: vehicleExpenses, globalExpenses: globalTotal, totalExpenses,
      netProfit, monthlyProfit: netProfit / diffMonths, costPerVehicle, activeCount: activeVehicles.length
    };
  };

  return {
    vehicles, entries, globalExpenses, messages, notifications, users, cashDesks, appLogo, currentUser,
    isCloudSyncing, isDataLoaded, setCurrentUser,
    setAppLogo: (logo: string) => { setAppLogoState(logo); setLocal('logo', logo); },
    addVehicle, updateVehicle, updateVehicleMileage, addEntry,
    addGlobalExpense, updateGlobalExpense, deleteGlobalExpense,
    approveMaintenance, archiveNotification,
    rejectMaintenance: async (id: string) => {
      setEntries(prev => prev.map(e => e.id === id ? { ...e, status: MaintenanceStatus.REJECTED } : e));
      await supabase.from('entries').update({ status: MaintenanceStatus.REJECTED }).eq('id', id);
    },
    archiveVehicle: async (id: string, salePrice: number) => {
      setVehicles(prev => prev.map(v => v.id === id ? { ...v, isArchived: true, salePrice } : v));
      await supabase.from('vehicles').update({ isArchived: true, salePrice }).eq('id', id);
    },
    addUser: async (u: User) => {
      setUsers(prev => [...prev, u]);
      await supabase.from('users').insert([u]);
      if (u.role === UserRole.ADMIN || (u.role as string) === 'ADMIN' || u.role === UserRole.AGENT || (u.role as string) === 'ASSISTANT') {
        const deskId = `cash-${u.id}`;
        const existingDesk = cashDesks.find(d => d.id === deskId);
        if (!existingDesk) {
          const desk: CashDesk = {
            id: deskId,
            userId: u.id,
            userName: u.name,
            balance: 0,
            createdAt: new Date().toISOString()
          };
          setCashDesks(prev => [...prev, desk]);
          await supabase.from('cash_desks').insert([desk]);
        }
      }
    },
    deleteUser: async (id: string) => {
      setUsers(prev => prev.filter(u => u.id !== id));
      await supabase.from('users').delete().eq('id', id);
      await supabase.from('cash_desks').delete().eq('userId', id);
    },
    deleteEntry: async (id: string) => {
      const entry = entries.find(e => e.id === id);
      if (entry?.cashDeskId) {
        const typeForReverse = entry.type === EntryType.REVENUE || entry.type === EntryType.FUNDING ? EntryType.EXPENSE_SIMPLE : EntryType.REVENUE;
        await updateCashDeskBalance(entry.cashDeskId, entry.amount, typeForReverse);
      }
      setEntries(prev => prev.filter(e => e.id !== id));
      await supabase.from('entries').delete().eq('id', id);
    },
    updateEntry: async (entry: FinancialEntry) => {
      // If agent edits, we might want to unset status back to PENDING if it was rejected
      const newEntry = { ...entry, status: currentUser?.role === UserRole.ADMIN ? entry.status : MaintenanceStatus.PENDING };
      setEntries(prev => prev.map(e => e.id === newEntry.id ? newEntry : e));
      await supabase.from('entries').update(newEntry).eq('id', newEntry.id);
    },
    markNotificationRead: async (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      await supabase.from('notifications').update({ isRead: true }).eq('id', id);
    },
    getFinancialStats,
    resetPassword: async (uid: string, pass: string) => {
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, password: pass } : u));
      await supabase.from('users').update({ password: pass }).eq('id', uid);
    },
    sendMessage: async (m: Message) => {
      // Optimistic update
      const msg = { ...m, timestamp: m.timestamp || new Date().toISOString() };
      setMessages(prev => {
        const updated = [...prev, msg];
        setLocal('messages', updated);
        return updated;
      });

      const { error } = await supabase.from('messages').insert([msg]);
      if (error) {
        console.error("Chat Error:", error);
        alert("Erreur d'envoi du message au serveur.");
      }
    },
    exportLocalData: () => {
      const data = {
        vehicles,
        entries,
        globalExpenses,
        users,
        notifications,
        cashDesks,
        exportDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Anistour_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
}
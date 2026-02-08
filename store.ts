import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Vehicle, FinancialEntry, Notification, User, UserRole, MaintenanceStatus, EntryType, GlobalExpense, Message, CashDesk, HistoricalStats } from './types.ts';

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
  const [historicalStats, setHistoricalStats] = useState<HistoricalStats | null>(() => getLocal('historical_stats', null));
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
        // Auto-check for 60-day inactivity
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const updatedUsers = uData.map(u => {
          const lastLogin = u.lastLogin ? new Date(u.lastLogin) : new Date(0);
          const isActive = lastLogin > sixtyDaysAgo;
          return { ...u, isActive };
        });

        setUsers(updatedUsers);
        setLocal('users', updatedUsers);
      } else {
        const admin = { id: 'admin_1', name: 'Admin Anistour', role: UserRole.ADMIN, email: 'anisbelhadjamara@gmail.com', password: 'Azerty2026', isActive: true };
        setUsers([admin]);
        setLocal('users', [admin]);
      }

      const { data: hData } = await supabase.from('historical_stats').select('*').single();
      if (hData) {
        setHistoricalStats(hData);
        setLocal('historical_stats', hData);
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

      // Check for DB Saturation (e.g. 1000 entries)
      if (entries.length > 1000) {
        const saturationNotifId = 'saturation-warning';
        const exists = notifications.find(n => n.id === saturationNotifId);
        if (!exists) {
          await supabase.from('notifications').insert([{
            id: saturationNotifId,
            vehicleId: 'SYSTEM',
            vehicleName: 'SYSTEME',
            type: 'ALERTE BASE DE DONNEES',
            message: 'La base de données approche de sa capacité maximale. Veuillez effectuer une sauvegarde locale et archiver (purger) les données anciennes.',
            targetKm: 0,
            createdAt: new Date().toISOString(),
            isRead: false,
            isCritical: true,
            isArchived: false
          }]);
        }
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
    if (ge.cashDeskId) {
      await updateCashDeskBalance(ge.cashDeskId, ge.amount, EntryType.EXPENSE_SIMPLE);
    }
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

    const carryRevenue = historicalStats?.accumulatedRevenue || 0;
    const carryExpenses = historicalStats?.accumulatedExpenses || 0;

    const finalRevenue = revenue + carryRevenue;
    const finalTotalExpenses = vehicleExpenses + globalTotal + carryExpenses;

    // accounting: Revenue - Expenses = Operating Profit
    const operatingProfit = finalRevenue - finalTotalExpenses;

    // simulation: Purchase - Sale (or simulated) = Loss/Gain on Sale
    const isAccountable = (saleDate?: string) => {
      if (!saleDate) return false;
      const d = new Date(saleDate);
      const now = new Date();
      // "Fin du mois prochain" : If sold in Feb, accountable after March 31
      const accountableDate = new Date(d.getFullYear(), d.getMonth() + 2, 0);
      return now > accountableDate;
    };

    const soldVehicles = vehicles.filter(v => v.isArchived && isAccountable(v.saleDate));
    const purchaseTotalOfSold = soldVehicles.reduce((sum, v) => sum + (v.purchasePrice || 0), 0);
    const salesTotal = soldVehicles.reduce((sum, v) => sum + (v.salePrice || 0), 0);
    const lossOnPastSales = purchaseTotalOfSold - salesTotal;

    // Final Net Profit = Operating Profit - lossOnPastSales
    const netProfit = operatingProfit - lossOnPastSales;

    const activeVehicles = vehicles.filter(v => !v.isArchived);
    // Mature vehicles = vehicles past the end of the next month following registration
    const matureVehicles = activeVehicles.filter(v => {
      const d = new Date(v.registrationDate);
      const now = new Date();
      const accountableDate = new Date(d.getFullYear(), d.getMonth() + 2, 0);
      return now > accountableDate;
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

    // Live Stats (Today)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEntries = validEntries.filter(e => e.date.startsWith(todayStr));
    const todayRevenue = todayEntries.filter(e => e.type === EntryType.REVENUE).reduce((sum, e) => sum + (e.amount || 0), 0);
    const todayExpenses = todayEntries.filter(e => e.type !== EntryType.REVENUE && e.type !== EntryType.FUNDING).reduce((sum, e) => sum + (e.amount || 0), 0);
    const todayProfit = todayRevenue - todayExpenses;

    // Cash On Hand (Total in all desks)
    const cashOnHand = cashDesks.reduce((sum, d) => sum + (d.balance || 0), 0);

    return {
      revenue: finalRevenue,
      expenses: vehicleExpenses,
      globalExpenses: globalTotal,
      totalExpenses: finalTotalExpenses,
      netProfit,
      monthlyProfit: netProfit / finalMonths,
      activeCount: activeVehicles.length,
      costPerVehicle, finalMonths,
      todayRevenue, todayExpenses, todayProfit, cashOnHand
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
      const saleDate = new Date().toISOString();
      setVehicles(prev => prev.map(v => v.id === id ? { ...v, isArchived: true, salePrice, saleDate } : v));
      await supabase.from('vehicles').update({ isArchived: true, salePrice, saleDate }).eq('id', id);
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
    },
    purgeDatabase: async () => {
      if (!confirm("ATTENTION : Cette action va archiver les montants actuels, purger les opérations CLOUD et DÉSACTIVER les comptes inactifs (>60 jours). Les véhicules actifs resteront. Vérifiez votre Backup avant. Continuer ?")) {
        return;
      }

      setIsCloudSyncing(true);
      try {
        const stats = getFinancialStats();
        // Carry forward: current historical + (current period totals)
        const newHistorical: Partial<HistoricalStats> = {
          accumulatedRevenue: (historicalStats?.accumulatedRevenue || 0) + (stats.revenue),
          accumulatedExpenses: (historicalStats?.accumulatedExpenses || 0) + (stats.expenses + globalExpenses.reduce((s, e) => s + (e.amount || 0), 0)),
          accumulatedProfit: stats.netProfit,
          lastPurgeDate: new Date().toISOString()
        };

        await supabase.from('historical_stats').upsert([{ id: 'global', ...newHistorical }]);

        // Deactivate inactive users (60 days)
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const inactiveUsers = users.filter(u => {
          if (u.role === UserRole.ADMIN) return false;
          if (!u.lastLogin) return true; // Never logged in
          return new Date(u.lastLogin) < sixtyDaysAgo;
        });

        for (const u of inactiveUsers) {
          await supabase.from('users').update({ isActive: false }).eq('id', u.id);
        }

        // Purge transactional data only
        await supabase.from('entries').delete().neq('id', '0');
        await supabase.from('global_expenses').delete().neq('id', '0');
        await supabase.from('notifications').delete().neq('id', '0');
        await supabase.from('messages').delete().neq('id', '0');

        setEntries([]);
        setGlobalExpenses([]);
        setNotifications([]);
        setMessages([]);

        alert(`${inactiveUsers.length} comptes inactifs ont été désactivés. Base de données purgée.`);
        fetchData();
      } catch (e) {
        console.error(e);
        alert("Erreur lors de la purge.");
      } finally {
        setIsCloudSyncing(false);
      }
    }
  };
}
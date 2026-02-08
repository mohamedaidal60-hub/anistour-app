
import React, { useMemo, useState } from 'react';
import { useFleetStore } from '../store.ts';
import { EntryType, MaintenanceStatus } from '../types.ts';
import { TrendingUp, TrendingDown, DollarSign, Activity, Clock, ArrowUpRight, ArrowDownLeft, Sparkles, Loader2, Calendar, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CURRENCY } from '../constants.ts';

interface DashboardProps {
  store: ReturnType<typeof useFleetStore>;
}

const Dashboard: React.FC<DashboardProps> = ({ store }) => {
  const stats = store.getFinancialStats();
  const isAdmin = store.currentUser?.role === 'ADMIN';

  const recentEntries = useMemo(() => {
    return [...store.entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [store.entries]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return months.map((m) => ({
      name: m,
      revenus: Math.floor(Math.random() * 400000 + 100000),
      charges: Math.floor(Math.random() * 150000 + 30000),
    }));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-3xl mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-700 rounded-2xl shadow-lg shadow-red-900/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Performance Overview</h2>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">Temps réel & Indicateurs clés</p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="p-4 bg-neutral-950 hover:bg-white hover:text-black rounded-2xl border border-neutral-800 transition-all flex items-center justify-center text-neutral-400 shadow-xl"
          title="Imprimer Tableau de Bord"
        >
          <Printer className="w-5 h-5" />
        </button>
      </div>

      {/* Idea 1: Live Profit Dashboard (Admin Only) */}
      {isAdmin && (
        <div className="bg-neutral-900 border border-neutral-800 p-1 rounded-2xl flex flex-col md:flex-row gap-1 shadow-2xl backdrop-blur-xl">
          <div className="flex-1 bg-neutral-950 p-4 rounded-xl border border-neutral-900 flex justify-between items-center group overflow-hidden relative">
            <div className="absolute inset-0 bg-emerald-500/5 translate-y-full group-hover:translate-y-0 transition-transform" />
            <div>
              <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.3em]">Recette Jour</p>
              <p className="text-xl font-black text-white mt-1">+{stats.todayRevenue.toLocaleString()} <span className="text-[10px] text-neutral-600">{CURRENCY}</span></p>
            </div>
            <ArrowUpRight className="w-8 h-8 text-emerald-900/40" />
          </div>
          <div className="flex-1 bg-neutral-950 p-4 rounded-xl border border-neutral-900 flex justify-between items-center group overflow-hidden relative">
            <div className="absolute inset-0 bg-red-500/5 translate-y-full group-hover:translate-y-0 transition-transform" />
            <div>
              <p className="text-[8px] font-black text-red-500 uppercase tracking-[0.3em]">Dépenses Jour</p>
              <p className="text-xl font-black text-white mt-1">-{stats.todayExpenses.toLocaleString()} <span className="text-[10px] text-neutral-600">{CURRENCY}</span></p>
            </div>
            <ArrowDownLeft className="w-8 h-8 text-red-900/40" />
          </div>
          <div className="flex-1 bg-gradient-to-br from-red-600 to-red-900 p-4 rounded-xl flex justify-between items-center shadow-lg shadow-red-900/20">
            <div>
              <p className="text-[8px] font-black text-white/60 uppercase tracking-[0.3em]">Cash Global Flotte</p>
              <p className="text-xl font-black text-white mt-1">{(stats.cashOnHand).toLocaleString()} <span className="text-[10px] text-white/50">{CURRENCY}</span></p>
            </div>
            <Activity className="w-8 h-8 text-white/20" />
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Revenus" value={stats.revenue} icon={TrendingUp} color="text-emerald-500" />
          <StatCard title="Charges" value={stats.expenses} icon={TrendingDown} color="text-red-500" />
          <StatCard title="Bénéfice Net" value={stats.netProfit} icon={DollarSign} color="text-blue-500" />
          <StatCard title="Bénéfice Mensuel" value={Math.round(stats.monthlyProfit || 0)} icon={Calendar} color="text-purple-500" />
          <StatCard title="Parc Actif" value={stats.activeCount} icon={Activity} color="text-amber-500" unit=" unités" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Idea 4: Usage Graphs (Admin Only) */}
          {isAdmin && (
            <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-3xl shadow-xl backdrop-blur-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500" /> Performance Fleet Anistour ({CURRENCY})
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis dataKey="name" stroke="#525252" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                    <YAxis stroke="#525252" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                    <Tooltip
                      cursor={{ fill: '#171717' }}
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #262626', borderRadius: '12px' }}
                      itemStyle={{ color: '#f5f5f5', fontSize: '12px', fontWeight: 600 }}
                    />
                    <Bar dataKey="revenus" fill="#059669" radius={[4, 4, 0, 0]} barSize={12} />
                    <Bar dataKey="charges" fill="#dc2626" radius={[4, 4, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-3xl shadow-xl backdrop-blur-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-neutral-400" /> Flux d'Opérations Récentes
            </h3>
            <div className="space-y-3">
              {recentEntries.map(entry => {
                const isRevenue = entry.type === EntryType.REVENUE || entry.type === EntryType.FUNDING;
                const vehicle = store.vehicles.find(v => v.id === entry.vehicleId);
                return (
                  <div key={entry.id} className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-800 rounded-2xl hover:border-neutral-700 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${isRevenue ? 'bg-emerald-950/30 text-emerald-500' : 'bg-red-950/30 text-red-500'}`}>
                        {isRevenue ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-200 truncate max-w-[150px]">{entry.description || entry.designation}</p>
                        <p className="text-[10px] text-neutral-500 uppercase font-black">{vehicle?.name || 'Agence'} • {new Date(entry.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className={`font-black ${isRevenue ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isRevenue ? '+' : '-'}{(entry.amount ?? 0).toLocaleString()} {CURRENCY}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-3xl shadow-xl backdrop-blur-sm space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold">Alertes KM Critiques</h3>
              <span className="text-[10px] font-black text-red-500 animate-pulse">LIVE</span>
            </div>
            <div className="space-y-3">
              {store.notifications.filter(n => n.isCritical && !n.isArchived).slice(0, 5).map(n => (
                <div key={n.id} className="p-4 bg-red-950/20 border border-red-900/50 rounded-2xl flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-red-500 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-red-100 uppercase">{n.vehicleName}</p>
                    <p className="text-[11px] text-neutral-400 mt-1">{n.message}</p>
                  </div>
                </div>
              ))}
              {store.notifications.filter(n => n.isCritical && !n.isArchived).length === 0 && <p className="text-xs text-neutral-600 italic text-center py-4">Aucune alerte en attente</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, unit = ` ${CURRENCY}` }: any) => (
  <div className="bg-neutral-900/50 border border-neutral-800 p-5 rounded-3xl shadow-lg backdrop-blur-sm hover:border-neutral-700 transition-all group">
    <div className={`p-3 w-fit rounded-2xl bg-neutral-950 border border-neutral-800 mb-4 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
    <p className="text-xl font-black tracking-tighter text-neutral-100">
      {typeof value === 'number' ? (value ?? 0).toLocaleString() : value}<span className="text-[10px] font-medium ml-1 text-neutral-500 uppercase">{unit}</span>
    </p>
  </div>
);

export default Dashboard;

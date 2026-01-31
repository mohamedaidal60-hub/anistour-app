
import React, { useState } from 'react';
import { useFleetStore } from '../store.ts';
import { EntryType, MaintenanceStatus, UserRole } from '../types.ts';
import { ArrowUpRight, ArrowDownLeft, Wrench, Search, Filter, ShieldAlert, Calendar, User as UserIcon } from 'lucide-react';
import { CURRENCY } from '../constants.ts';

interface JournalProps {
  store: ReturnType<typeof useFleetStore>;
}

const Journal: React.FC<JournalProps> = ({ store }) => {
  const isAgent = store.currentUser?.role === UserRole.AGENT;
  const [searchTerm, setSearchTerm] = useState('');
  
  const today = new Date().toISOString().split('T')[0];

  // Logic: Agent only sees today's entries. Admin sees everything.
  const filteredEntries = store.entries.filter(entry => {
    const entryDate = entry.date.split('T')[0];
    const isToday = entryDate === today;
    const matchesSearch = entry.designation.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (entry.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    if (isAgent) {
      return isToday && matchesSearch;
    }
    return matchesSearch;
  });

  const sortedEntries = [...filteredEntries].sort((a,b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Registre des Opérations</h2>
          <p className="text-sm text-neutral-500 mt-1">
            {isAgent ? `Affichage restreint : Aujourd'hui uniquement` : 'Historique complet du parc Anistour'}
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="flex-1 md:w-80 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une opération..." 
                className="w-full bg-neutral-900/50 border border-neutral-800 pl-12 pr-4 py-3 rounded-2xl focus:outline-none focus:border-red-600 transition-all text-sm font-bold" 
              />
           </div>
        </div>
      </div>

      {isAgent && (
        <div className="bg-amber-950/20 border border-amber-900/50 p-4 rounded-3xl flex items-center gap-4">
           <div className="p-2 bg-amber-900/40 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
           </div>
           <p className="text-[11px] text-amber-200 font-bold uppercase tracking-widest">
            Mode Assistante : Visibilité limitée aux saisies du jour. Accès à l'historique désactivé.
           </p>
        </div>
      )}

      <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-neutral-950/50 text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-neutral-800">
                <th className="px-8 py-6">Horodatage</th>
                <th className="px-8 py-6">Véhicule</th>
                <th className="px-8 py-6">Opération</th>
                <th className="px-8 py-6">Utilisateur</th>
                <th className="px-8 py-6">Statut</th>
                <th className="px-8 py-6 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {sortedEntries.map(entry => {
                const isRevenue = entry.type === EntryType.REVENUE;
                const vehicle = store.vehicles.find(v => v.id === entry.vehicleId);

                return (
                  <tr key={entry.id} className="group hover:bg-neutral-800/40 transition-colors">
                    <td className="px-8 py-6 text-neutral-400 font-mono text-xs">
                      {new Date(entry.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      {!isAgent && <span className="block text-[8px] mt-1 uppercase text-neutral-600">{new Date(entry.date).toLocaleDateString()}</span>}
                    </td>
                    <td className="px-8 py-6">
                       <span className="font-black text-neutral-100 uppercase tracking-tighter text-base">{vehicle?.name || 'Agence'}</span>
                       {vehicle && <span className="block text-[10px] text-neutral-500 font-bold">KM: {entry.mileageAtEntry?.toLocaleString() || 'N/A'}</span>}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${isRevenue ? 'bg-emerald-950/50 text-emerald-500' : 'bg-red-950/50 text-red-500'}`}>
                            {isRevenue ? <ArrowUpRight className="w-4 h-4" /> : (entry.type === EntryType.EXPENSE_MAINTENANCE ? <Wrench className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />)}
                         </div>
                         <div>
                            <span className="text-neutral-200 font-bold block">{entry.designation}</span>
                            {entry.info && <span className="text-[10px] text-neutral-500 italic max-w-xs block truncate">{entry.info}</span>}
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <UserIcon className="w-3 h-3 text-neutral-500" />
                          <span className="text-[10px] font-black uppercase text-neutral-400">{entry.userName}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${entry.status === MaintenanceStatus.PENDING ? 'bg-amber-500 animate-pulse' : entry.status === MaintenanceStatus.REJECTED ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${entry.status === MaintenanceStatus.PENDING ? 'text-amber-500' : entry.status === MaintenanceStatus.REJECTED ? 'text-red-500' : 'text-emerald-500'}`}>
                             {entry.status === MaintenanceStatus.PENDING ? 'En attente' : entry.status === MaintenanceStatus.REJECTED ? 'Refusé' : 'Validé'}
                          </span>
                       </div>
                    </td>
                    <td className={`px-8 py-6 text-right font-black ${isRevenue ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isRevenue ? '+' : '-'}{entry.amount.toLocaleString()} {CURRENCY}
                    </td>
                  </tr>
                );
              })}
              {sortedEntries.length === 0 && (
                <tr>
                   <td colSpan={6} className="px-8 py-20 text-center text-neutral-600 italic">
                      Aucune opération enregistrée pour cette période.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Journal;

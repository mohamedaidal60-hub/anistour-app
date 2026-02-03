import React from 'react';
import { useFleetStore } from '../store.ts';
import { EntryType, MaintenanceStatus } from '../types.ts';
import { Wrench, Calendar, Ruler, BadgeCheck, AlertCircle } from 'lucide-react';
import { CURRENCY } from '../constants.ts';

interface MaintenanceManagerProps {
  store: ReturnType<typeof useFleetStore>;
}

const MaintenanceManager: React.FC<MaintenanceManagerProps> = ({ store }) => {
  const approvedMaintenance = store.entries.filter(e =>
    e.type === EntryType.EXPENSE_MAINTENANCE && e.status === MaintenanceStatus.APPROVED
  ).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <section className="space-y-6">
          <div className="flex justify-between items-end px-2">
            <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
              <BadgeCheck className="w-6 h-6 text-emerald-500" /> Carnet de Maintenance
            </h2>
            <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">{approvedMaintenance.length} Opérations</span>
          </div>

          <div className="space-y-4">
            {(approvedMaintenance || []).map(log => {
              const vehicle = store.vehicles.find(v => v.id === log.vehicleId);
              return (
                <div key={log.id} className="bg-neutral-900/50 backdrop-blur-sm border-l-4 border-l-emerald-600 border border-neutral-800 rounded-2xl p-6 flex items-center gap-8 hover:border-neutral-700 transition-all">
                  <div className="text-center w-24 shrink-0 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                    <p className="text-[8px] text-neutral-600 uppercase font-black tracking-widest mb-1">Kilométrage</p>
                    <p className="text-xl font-black text-emerald-500">{(log.mileageAtEntry ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-neutral-100 uppercase tracking-tighter">{log.maintenanceType}</h4>
                        <p className="text-[10px] font-bold text-neutral-500 uppercase">{vehicle?.name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-600">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[9px] font-bold">{log.date ? new Date(log.date).toLocaleDateString('fr-FR') : '-'}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                      <p className="text-[8px] text-neutral-500 uppercase font-bold italic">Saisi par: <span className="text-neutral-400">{log.agentName || log.userName || '-'}</span></p>
                    </div>
                  </div>
                  <div className="text-right p-3 bg-neutral-950/50 rounded-xl">
                    <p className="text-[8px] text-neutral-600 uppercase font-black tracking-widest mb-1">Coût Total</p>
                    <p className="font-black text-neutral-200">{(log.amount ?? 0).toLocaleString()} <span className="text-[10px] text-neutral-500">{CURRENCY}</span></p>
                  </div>
                </div>
              );
            })}
            {approvedMaintenance.length === 0 && (
              <div className="py-24 text-center bg-neutral-900/20 border border-dashed border-neutral-800 rounded-[2rem]">
                <div className="w-16 h-16 bg-neutral-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-800">
                  <Wrench className="w-8 h-8 text-neutral-600" />
                </div>
                <p className="text-sm text-neutral-500 italic font-medium">Aucun entretien validé dans le registre.</p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 px-2">
            <Ruler className="w-6 h-6 text-red-500" /> État Technique du Parc
          </h2>
          <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-950 text-neutral-500 uppercase text-[9px] font-black tracking-[0.2em]">
                  <th className="px-6 py-5">Véhicule</th>
                  <th className="px-6 py-5">Entretien</th>
                  <th className="px-6 py-5">Dernier KM</th>
                  <th className="px-6 py-5">Échéance</th>
                  <th className="px-6 py-5">Restant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {store.vehicles.filter(v => !v.isArchived).flatMap(v => (v.maintenanceConfigs || []).map(cfg => {
                  const kmLeft = (cfg.nextDueKm ?? 0) - (v.lastMileage ?? 0);
                  const isUrgent = kmLeft <= 500;
                  const isCritical = kmLeft <= 0;
                  return (
                    <tr key={`${v.id}-${cfg.type}`} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="px-6 py-5 font-black text-neutral-200 uppercase tracking-tighter">{v.name}</td>
                      <td className="px-6 py-5 font-bold text-neutral-500">{cfg.type}</td>
                      <td className="px-6 py-5 font-mono text-neutral-400">{(cfg.lastPerformedKm ?? 0).toLocaleString()}</td>
                      <td className="px-6 py-5 font-mono text-red-500 font-bold">{(cfg.nextDueKm ?? 0).toLocaleString()}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden w-20">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-red-600 w-full' : isUrgent ? 'bg-amber-600 w-3/4' : 'bg-emerald-600 w-1/4'}`}
                              style={{ width: `${Math.min(100, Math.max(10, (1 - (kmLeft / cfg.intervalKm)) * 100))}%` }}
                            ></div>
                          </div>
                          <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${isCritical ? 'bg-red-600 text-white' : isUrgent ? 'bg-amber-600/20 text-amber-500 animate-pulse' : 'bg-neutral-800 text-neutral-500'}`}>
                            {isCritical ? 'Dépassement' : isUrgent ? 'Imminent' : `${(kmLeft ?? 0).toLocaleString()} KM`}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
            {store.vehicles.filter(v => !v.isArchived).length === 0 && (
              <div className="p-12 text-center text-neutral-600 italic font-medium">
                Aucun véhicule actif à surveiller.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MaintenanceManager;
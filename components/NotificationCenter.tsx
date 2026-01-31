import React from 'react';
import { useFleetStore } from '../store.ts';
import { Bell, AlertTriangle, ShieldAlert } from 'lucide-react';

interface NotificationCenterProps {
  store: ReturnType<typeof useFleetStore>;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ store }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-900/30 rounded-xl">
             <Bell className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Notifications</h2>
            <p className="text-sm text-neutral-500">Suivi des alertes kilométriques et maintenances</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs bg-red-600 px-2 py-1 rounded-full font-bold uppercase">{store.notifications.length} Actives</span>
        </div>
      </div>

      <div className="space-y-3">
        {store.notifications.length === 0 ? (
          <div className="text-center py-20 text-neutral-600 italic">Tout est sous contrôle. Aucune notification.</div>
        ) : (
          store.notifications.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(n => (
            <div key={n.id} className={`p-4 border rounded-2xl flex gap-4 transition-all ${n.isCritical ? 'bg-red-950/20 border-red-900/50' : 'bg-neutral-900 border-neutral-800'}`}>
              <div className="mt-1">
                {n.isCritical ? <ShieldAlert className="w-6 h-6 text-red-500" /> : <AlertTriangle className="w-6 h-6 text-amber-500" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-neutral-100">{n.vehicleName}</h4>
                  <span className="text-[10px] text-neutral-500 font-mono">{new Date(n.createdAt).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-neutral-400 mt-1">{n.message}</p>
                <div className="mt-3 flex gap-2">
                  <span className="px-2 py-1 bg-black/40 text-[10px] rounded border border-white/5 uppercase font-bold text-neutral-400">Objectif: {n.targetKm.toLocaleString()} KM</span>
                  {n.isCritical && <span className="px-2 py-1 bg-red-500 text-[10px] rounded uppercase font-bold text-white animate-pulse">CRITIQUE</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-neutral-900/30 border border-neutral-800 p-4 rounded-xl text-center text-xs text-neutral-600 italic">
        Note: Selon le cahier des charges, les agents ne peuvent pas supprimer les notifications. Seule une validation de maintenance les acquittera.
      </div>
    </div>
  );
};

export default NotificationCenter;
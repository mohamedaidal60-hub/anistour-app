import React from 'react';
import { useFleetStore } from '../store.ts';
import { Bell, AlertTriangle, ShieldAlert, X, Archive } from 'lucide-react';

interface NotificationCenterProps {
  store: ReturnType<typeof useFleetStore>;
  onClose?: () => void;
  showArchive?: boolean;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ store, onClose, showArchive = false }) => {
  const allNotifs = store.notifications || [];
  const displayNotifs = showArchive
    ? allNotifs.filter(n => n.isArchived)
    : allNotifs.filter(n => !n.isArchived);

  const handleArchive = async (id: string) => {
    await store.archiveNotification(id, store.currentUser?.name || 'Inconnu');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-neutral-900 border border-neutral-800 p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
        <div className="flex items-center gap-6">
          <div className={`p-4 rounded-3xl ${showArchive ? 'bg-neutral-800 text-neutral-400' : 'bg-red-700/20 text-red-500 shadow-xl shadow-red-900/10'}`}>
            {showArchive ? <Archive className="w-8 h-8" /> : <Bell className="w-8 h-8" />}
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
              {showArchive ? 'Historique des Alertes' : 'Alertes de Maintenance'}
            </h2>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em] mt-1">
              {showArchive ? 'Consultez les actions passées' : 'Suivi des échéances et maintenances critiques'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-6 sm:mt-0">
          <span className={`text-[10px] font-black px-4 py-2 rounded-xl transition-all border ${showArchive ? 'bg-neutral-950 border-neutral-800 text-neutral-500' : 'bg-red-700 border-red-600 text-white animate-pulse shadow-lg shadow-red-900/40'}`}>
            {displayNotifs.length} {showArchive ? 'ARCHIVES' : 'ACTIVES'}
          </span>
          {onClose && (
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl transition-all text-neutral-400 hover:text-white">&times;</button>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {displayNotifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-neutral-950 rounded-[2.5rem] border border-neutral-900 border-dashed opacity-40">
            <Archive className="w-16 h-16 mb-4" />
            <p className="text-xs font-black uppercase tracking-[0.3em]">Aucun contenu détecté</p>
          </div>
        ) : (
          displayNotifs.sort((a, b) => (b.archivedAt || b.createdAt).localeCompare(a.archivedAt || a.createdAt)).map(n => (
            <div key={n.id} className={`group relative p-8 border rounded-[2rem] flex flex-col md:flex-row gap-8 transition-all duration-300 hover:-translate-y-1 ${n.isCritical && !n.isArchived ? 'bg-red-950/20 border-red-900/40 shadow-xl shadow-red-900/10' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'}`}>
              <div className="shrink-0">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${n.isArchived ? 'bg-neutral-950 border-neutral-800 text-neutral-600' : n.isCritical ? 'bg-red-600 text-white border-red-500 animate-pulse shock-glow' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>
                  {n.isArchived ? <Archive className="w-8 h-8" /> : n.isCritical ? <ShieldAlert className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div>
                    <h4 className="text-xl font-black text-white uppercase tracking-tight">{n.vehicleName}</h4>
                    <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mt-1">Déclenchée le {new Date(n.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                  {!showArchive && (
                    <button
                      onClick={() => handleArchive(n.id)}
                      className="px-6 py-2.5 bg-neutral-950 hover:bg-white hover:text-black border border-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Archiver / Marquer comme fait
                    </button>
                  )}
                </div>
                <p className="text-neutral-300 font-medium text-base mb-6">{n.message}</p>
                <div className="flex flex-wrap gap-4">
                  <div className="px-4 py-2 bg-black/40 rounded-xl border border-white/5 flex items-center gap-3">
                    <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Échéance</span>
                    <span className="text-[11px] font-black text-white">{(n.targetKm ?? 0).toLocaleString()} KM</span>
                  </div>
                  {n.isArchived && (
                    <div className="px-4 py-2 bg-emerald-950/20 rounded-xl border border-emerald-900/30 flex items-center gap-3">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Traité par</span>
                      <span className="text-[11px] font-black text-emerald-500 uppercase">{n.archivedBy || 'Système'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!showArchive && (
        <div className="bg-neutral-950/40 p-8 rounded-[2rem] border border-neutral-900 flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-red-900 mt-1 shrink-0" />
          <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest leading-loose">
            Note de sécurité : Les alertes sont archivées soit manuellement par un agent/admin, soit automatiquement lors de la validation d'un entretien correspondant dans le journal. L'archive constitue une preuve juridique des opérations effectuées.
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
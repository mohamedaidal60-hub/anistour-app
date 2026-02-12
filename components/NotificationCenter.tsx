import React, { useState } from 'react';
import { useFleetStore } from '../store.ts';
import { Bell, AlertTriangle, ShieldAlert, Archive, CheckCircle, Clock } from 'lucide-react';
import { UserRole } from '../types.ts';

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

  const isAdmin = store.currentUser?.role === UserRole.ADMIN;

  const [postponeModalOpen, setPostponeModalOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  const [additionalKm, setAdditionalKm] = useState('');

  const handleArchive = async (id: string) => {
    if (!isAdmin) return;
    await store.archiveNotification(id, store.currentUser?.name || 'Admin');
  };

  const openPostponeModal = (notif: any) => {
    setSelectedNotif(notif);
    setPostponeModalOpen(true);
    setAdditionalKm('');
  };

  const handlePostpone = async () => {
    if (!selectedNotif || !additionalKm || Number(additionalKm) <= 0) return;

    await store.postponeMaintenanceAlert(
      selectedNotif.vehicleId,
      selectedNotif.type,
      Number(additionalKm)
    );

    setPostponeModalOpen(false);
    setSelectedNotif(null);
    setAdditionalKm('');
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
                  {!showArchive && isAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openPostponeModal(n)}
                        className="px-4 py-2.5 bg-amber-950/30 hover:bg-amber-900/50 border border-amber-800/50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center text-amber-500"
                      >
                        <Clock className="w-4 h-4" /> Reporter
                      </button>
                      <button
                        onClick={() => handleArchive(n.id)}
                        className="px-4 py-2.5 bg-neutral-950 hover:bg-white hover:text-black border border-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center"
                      >
                        <CheckCircle className="w-4 h-4" /> Archiver
                      </button>
                    </div>
                  )}
                  {!showArchive && !isAdmin && (
                    <div className="px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-[9px] font-black text-neutral-600 uppercase tracking-widest flex items-center gap-2">
                      <ShieldAlert className="w-3 h-3" /> Lecture Seule (Admin requis)
                    </div>
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
            Note de sécurité : Les alertes sont archivées uniquement par un administrateur. L'archive constitue une preuve juridique des opérations effectuées.
          </p>
        </div>
      )}

      {/* Modal de report d'échéance */}
      {postponeModalOpen && selectedNotif && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Reporter l'échéance</h3>
            <p className="text-sm text-neutral-400 mb-6">
              Véhicule: <span className="text-white font-bold">{selectedNotif.vehicleName}</span><br />
              Type: <span className="text-white font-bold">{selectedNotif.type}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-2">
                  Kilométrage supplémentaire
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Ex: 5000"
                  value={additionalKm}
                  onChange={(e) => setAdditionalKm(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl text-2xl font-black text-amber-500 outline-none focus:border-amber-600 transition-all"
                  autoFocus
                />
                <p className="text-[9px] text-neutral-600 mt-2 uppercase tracking-widest">
                  Nouvelle échéance: <span className="text-amber-500 font-black">{((selectedNotif.targetKm ?? 0) + Number(additionalKm || 0)).toLocaleString()} KM</span>
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handlePostpone}
                  disabled={!additionalKm || Number(additionalKm) <= 0}
                  className="flex-1 py-4 bg-amber-700 hover:bg-amber-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest transition-all disabled:cursor-not-allowed"
                >
                  Confirmer le report
                </button>
                <button
                  onClick={() => setPostponeModalOpen(false)}
                  className="px-6 py-4 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 rounded-2xl font-black uppercase text-sm tracking-widest transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
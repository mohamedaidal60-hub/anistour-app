import React, { useState } from 'react';
import { useFleetStore } from '../store.ts';
import { EntryType, MaintenanceStatus, FinancialEntry } from '../types.ts';
import { CheckCircle, XCircle, Clock, ExternalLink, ShieldCheck, Edit2, Save } from 'lucide-react';
import { CURRENCY } from '../constants.ts';

interface AdminValidationProps {
  store: ReturnType<typeof useFleetStore>;
}

const AdminValidation: React.FC<AdminValidationProps> = ({ store }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMileage, setEditMileage] = useState('');

  const pendingRequests = store.entries.filter(e =>
    (e.status === MaintenanceStatus.PENDING || e.status === MaintenanceStatus.REJECTED)
  );

  const startEditing = (req: FinancialEntry) => {
    setEditingId(req.id);
    setEditAmount(req.amount.toString());
    setEditDescription(req.description || req.designation || '');
    setEditMileage(req.mileageAtEntry?.toString() || '');
  };

  const saveAndApprove = async (req: FinancialEntry) => {
    const updated: FinancialEntry = {
      ...req,
      amount: Number(editAmount),
      description: editDescription,
      mileageAtEntry: Number(editMileage),
      status: MaintenanceStatus.APPROVED
    };
    await store.updateEntry(updated);
    if (req.type === EntryType.EXPENSE_MAINTENANCE) {
      await store.approveMaintenance(req.id);
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-900/10 blur-[100px] pointer-events-none"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-red-700 rounded-3xl flex items-center justify-center shrink-0 shadow-2xl shadow-red-900/40 border border-red-600">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Terminal de Validation</h3>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em] mt-1">Contrôle des flux et maintenances</p>
          </div>
        </div>
        <div className="px-6 py-3 bg-red-950/20 border border-red-900/30 rounded-2xl">
          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{pendingRequests.length} Dossiers En attente</span>
        </div>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 bg-neutral-900/20 border border-dashed border-neutral-800 rounded-[3rem] opacity-40">
          <Clock className="w-16 h-16 text-neutral-800 mb-6" />
          <p className="text-xs font-black uppercase tracking-[0.3em] text-neutral-600">Registre de validation vide</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pendingRequests.map(request => {
            const vehicle = store.vehicles.find(v => v.id === request.vehicleId);
            const isEditing = editingId === request.id;

            return (
              <div key={request.id} className={`group bg-neutral-900/50 border rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row transition-all duration-500 ${isEditing ? 'border-red-600 scale-[1.02]' : 'border-neutral-800 hover:border-neutral-700'}`}>
                <div className="w-full lg:w-80 bg-neutral-950 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-neutral-800 relative group overflow-hidden">
                  <img
                    src={request.proofPhoto || `https://picsum.photos/seed/${request.id}/400/400`}
                    className="object-cover w-full h-full opacity-40 group-hover:opacity-80 transition-all duration-700 cursor-pointer group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 px-6 py-8 flex flex-col justify-end">
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Justificatif</p>
                    <button className="text-xs font-black text-white uppercase text-left tracking-tight">Cliquer pour agrandir</button>
                  </div>
                </div>

                <div className="flex-1 p-10 flex flex-col relative overflow-hidden">
                  {request.status === MaintenanceStatus.REJECTED && !isEditing && (
                    <div className="absolute top-6 right-6 px-4 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest rotate-3 animate-pulse">
                      Précédemment Refusé
                    </div>
                  )}

                  <div className="flex flex-col xl:flex-row justify-between items-start gap-8 mb-10">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          className="bg-neutral-950 border border-red-600/50 p-4 rounded-xl text-xl font-black text-white w-full uppercase outline-none"
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                        />
                      ) : (
                        <h3 className="font-black text-3xl text-neutral-100 uppercase tracking-tighter truncate">{request.maintenanceType || request.description || 'Opération Sans Titre'}</h3>
                      )}

                      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">{vehicle?.name || 'Agence / Général'}</p>
                        <div className="flex items-center gap-2 opacity-60">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">
                            {request.agentName || 'Agent'} • {new Date(request.date).toLocaleDateString()} à {new Date(request.createdAt || request.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="w-full xl:w-auto p-6 bg-neutral-950 rounded-3xl border border-neutral-800 shadow-inner flex xl:flex-col justify-between xl:justify-center items-center gap-2 min-w-[200px]">
                      <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest xl:mb-1">Montant Saisi</p>
                      {isEditing ? (
                        <div className="flex items-center gap-2 lg:flex-col lg:items-end">
                          <input
                            type="number"
                            className="bg-neutral-900 border border-red-600/50 p-2 rounded-lg text-xl font-black text-red-500 w-32 text-right outline-none"
                            value={editAmount}
                            onChange={e => setEditAmount(e.target.value)}
                          />
                          <input
                            type="number"
                            className="bg-neutral-900 border border-neutral-800 p-1.5 rounded-lg text-xs font-black text-neutral-500 w-24 text-right outline-none"
                            value={editMileage}
                            onChange={e => setEditMileage(e.target.value)}
                            placeholder="Index KM"
                          />
                        </div>
                      ) : (
                        <div className="text-right">
                          <p className="text-3xl font-black text-red-500">{(request.amount ?? 0).toLocaleString()} <span className="text-xs text-neutral-600">{CURRENCY}</span></p>
                          <p className="text-[10px] text-neutral-400 font-bold uppercase mt-1 tracking-widest">Index : {(request.mileageAtEntry ?? 0).toLocaleString()} KM</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-neutral-950/60 p-6 rounded-3xl mb-10 border border-neutral-800 relative group/info">
                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-3">Détails de l'agent</p>
                    <p className="text-sm text-neutral-300 italic font-medium leading-relaxed opacity-80 group-hover/info:opacity-100 transition-opacity">
                      "{request.info || request.description || 'Aucune information supplémentaire fournie.'}"
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-auto">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveAndApprove(request)}
                          className="flex-1 flex items-center justify-center gap-3 bg-sky-600 hover:bg-sky-500 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all"
                        >
                          <Save className="w-5 h-5" /> Enregistrer & Valider
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-8 bg-neutral-800 hover:bg-neutral-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => store.approveMaintenance(request.id)}
                          className="flex-1 flex items-center justify-center gap-3 bg-emerald-700 hover:bg-emerald-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-emerald-900/20 transition-all active:scale-95"
                        >
                          <CheckCircle className="w-5 h-5" /> Approuver sans modif
                        </button>
                        <button
                          onClick={() => startEditing(request)}
                          className="flex-1 flex items-center justify-center gap-3 bg-neutral-950 border border-neutral-800 hover:border-red-900 hover:text-red-500 text-neutral-500 p-5 rounded-2xl font-black uppercase tracking-widest transition-all"
                        >
                          <Edit2 className="w-5 h-5" /> Modifier & Valider
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Raison du rejet (sera notifié à l\'agent) :');
                            if (reason) store.rejectMaintenance(request.id);
                          }}
                          className="sm:w-32 flex items-center justify-center gap-3 bg-transparent border border-neutral-800 hover:bg-red-950 text-neutral-700 hover:text-red-500 p-5 rounded-2xl font-black uppercase tracking-widest transition-all scale-90"
                          title="Rejeter"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminValidation;
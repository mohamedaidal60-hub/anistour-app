
import React, { useState } from 'react';
import { useFleetStore } from '../store.ts';
import { EntryType, MaintenanceStatus, FinancialEntry } from '../types.ts';
import { CheckCircle, XCircle, Clock, ShieldCheck, Edit2, Save, Printer } from 'lucide-react';
import { CURRENCY } from '../constants.ts';

interface AdminValidationProps {
  store: ReturnType<typeof useFleetStore>;
}

const AdminValidation: React.FC<AdminValidationProps> = ({ store }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMileage, setEditMileage] = useState('');
  const [editDate, setEditDate] = useState('');

  const pendingRequests = store.entries.filter(e =>
    (e.status === MaintenanceStatus.PENDING || e.status === MaintenanceStatus.REJECTED)
  );

  const startEditing = (req: FinancialEntry) => {
    setEditingId(req.id);
    setEditAmount(req.amount.toString());
    setEditDescription(req.description || req.designation || '');
    setEditMileage(req.mileageAtEntry?.toString() || '');
    setEditDate(req.date?.split('T')[0] || '');
  };

  const [isValidating, setIsValidating] = useState(false);

  const saveAndApprove = async (req: FinancialEntry) => {
    if (isValidating) return;
    setIsValidating(true);
    try {
      const updated: FinancialEntry = {
        ...req,
        amount: Number(editAmount),
        description: editDescription,
        mileageAtEntry: Number(editMileage),
        date: editDate || req.date,
        status: MaintenanceStatus.APPROVED
      };
      await store.updateEntry(updated);
      if (req.type === EntryType.EXPENSE_MAINTENANCE) {
        await store.approveMaintenance(req.id);
      }
      setEditingId(null);
    } finally {
      setIsValidating(false);
    }
  };

  const approveRequest = async (id: string) => {
    if (isValidating) return;
    setIsValidating(true);
    try {
      await store.approveMaintenance(id);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-900/10 blur-[100px] pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-red-700 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-red-900/40 border border-red-600">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tighter">Terminal de Validation</h3>
            <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-[0.2em] mt-0.5">Contrôle des flux</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10 print:hidden">
          <button
            onClick={() => window.print()}
            className="p-3 bg-neutral-950 hover:bg-white hover:text-black rounded-xl border border-neutral-800 transition-all shadow-xl text-neutral-400"
            title="Imprimer"
          >
            <Printer className="w-5 h-5" />
          </button>
          <div className="px-4 py-2 bg-red-950/20 border border-red-900/30 rounded-xl">
            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">{pendingRequests.length} Dossiers En attente</span>
          </div>
        </div>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-neutral-900/20 border border-dashed border-neutral-800 rounded-[2rem] opacity-40">
          <Clock className="w-12 h-12 text-neutral-800 mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600">Registre vide</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map(request => {
            const vehicle = store.vehicles.find(v => v.id === request.vehicleId);
            const isEditing = editingId === request.id;

            return (
              <div key={request.id} className={`group bg-neutral-900/50 border rounded-[2rem] overflow-hidden shadow-xl flex flex-col lg:flex-row transition-all duration-500 ${isEditing ? 'border-red-600 scale-[1.01]' : 'border-neutral-800 hover:border-neutral-700'}`}>
                {request.proofPhoto && (
                  <div className="w-full lg:w-48 bg-neutral-950 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-neutral-800 relative group overflow-hidden h-48 lg:h-auto shrink-0">
                    <img
                      src={request.proofPhoto}
                      className="object-cover w-full h-full opacity-60 group-hover:opacity-100 transition-all duration-700 cursor-pointer"
                      onClick={() => {
                        const w = window.open('about:blank');
                        if (w) { w.document.write(`<img src="${request.proofPhoto}"/>`); w.document.close(); }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 to-transparent flex items-end p-4 pointer-events-none">
                      <p className="text-[8px] font-black text-white uppercase tracking-widest">Preuve</p>
                    </div>
                  </div>
                )}

                <div className="flex-1 p-6 flex flex-col relative overflow-hidden">
                  {request.status === MaintenanceStatus.REJECTED && !isEditing && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest rotate-3 animate-pulse">
                      Refusé
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Description</label>
                          <input
                            className="bg-neutral-950 border border-red-600/50 p-3 rounded-xl text-sm font-bold text-white w-full uppercase outline-none focus:bg-neutral-900"
                            value={editDescription}
                            onChange={e => setEditDescription(e.target.value)}
                          />
                        </div>
                      ) : (
                        <h3 className="font-black text-lg text-neutral-100 uppercase tracking-tight truncate pr-4" title={request.description}>
                          {request.maintenanceType || request.description || 'Opération Sans Titre'}
                        </h3>
                      )}

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em]">{vehicle?.name || 'Agence / Général'}</p>
                        <div className="flex items-center gap-2 opacity-60">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <p className="text-[9px] text-neutral-400 font-black uppercase tracking-widest">
                            {request.agentName || 'Agent'} • {new Date(request.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-auto p-4 bg-neutral-950 rounded-2xl border border-neutral-800 shadow-inner flex md:flex-col justify-between md:justify-center items-end gap-1 min-w-[120px]">
                      <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest md:mb-1">Montant</p>
                      {isEditing ? (
                        <div className="space-y-2 w-full">
                          <input
                            type="number"
                            className="bg-neutral-900 border border-red-600/50 p-2 rounded-lg text-sm font-black text-red-500 w-full text-right outline-none"
                            value={editAmount}
                            onChange={e => setEditAmount(e.target.value)}
                          />
                          {request.vehicleId && (
                            <input
                              type="number"
                              className="bg-neutral-900 border border-neutral-800 p-1.5 rounded-lg text-[10px] font-black text-neutral-500 w-full text-right outline-none"
                              value={editMileage}
                              onChange={e => setEditMileage(e.target.value)}
                              placeholder="Index KM"
                            />
                          )}
                          <input
                            type="date"
                            className="bg-neutral-900 border border-neutral-800 p-1.5 rounded-lg text-[10px] font-black text-neutral-500 w-full text-right outline-none mt-1"
                            value={editDate}
                            onChange={e => setEditDate(e.target.value)}
                          />
                        </div>
                      ) : (
                        <div className="text-right">
                          <p className="text-xl font-black text-red-500">{(request.amount ?? 0).toLocaleString()} <span className="text-[9px] text-neutral-600">{CURRENCY}</span></p>
                          {request.mileageAtEntry && <p className="text-[8px] text-neutral-400 font-bold uppercase mt-0.5 tracking-widest">Index : {(request.mileageAtEntry ?? 0).toLocaleString()} KM</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* INFO SECTION: Items & Signature */}
                  {(request.info || request.signature) && (
                    <div className="mx-6 mb-6 p-4 bg-neutral-950/50 border border-neutral-800 rounded-2xl flex flex-col md:flex-row gap-6">
                      {request.info && (
                        <div className="flex-1 space-y-2">
                          <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Détails (Filtres/Pièces)</p>
                          <div className="space-y-1">
                            {JSON.parse(request.info).map((item: any, i: number) => (
                              <div key={i} className="flex justify-between text-[10px] font-bold text-neutral-400">
                                <span>• {item.name}</span>
                                <span className="text-red-500">{item.price?.toLocaleString()} DA</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {request.signature && (
                        <div className="shrink-0 space-y-2">
                          <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest text-center">Certification Agent</p>
                          <div className="bg-white/5 p-1 rounded-lg border border-neutral-800">
                            <img src={request.signature} className="h-16 object-contain invert" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 mt-auto pt-4 border-t border-neutral-800/50">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveAndApprove(request)}
                          className="flex-1 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white p-3 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg transition-all"
                        >
                          <Save className="w-4 h-4" /> Enregistrer & Valider
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-6 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-black uppercase tracking-widest text-[9px] transition-all"
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => approveRequest(request.id)}
                          disabled={isValidating}
                          className={`flex-1 flex items-center justify-center gap-2 bg-neutral-100 hover:bg-white text-neutral-900 p-3 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg transition-all active:scale-95 ${isValidating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <CheckCircle className={`w-4 h-4 text-emerald-600 ${isValidating ? 'animate-pulse' : ''}`} /> {isValidating ? 'Validation...' : 'Approuver'}
                        </button>
                        <button
                          onClick={() => startEditing(request)}
                          disabled={isValidating}
                          className="flex-1 flex items-center justify-center gap-2 bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 text-neutral-400 hover:text-white p-3 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all"
                        >
                          <Edit2 className="w-4 h-4" /> Modifier & Valider
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Raison du rejet (sera notifié à l\'agent) :');
                            if (reason) store.rejectMaintenance(request.id);
                          }}
                          className="px-4 flex items-center justify-center bg-transparent border border-neutral-800 hover:bg-red-950/30 text-neutral-600 hover:text-red-500 rounded-xl transition-all"
                          title="Rejeter"
                        >
                          <XCircle className="w-4 h-4" />
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
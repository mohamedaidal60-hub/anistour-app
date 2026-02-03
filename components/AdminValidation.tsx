import React from 'react';
import { useFleetStore } from '../store.ts';
import { EntryType, MaintenanceStatus } from '../types.ts';
import { CheckCircle, XCircle, Clock, ExternalLink, ShieldCheck } from 'lucide-react';
import { CURRENCY } from '../constants.ts';

interface AdminValidationProps {
  store: ReturnType<typeof useFleetStore>;
}

const AdminValidation: React.FC<AdminValidationProps> = ({ store }) => {
  const pendingRequests = store.entries.filter(e =>
    (e.type === EntryType.EXPENSE_MAINTENANCE || (e.type as string) === 'MAINTENANCE') &&
    (e.status === MaintenanceStatus.PENDING || (e.status as string) === 'PENDING')
  );

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-3xl flex items-center gap-6">
        <div className="w-12 h-12 bg-red-900/30 rounded-2xl flex items-center justify-center shrink-0 border border-red-800">
          <ShieldCheck className="w-7 h-7 text-red-500" />
        </div>
        <div>
          <h3 className="text-sm font-black text-red-500 uppercase tracking-widest">Protocoles de Validation</h3>
          <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
            Toute validation d'entretien met à jour instantanément le carnet de bord et le bénéfice net de l'entreprise.
            Veuillez vérifier les pièces jointes avant approbation.
          </p>
        </div>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-neutral-900/30 border border-dashed border-neutral-800 rounded-[2.5rem]">
          <div className="w-16 h-16 bg-neutral-800 flex items-center justify-center rounded-full mb-6 border border-neutral-700 shadow-xl">
            <Clock className="w-8 h-8 text-neutral-600" />
          </div>
          <p className="text-neutral-500 font-black uppercase tracking-widest text-[10px]">Flux de travail vide</p>
          <p className="text-xs text-neutral-600 mt-2">Aucune demande d'entretien en attente de votre signature.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="px-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest">{pendingRequests.length} Dossiers à traiter</p>
          {pendingRequests.map(request => {
            const vehicle = store.vehicles.find(v => v.id === request.vehicleId);
            return (
              <div key={request.id} className="bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row transition-all hover:border-neutral-700">
                <div className="w-full lg:w-72 bg-neutral-950 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-neutral-800 group relative">
                  <img
                    src={request.proofPhoto || `https://picsum.photos/seed/${request.id}/400/400`}
                    alt="Justificatif"
                    className="object-cover w-full h-full opacity-60 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                    <button className="px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <ExternalLink className="w-3 h-3" /> Agrandir
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-8 flex flex-col">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                    <div>
                      <h3 className="font-black text-2xl text-neutral-100 uppercase tracking-tighter">{request.maintenanceType || request.description || 'Entretien'}</h3>
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em] mt-1">{vehicle?.name}</p>
                      <div className="flex items-center gap-2 mt-4">
                        <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center">
                          <Clock className="w-3 h-3 text-neutral-600" />
                        </div>
                        <p className="text-[9px] text-neutral-500 font-bold uppercase">Saisi par <span className="text-neutral-300">{request.agentName || request.userName || 'Agent'}</span> • {request.date ? new Date(request.date).toLocaleString('fr-FR') : '-'}</p>
                      </div>
                    </div>
                    <div className="text-right w-full sm:w-auto p-4 bg-neutral-950 rounded-2xl border border-neutral-800">
                      <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-1">Montant Saisi</p>
                      <p className="text-2xl font-black text-red-500">{(request.amount ?? 0).toLocaleString()} <span className="text-xs text-neutral-600">{CURRENCY}</span></p>
                      <p className="text-[10px] text-neutral-400 font-black uppercase mt-1">@ {(request.mileageAtEntry ?? 0).toLocaleString()} KM</p>
                    </div>
                  </div>

                  <div className="bg-neutral-950/50 p-6 rounded-2xl mb-8 border border-neutral-800">
                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-2">Observations de l'agent</p>
                    <p className="text-sm text-neutral-300 italic">"{request.info || request.description || 'Aucune observation enregistrée pour cette opération.'}"</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                    <button
                      onClick={() => store.approveMaintenance(request.id)}
                      className="flex-1 flex items-center justify-center gap-3 bg-emerald-700 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 transition-all active:scale-95"
                    >
                      <CheckCircle className="w-5 h-5" /> Approuver le Dossier
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Raison du rejet (sera notifié à l\'agent) :');
                        if (reason) store.rejectMaintenance(request.id);
                      }}
                      className="sm:w-48 flex items-center justify-center gap-3 bg-neutral-950 border border-neutral-800 hover:bg-red-950 hover:border-red-900 text-neutral-500 hover:text-red-500 py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                      <XCircle className="w-5 h-5" /> Rejeter
                    </button>
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
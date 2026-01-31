
import React, { useState, useRef } from 'react';
import { useFleetStore } from '../store.ts';
import { EntryType, FinancialEntry, MaintenanceStatus, UserRole } from '../types.ts';
import { PlusCircle, Info, Image as ImageIcon, CheckCircle2, ChevronDown, Camera, Upload, ShieldAlert } from 'lucide-react';
import { MAINTENANCE_TYPES, CURRENCY } from '../constants.ts';

interface DailyEntryProps {
  store: ReturnType<typeof useFleetStore>;
}

const DailyEntry: React.FC<DailyEntryProps> = ({ store }) => {
  const [activeForm, setActiveForm] = useState<'REVENUE' | 'EXPENSE'>('REVENUE');
  const [vehicleId, setVehicleId] = useState('');
  const [amount, setAmount] = useState('');
  const [clientName, setClientName] = useState('');
  const [designation, setDesignation] = useState('');
  const [info, setInfo] = useState('');
  const [expenseType, setExpenseType] = useState<EntryType>(EntryType.EXPENSE_SIMPLE);
  const [maintenanceType, setMaintenanceType] = useState('Vidange');
  const [customNotifyKm, setCustomNotifyKm] = useState('');
  const [mileage, setMileage] = useState('');
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProofPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    let finalDesignation = activeForm === 'REVENUE' ? `Revenu: ${clientName}` : 
                            (expenseType === EntryType.EXPENSE_MAINTENANCE ? `Entretien: ${maintenanceType}` : designation);

    // If it's a custom maintenance, append the notification requirement to info
    let finalInfo = info;
    if (maintenanceType === 'Autres' && customNotifyKm) {
      finalInfo = `${info} [Alerte à +${customNotifyKm} KM]`.trim();
    }

    const entry: FinancialEntry = {
      id: Date.now().toString(),
      vehicleId: vehicleId || undefined,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      amount: Number(amount),
      type: activeForm === 'REVENUE' ? EntryType.REVENUE : expenseType,
      designation: finalDesignation,
      clientName: activeForm === 'REVENUE' ? clientName : undefined,
      info: finalInfo,
      userName: store.currentUser?.name || 'Agent Anistour',
      proofPhoto: proofPhoto || undefined,
      status: activeForm === 'EXPENSE' && expenseType === EntryType.EXPENSE_MAINTENANCE ? MaintenanceStatus.PENDING : MaintenanceStatus.APPROVED,
      maintenanceType: expenseType === EntryType.EXPENSE_MAINTENANCE ? maintenanceType : undefined,
      mileageAtEntry: mileage ? Number(mileage) : undefined,
    };

    // Update vehicle maintenance interval if "Autres" with custom KM
    if (expenseType === EntryType.EXPENSE_MAINTENANCE && maintenanceType === 'Autres' && customNotifyKm) {
      const vehicle = store.vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        const interval = Number(customNotifyKm);
        const newConfigs = [...vehicle.maintenanceConfigs];
        const existingIdx = newConfigs.findIndex(c => c.type === 'Autres');
        if (existingIdx >= 0) {
          newConfigs[existingIdx].intervalKm = interval;
        } else {
          newConfigs.push({ type: 'Autres', intervalKm: interval, lastKm: Number(mileage), nextNotifyKm: Number(mileage) + interval });
        }
        // This update will be finalized upon Admin approval in store logic, 
        // but we store the intent in the entry description/info for the admin to see.
      }
    }

    await store.addEntry(entry);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      resetForm();
    }, 2500);
  };

  const resetForm = () => {
    setVehicleId('');
    setAmount('');
    setClientName('');
    setDesignation('');
    setInfo('');
    setMileage('');
    setProofPhoto(null);
    setCustomNotifyKm('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-sm relative">
        <div className="absolute top-4 right-8 flex items-center gap-2 opacity-50">
           <ShieldAlert className="w-4 h-4 text-red-500" />
           <span className="text-[10px] font-black uppercase tracking-widest">Saisie sécurisée</span>
        </div>

        <div className="flex border-b border-neutral-800 bg-neutral-950/50 p-3">
          <button 
            onClick={() => { setActiveForm('REVENUE'); setExpenseType(EntryType.REVENUE); resetForm(); }}
            className={`flex-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all ${activeForm === 'REVENUE' ? 'bg-emerald-700 text-white shadow-xl' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            Saisie Revenu
          </button>
          <button 
            onClick={() => { setActiveForm('EXPENSE'); setExpenseType(EntryType.EXPENSE_SIMPLE); resetForm(); }}
            className={`flex-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all ${activeForm === 'EXPENSE' ? 'bg-red-700 text-white shadow-xl' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            Saisie Charge
          </button>
        </div>

        <div className="p-10">
          {success ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-950/30 rounded-full flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-black uppercase tracking-tighter text-emerald-500">Transmission Réussie</p>
                <p className="text-neutral-500 mt-2 text-sm uppercase font-bold tracking-widest">Opération enregistrée par {store.currentUser?.name}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Véhicule concerné</label>
                    <select 
                      className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl focus:border-red-600 outline-none text-sm font-bold text-neutral-200"
                      value={vehicleId}
                      onChange={(e) => setVehicleId(e.target.value)}
                      required={activeForm === 'REVENUE' || expenseType === EntryType.EXPENSE_MAINTENANCE}
                    >
                      <option value="">Sélectionner un véhicule...</option>
                      {store.vehicles.filter(v => !v.isArchived).map(v => (
                        <option key={v.id} value={v.id}>{v.name} (Actuel: {v.lastMileage.toLocaleString()} KM)</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Montant ({CURRENCY})</label>
                    <input 
                      required
                      type="number"
                      className={`w-full bg-neutral-950 border border-neutral-800 p-5 rounded-2xl text-4xl font-black outline-none transition-all ${activeForm === 'REVENUE' ? 'text-emerald-500 focus:border-emerald-600' : 'text-red-500 focus:border-red-600'}`}
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  {activeForm === 'REVENUE' ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Nom Complet du Client</label>
                      <input required className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl outline-none focus:border-emerald-600 text-sm font-bold" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Catégorie de dépense</label>
                        <div className="grid grid-cols-2 gap-3">
                           <button type="button" onClick={() => setExpenseType(EntryType.EXPENSE_SIMPLE)} className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${expenseType === EntryType.EXPENSE_SIMPLE ? 'bg-red-700 border-red-700 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-600'}`}>Charge Simple</button>
                           <button type="button" onClick={() => setExpenseType(EntryType.EXPENSE_MAINTENANCE)} className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${expenseType === EntryType.EXPENSE_MAINTENANCE ? 'bg-red-700 border-red-700 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-600'}`}>Entretien</button>
                        </div>
                      </div>
                      {expenseType === EntryType.EXPENSE_SIMPLE ? (
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Désignation (ex: Loyer, Salaire)</label>
                            <input required className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl outline-none focus:border-red-600 text-sm font-bold" value={designation} onChange={(e) => setDesignation(e.target.value)} />
                         </div>
                      ) : (
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Type d'Entretien</label>
                            <select className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl focus:border-red-600 outline-none text-sm font-bold" value={maintenanceType} onChange={(e) => setMaintenanceType(e.target.value)}>
                               {MAINTENANCE_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            {maintenanceType === 'Autres' && (
                              <div className="mt-4 p-4 bg-red-950/20 border border-red-900/50 rounded-2xl space-y-2 animate-in slide-in-from-top-2">
                                <label className="text-[9px] font-black text-red-500 uppercase">Dans combien de KM notifier ?</label>
                                <input 
                                  required 
                                  type="number" 
                                  placeholder="ex: 15000" 
                                  className="w-full bg-neutral-950 border border-red-900/30 p-3 rounded-xl text-sm font-black text-white" 
                                  value={customNotifyKm}
                                  onChange={(e) => setCustomNotifyKm(e.target.value)}
                                />
                              </div>
                            )}
                         </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-6">
                  {expenseType === EntryType.EXPENSE_MAINTENANCE && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Kilométrage Actuel (Indispensable)</label>
                      <input required type="number" className="w-full bg-neutral-950 border border-neutral-800 p-5 rounded-2xl outline-none focus:border-red-600 text-xl font-black text-red-500" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="000 000" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Justificatif (Bon / Facture)</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-neutral-800 rounded-3xl p-8 flex flex-col items-center justify-center text-neutral-600 hover:text-red-500 hover:border-red-500/50 cursor-pointer transition-all bg-neutral-950/30 overflow-hidden min-h-[160px]"
                    >
                      {proofPhoto ? (
                        <div className="relative w-full h-full">
                           <img src={proofPhoto} className="w-full h-32 object-contain rounded-lg" />
                           <p className="text-[8px] text-center mt-2 uppercase font-black text-neutral-500">Document attaché</p>
                        </div>
                      ) : (
                        <>
                          <Camera className="w-8 h-8 mb-3" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-center">Capturer ou Uploader le Bon</span>
                        </>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Informations complémentaires</label>
                    <textarea className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl h-24 outline-none focus:border-red-600 text-sm resize-none font-medium" value={info} onChange={(e) => setInfo(e.target.value)} placeholder="Détails sur la pièce changée ou le client..."></textarea>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 pt-8">
                <button type="submit" className={`w-full py-6 rounded-3xl text-xl font-black uppercase tracking-widest shadow-2xl transition-all active:scale-[0.98] ${activeForm === 'REVENUE' ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-red-700 hover:bg-red-600'}`}>
                  Valider et Envoyer
                </button>
                <p className="text-center text-[9px] text-neutral-600 uppercase font-black tracking-widest mt-4">Toute saisie sera vérifiée par l'administrateur</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyEntry;

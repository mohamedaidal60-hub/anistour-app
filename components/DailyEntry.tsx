import React, { useState, useRef } from 'react';
import { useFleetStore } from '../store.ts';
import { EntryType, FinancialEntry, MaintenanceStatus, UserRole } from '../types.ts';
import { ShieldAlert, CheckCircle2, Camera, Wallet, Coins } from 'lucide-react';
import { MAINTENANCE_TYPES, CURRENCY } from '../constants.ts';

interface DailyEntryProps {
  store: ReturnType<typeof useFleetStore>;
}

const DailyEntry: React.FC<DailyEntryProps> = ({ store }) => {
  const [activeForm, setActiveForm] = useState<'REVENUE' | 'EXPENSE_VEHICLE' | 'EXPENSE_GLOBAL'>('REVENUE');
  const [vehicleId, setVehicleId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseType, setExpenseType] = useState<EntryType>(EntryType.EXPENSE_SIMPLE);
  const [maintenanceType, setMaintenanceType] = useState(MAINTENANCE_TYPES[0] || 'Vidange');
  const [mileage, setMileage] = useState('');
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [usePersonalCaisse, setUsePersonalCaisse] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [success, setSuccess] = useState(false);

  const myCaisse = store.cashDesks.find(d => d.userId === store.currentUser?.id);

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

    const cashDeskId = usePersonalCaisse && myCaisse ? myCaisse.id : undefined;

    if (activeForm === 'EXPENSE_GLOBAL') {
      const globalExp = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        amount: Number(amount),
        description: description || 'Dépense Générale',
        category: 'AUTRE',
        proofPhoto: proofPhoto || undefined,
        agentName: store.currentUser?.name || 'Agent',
        cashDeskId: cashDeskId // Handle global expenses from personal caisse too
      };

      // Update: Global expenses now also impact cash desk if selected
      if (cashDeskId) {
        // We simulate a financial entry for the cash desk tracking if it's not and admin adding to agency
        await store.addEntry({
          id: `global-${globalExp.id}`,
          date: globalExp.date,
          amount: globalExp.amount,
          type: EntryType.EXPENSE_SIMPLE,
          description: `Charge Globale: ${globalExp.description}`,
          cashDeskId: cashDeskId,
          agentName: globalExp.agentName,
          status: MaintenanceStatus.APPROVED
        });
      }
      await store.addGlobalExpense(globalExp);
    } else {
      let finalDescription = description;
      if (activeForm === 'REVENUE') {
        finalDescription = description ? `Revenu: ${description}` : 'Revenu Client';
      } else if (expenseType === EntryType.EXPENSE_MAINTENANCE) {
        finalDescription = `Entretien: ${maintenanceType} - ${description}`;
      }

      const entry: FinancialEntry = {
        id: Date.now().toString(),
        vehicleId: vehicleId || undefined,
        cashDeskId: cashDeskId,
        date: new Date().toISOString().split('T')[0],
        amount: Number(amount),
        type: activeForm === 'REVENUE' ? EntryType.REVENUE : expenseType,
        description: finalDescription,
        agentName: store.currentUser?.name || 'Agent Anistour',
        mileageAtEntry: mileage ? Number(mileage) : undefined,
        status: activeForm === 'EXPENSE_VEHICLE' && expenseType === EntryType.EXPENSE_MAINTENANCE ? MaintenanceStatus.PENDING : MaintenanceStatus.APPROVED,
        maintenanceType: expenseType === EntryType.EXPENSE_MAINTENANCE ? maintenanceType : undefined,
        proofPhoto: proofPhoto || undefined,
        createdAt: new Date().toISOString()
      };
      await store.addEntry(entry);
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      resetForm();
    }, 2500);
  };

  const resetForm = () => {
    setVehicleId('');
    setAmount('');
    setDescription('');
    setMileage('');
    setProofPhoto(null);
    setUsePersonalCaisse(false);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-[3rem] shadow-2xl overflow-hidden backdrop-blur-sm relative border-t-neutral-700/30">

        {/* Header Tabs */}
        <div className="flex flex-col border-b border-neutral-800 bg-neutral-950/80 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="px-5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Terminal de Saisie Fleet</span>
            </div>
            {myCaisse && (
              <div className="flex items-center gap-3 bg-red-950/20 px-4 py-2.5 rounded-2xl border border-red-900/30">
                <Wallet className="w-4 h-4 text-red-500" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{(myCaisse.balance ?? 0).toLocaleString()} {CURRENCY}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => { setActiveForm('REVENUE'); setExpenseType(EntryType.REVENUE); resetForm(); }}
              type="button"
              className={`py-5 px-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border ${activeForm === 'REVENUE' ? 'bg-emerald-700 border-emerald-600 text-white shadow-xl shadow-emerald-900/40 translate-y-[-2px]' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'}`}
            >
              Recette (Achat)
            </button>
            <button
              onClick={() => { setActiveForm('EXPENSE_VEHICLE'); setExpenseType(EntryType.EXPENSE_SIMPLE); resetForm(); }}
              type="button"
              className={`py-5 px-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border ${activeForm === 'EXPENSE_VEHICLE' ? 'bg-red-700 border-red-600 text-white shadow-xl shadow-red-900/40 translate-y-[-2px]' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'}`}
            >
              Véhicule
            </button>
            <button
              onClick={() => { setActiveForm('EXPENSE_GLOBAL'); resetForm(); }}
              type="button"
              className={`py-5 px-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border ${activeForm === 'EXPENSE_GLOBAL' ? 'bg-red-900/40 border-red-800 text-neutral-400 text-white shadow-xl translate-y-[-2px]' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'}`}
            >
              Charge Agence
            </button>
          </div>
        </div>

        <div className="p-8 sm:p-12">
          {success ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-950/30 rounded-full flex items-center justify-center border-2 border-emerald-500/30 shadow-2xl shadow-emerald-900/20">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-3xl font-black uppercase tracking-tighter text-emerald-500">Données Sécurisées</p>
                <p className="text-neutral-500 mt-3 text-[10px] font-black uppercase tracking-[0.3em]">Mise à jour du registre en cours...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Cash Desk Selection Selection */}
              <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-3xl space-y-4 shadow-inner">
                <div className="flex items-center gap-3 mb-2">
                  <Coins className="w-4 h-4 text-red-600" />
                  <label className="text-[10px] font-black text-neutral-100 uppercase tracking-[0.2em]">Source / Destination des fonds</label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => setUsePersonalCaisse(false)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${!usePersonalCaisse ? 'bg-neutral-900 border-red-600/50 shadow-lg' : 'bg-neutral-950 border-neutral-800 opacity-50'}`}
                  >
                    <p className="text-[11px] font-black text-white uppercase tracking-widest text-center">Caisse Agence (Global)</p>
                  </div>
                  {myCaisse && (
                    <div
                      onClick={() => setUsePersonalCaisse(true)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${usePersonalCaisse ? 'bg-red-950/20 border-red-600 shadow-lg' : 'bg-neutral-950 border-neutral-800 opacity-50'}`}
                    >
                      <p className="text-[11px] font-black text-white uppercase tracking-widest text-center">Ma Caisse ({myCaisse.userName})</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left Side */}
                <div className="space-y-8">
                  {activeForm !== 'EXPENSE_GLOBAL' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Véhicule</label>
                      <select
                        className="w-full bg-neutral-950 border border-neutral-800 p-5 rounded-2xl focus:border-red-600 outline-none text-sm font-bold text-white shadow-xl transition-all"
                        value={vehicleId}
                        onChange={(e) => setVehicleId(e.target.value)}
                        required
                      >
                        <option value="">Sélectionner une unité...</option>
                        {store.vehicles.filter(v => !v.isArchived).map(v => (
                          <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Montant ({CURRENCY})</label>
                    <input
                      required
                      type="number"
                      className={`w-full bg-neutral-950 border border-neutral-800 p-6 rounded-3xl text-5xl font-black outline-none transition-all shadow-2xl ${activeForm === 'REVENUE' ? 'text-emerald-500 focus:border-emerald-600' : 'text-white focus:border-red-600'}`}
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  {activeForm === 'EXPENSE_VEHICLE' && (
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Type de dépense</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setExpenseType(EntryType.EXPENSE_SIMPLE)}
                          className={`p-5 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${expenseType === EntryType.EXPENSE_SIMPLE ? 'bg-neutral-800 border-red-600 text-white shadow-xl' : 'bg-neutral-950 border-neutral-800 text-neutral-600'}`}
                        >
                          Courante
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpenseType(EntryType.EXPENSE_MAINTENANCE)}
                          className={`p-5 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${expenseType === EntryType.EXPENSE_MAINTENANCE ? 'bg-red-700 border-red-600 text-white shadow-xl' : 'bg-neutral-950 border-neutral-800 text-neutral-600'}`}
                        >
                          Entretien
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side */}
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Description / Motif</label>
                    <textarea
                      required
                      rows={3}
                      className="w-full bg-neutral-950 border border-neutral-800 p-5 rounded-3xl outline-none focus:border-red-600 text-sm font-bold text-white shadow-xl resize-none"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={activeForm === 'REVENUE' ? "Détails de la location, client..." : "Objet de la dépense..."}
                    />
                  </div>

                  {expenseType === EntryType.EXPENSE_MAINTENANCE && activeForm === 'EXPENSE_VEHICLE' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Nature Entretien</label>
                        <select
                          className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl focus:border-red-600 outline-none text-sm font-bold text-white"
                          value={maintenanceType}
                          onChange={(e) => setMaintenanceType(e.target.value)}
                        >
                          {MAINTENANCE_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Index Compteur</label>
                        <input
                          required
                          type="number"
                          className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl outline-none focus:border-red-600 text-lg font-black text-red-500"
                          value={mileage}
                          onChange={(e) => setMileage(e.target.value)}
                          placeholder="000000"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Preuve / Reçu (Photo)</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-neutral-800 rounded-3xl p-6 flex flex-col items-center justify-center text-neutral-600 hover:text-red-600 hover:border-red-500/50 cursor-pointer transition-all bg-neutral-950/50 h-32 group shadow-inner"
                    >
                      {proofPhoto ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                          <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">Document Chargé</span>
                        </div>
                      ) : (
                        <>
                          <Camera className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Prendre / Envoyer Photo</span>
                        </>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>
                </div>
              </div>

              <div className="pt-10">
                <button
                  type="submit"
                  className={`w-full py-7 rounded-[2rem] text-xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-[0.97] ${activeForm === 'REVENUE' ? 'bg-emerald-700 hover:bg-emerald-600 shadow-emerald-950' : 'bg-red-700 hover:bg-red-600 shadow-red-950'}`}
                >
                  Valider l'Opération
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyEntry;

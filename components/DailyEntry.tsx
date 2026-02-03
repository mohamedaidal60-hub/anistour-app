
import React, { useState, useRef } from 'react';
import { useFleetStore } from '../store.ts';
import { EntryType, FinancialEntry, MaintenanceStatus, UserRole } from '../types.ts';
import { ShieldAlert, CheckCircle2, Camera } from 'lucide-react';
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

    if (activeForm === 'EXPENSE_GLOBAL') {
      const globalExp = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        amount: Number(amount),
        description: description || 'Dépense Générale',
        category: 'AUTRE',
        proofPhoto: proofPhoto || undefined,
        agentName: store.currentUser?.name || 'Agent'
      };
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
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-sm relative">

        {/* Unified Mobile-Ready Header with Centered Badge */}
        <div className="flex flex-col border-b border-neutral-800 bg-neutral-950/50">
          <div className="flex items-center justify-between p-3 gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => { setActiveForm('REVENUE'); setExpenseType(EntryType.REVENUE); resetForm(); }}
              type="button"
              className={`flex-1 py-3 px-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeForm === 'REVENUE' ? 'bg-emerald-700 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              Revenu
            </button>

            {/* Centered Secure Indicator */}
            <div className="order-first sm:order-none w-full sm:w-auto px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center gap-2 shrink-0 mb-2 sm:mb-0">
              <ShieldAlert className="w-3 h-3 text-red-600 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Saisie Sécurisée</span>
            </div>

            <button
              onClick={() => { setActiveForm('EXPENSE_VEHICLE'); setExpenseType(EntryType.EXPENSE_SIMPLE); resetForm(); }}
              type="button"
              className={`flex-1 py-3 px-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeForm === 'EXPENSE_VEHICLE' ? 'bg-red-700 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              Charge Véhicule
            </button>
          </div>

          <div className="px-3 pb-3">
            <button
              onClick={() => { setActiveForm('EXPENSE_GLOBAL'); resetForm(); }}
              type="button"
              className={`w-full py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${activeForm === 'EXPENSE_GLOBAL' ? 'bg-amber-700 text-white border-amber-600 shadow-lg' : 'text-neutral-500 border-neutral-800 hover:border-neutral-700'}`}
            >
              Charge Globale (Loyer, Salaire, etc.)
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          {success ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-950/30 rounded-full flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-black uppercase tracking-tighter text-emerald-500">Transmission Réussie</p>
                <p className="text-neutral-500 mt-2 text-sm uppercase font-bold tracking-widest">Opération enregistrée</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Vehicle Selector */}
                  {activeForm !== 'EXPENSE_GLOBAL' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Véhicule concerné</label>
                      <select
                        className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl focus:border-red-600 outline-none text-sm font-bold text-neutral-200"
                        value={vehicleId}
                        onChange={(e) => setVehicleId(e.target.value)}
                        required
                      >
                        <option value="">Sélectionner un véhicule...</option>
                        {store.vehicles.filter(v => !v.isArchived).map(v => (
                          <option key={v.id} value={v.id}>{v.name} (Actuel: {(v.lastMileage ?? 0).toLocaleString()} KM)</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Montant ({CURRENCY})</label>
                    <input
                      required
                      type="number"
                      className={`w-full bg-neutral-950 border border-neutral-800 p-5 rounded-2xl text-4xl font-black outline-none transition-all ${activeForm === 'REVENUE' ? 'text-emerald-500 focus:border-emerald-600' : activeForm === 'EXPENSE_GLOBAL' ? 'text-amber-500 focus:border-amber-600' : 'text-red-500 focus:border-red-600'}`}
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  {/* Expense Type Toggle */}
                  {activeForm === 'EXPENSE_VEHICLE' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Nature de la charge</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setExpenseType(EntryType.EXPENSE_SIMPLE)}
                          className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${expenseType === EntryType.EXPENSE_SIMPLE ? 'bg-red-700 border-red-700 text-white shadow-lg shadow-red-900/40' : 'bg-neutral-950 border-neutral-800 text-neutral-600'}`}
                        >
                          Simple
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpenseType(EntryType.EXPENSE_MAINTENANCE)}
                          className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${expenseType === EntryType.EXPENSE_MAINTENANCE ? 'bg-red-700 border-red-700 text-white shadow-lg shadow-red-900/40' : 'bg-neutral-950 border-neutral-800 text-neutral-600'}`}
                        >
                          Entretien
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Dynamic Inputs */}
                  {activeForm === 'REVENUE' ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Détails Revenu (Client)</label>
                      <input
                        required
                        className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl outline-none focus:border-emerald-600 text-sm font-bold"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="ex: Client Sid Ahmed (3 jours)"
                      />
                    </div>
                  ) : activeForm === 'EXPENSE_GLOBAL' ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Détails Charge Globale</label>
                      <input
                        required
                        className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl outline-none focus:border-amber-600 text-sm font-bold"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="ex: Loyer agence, Électricité, Salaires..."
                      />
                    </div>
                  ) : (
                    <>
                      {expenseType === EntryType.EXPENSE_MAINTENANCE ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Type d'Entretien</label>
                            <select
                              className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl focus:border-red-600 outline-none text-sm font-bold"
                              value={maintenanceType}
                              onChange={(e) => setMaintenanceType(e.target.value)}
                            >
                              {MAINTENANCE_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Kilométrage Actuel (Obligatoire)</label>
                            <input
                              required
                              type="number"
                              className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl outline-none focus:border-red-600 text-xl font-bold text-white"
                              value={mileage}
                              onChange={(e) => setMileage(e.target.value)}
                              placeholder="000000"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Détails Charge Véhicule</label>
                          <input
                            required
                            className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl outline-none focus:border-red-600 text-sm font-bold"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="ex: Lavage, Achat essuie-glaces, Ampoule..."
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Photo Upload */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Justificatif (Photo)</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-neutral-800 rounded-2xl p-4 flex items-center justify-center text-neutral-600 hover:text-red-500 hover:border-red-500/50 cursor-pointer transition-all bg-neutral-950/30 overflow-hidden h-24"
                    >
                      {proofPhoto ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          <span className="text-xs font-bold text-emerald-500">Image chargée</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Camera className="w-5 h-5 mb-1" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Ajouter Photo</span>
                        </div>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>
                </div>
              </div>

              {/* Extra Details for Maintenance */}
              {activeForm === 'EXPENSE_VEHICLE' && expenseType === EntryType.EXPENSE_MAINTENANCE && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Détails Supplémentaires (Optionnel)</label>
                  <input
                    className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl outline-none focus:border-red-600 text-sm font-bold"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="ex: Marque de l'huile, Référence pièce..."
                  />
                </div>
              )}

              <div className="pt-8">
                <button
                  type="submit"
                  className={`w-full py-6 rounded-3xl text-xl font-black uppercase tracking-widest shadow-2xl transition-all active:scale-[0.98] ${activeForm === 'REVENUE' ? 'bg-emerald-700 hover:bg-emerald-600 shadow-emerald-900/20' : activeForm === 'EXPENSE_GLOBAL' ? 'bg-amber-700 hover:bg-amber-600 shadow-amber-900/20' : 'bg-red-700 hover:bg-red-600 shadow-red-900/20'}`}
                >
                  Valider la Saisie
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

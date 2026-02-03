
import React, { useState, useRef } from 'react';
import { useFleetStore } from '../store.ts';
import { EntryType, FinancialEntry, MaintenanceStatus, UserRole } from '../types.ts';
import { ShieldAlert, CheckCircle2, Camera } from 'lucide-react';
import { MAINTENANCE_TYPES, CURRENCY } from '../constants.ts';

interface DailyEntryProps {
  store: ReturnType<typeof useFleetStore>;
}

const DailyEntry: React.FC<DailyEntryProps> = ({ store }) => {
  const [activeForm, setActiveForm] = useState<'REVENUE' | 'EXPENSE'>('REVENUE');
  const [vehicleId, setVehicleId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState(''); // Unified description
  const [expenseType, setExpenseType] = useState<EntryType>(EntryType.EXPENSE_SIMPLE);

  // Default to first maintenance type if available, else 'Vidange'
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

    // Construct the final description based on form type
    let finalDescription = description;
    if (activeForm === 'REVENUE') {
      finalDescription = description ? `Revenu: ${description}` : 'Revenu Client';
    } else if (expenseType === EntryType.EXPENSE_MAINTENANCE) {
      finalDescription = `Entretien: ${maintenanceType} - ${description}`;
    }

    const entry: FinancialEntry = {
      id: Date.now().toString(),
      vehicleId: vehicleId || undefined,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      amount: Number(amount),
      type: activeForm === 'REVENUE' ? EntryType.REVENUE : expenseType,
      description: finalDescription,
      agentName: store.currentUser?.name || 'Agent Anistour',
      mileageAtEntry: mileage ? Number(mileage) : undefined,
      status: activeForm === 'EXPENSE' && expenseType === EntryType.EXPENSE_MAINTENANCE ? MaintenanceStatus.PENDING : MaintenanceStatus.APPROVED,
      maintenanceType: expenseType === EntryType.EXPENSE_MAINTENANCE ? maintenanceType : undefined,
      proofPhoto: proofPhoto || undefined,
      // Optional/Legacy fields for maximum compatibility across components
      info: description,
      designation: finalDescription,
      userName: store.currentUser?.name || 'Agent',
      createdAt: new Date().toISOString()
    };

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
    setDescription('');
    setMileage('');
    setProofPhoto(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-sm relative">
        <div className="absolute top-4 right-8 flex items-center gap-2 opacity-50">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <span className="text-[10px] font-black uppercase tracking-widest">Saisie sécurisée</span>
          <span className="text-[10px] text-neutral-500 font-bold ml-2">Agent: {store.currentUser?.name}</span>
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
                <p className="text-neutral-500 mt-2 text-sm uppercase font-bold tracking-widest">Opération enregistrée</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Vehicle Selector */}
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
                        <option key={v.id} value={v.id}>{v.name} (Actuel: {(v.lastMileage ?? 0).toLocaleString()} KM)</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount Input */}
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

                  {/* Expense Type Toggle */}
                  {activeForm === 'EXPENSE' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Type de dépense</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setExpenseType(EntryType.EXPENSE_SIMPLE)}
                          className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${expenseType === EntryType.EXPENSE_SIMPLE ? 'bg-red-700 border-red-700 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-600'}`}
                        >
                          Charge Simple
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpenseType(EntryType.EXPENSE_MAINTENANCE)}
                          className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${expenseType === EntryType.EXPENSE_MAINTENANCE ? 'bg-red-700 border-red-700 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-600'}`}
                        >
                          Entretien
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Variable Inputs based on Type */}
                  {activeForm === 'REVENUE' ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Nom du Client / Détails</label>
                        <input
                          required
                          className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl outline-none focus:border-emerald-600 text-sm font-bold"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="ex: Sid Ahmed (2 jours)"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Kilométrage Retour (Mise à jour)</label>
                        <input
                          required
                          type="number"
                          className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl outline-none focus:border-emerald-600 text-xl font-bold text-white placeholder-neutral-700"
                          value={mileage}
                          onChange={(e) => setMileage(e.target.value)}
                          placeholder="ex: 12500"
                        />
                      </div>
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
                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Kilométrage Actuel (OBLIGATOIRE)</label>
                            <input
                              required
                              type="number"
                              className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl outline-none focus:border-red-600 text-xl font-bold text-white placeholder-neutral-700"
                              value={mileage}
                              onChange={(e) => setMileage(e.target.value)}
                              placeholder="000000"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Description Charge</label>
                          <input
                            required
                            className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl outline-none focus:border-red-600 text-sm font-bold"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="ex: Loyer, Salaire, Achat Pièces..."
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
                      className="border-2 border-dashed border-neutral-800 rounded-3xl p-4 flex items-center justify-center text-neutral-600 hover:text-red-500 hover:border-red-500/50 cursor-pointer transition-all bg-neutral-950/30 overflow-hidden h-24"
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

              {/* Optional Description for Maintenance */}
              {activeForm === 'EXPENSE' && expenseType === EntryType.EXPENSE_MAINTENANCE && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Détails Supplémentaires</label>
                  <input
                    className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl outline-none focus:border-red-600 text-sm font-bold"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Marque huile, réf pièce..."
                  />
                </div>
              )}

              <div className="pt-8">
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

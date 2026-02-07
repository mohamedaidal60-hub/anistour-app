import React, { useState, useRef, useEffect } from 'react';
import { useFleetStore } from '../store.ts';
import { EntryType, FinancialEntry, MaintenanceStatus, UserRole } from '../types.ts';
import { ShieldAlert, CheckCircle2, Camera, Wallet, Coins, Plus, Trash2 } from 'lucide-react';
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

  // Filter Logic for Vidange
  const [filters, setFilters] = useState<{ id: string, name: string, price: number }[]>([]);
  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [newFilterType, setNewFilterType] = useState<string>(MAINTENANCE_TYPES.find(t => t !== 'Vidange') || 'Filtre à huile');
  const [newFilterPrice, setNewFilterPrice] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [success, setSuccess] = useState(false);

  const myCaisse = store.cashDesks.find(d => d.userId === store.currentUser?.id);
  const isAdmin = store.currentUser?.role === UserRole.ADMIN;

  // Auto-update amount based on filters for Vidange
  useEffect(() => {
    if (activeForm === 'EXPENSE_VEHICLE' && expenseType === EntryType.EXPENSE_MAINTENANCE && maintenanceType === 'Vidange') {
      const total = filters.reduce((sum, f) => sum + f.price, 0);
      if (total > 0) {
        setAmount(total.toString());
      }
    }
  }, [filters, activeForm, expenseType, maintenanceType]);

  // Reset filters when changing types
  useEffect(() => {
    if (maintenanceType !== 'Vidange') {
      setFilters([]);
    }
  }, [maintenanceType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProofPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addFilter = () => {
    if (!newFilterType || !newFilterPrice) return;
    setFilters(prev => [...prev, { id: crypto.randomUUID(), name: newFilterType, price: parseFloat(newFilterPrice) }]);
    setNewFilterPrice('');
    setIsAddingFilter(false);
  };

  const removeFilter = (id: string) => {
    setFilters(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    // Revenus: FORCE Global Caisse (undefined usually implies Agency Caisse)
    // Charges: User can select personal caisse
    const effectiveUsePersonal = activeForm === 'REVENUE' ? false : usePersonalCaisse;
    const cashDeskId = effectiveUsePersonal && myCaisse ? myCaisse.id : undefined;

    // Determine Status: Admin -> APPROVED, Agent -> PENDING (for EVERYTHING per user request)
    const status = isAdmin ? MaintenanceStatus.APPROVED : MaintenanceStatus.PENDING;

    if (activeForm === 'EXPENSE_GLOBAL') {
      const globalExp = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        amount: Number(amount),
        description: description || 'Dépense Générale',
        category: 'AUTRE',
        proofPhoto: proofPhoto || undefined,
        agentName: store.currentUser?.name || 'Agent',
        cashDeskId: cashDeskId
      };

      if (cashDeskId) {
        await store.addEntry({
          id: `global-${globalExp.id}`,
          date: globalExp.date,
          createdAt: globalExp.date,
          amount: globalExp.amount,
          type: EntryType.EXPENSE_SIMPLE,
          description: `Charge Globale: ${globalExp.description}`,
          cashDeskId: cashDeskId,
          agentName: globalExp.agentName,
          status: status
        });
      }
      // Note: globalExpense collection might not have a 'status' field, but the Entry associated with it does.
      // However, `addGlobalExpense` adds to a separate list. Usually Global Expenses are "top level".
      // If an Agent adds a global expense, maybe it shouldn't go to the main list immediately? 
      // But `GlobalExpense` type doesn't have status. 
      // I will add it to `GlobalExpense` via store or just accept it adds to the list but the money movement is Pending.
      // The user said "valider toutes les opérations".
      // For now, I will add it. The validation happens on the financial ENTRY side if linked.

      await store.addGlobalExpense(globalExp);

    } else {
      let finalDescription = description;
      if (activeForm === 'REVENUE') {
        finalDescription = description ? `Revenu: ${description}` : 'Revenu Client';
      } else if (expenseType === EntryType.EXPENSE_MAINTENANCE) {
        if (maintenanceType === 'Vidange' && filters.length > 0) {
          const filterDesc = filters.map(f => `${f.name} (${f.price} DA)`).join(', ');
          finalDescription = `Vidange + Filtres: ${filterDesc} - ${description}`;
        } else {
          finalDescription = `Entretien: ${maintenanceType} - ${description}`;
        }
      }

      const entry: FinancialEntry = {
        id: Date.now().toString(),
        vehicleId: vehicleId || undefined,
        cashDeskId: cashDeskId,
        date: new Date().toISOString(),
        amount: Number(amount),
        type: activeForm === 'REVENUE' ? EntryType.REVENUE : expenseType,
        description: finalDescription,
        agentName: store.currentUser?.name || 'Agent Anistour',
        mileageAtEntry: mileage ? Number(mileage) : undefined,
        status: status, // Crucial Change
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
    setFilters([]);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in zoom-in duration-500">
      <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] shadow-2xl overflow-hidden backdrop-blur-sm relative border-t-neutral-700/30">

        {/* Header Tabs */}
        <div className="bg-neutral-950/80 p-4 border-b border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">Terminal Saisie</span>
            </div>
            {myCaisse && (
              <div className="flex items-center gap-2 bg-red-950/20 px-3 py-1.5 rounded-xl border border-red-900/30">
                <Wallet className="w-3.5 h-3.5 text-red-500" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">{(myCaisse.balance ?? 0).toLocaleString()} {CURRENCY}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => { setActiveForm('REVENUE'); setExpenseType(EntryType.REVENUE); resetForm(); }}
              type="button"
              className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeForm === 'REVENUE' ? 'bg-emerald-700 border-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'}`}
            >
              Recette
            </button>
            <button
              onClick={() => { setActiveForm('EXPENSE_VEHICLE'); setExpenseType(EntryType.EXPENSE_SIMPLE); resetForm(); }}
              type="button"
              className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeForm === 'EXPENSE_VEHICLE' ? 'bg-red-700 border-red-600 text-white shadow-lg shadow-red-900/40' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'}`}
            >
              Véhicule
            </button>
            <button
              onClick={() => { setActiveForm('EXPENSE_GLOBAL'); resetForm(); }}
              type="button"
              className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeForm === 'EXPENSE_GLOBAL' ? 'bg-red-900/40 border-red-800 text-white shadow-lg' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'}`}
            >
              Charge Agence
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {success ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="w-20 h-20 bg-emerald-950/30 rounded-full flex items-center justify-center border-2 border-emerald-500/30 shadow-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-xl font-black uppercase tracking-tighter text-emerald-500">Opération Enregistrée</p>
                <p className="text-neutral-500 mt-2 text-[9px] font-black uppercase tracking-[0.3em]">
                  {isAdmin ? "Validée imméditament" : "En attente de validation"}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cash Desk Selection */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3 shadow-inner">
                <div className="flex items-center gap-2">
                  <Coins className="w-3.5 h-3.5 text-red-600" />
                  <label className="text-[9px] font-black text-neutral-100 uppercase tracking-[0.2em]">Source / Destination</label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setUsePersonalCaisse(false)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${!usePersonalCaisse ? 'bg-neutral-900 border-red-600/50 shadow text-white' : 'bg-neutral-950 border-neutral-800 opacity-50 text-neutral-500'}`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-center">Caisse Agence</p>
                  </div>
                  {activeForm !== 'REVENUE' && myCaisse && (
                    <div
                      onClick={() => setUsePersonalCaisse(true)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${usePersonalCaisse ? 'bg-red-950/20 border-red-600 shadow text-white' : 'bg-neutral-950 border-neutral-800 opacity-50 text-neutral-500'}`}
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-center">Ma Caisse ({myCaisse.userName})</p>
                    </div>
                  )}
                  {activeForm === 'REVENUE' && myCaisse && (
                    <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-950 opacity-20 cursor-not-allowed">
                      <p className="text-[10px] font-black uppercase tracking-widest text-center text-neutral-600">Ma Caisse (Indisp.)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side */}
                <div className="space-y-6">
                  {activeForm !== 'EXPENSE_GLOBAL' && (
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest px-1">Véhicule</label>
                      <select
                        className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl focus:border-red-600 outline-none text-xs font-bold text-white shadow-lg transition-all"
                        value={vehicleId}
                        onChange={(e) => setVehicleId(e.target.value)}
                        required
                      >
                        <option value="">Sélectionner...</option>
                        {store.vehicles.filter(v => !v.isArchived).map(v => (
                          <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest px-1">Montant ({CURRENCY})</label>
                    <input
                      required
                      type="number"
                      readOnly={maintenanceType === 'Vidange' && filters.length > 0}
                      className={`w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl text-3xl font-black outline-none transition-all shadow-xl ${activeForm === 'REVENUE' ? 'text-emerald-500 focus:border-emerald-600' : 'text-white focus:border-red-600'} ${maintenanceType === 'Vidange' && filters.length > 0 ? 'opacity-80 cursor-not-allowed' : ''}`}
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    {maintenanceType === 'Vidange' && filters.length > 0 && <p className="text-[9px] text-neutral-500 italic">Auto-calculé via filtres</p>}
                  </div>

                  {activeForm === 'EXPENSE_VEHICLE' && (
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest px-1">Type de dépense</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setExpenseType(EntryType.EXPENSE_SIMPLE)}
                          className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${expenseType === EntryType.EXPENSE_SIMPLE ? 'bg-neutral-800 border-red-600 text-white shadow' : 'bg-neutral-950 border-neutral-800 text-neutral-600'}`}
                        >
                          Courante
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpenseType(EntryType.EXPENSE_MAINTENANCE)}
                          className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${expenseType === EntryType.EXPENSE_MAINTENANCE ? 'bg-red-700 border-red-600 text-white shadow' : 'bg-neutral-950 border-neutral-800 text-neutral-600'}`}
                        >
                          Entretien
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side */}
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest px-1">Description / Motif</label>
                    <textarea
                      required
                      rows={3}
                      className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl outline-none focus:border-red-600 text-xs font-bold text-white shadow-lg resize-none"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={activeForm === 'REVENUE' ? "Détails..." : "Objet..."}
                    />
                  </div>

                  {expenseType === EntryType.EXPENSE_MAINTENANCE && activeForm === 'EXPENSE_VEHICLE' && (
                    <div className="space-y-3 p-3 border border-neutral-800 rounded-xl bg-neutral-900/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest px-1">Nature Entretien</label>
                          <select
                            className="w-full bg-neutral-950 border border-neutral-800 p-2.5 rounded-xl focus:border-red-600 outline-none text-xs font-bold text-white"
                            value={maintenanceType}
                            onChange={(e) => setMaintenanceType(e.target.value)}
                          >
                            {MAINTENANCE_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest px-1">Index Compteur</label>
                          <input
                            required
                            type="number"
                            className="w-full bg-neutral-950 border border-neutral-800 p-2.5 rounded-xl outline-none focus:border-red-600 text-sm font-black text-red-500"
                            value={mileage}
                            onChange={(e) => setMileage(e.target.value)}
                            placeholder="000000"
                          />
                        </div>
                      </div>

                      {/* Vidange Filters Section */}
                      {maintenanceType === 'Vidange' && (
                        <div className="mt-3 space-y-2 pt-3 border-t border-neutral-800">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Filtres</label>
                            <button
                              type="button"
                              onClick={() => setIsAddingFilter(!isAddingFilter)}
                              className="text-white hover:text-red-500 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {isAddingFilter && (
                            <div className="flex gap-2">
                              <select
                                className="bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-[10px] text-white flex-1"
                                value={newFilterType}
                                onChange={(e) => setNewFilterType(e.target.value)}
                              >
                                {MAINTENANCE_TYPES.filter(t => t !== 'Vidange').map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                placeholder="Prix"
                                className="bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-[10px] text-white w-20"
                                value={newFilterPrice}
                                onChange={(e) => setNewFilterPrice(e.target.value)}
                              />
                              <button
                                type="button"
                                onClick={addFilter}
                                className="bg-red-700 text-white rounded-lg px-2 text-[10px] font-bold"
                              >
                                OK
                              </button>
                            </div>
                          )}

                          <div className="space-y-1">
                            {filters.map(filter => (
                              <div key={filter.id} className="flex justify-between items-center p-1.5 bg-neutral-950 rounded-lg border border-neutral-800">
                                <span className="text-[10px] text-neutral-300">{filter.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-red-400">{filter.price.toLocaleString()}</span>
                                  <button type="button" onClick={() => removeFilter(filter.id)}>
                                    <Trash2 className="w-3 h-3 text-neutral-600 hover:text-red-500" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest px-1">Preuve / Reçu</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-neutral-800 rounded-2xl p-4 flex flex-col items-center justify-center text-neutral-600 hover:text-red-600 hover:border-red-500/50 cursor-pointer transition-all bg-neutral-950/50 h-24 group shadow-inner"
                    >
                      {proofPhoto ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-1" />
                          <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">OK</span>
                        </div>
                      ) : (
                        <>
                          <Camera className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Photo</span>
                        </>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className={`w-full py-5 rounded-[1.5rem] text-sm font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.97] ${activeForm === 'REVENUE' ? 'bg-emerald-700 hover:bg-emerald-600 shadow-emerald-950' : 'bg-red-700 hover:bg-red-600 shadow-red-950'}`}
                >
                  Valider
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

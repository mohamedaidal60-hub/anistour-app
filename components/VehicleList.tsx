import React, { useState, useRef } from 'react';
import { useFleetStore } from '../store.ts';
import { UserRole, Vehicle, MaintenanceConfig, EntryType, MaintenanceStatus, FinancialEntry } from '../types.ts';
import { MAINTENANCE_TYPES, CURRENCY } from '../constants.ts';
import { Plus, Search, Archive, Calendar, Ruler, Car, Camera, Wrench, FileText, X, Save, Filter, Trash2, Edit2, Calculator } from 'lucide-react';

interface VehicleListProps {
  store: ReturnType<typeof useFleetStore>;
}

const VehicleList: React.FC<VehicleListProps> = ({ store }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [search, setSearch] = useState('');

  const activeVehicles = store.vehicles.filter(v => !v.isArchived && v.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full pl-12 pr-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-2xl focus:outline-none focus:border-red-600 transition-all text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {store.currentUser?.role === UserRole.ADMIN && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-red-700 hover:bg-red-600 rounded-2xl text-sm font-black uppercase tracking-tighter transition-all shadow-lg shadow-red-900/20 active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" /> Nouveau Véhicule
          </button>
        )}
      </div>

      {/* List View */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-950/50 text-neutral-500 border-b border-neutral-800">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Véhicule</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest hidden md:table-cell">Mise en Circ.</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Kilométrage Actuel</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest hidden lg:table-cell text-center">Alertes</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {activeVehicles.map(vehicle => {
              const alertCount = vehicle.maintenanceConfigs?.filter(cfg => (cfg.nextDueKm - vehicle.lastMileage) < 1000).length || 0;

              return (
                <tr
                  key={vehicle.id}
                  className="hover:bg-neutral-800/30 transition-all cursor-pointer group"
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0">
                        <img src={vehicle.photo || '/car-placeholder.jpg'} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <p className="font-black text-neutral-100 uppercase tracking-tighter">{vehicle.name}</p>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase">{vehicle.registrationNumber || 'Sans matricule'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{new Date(vehicle.registrationDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-black text-white">{(vehicle.lastMileage ?? 0).toLocaleString()} <span className="text-[9px] text-neutral-600">KM</span></p>
                      {vehicle.mileageUpdatedBy && (
                        <p className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest mt-0.5">Par {vehicle.mileageUpdatedBy}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-center">
                    {alertCount > 0 ? (
                      <span className="px-2 py-1 bg-red-900/20 text-red-500 text-[10px] font-black rounded-lg border border-red-900/30">{alertCount} ALERTES</span>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-900/20 text-emerald-500 text-[10px] font-black rounded-lg border border-emerald-900/30">OK</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedVehicle(vehicle); }}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-neutral-700 hover:text-white"
                    >
                      Détails
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {activeVehicles.length === 0 && (
          <div className="p-20 text-center">
            <Car className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
            <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">Aucun véhicule trouvé</p>
          </div>
        )}
      </div>

      {showAddForm && <AddVehicleModal onClose={() => setShowAddForm(false)} onAdd={store.addVehicle} />}

      {/* Detailed Modal */}
      {selectedVehicle && (
        <VehicleDetailModal
          vehicle={selectedVehicle}
          store={store}
          onClose={() => setSelectedVehicle(null)}
        />
      )}
    </div>
  );
};

// --- New Detail Modal with Tabs ---
const VehicleDetailModal = ({ vehicle, store, onClose }: { vehicle: Vehicle, store: ReturnType<typeof useFleetStore>, onClose: () => void }) => {
  const isAdmin = store.currentUser?.role === UserRole.ADMIN;
  const [tab, setTab] = useState<'carnet' | 'calculs'>('carnet');
  const [filterDate, setFilterDate] = useState('');
  const [filterText, setFilterText] = useState('');
  const [simulatedResale, setSimulatedResale] = useState<string>('');

  // Editing State
  const [editingConfig, setEditingConfig] = useState<boolean>(false);
  const [tempConfigs, setTempConfigs] = useState<MaintenanceConfig[]>(vehicle.maintenanceConfigs || []);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const saveConfigs = () => {
    store.updateVehicle({ ...vehicle, maintenanceConfigs: tempConfigs });
    setEditingConfig(false);
  };

  const handleUpdateEntry = (id: string) => {
    const original = store.entries.find(e => e.id === id);
    if (!original) return;
    store.updateEntry({ ...original, amount: Number(editAmount), description: editDesc });
    setEditingEntryId(null);
  };

  const vehicleEntries = store.entries.filter(e => e.vehicleId === vehicle.id);
  const filteredEntries = vehicleEntries.filter(e => {
    const matchDate = filterDate ? e.date === filterDate : true;
    const matchText = filterText ? (e.description?.toLowerCase().includes(filterText.toLowerCase()) || e.amount.toString().includes(filterText)) : true;
    return matchDate && matchText;
  });

  // Calculations
  const totalRevenue = vehicleEntries.filter(e => e.type === EntryType.REVENUE).reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = vehicleEntries.filter(e => e.type !== EntryType.REVENUE).reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Date Calc
  const regDate = new Date(vehicle.registrationDate);
  const now = new Date();

  // Months Active: From Registration to Current Date
  const diffTime = Math.abs(now.getTime() - regDate.getTime());
  const monthsActive = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.4375)));
  const monthlyProfit = netProfit / monthsActive;

  const resaleVal = Number(simulatedResale) || 0;
  const projectedResult = netProfit + (resaleVal - vehicle.purchasePrice);

  const getStatusColor = (status?: string) => {
    if (status === MaintenanceStatus.APPROVED) return 'text-emerald-500';
    if (status === MaintenanceStatus.REJECTED) return 'text-red-500';
    return 'text-amber-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-hidden">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col relative overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 bg-neutral-950 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <img src={vehicle.photo} className="w-16 h-16 rounded-xl object-cover border border-neutral-800" />
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">{vehicle.name}</h2>
              <p className="text-neutral-500 text-xs">Immatriculé le {new Date(vehicle.registrationDate).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-neutral-800 rounded-full hover:bg-neutral-700 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 shrink-0">
          <button
            onClick={() => setTab('carnet')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${tab === 'carnet' ? 'bg-neutral-900 text-red-500 border-b-2 border-red-600' : 'text-neutral-500 hover:text-white'}`}
          >
            <Wrench className="w-4 h-4" /> Carnet & Historique
          </button>

          {isAdmin && (
            <button
              onClick={() => setTab('calculs')}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${tab === 'calculs' ? 'bg-neutral-900 text-red-500 border-b-2 border-red-600' : 'text-neutral-500 hover:text-white'}`}
            >
              <FileText className="w-4 h-4" /> Rentabilité & Calculs
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-900 custom-scrollbar">
          {tab === 'carnet' ? (
            <div className="space-y-6">
              {/* Mileage Update Section */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Ruler className="w-20 h-20 text-white" /></div>
                <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest mb-4">Mise à jour Kilométrage</h3>
                <div className="flex flex-col sm:flex-row items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest px-1">Compteur Actuel (KM)</label>
                    <input
                      type="number"
                      defaultValue={vehicle.lastMileage}
                      id={`mileage-update-${vehicle.id}`}
                      className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-2xl outline-none focus:border-red-600 text-2xl font-black text-white"
                      placeholder="Nouveau kilométrage..."
                    />
                  </div>
                  <button
                    onClick={() => {
                      const val = (document.getElementById(`mileage-update-${vehicle.id}`) as HTMLInputElement).value;
                      if (val && Number(val) > vehicle.lastMileage) {
                        store.updateVehicleMileage(vehicle.id, Number(val), store.currentUser?.name || 'Inconnu');
                        alert('Kilométrage mis à jour avec succès !');
                      } else {
                        alert('Le nouveau kilométrage doit être supérieur à l\'ancien.');
                      }
                    }}
                    className="px-8 py-5 bg-red-700 hover:bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-red-900/20"
                  >
                    Mettre à jour
                  </button>
                </div>
                {vehicle.mileageUpdatedBy && (
                  <p className="text-[10px] text-neutral-500 mt-4 font-bold uppercase tracking-widest">
                    Dernière mise à jour par : <span className="text-neutral-300">{vehicle.mileageUpdatedBy}</span>
                  </p>
                )}
              </div>
              {/* Maintenance Configs (Always visible) */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2"><Ruler className="w-5 h-5 text-red-600" /> Maintenance Cible</h3>
                  {isAdmin && (
                    editingConfig ? (
                      <button onClick={saveConfigs} className="flex items-center gap-2 px-4 py-2 bg-emerald-900/30 text-emerald-500 rounded-lg text-xs font-bold border border-emerald-900 hover:bg-emerald-900/50">
                        <Save className="w-4 h-4" /> Sauvegarder
                      </button>
                    ) : (
                      <button onClick={() => setEditingConfig(true)} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-neutral-400 rounded-lg text-xs font-bold border border-neutral-700 hover:text-white">
                        Modifier
                      </button>
                    )
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(editingConfig ? tempConfigs : (vehicle.maintenanceConfigs || [])).map((cfg, idx) => (
                    <div key={cfg.type} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-neutral-500">{cfg.type}</span>
                        <span className="text-[10px] bg-neutral-800 px-2 py-1 rounded text-neutral-400">Int: {cfg.intervalKm} km</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-neutral-600">Prochain (Compteur)</label>
                        {editingConfig ? (
                          <input
                            type="number"
                            className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-sm font-bold text-white focus:border-red-600 outline-none"
                            value={cfg.nextDueKm}
                            onChange={(e) => {
                              const newC = [...tempConfigs];
                              newC[idx].nextDueKm = Number(e.target.value);
                              setTempConfigs(newC);
                            }}
                          />
                        ) : (
                          <div className="text-xl font-black text-white">{(cfg.nextDueKm ?? 0).toLocaleString()} <span className="text-xs text-neutral-600">KM</span></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operational History (Entries List) */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Historique Opérations</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-red-600"
                      value={filterText}
                      onChange={e => setFilterText(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredEntries.map(e => (
                    <div key={e.id} className="flex items-center justify-between p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-all">
                      {editingEntryId === e.id ? (
                        <div className="flex-1 flex gap-2 items-center">
                          <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="w-24 bg-neutral-950 border border-neutral-700 p-2 rounded text-sm" />
                          <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)} className="flex-1 bg-neutral-950 border border-neutral-700 p-2 rounded text-sm" />
                          <button onClick={() => handleUpdateEntry(e.id)} className="p-2 bg-emerald-900/30 text-emerald-500 rounded"><Save className="w-4 h-4" /></button>
                          <button onClick={() => setEditingEntryId(null)} className="p-2 bg-neutral-800 text-neutral-500 rounded"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-4">
                            <div className={`w-1 h-12 rounded-full ${getStatusColor(e.status)} bg-current opacity-80`}></div>
                            <div>
                              <p className="font-bold text-neutral-200 text-sm">{e.description || e.designation}</p>
                              <div className="flex gap-2 text-[10px] text-neutral-500 uppercase font-bold">
                                <span>{new Date(e.date).toLocaleDateString()}</span>
                                <span>• {e.agentName || '-'}</span>
                                {e.mileageAtEntry && <span>• {e.mileageAtEntry} KM</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={`font-black ${e.type === EntryType.REVENUE ? 'text-emerald-500' : 'text-red-500'}`}>
                                {e.type === EntryType.REVENUE ? '+' : '-'} {(e.amount ?? 0).toLocaleString()} <span className="text-[9px] text-neutral-600">{CURRENCY}</span>
                              </p>
                            </div>

                            {/* Edit/Delete Actions */}
                            {(isAdmin || store.currentUser?.name === e.agentName) && (
                              <div className="flex gap-1 ml-2">
                                <button
                                  onClick={() => { setEditingEntryId(e.id); setEditAmount((e.amount ?? '').toString()); setEditDesc(e.description ?? ''); }}
                                  className="p-1.5 rounded hover:bg-neutral-800 text-neutral-600 hover:text-white"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={() => { if (confirm('Supprimer cette entrée ?')) store.deleteEntry(e.id); }}
                                    className="p-1.5 rounded hover:bg-red-900/30 text-neutral-600 hover:text-red-500"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Financial Summary Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-neutral-950 p-6 rounded-3xl border border-neutral-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10"><Calculator className="w-24 h-24 text-white" /></div>
                  <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest mb-4">Marge Nette (Réelle)</h3>
                  <p className={`text-4xl font-black mb-2 ${netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {netProfit > 0 ? '+' : ''}{(netProfit ?? 0).toLocaleString()} <span className="text-lg text-neutral-600">{CURRENCY}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-neutral-600">Revenus Totaux</p>
                      <p className="text-lg font-bold text-emerald-500">{(totalRevenue ?? 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-neutral-600">Charges Totales</p>
                      <p className="text-lg font-bold text-red-500">{(totalExpenses ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-950 p-6 rounded-3xl border border-neutral-800 flex flex-col justify-center">
                  <div className="flex justify-between items-baseline mb-4">
                    <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest">Rentabilité Mensuelle</h3>
                    <span className="text-xs bg-neutral-900 px-2 py-1 rounded text-neutral-400">{monthsActive} Mois d'activité</span>
                  </div>
                  <p className={`text-3xl font-black ${monthlyProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {(monthlyProfit ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-sm text-neutral-600">{CURRENCY} / Mois</span>
                  </p>
                  <p className="text-xs text-neutral-600 mt-2 italic">Basé sur la date de mise en circulation ({new Date(vehicle.registrationDate ?? '').toLocaleDateString()})</p>
                </div>
              </div>

              {/* Simulation & Resale Analysis */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8">
                <h3 className="text-lg font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                  <Archive className="w-5 h-5 text-amber-500" /> Simulation de Vente & Projection
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Prix d'Achat (Initial)</label>
                    <div className="text-2xl font-black text-neutral-300">{(vehicle.purchasePrice ?? 0).toLocaleString()} {CURRENCY}</div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Estimation Prix de Vente</label>
                    <input
                      type="number"
                      className="w-full bg-neutral-950 border border-amber-900/30 focus:border-amber-500 p-3 rounded-xl text-xl font-bold text-white outline-none"
                      placeholder="Simuler un prix..."
                      value={simulatedResale}
                      onChange={e => setSimulatedResale(e.target.value)}
                    />
                  </div>

                  <div className={`space-y-1 p-4 rounded-2xl border ${projectedResult >= 0 ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-red-950/20 border-red-900/50'}`}>
                    <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Résultat Projeté (Final)</label>
                    <div className={`text-2xl font-black ${projectedResult >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {projectedResult > 0 ? '+' : ''}{(projectedResult ?? 0).toLocaleString()} {CURRENCY}
                    </div>
                    <p className="text-[9px] text-neutral-500 font-medium">Bénéfice Net Exploit. + (Vente - Achat)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AddVehicleModal = ({ onClose, onAdd }: { onClose: () => void, onAdd: (v: Vehicle) => void }) => {
  const [name, setName] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [lastMileage, setLastMileage] = useState('');
  const [regDate, setRegDate] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [configs, setConfigs] = useState<MaintenanceConfig[]>(
    MAINTENANCE_TYPES.slice(0, 6).map(type => ({
      type,
      intervalKm: 7000,
      lastPerformedKm: 0,
      nextDueKm: 7000
    }))
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !purchasePrice || !lastMileage || !regDate) return;

    const newVehicle: Vehicle = {
      id: Date.now().toString(),
      name,
      photo: photo || '',
      registrationDate: regDate,
      purchasePrice: Number(purchasePrice),
      lastMileage: Number(lastMileage),
      isArchived: false,
      maintenanceConfigs: configs
    };

    onAdd(newVehicle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl my-auto overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/50">
          <h2 className="text-xl font-black uppercase tracking-tighter">Nouveau Véhicule</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 rounded-full transition-colors">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[16/9] bg-neutral-950 border-2 border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-red-600 transition-all overflow-hidden group"
            >
              {photo ? (
                <img src={photo} className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera className="w-10 h-10 text-neutral-600 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-[10px] font-black text-neutral-500 uppercase">Télécharger Photo Véhicule</p>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Nom / Référence</label>
              <input
                required
                className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl focus:border-red-600 outline-none transition-all text-sm"
                placeholder="ex: Toyota Hilux 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Date de circulation</label>
              <input
                required
                type="date"
                className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl focus:border-red-600 outline-none transition-all text-sm"
                value={regDate}
                onChange={(e) => setRegDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Prix d'achat ({CURRENCY})</label>
              <input
                required
                type="number"
                className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl focus:border-red-600 outline-none transition-all text-sm"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Kilométrage Actuel</label>
              <input
                required
                type="number"
                className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl focus:border-red-600 outline-none transition-all text-sm"
                value={lastMileage}
                onChange={(e) => setLastMileage(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] border-b border-neutral-800 pb-2 flex items-center gap-2">
              <Ruler className="w-3 h-3" /> Config initiale Entretiens
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <p className="text-xs text-neutral-500 mb-2">Définissez ici l'objectif kilométrique de la <strong>première</strong> maintenance.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {configs.map((cfg, idx) => (
                  <div key={cfg.type} className="flex flex-col gap-1.5 p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                    <div className="flex justify-between">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase">{cfg.type}</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[8px] text-neutral-600 uppercase">Intervalle</label>
                        <input
                          type="number"
                          className="w-full bg-neutral-900 border border-neutral-800 text-xs p-1 rounded outline-none text-neutral-400"
                          value={cfg.intervalKm}
                          onChange={(e) => {
                            const newConfigs = [...configs];
                            newConfigs[idx].intervalKm = Number(e.target.value);
                            setConfigs(newConfigs);
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[8px] text-red-900 uppercase font-bold">Prochain à</label>
                        <input
                          type="number"
                          className="w-full bg-neutral-900 border border-red-900/50 text-xs p-1 rounded outline-none text-red-500 font-bold"
                          value={cfg.nextDueKm}
                          onChange={(e) => {
                            const newConfigs = [...configs];
                            newConfigs[idx].nextDueKm = Number(e.target.value);
                            setConfigs(newConfigs);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-bold text-neutral-500 hover:text-white transition-colors">Annuler</button>
            <button type="submit" className="px-8 py-3 bg-red-700 hover:bg-red-600 rounded-xl text-sm font-black uppercase tracking-tighter shadow-lg shadow-red-900/20 active:scale-95 transition-all">Valider l'Ajout</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleList;
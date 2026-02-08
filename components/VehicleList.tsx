import React, { useState, useRef, useMemo } from 'react';
import { useFleetStore } from '../store.ts';
import { UserRole, Vehicle, MaintenanceConfig, EntryType, MaintenanceStatus, FinancialEntry, RentalStatus } from '../types.ts';
import { MAINTENANCE_TYPES, CURRENCY } from '../constants.ts';
import {
  Plus, Search, Archive, Calendar, Ruler, Car, Camera, Wrench,
  FileText, X, Save, Filter, Trash2, Edit2, Calculator,
  AlertCircle, ChevronRight, CheckSquare, Square, User,
  Printer, TrendingUp, History, Timer, Fuel, UserPlus, LogIn
} from 'lucide-react';

interface VehicleListProps {
  store: ReturnType<typeof useFleetStore>;
}

const VehicleList: React.FC<VehicleListProps> = ({ store }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [search, setSearch] = useState('');

  const activeVehicles = store.vehicles.filter(v =>
    !v.isArchived &&
    (v.name.toLowerCase().includes(search.toLowerCase()) || (v.registrationNumber || '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Premium Header & Search */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 bg-neutral-900/30 p-6 rounded-[2rem] border border-neutral-800 backdrop-blur-sm">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
          <input
            type="text"
            placeholder="Rechercher par nom ou matricule..."
            className="w-full pl-14 pr-6 py-4 bg-neutral-950/50 border border-neutral-800 rounded-2xl focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all text-sm font-medium placeholder:text-neutral-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {store.currentUser?.role === UserRole.ADMIN && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-red-700 hover:bg-red-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-red-900/20 active:scale-95 border border-red-800/50"
          >
            <Plus className="w-5 h-5" /> Nouveau Véhicule
          </button>
        )}
      </div>

      {/* Modern List View */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-950 text-neutral-500 border-b border-neutral-800">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Parc Automobile</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] hidden md:table-cell">Mise en Circ.</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Kilométrage Actuel</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] hidden lg:table-cell text-center">Alertes</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {activeVehicles.map(vehicle => {
                const alertCount = (vehicle.maintenanceConfigs || []).filter(cfg => ((cfg.nextDueKm ?? 0) - (vehicle.lastMileage ?? 0)) < 1000).length;

                return (
                  <tr
                    key={vehicle.id}
                    className="hover:bg-neutral-800/40 transition-all cursor-pointer group"
                    onClick={() => setSelectedVehicle(vehicle)}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0 shadow-lg relative">
                          <img src={vehicle.photo || '/car-placeholder.jpg'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-black text-neutral-100 text-base uppercase tracking-tighter truncate group-hover:text-red-500 transition-colors">{vehicle.name}</p>
                            {vehicle.status === RentalStatus.RENTED && (
                              <span className="px-1.5 py-0.5 bg-amber-900/30 text-amber-500 text-[7px] font-black rounded border border-amber-800/50 uppercase">Loué</span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-0.5">{vehicle.registrationNumber || 'MATRICULE N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 hidden md:table-cell">
                      <div className="flex items-center gap-2.5 text-neutral-400">
                        <Calendar className="w-4 h-4 text-red-600/50" />
                        <span className="text-xs font-bold uppercase tracking-wider">{new Date(vehicle.registrationDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">{(vehicle.lastMileage ?? 0).toLocaleString()}</span>
                          <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">KM</span>
                        </div>
                        {vehicle.mileageUpdatedBy && (
                          <div className="flex items-center gap-1 mt-1 opacity-60">
                            <span className="text-[7px] text-neutral-500 font-black uppercase">MàJ par :</span>
                            <span className="text-[7px] text-red-500 font-black uppercase">{vehicle.mileageUpdatedBy}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 hidden lg:table-cell text-center">
                      {alertCount > 0 ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-950/30 text-red-500 text-[10px] font-black rounded-lg border border-red-900/30 animate-pulse">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{alertCount} ALERTES</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-950/30 text-emerald-500 text-[10px] font-black rounded-lg border border-emerald-900/30">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          <span>OPÉRATIONNEL</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        {store.currentUser?.role === UserRole.ADMIN && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingVehicle(vehicle); }}
                            className="p-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-500 hover:text-amber-500 rounded-xl transition-all border border-neutral-800"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedVehicle(vehicle); }}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border border-neutral-800 hover:border-neutral-700"
                        >
                          Détails <ChevronRight className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {activeVehicles.length === 0 && (
          <div className="p-24 text-center">
            <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-neutral-800 shadow-xl">
              <Car className="w-10 h-10 text-neutral-700" />
            </div>
            <p className="text-neutral-500 text-xs font-black uppercase tracking-[0.3em]">Aucune unité détectée</p>
          </div>
        )}
      </div>

      {showAddForm && <AddVehicleModal onClose={() => setShowAddForm(false)} onAdd={store.addVehicle} store={store} />}
      {editingVehicle && <AddVehicleModal vehicleToEdit={editingVehicle} onClose={() => setEditingVehicle(null)} onAdd={store.updateVehicle} store={store} />}

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

// Modal for both Add and Edit
const AddVehicleModal = ({ onClose, onAdd, store, vehicleToEdit }: { onClose: () => void, onAdd: (v: Vehicle) => void, store: any, vehicleToEdit?: Vehicle }) => {
  const [name, setName] = useState(vehicleToEdit?.name || '');
  const [regNumber, setRegNumber] = useState(vehicleToEdit?.registrationNumber || '');
  const [purchasePrice, setPurchasePrice] = useState(vehicleToEdit?.purchasePrice.toString() || '');
  const [lastMileage, setLastMileage] = useState(vehicleToEdit?.lastMileage.toString() || '');
  const [regDate, setRegDate] = useState(vehicleToEdit?.registrationDate || '');
  const [photo, setPhoto] = useState<string | null>(vehicleToEdit?.photo || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deriving the "Master List" of maintenance types
  const masterMaintenanceList = useMemo(() => {
    const existingTypes = new Set(MAINTENANCE_TYPES);
    store.vehicles.forEach((v: Vehicle) => {
      v.maintenanceConfigs?.forEach(cfg => existingTypes.add(cfg.type));
    });
    return Array.from(existingTypes);
  }, [store.vehicles]);

  const [selectedMaintenances, setSelectedMaintenances] = useState<MaintenanceConfig[]>(() => {
    if (vehicleToEdit) return vehicleToEdit.maintenanceConfigs;
    // For new vehicles, start empty as requested
    return [];
  });

  const [newMaintenanceName, setNewMaintenanceName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleMaintenance = (type: string) => {
    const exists = selectedMaintenances.find(m => m.type === type);
    if (exists) {
      setSelectedMaintenances(prev => prev.filter(m => m.type !== type));
    } else {
      setSelectedMaintenances(prev => [...prev, {
        type,
        intervalKm: 10000,
        nextDueKm: Number(lastMileage) + 10000,
        lastPerformedKm: Number(lastMileage)
      }]);
    }
  };

  const addNewMaintenance = () => {
    if (!newMaintenanceName) return;
    toggleMaintenance(newMaintenanceName);
    setNewMaintenanceName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !regNumber || !purchasePrice || !lastMileage || !regDate) {
      alert("Veuillez remplir tous les champs obligatoires (incluant le matricule)");
      return;
    }

    const vehicle: Vehicle = {
      id: vehicleToEdit?.id || Date.now().toString(),
      name,
      registrationNumber: regNumber,
      photo: photo || '',
      registrationDate: regDate,
      purchasePrice: Number(purchasePrice),
      lastMileage: Number(lastMileage),
      isArchived: vehicleToEdit?.isArchived || false,
      maintenanceConfigs: selectedMaintenances
    };

    onAdd(vehicle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] w-full max-w-4xl my-auto overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
              {vehicleToEdit ? 'Modifier le Véhicule' : 'Nouveau Véhicule'}
            </h2>
            <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mt-1">Configuration Parc Automobile</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-2xl transition-all">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Photo Column */}
            <div className="flex flex-col gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square bg-neutral-950 border-2 border-dashed border-neutral-800 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-red-600 transition-all overflow-hidden group shadow-inner"
              >
                {photo ? (
                  <img src={photo} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-12 h-12 text-neutral-700 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Photo du véhicule</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            {/* Basic Info Column */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 flex flex-col">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] px-1">Nom / Modèle <span className="text-red-600">*</span></label>
                <input
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl focus:border-red-600 outline-none transition-all text-sm font-bold text-white shadow-xl"
                  placeholder="ex: Toyota Hilux"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 flex flex-col">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] px-1">Matricule <span className="text-red-600">*</span></label>
                <input
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl focus:border-red-600 outline-none transition-all text-sm font-bold text-white shadow-xl"
                  placeholder="ex: 01234-124-16"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] px-1">Mise en circulation</label>
                <input
                  required
                  type="date"
                  className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl focus:border-red-600 outline-none transition-all text-sm font-bold text-white shadow-xl"
                  value={regDate}
                  onChange={(e) => setRegDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] px-1">Prix Achat ({CURRENCY})</label>
                <input
                  required
                  type="number"
                  className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl focus:border-red-600 outline-none transition-all text-sm font-bold text-white shadow-xl"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] px-1">Kilométrage Actuel</label>
                <input
                  required
                  type="number"
                  className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-2xl focus:border-red-600 outline-none transition-all text-2xl font-black text-red-500 shadow-xl"
                  value={lastMileage}
                  onChange={(e) => setLastMileage(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Maintenance Checklist */}
          <div className="space-y-6 pt-10 border-t border-neutral-800">
            <h3 className="text-xs font-black text-neutral-100 uppercase tracking-[0.25em] flex items-center gap-3">
              <Wrench className="w-5 h-5 text-red-600" /> Plan d'Entretien Personnalisé
            </h3>

            <div className="bg-neutral-950 p-8 rounded-[2rem] border border-neutral-800 shadow-inner">
              <p className="text-[11px] text-neutral-500 mb-6 font-bold uppercase tracking-wider leading-relaxed">
                Sélectionnez les entretiens applicables à ce véhicule. Vous pouvez également ajouter de nouveaux types personnalisés.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {masterMaintenanceList.map((type) => {
                  const isSelected = selectedMaintenances.find(m => m.type === type);
                  return (
                    <div
                      key={type}
                      onClick={() => toggleMaintenance(type)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${isSelected ? 'bg-red-950/20 border-red-600/50 text-white' : 'bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}
                    >
                      {isSelected ? <CheckSquare className="w-5 h-5 text-red-500" /> : <Square className="w-5 h-5" />}
                      <span className="text-[11px] font-black uppercase tracking-widest truncate">{type}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
                <input
                  type="text"
                  placeholder="Autre entretien... (Ex: Courroie)"
                  className="flex-1 bg-transparent outline-none text-xs font-bold text-white px-2"
                  value={newMaintenanceName}
                  onChange={(e) => setNewMaintenanceName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={addNewMaintenance}
                  className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  + Ajouter
                </button>
              </div>
            </div>

            {selectedMaintenances.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedMaintenances.map((cfg, idx) => (
                  <div key={cfg.type} className="p-5 bg-neutral-900/50 border border-neutral-800 rounded-2xl shadow-xl">
                    <label className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-3 block">{cfg.type}</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[8px] text-neutral-600 uppercase font-black block mb-1">Intervalle (KM)</label>
                        <input
                          type="number"
                          className="w-full bg-neutral-950 border border-neutral-800 p-2 rounded-lg text-xs font-bold text-white outline-none focus:border-red-600"
                          value={cfg.intervalKm}
                          onChange={(e) => {
                            const newCfg = [...selectedMaintenances];
                            newCfg[idx].intervalKm = Number(e.target.value);
                            setSelectedMaintenances(newCfg);
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-neutral-600 uppercase font-black block mb-1">Prochaine Échéance</label>
                        <input
                          type="number"
                          className="w-full bg-neutral-950 border border-neutral-800 p-2 rounded-lg text-xs font-bold text-white outline-none focus:border-red-600"
                          value={cfg.nextDueKm}
                          onChange={(e) => {
                            const newCfg = [...selectedMaintenances];
                            newCfg[idx].nextDueKm = Number(e.target.value);
                            setSelectedMaintenances(newCfg);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-8 flex flex-col sm:flex-row justify-end gap-4 border-t border-neutral-800">
            <button type="button" onClick={onClose} className="px-10 py-4 text-xs font-black uppercase tracking-widest text-neutral-600 hover:text-white transition-colors">Annuler</button>
            <button type="submit" className="px-12 py-4 bg-red-700 hover:bg-red-600 rounded-2xl text-sm font-black uppercase tracking-[0.1em] shadow-2xl shadow-red-900/30 active:scale-95 transition-all text-white">
              {vehicleToEdit ? 'Enregistrer les modifications' : 'Confirmer l\'ajout du véhicule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Detailed Modal for Vehicle Info
const VehicleDetailModal = ({ vehicle, store, onClose }: { vehicle: Vehicle, store: any, onClose: () => void }) => {
  const [tab, setTab] = useState<'carnet' | 'calculs' | 'location'>('carnet');
  const [simulatedResale, setSimulatedResale] = useState('');
  const [editingConfig, setEditingConfig] = useState(false);
  const [tempConfigs, setTempConfigs] = useState<MaintenanceConfig[]>(vehicle.maintenanceConfigs || []);

  const saveSimulation = async () => {
    if (!simulatedResale) return;
    await store.updateVehicle({ ...vehicle, simulatedSalePrice: Number(simulatedResale) });
    alert("Simulation de revente enregistrée.");
  };

  const isAdmin = store.currentUser?.role === UserRole.ADMIN;

  const entries = store.entries.filter((e: FinancialEntry) => e.vehicleId === vehicle.id);
  const revenueEntries = entries.filter((e: FinancialEntry) => e.type === EntryType.REVENUE);
  const expenseEntries = entries.filter((e: FinancialEntry) => e.type !== EntryType.REVENUE);

  const totalRevenue = revenueEntries.reduce((sum: number, e: FinancialEntry) => sum + (e.amount || 0), 0);
  const totalExpenses = expenseEntries.reduce((sum: number, e: FinancialEntry) => sum + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  const monthsActive = Math.max(1, Math.floor((new Date().getTime() - new Date(vehicle.registrationDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
  const monthlyProfit = netProfit / monthsActive;

  const projectedResult = (Number(simulatedResale) || 0) + netProfit - vehicle.purchasePrice;

  const saveConfigs = () => {
    store.updateVehicle({ ...vehicle, maintenanceConfigs: tempConfigs });
    setEditingConfig(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-hidden">
      <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] w-full max-w-3xl h-[95vh] sm:h-[90vh] flex flex-col relative overflow-hidden shadow-2xl">
        {/* Premium Header */}
        <div className="relative shrink-0 border-b border-neutral-800 bg-neutral-950 px-6 py-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-900/10 blur-[100px] pointer-events-none"></div>
          <div className="relative flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl shrink-0 group">
              <img src={vehicle.photo || '/car-placeholder.jpg'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-1">
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-white truncate">{vehicle.name}</h2>
                <div className="px-2 py-0.5 bg-red-900/20 border border-red-700/30 rounded-lg text-[9px] font-black text-red-500 uppercase tracking-widest">Actif</div>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-center gap-2 text-neutral-500">
                  <Calendar className="w-4 h-4 text-red-600/50" />
                  <span className="text-xs font-black uppercase tracking-wider">{vehicle.registrationNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-500">
                  <Ruler className="w-4 h-4 text-red-600/50" />
                  <span className="text-xs font-black uppercase tracking-wider">Index : <span className="text-white">{(vehicle.lastMileage ?? 0).toLocaleString()} KM</span></span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="p-3 bg-neutral-900 hover:bg-neutral-100 hover:text-neutral-900 text-neutral-400 rounded-xl transition-all border border-neutral-800 shadow-lg group"
                title="Imprimer Fiche"
              >
                <Printer className="w-5 h-5 group-active:scale-95" />
              </button>
              <button onClick={onClose} className="p-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl transition-all shadow-xl border border-neutral-800 active:scale-95">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Premium Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 shrink-0 p-3 gap-3">
          <button
            onClick={() => setTab('carnet')}
            className={`flex-1 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 transition-all duration-300 ${tab === 'carnet' ? 'bg-red-700 text-white shadow-xl shadow-red-900/20' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'}`}
          >
            <Wrench className="w-4 h-4" /> Carnet & Historique
          </button>
          <button
            onClick={() => setTab('location')}
            className={`flex-1 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 transition-all duration-300 ${tab === 'location' ? 'bg-amber-700 text-white shadow-xl shadow-amber-900/20' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'}`}
          >
            <History className="w-4 h-4" /> Gestion Location
          </button>
          {isAdmin && (
            <button
              onClick={() => setTab('calculs')}
              className={`flex-1 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 transition-all duration-300 ${tab === 'calculs' ? 'bg-red-700 text-white shadow-xl shadow-red-900/20' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'}`}
            >
              <FileText className="w-4 h-4" /> Rentabilité & Calculs
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-neutral-900 custom-scrollbar pb-20">
          {tab === 'location' ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full animate-pulse ${vehicle.status === RentalStatus.RENTED ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">
                  Statut : {vehicle.status === RentalStatus.RENTED ? 'En Location' : 'Disponible'}
                </h3>
              </div>

              {vehicle.status === RentalStatus.RENTED && vehicle.currentRental ? (
                <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-8 space-y-8 shadow-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Client Actuel</p>
                      <p className="text-lg font-black text-white uppercase">{vehicle.currentRental.clientName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Échéance Retour</p>
                      <p className="text-lg font-black text-amber-500 uppercase">{new Date(vehicle.currentRental.expectedEndDate).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">KM au Départ</p>
                      <p className="text-lg font-black text-white">{(vehicle.currentRental.startMileage ?? 0).toLocaleString()} KM</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Temps Restant</p>
                      <p className="text-lg font-black text-neutral-400">
                        {Math.max(0, Math.ceil((new Date(vehicle.currentRental.expectedEndDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))} Jours
                      </p>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-neutral-900 space-y-6">
                    <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Procédure de Retour</h4>
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                      <div className="flex-1 space-y-2">
                        <label className="text-[9px] font-black text-neutral-600 uppercase px-1">KM au Retour</label>
                        <input
                          type="number"
                          id="return-km"
                          placeholder={vehicle.lastMileage.toString()}
                          className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-xl font-black text-white focus:border-red-600 outline-none"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const km = (document.getElementById('return-km') as HTMLInputElement).value;
                          if (km && Number(km) >= vehicle.lastMileage) {
                            store.checkinVehicle(vehicle.id, Number(km));
                            alert("Retour enregistré.");
                          } else alert("Erreur KM");
                        }}
                        className="bg-red-700 hover:bg-red-600 text-white px-8 py-5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
                      >
                        Valider le Retour
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-8 space-y-6">
                  <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-4">Mise en Location</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-neutral-600 uppercase px-1">Nom du Client</label>
                      <input id="rent-client" type="text" className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-sm font-bold text-white outline-none focus:border-red-600" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-neutral-600 uppercase px-1">Fin Prévue</label>
                      <input id="rent-end" type="date" className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-sm font-bold text-white outline-none focus:border-red-600" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-neutral-600 uppercase px-1">Niveau Carburant (%)</label>
                      <input id="rent-fuel" type="number" defaultValue="100" className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-sm font-bold text-white outline-none focus:border-red-600" />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          const c = (document.getElementById('rent-client') as HTMLInputElement).value;
                          const d = (document.getElementById('rent-end') as HTMLInputElement).value;
                          const f = (document.getElementById('rent-fuel') as HTMLInputElement).value;
                          if (c && d) {
                            store.checkoutVehicle(vehicle.id, c, d, Number(f));
                            alert("Départ validé.");
                          } else alert("Champs obligatoires.");
                        }}
                        className="w-full bg-emerald-700 hover:bg-emerald-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
                      >
                        Valider le Départ
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : tab === 'carnet' ? (
            <div className="space-y-8 sm:space-y-10">
              {/* Mileage Update */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
                <div className="flex flex-col sm:flex-row items-end gap-6 relative z-10">
                  <div className="flex-1 w-full space-y-3">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Mettre à jour le compteur (KM)</label>
                    <input
                      type="number"
                      defaultValue={vehicle.lastMileage}
                      id={`mileage-update-${vehicle.id}`}
                      className="w-full bg-neutral-900 border border-neutral-800 p-4 sm:p-5 rounded-2xl outline-none focus:border-red-600 text-2xl sm:text-3xl font-black text-white shadow-inner"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const val = (document.getElementById(`mileage-update-${vehicle.id}`) as HTMLInputElement).value;
                      if (val && Number(val) >= vehicle.lastMileage) {
                        store.updateVehicleMileage(vehicle.id, Number(val), store.currentUser?.name || 'Inconnu');
                        alert('Index mis à jour.');
                      } else alert('Inférieur à l\'index actuel.');
                    }}
                    className="w-full sm:w-auto px-10 py-5 sm:py-6 bg-red-700 hover:bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all active:scale-95 shadow-xl shadow-red-900/30 border border-red-600"
                  >
                    Mise à jour
                  </button>
                </div>
              </div>

              {/* Maintenance Grid */}
              <div className="space-y-6">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em]">Plan d'Entretien Actif</h3>
                  {isAdmin && (
                    <button onClick={() => setEditingConfig(!editingConfig)} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400">
                      {editingConfig ? 'Terminer' : 'Ajuster les Échéances'}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {(editingConfig ? tempConfigs : (vehicle.maintenanceConfigs || [])).map((cfg, idx) => {
                    const remaining = (cfg.nextDueKm ?? 0) - (vehicle.lastMileage ?? 0);
                    const isUrgent = remaining < 1000;
                    const progress = Math.min(100, Math.max(0, (1 - (remaining / (cfg.intervalKm || 1))) * 100));
                    return (
                      <div key={idx} className={`p-6 rounded-3xl border transition-all duration-300 ${isUrgent ? 'bg-red-950/20 border-red-900/40 shadow-red-900/10' : 'bg-neutral-950 border-neutral-800 shadow-xl'}`}>
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-1">Maintenance</p>
                            <h4 className="text-xs font-black text-neutral-100 uppercase tracking-tight">{cfg.type}</h4>
                          </div>
                          {isUrgent && <AlertCircle className="w-5 h-5 text-red-600 animate-pulse" />}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div>
                            <p className="text-[8px] text-neutral-600 uppercase font-black text-[7px]">Intervalle</p>
                            <p className="text-[11px] font-black text-neutral-200">{(cfg.intervalKm ?? 0).toLocaleString()} KM</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-neutral-600 uppercase font-black text-[7px]">Prochain</p>
                            <p className={`text-[11px] font-black ${isUrgent ? 'text-red-500' : 'text-neutral-200'}`}>{(cfg.nextDueKm ?? 0).toLocaleString()} KM</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-baseline">
                            <span className={`text-[8px] font-black uppercase ${remaining < 0 ? 'text-red-500' : 'text-neutral-500'}`}>
                              {remaining < 0 ? 'Dépassement' : 'Reste'}
                            </span>
                            <span className={`text-[10px] font-black ${remaining < 0 ? 'text-red-500' : 'text-neutral-200'}`}>{(Math.abs(remaining) ?? 0).toLocaleString()} KM</span>
                          </div>
                          <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden shadow-inner">
                            <div className={`h-full transition-all duration-1000 ${isUrgent ? 'bg-red-600' : 'bg-red-900'}`} style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Journal - Only for Admins */}
              {isAdmin && (
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] px-2">Flux Historique (Détails)</h3>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left">
                      <thead className="bg-neutral-900 text-[8px] font-black text-neutral-500 uppercase tracking-widest">
                        <tr>
                          <th className="px-5 py-3">Date</th>
                          <th className="px-5 py-3">Opération</th>
                          <th className="px-5 py-3 text-right">Montant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        {entries.filter(e => e.vehicleId === vehicle.id && e.status !== MaintenanceStatus.REJECTED).slice(0, 15).map(e => (
                          <tr key={e.id} className="text-[10px] font-black uppercase tracking-tight hover:bg-neutral-900/50 transition-colors">
                            <td className="px-5 py-4 text-neutral-600">{new Date(e.date).toLocaleDateString()}</td>
                            <td className="px-5 py-4 text-neutral-200">{e.description || e.designation}</td>
                            <td className={`px-5 py-4 text-right ${e.type === EntryType.REVENUE ? 'text-emerald-500' : 'text-neutral-100'}`}>
                              {e.type === EntryType.REVENUE ? '+' : '-'}{e.amount.toLocaleString()} <span className="text-[7px] text-neutral-600">DA</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 sm:space-y-10">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="bg-neutral-950 p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-neutral-800 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><Calculator className="w-32 h-32 text-white" /></div>
                  <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-6">Marge d'Exploitation Nette</h3>
                  <p className={`text-4xl sm:text-5xl font-black mb-4 ${netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {(netProfit ?? 0).toLocaleString()} <span className="text-lg sm:text-xl text-neutral-600">{CURRENCY}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 mt-8 p-6 bg-neutral-900/50 rounded-3xl border border-neutral-800">
                    <div>
                      <p className="text-[8px] uppercase font-black text-neutral-600 tracking-widest mb-1">Revenus Total</p>
                      <p className="text-lg font-black text-emerald-500">{(totalRevenue ?? 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase font-black text-neutral-600 tracking-widest mb-1">Charges Directes</p>
                      <p className="text-lg font-black text-red-500">{(totalExpenses ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-950 p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-neutral-800 flex flex-col justify-center shadow-2xl">
                  <div className="flex justify-between items-baseline mb-6">
                    <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Rentabilité Mensuelle Moy.</h3>
                    <span className="text-[8px] bg-neutral-900 px-3 py-1 rounded-full font-black text-neutral-400 uppercase tracking-widest">{monthsActive} Mois</span>
                  </div>
                  <p className={`text-3xl sm:text-4xl font-black ${monthlyProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {(monthlyProfit ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-lg text-neutral-600">{CURRENCY} / Mois</span>
                  </p>
                  <p className="text-[10px] text-neutral-600 mt-6 italic font-medium leading-relaxed">
                    Comptabilisé depuis le <span className="text-neutral-400">{new Date(vehicle.registrationDate).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>

              {/* Simulation Card */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-900/5 blur-[100px] pointer-events-none"></div>
                <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
                  <div className="flex-1 space-y-6">
                    <div>
                      <h3 className="text-sm sm:text-lg font-black text-white uppercase tracking-tighter mb-2">Simulateur de Sortie (Vente)</h3>
                      <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Estimation du résultat final après revente</p>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest px-1">Prix de Revente Estimé ({CURRENCY})</label>
                      <div className="flex gap-4">
                        <input
                          type="number"
                          className="flex-1 bg-neutral-900 border border-neutral-800 p-4 rounded-xl outline-none focus:border-emerald-500 text-2xl font-black text-white shadow-inner"
                          placeholder={vehicle.simulatedSalePrice?.toString() || "0"}
                          value={simulatedResale}
                          onChange={e => setSimulatedResale(e.target.value)}
                        />
                        <button
                          onClick={saveSimulation}
                          className="px-6 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-96 p-8 bg-neutral-900 rounded-[2rem] border border-neutral-800 shadow-xl text-center">
                    <p className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4">Résultat Final Projeté</p>
                    <p className={`text-3xl sm:text-4xl font-black ${projectedResult >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {(projectedResult ?? 0).toLocaleString()} <span className="text-sm text-neutral-600">DA</span>
                    </p>
                    <div className="mt-6 pt-6 border-t border-neutral-800">
                      <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest leading-loose">Calcul : (Revente + Marge) - Achat</p>
                    </div>
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

export default VehicleList;
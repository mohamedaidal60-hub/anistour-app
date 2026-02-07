import React, { useState, useRef, useMemo } from 'react';
import { useFleetStore } from '../store.ts';
import { UserRole, Vehicle, MaintenanceConfig, EntryType, MaintenanceStatus, FinancialEntry } from '../types.ts';
import { MAINTENANCE_TYPES, CURRENCY } from '../constants.ts';
import {
  Plus, Search, Archive, Calendar, Ruler, Car, Camera, Wrench,
  FileText, X, Save, Filter, Trash2, Edit2, Calculator,
  AlertCircle, ChevronRight, CheckSquare, Square, User, Printer
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
    <div className="space-y-4 print:space-y-0">
      {/* Premium Header & Search */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-neutral-900/30 p-4 rounded-[1.5rem] border border-neutral-800 backdrop-blur-sm print:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
          <input
            type="text"
            placeholder="Rechercher par nom ou matricule..."
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-950/50 border border-neutral-800 rounded-xl focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all text-sm font-medium placeholder:text-neutral-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center p-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-all shadow-lg active:scale-95 border border-neutral-700"
            title="Imprimer"
          >
            <Printer className="w-5 h-5" />
          </button>
          {store.currentUser?.role === UserRole.ADMIN && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-red-900/20 active:scale-95 border border-red-800/50"
            >
              <Plus className="w-4 h-4" /> Nouveau
            </button>
          )}
        </div>
      </div>

      {/* Modern List View */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-sm print:border-none print:shadow-none print:bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-950 text-neutral-500 border-b border-neutral-800 print:bg-white print:border-neutral-200">
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] print:text-black">Parc Automobile</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] hidden md:table-cell print:table-cell print:text-black">Mise en Circ.</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] print:text-black">Kilométrage Actuel</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] hidden lg:table-cell text-center print:hidden">Alertes</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-right print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 print:divide-neutral-200">
              {activeVehicles.map(vehicle => {
                const alertCount = (vehicle.maintenanceConfigs || []).filter(cfg => ((cfg.nextDueKm ?? 0) - (vehicle.lastMileage ?? 0)) < 1000).length;

                return (
                  <tr
                    key={vehicle.id}
                    className="hover:bg-neutral-800/40 transition-all cursor-pointer group print:hover:bg-transparent"
                    onClick={() => setSelectedVehicle(vehicle)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0 shadow-lg relative print:border-neutral-200">
                          <img src={vehicle.photo || '/car-placeholder.jpg'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 print:grayscale" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-neutral-100 text-sm uppercase tracking-tighter truncate group-hover:text-red-500 transition-colors print:text-black">{vehicle.name}</p>
                          <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest mt-0.5 print:text-neutral-600">{vehicle.registrationNumber || 'MATRICULE N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell print:table-cell">
                      <div className="flex items-center gap-2 text-neutral-400 print:text-black">
                        <Calendar className="w-3.5 h-3.5 text-red-600/50 print:text-black" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{new Date(vehicle.registrationDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-white print:text-black">{(vehicle.lastMileage ?? 0).toLocaleString()}</span>
                          <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest print:text-neutral-500">KM</span>
                        </div>
                        {vehicle.mileageUpdatedBy && (
                          <div className="flex items-center gap-1 mt-0.5 opacity-60">
                            <span className="text-[7px] text-neutral-500 font-black uppercase">MàJ:</span>
                            <span className="text-[7px] text-red-500 font-black uppercase print:text-black">{vehicle.mileageUpdatedBy}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-center print:hidden">
                      {alertCount > 0 ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-950/30 text-red-500 text-[9px] font-black rounded border border-red-900/30 animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          <span>{alertCount} ALERTES</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-950/30 text-emerald-500 text-[9px] font-black rounded border border-emerald-900/30">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          <span>OPÉRATIONNEL</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right print:hidden">
                      <div className="flex justify-end gap-2">
                        {store.currentUser?.role === UserRole.ADMIN && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingVehicle(vehicle); }}
                              className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-500 hover:text-amber-500 rounded-lg transition-all border border-neutral-800"
                              title="Modifier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Voulez-vous vraiment archiver le véhicule "${vehicle.name}" ?\nIl ne sera plus visible dans la liste active.`)) {
                                  store.archiveVehicle(vehicle.id, 0);
                                }
                              }}
                              className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-500 hover:text-red-500 rounded-lg transition-all border border-neutral-800"
                              title="Archiver / Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedVehicle(vehicle); }}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border border-neutral-800 hover:border-neutral-700"
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
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-800 shadow-xl">
              <Car className="w-8 h-8 text-neutral-700" />
            </div>
            <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em]">Aucune unité détectée</p>
          </div>
        )}
      </div>

      {showAddForm && <AddVehicleModal onClose={() => setShowAddForm(false)} onAdd={store.addVehicle} store={store} />}
      {editingVehicle && <AddVehicleModal vehicleToEdit={editingVehicle} onClose={() => setEditingVehicle(null)} onAdd={store.updateVehicle} store={store} />}

      {
        selectedVehicle && (
          <VehicleDetailModal
            vehicle={selectedVehicle}
            store={store}
            onClose={() => setSelectedVehicle(null)}
          />
        )
      }
    </div >
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
    if (vehicleToEdit) return vehicleToEdit.maintenanceConfigs || [];
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
      maintenanceConfigs: selectedMaintenances,
      salePrice: vehicleToEdit?.salePrice
    };

    onAdd(vehicle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto print:hidden">
      <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] w-full max-w-3xl my-auto overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter text-white">
              {vehicleToEdit ? 'Modifier le Véhicule' : 'Nouveau Véhicule'}
            </h2>
            <p className="text-neutral-500 text-[9px] font-black uppercase tracking-widest mt-0.5">Configuration Parc Automobile</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl transition-all">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Photo Column */}
            <div className="flex flex-col gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square bg-neutral-950 border-2 border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-red-600 transition-all overflow-hidden group shadow-inner"
              >
                {photo ? (
                  <img src={photo} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-neutral-700 mb-1 group-hover:scale-110 transition-transform" />
                    <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">Photo</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            {/* Basic Info Column */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 flex flex-col">
                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] px-1">Nom / Modèle <span className="text-red-600">*</span></label>
                <input
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl focus:border-red-600 outline-none transition-all text-sm font-bold text-white shadow-xl"
                  placeholder="ex: Toyota Hilux"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1 flex flex-col">
                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] px-1">Matricule <span className="text-red-600">*</span></label>
                <input
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl focus:border-red-600 outline-none transition-all text-sm font-bold text-white shadow-xl"
                  placeholder="ex: 01234-124-16"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] px-1">Mise en circulation</label>
                <input
                  required
                  type="date"
                  className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl focus:border-red-600 outline-none transition-all text-sm font-bold text-white shadow-xl"
                  value={regDate}
                  onChange={(e) => setRegDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] px-1">Prix Achat ({CURRENCY})</label>
                <input
                  required
                  type="number"
                  className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl focus:border-red-600 outline-none transition-all text-sm font-bold text-white shadow-xl"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] px-1">Kilométrage Actuel</label>
                <input
                  required
                  type="number"
                  className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl focus:border-red-600 outline-none transition-all text-xl font-black text-red-500 shadow-xl"
                  value={lastMileage}
                  onChange={(e) => setLastMileage(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Maintenance Checklist */}
          <div className="space-y-4 pt-6 border-t border-neutral-800">
            <h3 className="text-xs font-black text-neutral-100 uppercase tracking-[0.25em] flex items-center gap-2">
              <Wrench className="w-4 h-4 text-red-600" /> Plan d'Entretien
            </h3>

            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 shadow-inner">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {masterMaintenanceList.map((type) => {
                  const isSelected = selectedMaintenances.find(m => m.type === type);
                  return (
                    <div
                      key={type}
                      onClick={() => toggleMaintenance(type)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-300 ${isSelected ? 'bg-red-950/20 border-red-600/50 text-white' : 'bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}
                    >
                      {isSelected ? <CheckSquare className="w-4 h-4 text-red-500" /> : <Square className="w-4 h-4" />}
                      <span className="text-[10px] font-black uppercase tracking-widest truncate">{type}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-xl">
                <input
                  type="text"
                  placeholder="Autre type..."
                  className="flex-1 bg-transparent outline-none text-xs font-bold text-white px-1"
                  value={newMaintenanceName}
                  onChange={(e) => setNewMaintenanceName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={addNewMaintenance}
                  className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-end gap-3 border-t border-neutral-800">
            <button type="button" onClick={onClose} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:text-white transition-colors">Annuler</button>
            <button type="submit" className="px-8 py-3 bg-red-700 hover:bg-red-600 rounded-xl text-xs font-black uppercase tracking-[0.1em] shadow-xl shadow-red-900/30 active:scale-95 transition-all text-white">
              {vehicleToEdit ? 'Enregistrer' : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Detailed Modal for Vehicle Info
const VehicleDetailModal = ({ vehicle, store, onClose }: { vehicle: Vehicle, store: any, onClose: () => void }) => {
  const [tab, setTab] = useState<'carnet' | 'calculs'>('carnet');
  const [filterText, setFilterText] = useState('');
  const [simulatedResale, setSimulatedResale] = useState('');
  const [editingConfig, setEditingConfig] = useState(false);
  const [tempConfigs, setTempConfigs] = useState<MaintenanceConfig[]>(vehicle.maintenanceConfigs || []);
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null);

  const isAdmin = store.currentUser?.role === UserRole.ADMIN;
  const isAgent = store.currentUser?.role === UserRole.AGENT;

  const entries = store.entries.filter((e: FinancialEntry) => e.vehicleId === vehicle.id);
  const revenueEntries = entries.filter((e: FinancialEntry) => e.type === EntryType.REVENUE);
  const expenseEntries = entries.filter((e: FinancialEntry) => e.type !== EntryType.REVENUE);

  const totalRevenue = revenueEntries.reduce((sum: number, e: FinancialEntry) => sum + (e.amount || 0), 0);
  const totalExpenses = expenseEntries.reduce((sum: number, e: FinancialEntry) => sum + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  const monthsActive = Math.max(1, Math.floor((new Date().getTime() - new Date(vehicle.registrationDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
  const monthlyProfit = netProfit / monthsActive;

  const projectedResult = (Number(simulatedResale) || 0) + netProfit - vehicle.purchasePrice;

  const filteredEntries = entries.filter((e: FinancialEntry) => {
    const description = e.description || e.designation || '';
    const amountStr = (e.amount ?? 0).toString();
    const agent = e.agentName ?? '';
    const matchText = filterText ? (
      description.toLowerCase().includes(filterText.toLowerCase()) ||
      amountStr.includes(filterText) ||
      agent.toLowerCase().includes(filterText.toLowerCase())
    ) : true;
    return matchText;
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-hidden print:bg-white print:p-0 print:absolute print:inset-0">
      <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] w-full max-w-5xl h-[85vh] flex flex-col relative overflow-hidden shadow-2xl print:h-auto print:border-none print:shadow-none print:rounded-none print:bg-white">
        {/* Premium Header */}
        <div className="relative shrink-0 border-b border-neutral-800 bg-neutral-950 px-6 py-6 overflow-hidden print:bg-white print:border-neutral-200">
          {/* Header Content */}
          <div className="relative flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl shrink-0 group print:border-neutral-300">
              <img src={vehicle.photo || '/car-placeholder.jpg'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 print:grayscale" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white truncate print:text-black">{vehicle.name}</h2>
                <div className="px-2 py-0.5 bg-red-900/20 border border-red-700/30 rounded text-[9px] font-black text-red-500 uppercase tracking-widest print:hidden">Actif</div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <div className="flex items-center gap-1.5 text-neutral-500 print:text-black">
                  <Calendar className="w-3.5 h-3.5 text-red-600/50 print:text-black" />
                  <span className="text-xs font-black uppercase tracking-wider">{vehicle.registrationNumber}</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-500 print:text-black">
                  <Ruler className="w-3.5 h-3.5 text-red-600/50 print:text-black" />
                  <span className="text-xs font-black uppercase tracking-wider">Index: <span className="text-white print:text-black">{(vehicle.lastMileage ?? 0).toLocaleString()} KM</span></span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 no-print">
              <button onClick={() => window.print()} className="p-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl transition-all shadow-xl border border-neutral-800 active:scale-95 no-print">
                <Printer className="w-5 h-5" />
              </button>
              <button onClick={onClose} className="p-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl transition-all shadow-xl border border-neutral-800 active:scale-95">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Premium Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 shrink-0 p-2 gap-2 print:hidden">
          <button
            onClick={() => setTab('carnet')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300 ${tab === 'carnet' ? 'bg-red-700 text-white shadow-xl shadow-red-900/20' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'}`}
          >
            <Wrench className="w-3.5 h-3.5" /> Carnet & Historique
          </button>
          {isAdmin && (
            <button
              onClick={() => setTab('calculs')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300 ${tab === 'calculs' ? 'bg-red-700 text-white shadow-xl shadow-red-900/20' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'}`}
            >
              <FileText className="w-3.5 h-3.5" /> Rentabilité & Calculs
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-900 custom-scrollbar print:bg-white print:overflow-visible print:h-auto">
          {tab === 'carnet' ? (
            <div className="space-y-8">
              {/* Mileage Update */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden shadow-xl print:hidden">
                <div className="flex flex-col sm:flex-row items-end gap-4 relative z-10 w-full">
                  <div className="flex-1 w-full space-y-2">
                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest px-1">Mettre à jour le compteur (KM)</label>
                    <input
                      type="number"
                      defaultValue={vehicle.lastMileage}
                      id={`mileage-update-${vehicle.id}`}
                      className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl outline-none focus:border-red-600 text-2xl font-black text-white shadow-inner"
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
                    className="w-full sm:w-auto px-6 py-4 bg-red-700 hover:bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all active:scale-95 shadow-xl shadow-red-900/30"
                  >
                    Mise à jour
                  </button>
                </div>
              </div>

              {/* Maintenance Grid */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-black text-neutral-500 uppercase tracking-[0.25em] print:text-black">Plan d'Entretien Actif</h3>
                  {isAdmin && (
                    <button onClick={() => setEditingConfig(!editingConfig)} className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 print:hidden">
                      {editingConfig ? 'Terminer' : 'Ajuster les Échéances'}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(editingConfig ? tempConfigs : (vehicle.maintenanceConfigs || [])).map((cfg, idx) => {
                    const remaining = (cfg.nextDueKm ?? 0) - (vehicle.lastMileage ?? 0);
                    const isUrgent = remaining < 1000;
                    const progress = Math.min(100, Math.max(0, (1 - (remaining / (cfg.intervalKm || 1))) * 100));
                    return (
                      <div key={idx} className={`p-5 rounded-2xl border transition-all duration-300 print:border-neutral-300 print:break-inside-avoid ${isUrgent ? 'bg-red-950/20 border-red-900/40' : 'bg-neutral-950 border-neutral-800 print:bg-white'} `}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-1 print:text-neutral-500">Maintenance</p>
                            <h4 className="text-xs font-black text-neutral-100 uppercase tracking-tight print:text-black">{cfg.type}</h4>
                          </div>
                          {isUrgent && <AlertCircle className="w-4 h-4 text-red-600 animate-pulse print:hidden" />}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div>
                            <p className="text-[8px] text-neutral-600 uppercase font-black print:text-neutral-500">Intervalle</p>
                            <p className="text-[10px] font-black text-neutral-200 print:text-black">{(cfg.intervalKm ?? 0).toLocaleString()} KM</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-neutral-600 uppercase font-black print:text-neutral-500">Prochain</p>
                            <p className={`text-[10px] font-black ${isUrgent ? 'text-red-500' : 'text-neutral-200 print:text-black'}`}>{(cfg.nextDueKm ?? 0).toLocaleString()} KM</p>
                          </div>
                        </div>
                        <div className="space-y-1.5 print:hidden">
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

              {/* History List - HIDDEN FOR AGENTS */}
              {!isAgent && (
                <div className="bg-neutral-950 border border-neutral-800 rounded-[2rem] p-6 shadow-2xl print:bg-white print:border-none print:shadow-none print:p-0">
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
                    <h3 className="text-sm font-black uppercase tracking-tighter text-white print:text-black">Journal des Opérations</h3>
                    <div className="relative print:hidden">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
                      <input
                        type="text"
                        placeholder="Filtrer l'historique..."
                        className="pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs outline-none focus:border-red-600 w-full sm:w-64 font-bold text-white transition-all"
                        value={filterText}
                        onChange={e => setFilterText(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredEntries.length === 0 ? (
                      <div className="py-12 text-center border-2 border-dashed border-neutral-900 rounded-2xl">
                        <FileText className="w-8 h-8 text-neutral-800 mx-auto mb-3" />
                        <p className="text-neutral-600 text-[10px] font-black uppercase tracking-widest">Aucun historique disponible</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse hidden print:table">
                        <thead className="border-b border-black">
                          <tr>
                            <th className="text-[10px] uppercase font-black">Date</th>
                            <th className="text-[10px] uppercase font-black">Type</th>
                            <th className="text-[10px] uppercase font-black">Description</th>
                            <th className="text-[10px] uppercase font-black text-right">Montant</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300">
                          {filteredEntries.map(e => (
                            <tr key={e.id}>
                              <td className="py-2 text-xs">{new Date(e.date).toLocaleDateString()}</td>
                              <td className="py-2 text-xs">{e.type}</td>
                              <td className="py-2 text-xs">{e.description}</td>
                              <td className="py-2 text-xs text-right font-bold">{e.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* Screen View for History */}
                    <div className="space-y-3 print:hidden">
                      {filteredEntries.map((e: FinancialEntry) => (
                        <div key={e.id} className="group bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 p-4 rounded-2xl transition-all flex flex-col md:flex-row gap-4 items-start md:items-center relative">
                          <div className="flex flex-col items-center justify-center w-14 h-14 bg-neutral-950 rounded-xl border border-neutral-800 shrink-0">
                            <p className="text-xs font-black text-white">{new Date(e.date).getDate()}</p>
                            <p className="text-[8px] font-black text-neutral-600 uppercase">{new Date(e.date).toLocaleString('fr-FR', { month: 'short' })}</p>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {e.type === EntryType.REVENUE ? (
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-900/20" />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-lg shadow-red-900/20" />
                              )}
                              <h4 className="text-xs font-black text-neutral-100 uppercase tracking-tight truncate group-hover:text-red-500 transition-colors">
                                {e.description || e.designation || 'Sans description'}
                              </h4>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 opacity-60">
                              <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-neutral-400">
                                <User className="w-2.5 h-2.5 text-red-600" />
                                <span><span className="text-neutral-100">{e.agentName || 'Système'}</span></span>
                              </div>
                              <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-neutral-400">
                                <Ruler className="w-2.5 h-2.5 text-red-600" />
                                <span><span className="text-neutral-100">{(e.mileageAtEntry || 0).toLocaleString()} KM</span></span>
                              </div>
                              {e.maintenanceType && (
                                <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-amber-500">
                                  <Wrench className="w-2.5 h-2.5" />
                                  <span>{e.maintenanceType}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {e.proofPhoto && (
                              <button
                                onClick={() => {
                                  // Open photo in new tab
                                  const w = window.open('about:blank');
                                  if (w) {
                                    w.document.write(`<img src="${e.proofPhoto}" style="max-width: 100%; height: auto;"/>`);
                                    w.document.close();
                                  }
                                }}
                                className="p-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:border-neutral-600 transition-all"
                                title="Voir la preuve (Photo)"
                              >
                                <Camera className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {isAdmin && (
                              <button
                                onClick={() => setEditingEntry(e)}
                                className="p-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-400 hover:text-amber-500 hover:border-amber-900/30 transition-all"
                                title="Modifier l'entrée"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <div className="text-right shrink-0">
                              <p className={`text-base font-black ${e.type === EntryType.REVENUE ? 'text-emerald-500' : 'text-neutral-200'}`}>
                                {e.type === EntryType.REVENUE ? '+' : '-'}{(e.amount || 0).toLocaleString()} <span className="text-[9px] text-neutral-600">{CURRENCY}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
                <div className="bg-neutral-950 p-6 rounded-[2rem] border border-neutral-800 relative overflow-hidden shadow-2xl print:bg-white print:border-neutral-300">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><Calculator className="w-24 h-24 text-white print:hidden" /></div>
                  <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-4 print:text-black">Marge Nette (Exploitation)</h3>
                  <p className={`text-4xl font-black mb-4 ${netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'} print:text-black`}>
                    {(netProfit ?? 0).toLocaleString()} <span className="text-lg text-neutral-600 print:text-neutral-500">{CURRENCY}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-neutral-900/50 rounded-2xl border border-neutral-800 print:bg-white print:border-neutral-300">
                    <div>
                      <p className="text-[8px] uppercase font-black text-neutral-600 tracking-widest mb-1">Revenus</p>
                      <p className="text-base font-black text-emerald-500 print:text-black">{(totalRevenue ?? 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase font-black text-neutral-600 tracking-widest mb-1">Charges</p>
                      <p className="text-base font-black text-red-500 print:text-black">{(totalExpenses ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-950 p-6 rounded-[2rem] border border-neutral-800 flex flex-col justify-center shadow-2xl print:bg-white print:border-neutral-300">
                  <div className="flex justify-between items-baseline mb-4">
                    <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest print:text-black">Rentabilité Mensuelle Moyen.</h3>
                    <span className="text-[8px] bg-neutral-900 px-2 py-1 rounded-full font-black text-neutral-400 uppercase tracking-widest print:hidden">{monthsActive} Mois</span>
                  </div>
                  <p className={`text-3xl font-black ${monthlyProfit >= 0 ? 'text-emerald-500' : 'text-red-500'} print:text-black`}>
                    {(monthlyProfit ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-base text-neutral-600 print:text-neutral-500">{CURRENCY} / Mois</span>
                  </p>
                  <p className="text-[9px] text-neutral-600 mt-4 italic font-medium leading-relaxed print:text-black">
                    Calcul basé sur la mise en circulation le <span className="text-neutral-400 print:text-black">{new Date(vehicle.registrationDate).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>

              {/* Simulation de Vente & Clôture */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-[2rem] p-6 relative overflow-hidden print:hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-900/10 rounded-full blur-[80px] pointer-events-none"></div>

                <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-500" /> Simulation de Vente & Clôture
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest px-1">Prix de Vente Simulé ({CURRENCY})</label>
                    <input
                      type="number"
                      className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-xl font-black text-white outline-none focus:border-emerald-500 transition-all shadow-inner"
                      placeholder="0"
                      value={simulatedResale}
                      onChange={(e) => setSimulatedResale(e.target.value)}
                    />
                  </div>

                  <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
                    <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-2">Résultat Final Projeté</p>
                    <div className={`text-2xl font-black ${projectedResult >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {(projectedResult).toLocaleString()} <span className="text-xs text-neutral-600">{CURRENCY}</span>
                    </div>
                    <p className="text-[8px] text-neutral-600 mt-2 font-bold">
                      (Exploitation + Vente) - Achat
                    </p>
                  </div>

                  <div>
                    <button
                      onClick={() => {
                        if (!simulatedResale || Number(simulatedResale) <= 0) {
                          alert("Veuillez saisir un prix de vente valide.");
                          return;
                        }
                        if (confirm(`ATTENTION: ACTION IRRÉVERSIBLE.\n\nVous êtes sur le point de vendre le véhicule "${vehicle.name}" pour ${Number(simulatedResale).toLocaleString()} DA.\n\nLe véhicule sera ARCHIVÉ et ne pourra plus recevoir de nouvelles opérations.\nUne entrée de REVENU correspondant à la vente sera ajoutée.\n\nContinuer ?`)) {
                          // 1. Update Vehicle (Archive + Sale Price)
                          store.updateVehicle({
                            ...vehicle,
                            isArchived: true,
                            salePrice: Number(simulatedResale)
                          });

                          // 2. Add Sale Revenue Entry
                          store.addEntry({
                            id: `sale-${Date.now()}`,
                            vehicleId: vehicle.id,
                            date: new Date().toISOString(),
                            amount: Number(simulatedResale),
                            type: 'REVENUE', // EntryType.REVENUE
                            description: `Vente Véhicule : ${vehicle.name}`,
                            agentName: store.currentUser?.name || 'Admin',
                            status: 'APPROVED'
                          });

                          alert("Véhicule vendu et archivé avec succès.");
                          onClose();
                        }
                      }}
                      className="w-full py-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-900/30 transition-all active:scale-95 border border-emerald-600/30"
                    >
                      Confirmer la Vente et Archiver
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {editingEntry && (
          <div className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <h3 className="text-lg font-black uppercase tracking-tighter text-white mb-4">Modifier l'opération</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                store.updateEntry(editingEntry);
                setEditingEntry(null);
              }} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Description</label>
                  <input
                    className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-white text-sm"
                    value={editingEntry.description}
                    onChange={e => setEditingEntry({ ...editingEntry, description: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Montant ({CURRENCY})</label>
                  <input
                    type="number"
                    className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-white text-sm"
                    value={editingEntry.amount}
                    onChange={e => setEditingEntry({ ...editingEntry, amount: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Date</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-white text-sm"
                    value={editingEntry.date ? new Date(editingEntry.date).toISOString().slice(0, 16) : ''}
                    onChange={e => setEditingEntry({ ...editingEntry, date: new Date(e.target.value).toISOString() })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditingEntry(null)} className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-xs font-bold uppercase">Annuler</button>
                  <button type="submit" className="px-6 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">Enregistrer</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleList;
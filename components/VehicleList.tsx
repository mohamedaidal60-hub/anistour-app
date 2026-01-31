import React, { useState, useRef } from 'react';
import { useFleetStore } from '../store.ts';
import { UserRole, Vehicle, MaintenanceConfig } from '../types.ts';
import { MAINTENANCE_TYPES, CURRENCY } from '../constants.ts';
import { Plus, Search, Archive, Calendar, Ruler, Car, Camera, Upload } from 'lucide-react';

interface VehicleListProps {
  store: ReturnType<typeof useFleetStore>;
}

const VehicleList: React.FC<VehicleListProps> = ({ store }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');
  
  const activeVehicles = store.vehicles.filter(v => !v.isArchived && v.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
          <input 
            type="text" 
            placeholder="Rechercher par nom ou immatriculation..." 
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeVehicles.map(vehicle => (
          <div key={vehicle.id} className="bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl hover:border-neutral-600 transition-all group flex flex-col">
            <div className="aspect-[16/10] relative overflow-hidden bg-neutral-950">
              <img 
                src={vehicle.photo || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=600&auto=format&fit=crop'} 
                alt={vehicle.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-neutral-950/80 backdrop-blur-md rounded-lg text-[10px] font-black uppercase border border-white/5 shadow-xl">
                  {vehicle.lastMileage.toLocaleString()} KM
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-neutral-950 to-transparent">
                 <h3 className="font-black text-xl text-white uppercase tracking-tighter">{vehicle.name}</h3>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2 text-neutral-500">
                  <Calendar className="w-3 h-3" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">{new Date(vehicle.registrationDate).toLocaleDateString('fr-FR')}</p>
                </div>
                {store.currentUser?.role === UserRole.ADMIN && (
                   <button 
                    onClick={() => {
                      const price = prompt('À combien avez-vous vendu le véhicule ?');
                      if (price && !isNaN(Number(price))) store.archiveVehicle(vehicle.id, Number(price));
                    }}
                    className="p-2 bg-neutral-950 border border-neutral-800 hover:bg-red-950 text-neutral-600 hover:text-red-500 rounded-xl transition-all"
                    title="Vendre et Archiver"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="space-y-4 flex-1">
                <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 flex justify-between items-center">
                  <span className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em]">Prix d'acquisition</span>
                  <span className="font-black text-neutral-200">{vehicle.purchasePrice.toLocaleString()} {CURRENCY}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                     <Ruler className="w-3 h-3 text-red-600" />
                     <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Échéances critiques</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {vehicle.maintenanceConfigs.slice(0, 3).map(cfg => {
                      const kmLeft = cfg.nextNotifyKm - vehicle.lastMileage;
                      const isNear = kmLeft < 1000;
                      return (
                        <div key={cfg.type} className={`px-2 py-1.5 rounded-lg border flex flex-col ${isNear ? 'bg-red-950/20 border-red-900/50' : 'bg-neutral-950 border-neutral-800'}`}>
                          <span className="text-[8px] font-black text-neutral-500 uppercase">{cfg.type}</span>
                          <span className={`text-[10px] font-bold ${isNear ? 'text-red-500' : 'text-neutral-400'}`}>{cfg.nextNotifyKm.toLocaleString()} KM</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {activeVehicles.length === 0 && (
          <div className="col-span-full py-20 text-center">
             <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-800">
                <Car className="w-10 h-10 text-neutral-700" />
             </div>
             <p className="text-neutral-500 italic">Aucun véhicule actif trouvé dans votre parc.</p>
          </div>
        )}
      </div>

      {showAddForm && <AddVehicleModal onClose={() => setShowAddForm(false)} onAdd={store.addVehicle} />}
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
      lastKm: 0,
      nextNotifyKm: 7000
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
      maintenanceConfigs: configs.map(c => ({
        ...c,
        lastKm: Number(lastMileage),
        nextNotifyKm: Number(lastMileage) + c.intervalKm
      }))
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
               <Ruler className="w-3 h-3" /> Paramètres des Entretiens
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {configs.map((cfg, idx) => (
                <div key={cfg.type} className="flex flex-col gap-1.5 p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{cfg.type}</span>
                  <select 
                    className="bg-neutral-900 border border-neutral-800 text-xs p-2 rounded-lg outline-none focus:border-red-600"
                    value={cfg.intervalKm}
                    onChange={(e) => {
                      const newConfigs = [...configs];
                      newConfigs[idx].intervalKm = Number(e.target.value);
                      setConfigs(newConfigs);
                    }}
                  >
                    {[5000, 7000, 8000, 9000, 10000, 15000, 20000, 30000].map(v => (
                      <option key={v} value={v}>{v.toLocaleString()} KM</option>
                    ))}
                  </select>
                </div>
              ))}
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
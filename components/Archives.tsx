import React from 'react';
import { useFleetStore } from '../store.ts';
import { Search, Info, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { CURRENCY } from '../constants.ts';

interface ArchivesProps { store: ReturnType<typeof useFleetStore>; }

const Archives: React.FC<ArchivesProps> = ({ store }) => {
  const archivedVehicles = store.vehicles.filter(v => v.isArchived);
  const totalProfit = archivedVehicles.reduce((sum, v) => sum + ((v.salePrice || 0) - v.purchasePrice), 0);

  return (
    <div className="space-y-8">
      <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-[2rem] flex flex-col lg:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
           <Target className="w-64 h-64 -translate-y-12 translate-x-12" />
        </div>
        <div className="relative z-10 text-center lg:text-left">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Historique des Cessions</h2>
          <p className="text-sm text-neutral-500 max-w-md">Registre complet des véhicules ayant quitté le parc. Suivi des plus-values et moins-values réalisées.</p>
        </div>
        <div className="relative z-10 p-8 bg-neutral-950 border border-neutral-800 rounded-3xl text-center min-w-[300px] shadow-xl">
          <p className="text-[10px] text-neutral-600 uppercase font-black tracking-[0.3em] mb-2">Bénéfice Archive Global</p>
          <div className="flex items-center justify-center gap-3">
             {totalProfit >= 0 ? <TrendingUp className="w-8 h-8 text-emerald-500" /> : <TrendingDown className="w-8 h-8 text-red-500" />}
             <p className={`text-4xl font-black tracking-tighter ${totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
               {Math.abs(totalProfit).toLocaleString()} <span className="text-sm font-medium opacity-60 uppercase">{CURRENCY}</span>
             </p>
          </div>
          <p className="text-[8px] text-neutral-700 font-bold uppercase mt-4 tracking-widest">{archivedVehicles.length} Véhicules archivés</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {archivedVehicles.map(v => {
          const diff = (v.salePrice || 0) - v.purchasePrice;
          const isProfit = diff >= 0;
          return (
            <div key={v.id} className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8 transition-all hover:border-neutral-700 shadow-xl opacity-90 hover:opacity-100">
              <div className="w-32 h-32 rounded-3xl overflow-hidden grayscale contrast-125 bg-neutral-800 shrink-0 border border-neutral-700 shadow-lg">
                 <img src={v.photo} alt={v.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 w-full">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-black text-xl uppercase tracking-tighter text-neutral-100">{v.name}</h3>
                    <span className="text-[9px] bg-neutral-800 border border-neutral-700 px-2 py-1 rounded-lg text-neutral-500 uppercase font-black tracking-widest mt-2 inline-block">Statut: Vendu</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 bg-neutral-950 p-5 rounded-2xl border border-neutral-800">
                  <div>
                    <p className="text-[9px] text-neutral-600 uppercase font-black tracking-widest mb-1">Achat</p>
                    <p className="font-bold text-neutral-400 text-sm">{v.purchasePrice.toLocaleString()} {CURRENCY}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-neutral-600 uppercase font-black tracking-widest mb-1">Vente</p>
                    <p className="font-bold text-neutral-200 text-sm">{v.salePrice?.toLocaleString()} {CURRENCY}</p>
                  </div>
                  <div className="col-span-2 pt-4 border-t border-neutral-800 flex justify-between items-center">
                     <p className="text-[9px] text-neutral-500 uppercase font-black tracking-widest">Résultat Net</p>
                     <p className={`font-black text-lg tracking-tighter ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                       {isProfit ? '+' : ''}{diff.toLocaleString()} {CURRENCY}
                     </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {archivedVehicles.length === 0 && (
          <div className="col-span-full py-32 text-center bg-neutral-900/10 border border-dashed border-neutral-800 rounded-[3rem]">
             <div className="w-16 h-16 bg-neutral-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-neutral-700" />
             </div>
             <p className="text-sm text-neutral-600 font-medium italic">Aucun enregistrement d'archive disponible.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Archives;
import React, { useState } from 'react';
import { useFleetStore } from './store.ts';
import { UserRole } from './types.ts';
import Login from './components/Login.tsx';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import VehicleList from './components/VehicleList.tsx';
import DailyEntry from './components/DailyEntry.tsx';
import MaintenanceManager from './components/MaintenanceManager.tsx';
import AdminValidation from './components/AdminValidation.tsx';
import NotificationCenter from './components/NotificationCenter.tsx';
import Archives from './components/Archives.tsx';
import UserManagement from './components/UserManagement.tsx';
import Journal from './components/Journal.tsx';
import { Cloud, RefreshCw, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const store = useFleetStore();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!store.isDataLoaded) {
    return (
      <div className="h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
        <p className="text-neutral-500 font-black uppercase tracking-widest text-[10px]">Chargement Anistour Cloud...</p>
      </div>
    );
  }

  if (!store.currentUser) {
    return <Login onLogin={store.setCurrentUser} users={store.users} appLogo={store.appLogo} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard store={store} />;
      case 'vehicles': return <VehicleList store={store} />;
      case 'entry': return <DailyEntry store={store} />;
      case 'journal': return <Journal store={store} />;
      case 'maintenance': return <MaintenanceManager store={store} />;
      case 'validation': return store.currentUser?.role === UserRole.ADMIN ? <AdminValidation store={store} /> : <div className="p-20 text-center text-red-500 font-black">ACCÈS REFUSÉ</div>;
      case 'notifications': return <NotificationCenter store={store} />;
      case 'archives': return <Archives store={store} />;
      case 'users': return store.currentUser?.role === UserRole.ADMIN ? <UserManagement store={store} /> : <div className="p-20 text-center text-red-500 font-black">ACCÈS REFUSÉ</div>;
      default: return <Dashboard store={store} />;
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        role={store.currentUser.role} 
        userName={store.currentUser.name}
        appLogo={store.appLogo}
        onLogout={() => store.setCurrentUser(null)}
      />
      <main className="flex-1 flex flex-col overflow-auto relative custom-scrollbar bg-neutral-950">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        
        <header className="p-4 border-b border-neutral-800 flex justify-between items-center sticky top-0 bg-neutral-950/80 backdrop-blur-xl z-30">
          <div className="flex items-center gap-4">
             <h1 className="text-xl font-black tracking-tighter uppercase text-neutral-100">
               {activeTab === 'dashboard' ? 'Tableau de Bord' : 
                activeTab === 'vehicles' ? 'Parc Automobile' :
                activeTab === 'entry' ? 'Opérations' :
                activeTab === 'journal' ? 'Journal' :
                activeTab === 'maintenance' ? 'Entretiens' :
                activeTab === 'validation' ? 'Validation' :
                activeTab === 'notifications' ? 'Alertes' : 
                activeTab === 'users' ? 'Paramètres' : 'Archives'}
             </h1>
          </div>
          
          <div className="flex items-center space-x-4">
             <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 border rounded-xl transition-all ${store.isCloudSyncing ? 'bg-amber-950/20 border-amber-900/50 text-amber-500' : 'bg-emerald-950/20 border-emerald-900/50 text-emerald-500'}`}>
                {store.isCloudSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5" />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {store.isCloudSyncing ? 'Sync...' : 'Cloud Online'}
                </span>
             </div>
             <span className="px-3 py-1 bg-neutral-800 text-neutral-400 border border-neutral-700 rounded-lg text-xs font-bold uppercase tracking-widest">{store.currentUser.role}</span>
          </div>
        </header>

        <div className="p-6 relative z-10 max-w-[1600px] mx-auto w-full">
          {renderContent()}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #262626; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
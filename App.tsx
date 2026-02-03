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
import GlobalExpenses from './components/GlobalExpenses.tsx';
import Chat from './components/Chat.tsx';
import { Cloud, RefreshCw, Loader2, Menu, Bell } from 'lucide-react';

const App: React.FC = () => {
  const store = useFleetStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!store.isDataLoaded) {
    return (
      <div className="h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
        <p className="text-neutral-500 font-black uppercase tracking-widest text-[10px]">Chargement Anistour Cloud...</p>
      </div>
    );
  }

  if (!store.currentUser) {
    return <Login onLogin={store.setCurrentUser} users={store.users} appLogo="/logo.png" />;
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
      case 'charges': return store.currentUser?.role === UserRole.ADMIN ? <GlobalExpenses store={store} /> : <div className="p-20 text-center text-red-500 font-black">ACCÈS REFUSÉ</div>;
      case 'users': return store.currentUser?.role === UserRole.ADMIN ? <UserManagement store={store} /> : <div className="p-20 text-center text-red-500 font-black">ACCÈS REFUSÉ</div>;
      default: return <Dashboard store={store} />;
    }
  };


  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      <aside className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shrink-0`}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }}
          role={store.currentUser.role}
          userName={store.currentUser.name}
          appLogo="/logo.png"
          onLogout={() => store.setCurrentUser(null)}
          onClose={() => setIsSidebarOpen(false)}
          store={store}
        />
      </aside>

      <main className="flex-1 min-w-0 flex flex-col overflow-x-hidden overflow-y-auto relative custom-scrollbar bg-neutral-950">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

        <header className="p-4 border-b border-neutral-800 flex justify-between items-center sticky top-0 bg-neutral-950/80 backdrop-blur-xl z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-black tracking-tighter uppercase text-neutral-100 truncate">
              {activeTab === 'dashboard' ? 'Tableau de Bord' :
                activeTab === 'vehicles' ? 'Parc Auto' :
                  activeTab === 'entry' ? 'Opérations' :
                    activeTab === 'journal' ? 'Journal' :
                      activeTab === 'maintenance' ? 'Entretiens' :
                        activeTab === 'validation' ? 'Validation' :
                          activeTab === 'notifications' ? 'Alertes' :
                            activeTab === 'users' ? 'Paramètres' : 'Archives'}
            </h1>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"
            >
              <Bell className="w-5 h-5" />
              {store.notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-neutral-950 animate-pulse"></span>
              )}
            </button>
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 border rounded-xl transition-all ${store.isCloudSyncing ? 'bg-amber-950/20 border-amber-900/50 text-amber-500' : 'bg-emerald-950/20 border-emerald-900/50 text-emerald-500'}`}>
              {store.isCloudSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Cloud className="w-3.5 h-3.5" />
              )}
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">
                {store.isCloudSyncing ? 'Sync...' : 'Online'}
              </span>
            </div>
            <span className="px-3 py-1 bg-neutral-800 text-neutral-400 border border-neutral-700 rounded-lg text-xs font-bold uppercase tracking-widest">{store.currentUser.role}</span>
          </div>
        </header>

        <div className="p-4 sm:p-6 relative z-10 w-full mx-auto max-w-[1600px]">
          {renderContent()}
        </div>

        <Chat store={store} />
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
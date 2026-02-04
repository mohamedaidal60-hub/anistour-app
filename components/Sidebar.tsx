import React, { useState } from 'react';
import { UserRole } from '../types.ts';
import {
  LayoutDashboard,
  Car,
  PlusCircle,
  Wrench,
  CheckCircle,
  Bell,
  Archive,
  Users,
  LogOut,
  ListOrdered,
  X,
  Wallet,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: UserRole;
  userName: string;
  appLogo?: string;
  onLogout: () => void;
  onClose?: () => void;
  store: any;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, role, userName, appLogo, onLogout, onClose, store }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.AGENT] },
    { id: 'vehicles', label: 'Gestion Véhicules', icon: Car, roles: [UserRole.ADMIN, UserRole.AGENT] },
    { id: 'entry', label: 'Saisie du Jour', icon: PlusCircle, roles: [UserRole.ADMIN, UserRole.AGENT] },
    { id: 'journal', label: 'Journal de Bord', icon: ListOrdered, roles: [UserRole.ADMIN, UserRole.AGENT] },
    { id: 'caisse', label: 'Caisse', icon: TrendingUp, roles: [UserRole.ADMIN, UserRole.AGENT] },
    { id: 'maintenance', label: 'Suivi Entretiens', icon: Wrench, roles: [UserRole.ADMIN, UserRole.AGENT] },
    { id: 'validation', label: 'Validations', icon: CheckCircle, roles: [UserRole.ADMIN] },
    { id: 'charges', label: 'Charges Globales', icon: Wallet, roles: [UserRole.ADMIN] },
    { id: 'notifications', label: 'Alertes', icon: Bell, roles: [UserRole.ADMIN, UserRole.AGENT] },
    { id: 'archives', label: 'Archives Vente', icon: Archive, roles: [UserRole.ADMIN] },
    { id: 'users', label: 'Paramètres', icon: Users, roles: [UserRole.ADMIN] },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-72'} bg-neutral-950 border-r border-neutral-800 flex flex-col h-screen shrink-0 transition-all duration-300 relative overflow-hidden`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-6 -right-3 z-50 w-6 h-6 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all shadow-xl"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={`${isCollapsed ? 'p-2' : 'p-6'} shrink-0 relative flex flex-col items-center`}>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 lg:hidden p-2 text-neutral-500 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className={`${isCollapsed ? 'w-12 h-12 mb-4 p-2' : 'w-32 h-32 mb-6 p-4'} relative rounded-xl overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-950 flex items-center justify-center transition-all duration-300`}>
          {appLogo ? (
            <img src="/logo.png" alt="Anistour Logo" className="w-full h-full object-contain" />
          ) : (
            <div className="text-red-600 font-bold text-[8px] sm:text-[10px] text-center uppercase tracking-tighter">
              Anistour<br />Fleet
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="w-full p-4 bg-neutral-900/50 rounded-[1.5rem] border border-neutral-800 shadow-inner">
            <p className="text-[8px] text-neutral-600 uppercase font-black tracking-[0.2em] mb-1">Session Active</p>
            <p className="text-xs font-black truncate text-neutral-100 uppercase tracking-tight">{userName}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.filter(item => item.roles.includes(role)).map(item => {
          const isValidation = item.id === 'validation';
          const isNotif = item.id === 'notifications';
          const pendingCount = store.entries.filter(e => e.status === 'PENDING').length;
          const notifCount = store.notifications.length;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : ''}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-between px-5 py-3.5'} rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all group ${activeTab === item.id
                ? 'bg-red-700 text-white shadow-xl shadow-red-900/30'
                : 'text-neutral-500 hover:bg-neutral-900/80 hover:text-neutral-200'
                }`}
            >
              <div className="flex items-center">
                <item.icon className={`shrink-0 ${isCollapsed ? 'w-6 h-6' : 'w-4 h-4 mr-4'} transition-all`} />
                {!isCollapsed && <span>{item.label}</span>}
              </div>
              {!isCollapsed && (
                <>
                  {isValidation && pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-lg font-black animate-pulse">{pendingCount}</span>
                  )}
                  {isNotif && notifCount > 0 && (
                    <span className="bg-neutral-800 text-neutral-300 text-[9px] px-2 py-0.5 rounded-lg font-black border border-neutral-700">{notifCount}</span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-neutral-900 bg-neutral-950`}>
        <button
          onClick={onLogout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'px-5 py-3.5'} text-neutral-600 hover:text-red-500 rounded-2xl transition-all text-xs font-black uppercase tracking-widest group`}
        >
          <LogOut className={`${isCollapsed ? 'w-6 h-6' : 'w-4 h-4 mr-4'} group-hover:rotate-12 transition-transform`} />
          {!isCollapsed && 'Déconnexion'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
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
  TrendingUp,
  ChevronLeft,
  ChevronRight
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
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard, roles: [UserRole.ADMIN] },
    { id: 'vehicles', label: 'Gestion Véhicules', icon: Car, roles: [UserRole.ADMIN, UserRole.AGENT] },
    { id: 'entry', label: 'Saisie du Jour', icon: PlusCircle, roles: [UserRole.ADMIN, UserRole.AGENT] },
    { id: 'journal', label: 'Journal de Bord', icon: ListOrdered, roles: [UserRole.ADMIN, UserRole.AGENT] },
    { id: 'caisse', label: 'Caisse', icon: TrendingUp, roles: [UserRole.ADMIN, UserRole.AGENT] },
    { id: 'maintenance', label: 'Suivi Entretiens', icon: Wrench, roles: [UserRole.ADMIN, UserRole.AGENT] },
    { id: 'validation', label: 'Validations', icon: CheckCircle, roles: [UserRole.ADMIN] },
    { id: 'charges', label: 'Charges Globales', icon: Wallet, roles: [UserRole.ADMIN] },
    { id: 'notifications', label: 'Alertes', icon: Bell, roles: [UserRole.ADMIN, UserRole.AGENT] },
    { id: 'alerts_archive', label: 'Archive Alertes', icon: Archive, roles: [UserRole.ADMIN, UserRole.AGENT] },
    { id: 'archives', label: 'Archives Vente', icon: Archive, roles: [UserRole.ADMIN] },
    { id: 'users', label: 'Paramètres', icon: Users, roles: [UserRole.ADMIN] },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-60'} bg-neutral-950 border-r border-neutral-800 flex flex-col h-screen shrink-0 transition-all duration-300 relative overflow-hidden print:hidden`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-4 -right-3 z-50 w-5 h-5 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all shadow-md"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      <div className={`${isCollapsed ? 'p-2' : 'p-4'} shrink-0 relative flex flex-col items-center`}>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 lg:hidden p-1 text-neutral-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className={`${isCollapsed ? 'w-8 h-8 mb-2 p-1' : 'w-24 h-24 mb-4 p-2'} relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 flex items-center justify-center transition-all duration-300`}>
          {appLogo ? (
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <div className="text-red-600 font-bold text-[8px] text-center uppercase tracking-tighter">
              AF
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="w-full p-3 bg-neutral-900/50 rounded-xl border border-neutral-800">
            <p className="text-[9px] font-black truncate text-neutral-300 uppercase tracking-tight text-center">{userName}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.filter(item => item.roles.includes(role)).map((item) => {
          const isValidation = item.id === 'validation';
          const isNotif = item.id === 'notifications';
          const pendingCount = store.entries.filter((e: any) => e.status === 'PENDING').length;
          const notifCount = store.notifications.filter((n: any) => !n.isArchived).length;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : ''}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2.5'} rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all group ${activeTab === item.id
                ? 'bg-red-700 text-white shadow-lg shadow-red-900/20'
                : 'text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300'
                }`}
            >
              <div className="flex items-center">
                <item.icon className={`shrink-0 ${isCollapsed ? 'w-4 h-4' : 'w-3.5 h-3.5 mr-3'} transition-all`} />
                {!isCollapsed && <span>{item.label}</span>}
              </div>
              {!isCollapsed && (
                <div className="flex gap-1">
                  {isValidation && pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold animate-pulse">{pendingCount}</span>
                  )}
                  {isNotif && notifCount > 0 && (
                    <span className="bg-neutral-800 text-neutral-400 text-[9px] px-1.5 py-0.5 rounded font-bold border border-neutral-700">{notifCount}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className={`${isCollapsed ? 'p-2' : 'p-3'} border-t border-neutral-900 bg-neutral-950`}>
        <button
          onClick={onLogout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'px-3 py-2.5'} text-neutral-600 hover:text-red-500 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest group`}
        >
          <LogOut className={`${isCollapsed ? 'w-4 h-4' : 'w-3.5 h-3.5 mr-3'} group-hover:rotate-12 transition-transform`} />
          {!isCollapsed && 'Déconnexion'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
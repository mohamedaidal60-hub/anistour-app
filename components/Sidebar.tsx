import React from 'react';
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
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: UserRole;
  userName: string;
  appLogo?: string;
  onLogout: () => void;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, role, userName, appLogo, onLogout, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.AGENT] },
    { id: 'vehicles', label: 'Gestion Véhicules', icon: Car, roles: [UserRole.ADMIN, UserRole.AGENT] },
    { id: 'entry', label: 'Saisie du Jour', icon: PlusCircle, roles: [UserRole.ADMIN, UserRole.AGENT] },
    { id: 'journal', label: 'Journal de Bord', icon: ListOrdered, roles: [UserRole.ADMIN, UserRole.AGENT] },
    { id: 'maintenance', label: 'Suivi Entretiens', icon: Wrench, roles: [UserRole.ADMIN, UserRole.AGENT] },
    { id: 'validation', label: 'Validations', icon: CheckCircle, roles: [UserRole.ADMIN] },
    { id: 'notifications', label: 'Alertes', icon: Bell, roles: [UserRole.ADMIN, UserRole.AGENT] },
    { id: 'archives', label: 'Archives Vente', icon: Archive, roles: [UserRole.ADMIN] },
    { id: 'users', label: 'Paramètres', icon: Users, roles: [UserRole.ADMIN] },
  ];

  return (
    <aside className="w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col h-screen shrink-0 overflow-hidden">
      <div className="p-6 shrink-0 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 lg:hidden p-2 text-neutral-500 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        )}
        <div className="w-full aspect-square relative mb-6 rounded-2xl overflow-hidden border border-neutral-800 shadow-xl bg-neutral-950 flex items-center justify-center p-3">
          {appLogo ? (
            <img src="/logo.png" alt="Anistour Logo" className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="text-red-600 font-black text-xs text-center uppercase tracking-tighter">
              Anistour<br />Fleet
            </div>
          )}
        </div>
        <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-800">
          <p className="text-[9px] text-neutral-500 uppercase font-black tracking-widest mb-1">Utilisateur</p>
          <p className="text-sm font-bold truncate text-neutral-100">{userName}</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.filter(item => item.roles.includes(role)).map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all group ${activeTab === item.id
              ? 'bg-red-700 text-white shadow-lg'
              : 'text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200'
              }`}
          >
            <item.icon className="w-5 h-5 mr-3 shrink-0" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-neutral-800 bg-neutral-950">
        <button onClick={onLogout} className="w-full flex items-center px-4 py-3 text-neutral-500 hover:text-red-500 rounded-xl transition-all text-sm font-bold">
          <LogOut className="w-5 h-5 mr-3" /> Déconnexion
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
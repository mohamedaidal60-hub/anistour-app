import React, { useState, useRef } from 'react';
import { useFleetStore } from '../store.ts';
import { User, UserRole } from '../types.ts';
import { Plus, UserPlus, Key, Trash2, Shield, User as UserIcon, Settings, Upload, Image as ImageIcon } from 'lucide-react';

interface UserManagementProps {
  store: ReturnType<typeof useFleetStore>;
}

const UserManagement: React.FC<UserManagementProps> = ({ store }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.AGENT);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => store.setAppLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: Date.now().toString(),
      name: newUserName,
      email: newUserEmail,
      password: newUserPass,
      role: newUserRole
    };
    store.addUser(newUser);
    setShowAdd(false);
    resetForm();
  };

  const resetForm = () => {
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPass('');
    setNewUserRole(UserRole.AGENT);
  };

  const handleResetPass = (userId: string) => {
    const newPass = prompt('Entrez le nouveau mot de passe :');
    if (newPass) store.resetPassword(userId, newPass);
  };

  return (
    <div className="space-y-10">
      {/* Section Paramètres Agence */}
      <section className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
           <div className="p-3 bg-red-900/30 rounded-2xl">
              <Settings className="w-6 h-6 text-red-500" />
           </div>
           <div>
              <h2 className="text-xl font-black uppercase tracking-tighter">Paramètres de l'Agence</h2>
              <p className="text-xs text-neutral-500">Configurez l'identité visuelle de votre plateforme Anistour.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
           <div className="space-y-4">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">Logo de l'entreprise (Menu & Connexion)</label>
              <div 
                onClick={() => logoInputRef.current?.click()}
                className="w-48 h-48 bg-neutral-950 border-2 border-dashed border-neutral-800 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:border-red-600 transition-all overflow-hidden relative group"
              >
                 {store.appLogo ? (
                   <>
                    <img src={store.appLogo} className="w-full h-full object-contain p-4" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Upload className="w-6 h-6 text-white" />
                    </div>
                   </>
                 ) : (
                   <>
                    <ImageIcon className="w-10 h-10 text-neutral-700 mb-3" />
                    <span className="text-[9px] font-black text-neutral-600 uppercase">Uploader Logo</span>
                   </>
                 )}
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <p className="text-[10px] text-neutral-600 italic">Format recommandé: Carré, fond transparent ou noir (PNG/JPG).</p>
           </div>
           
           <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl">
              <h4 className="text-sm font-bold mb-4 text-red-500">Note de déploiement</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Les modifications effectuées ici sont enregistrées localement sur votre navigateur. 
                Toutes les futures mises à jour logicielles de la plateforme conserveront ces paramètres personnalisés.
              </p>
           </div>
        </div>
      </section>

      {/* Section Gestion Equipe */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter">Gestion de l'Équipe</h2>
            <p className="text-xs text-neutral-500">Contrôlez les accès administrateurs et agents.</p>
          </div>
          <button 
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-red-700 hover:bg-red-600 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-900/20 active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> Ajouter un Membre
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {store.users.map(user => (
            <div key={user.id} className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 relative group overflow-hidden hover:border-neutral-700 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-4 rounded-2xl ${user.role === UserRole.ADMIN ? 'bg-red-950/30 text-red-500 border border-red-900/30' : 'bg-neutral-950 text-neutral-500 border border-neutral-800'}`}>
                   {user.role === UserRole.ADMIN ? <Shield className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-black text-neutral-100 uppercase tracking-tighter">{user.name}</h3>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-6 border-t border-neutral-800">
                <button 
                  onClick={() => handleResetPass(user.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-neutral-950 hover:bg-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-neutral-500 hover:text-white border border-neutral-800"
                >
                  <Key className="w-3 h-3" /> Reset Password
                </button>
                {user.id !== store.currentUser?.id && (
                  <button 
                    onClick={() => { if(confirm('Supprimer cet utilisateur ?')) store.deleteUser(user.id) }}
                    className="p-3 bg-neutral-950 border border-neutral-800 hover:bg-red-950 text-neutral-600 hover:text-red-500 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/50">
              <h2 className="text-xl font-black uppercase tracking-tighter">Nouveau Membre</h2>
              <button onClick={() => setShowAdd(false)} className="text-neutral-500 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleAdd} className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Nom Complet</label>
                <input required className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl focus:border-red-600 outline-none text-sm" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Email</label>
                <input required type="email" className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl focus:border-red-600 outline-none text-sm" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Mot de passe initial</label>
                <input required type="text" className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl focus:border-red-600 outline-none text-sm" value={newUserPass} onChange={(e) => setNewUserPass(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Rôle Système</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" 
                    onClick={() => setNewUserRole(UserRole.AGENT)}
                    className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newUserRole === UserRole.AGENT ? 'bg-red-700 border-red-700 text-white shadow-lg shadow-red-900/20' : 'bg-neutral-950 border-neutral-800 text-neutral-500'}`}
                  >Agent</button>
                  <button 
                    type="button" 
                    onClick={() => setNewUserRole(UserRole.ADMIN)}
                    className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newUserRole === UserRole.ADMIN ? 'bg-red-700 border-red-700 text-white shadow-lg shadow-red-900/20' : 'bg-neutral-950 border-neutral-800 text-neutral-500'}`}
                  >Admin</button>
                </div>
              </div>

              <div className="pt-6 space-y-2">
                <button type="submit" className="w-full bg-red-700 hover:bg-red-600 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-red-900/20 active:scale-95">Créer l'accès</button>
                <button type="button" onClick={() => setShowAdd(false)} className="w-full py-2 text-[10px] text-neutral-600 font-bold hover:text-neutral-400 uppercase tracking-widest transition-colors">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
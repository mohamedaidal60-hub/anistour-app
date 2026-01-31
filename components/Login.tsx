import React, { useState } from 'react';
import { User, UserRole } from '../types.ts';
import { Lock, Mail, AlertCircle, ChevronRight, Car } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
  appLogo?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, users, appLogo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Identifiants incorrects. Veuillez réessayer.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-900/20 rounded-full blur-[120px]"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-red-900/20 rounded-full blur-[120px]"></div>

      <div className="max-w-md w-full relative">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-8 space-y-8 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-28 h-28 mx-auto mb-6 relative">
              {appLogo ? (
                <img src={appLogo} alt="Anistour Logo" className="w-full h-full object-contain rounded-2xl shadow-lg border border-neutral-800 bg-neutral-950 p-2" />
              ) : (
                <div className="w-full h-full bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-center">
                  <Car className="w-12 h-12 text-red-600" />
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-red-600 p-1.5 rounded-lg border border-neutral-900">
                <Lock className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-neutral-100 uppercase tracking-tighter">Anistour Fleet</h2>
            <p className="text-neutral-500 mt-2 text-sm">Gestion de Parc Automobile • Algérie</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-200 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Adresse Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none p-4 pl-12 rounded-xl text-sm transition-all text-neutral-100"
                  placeholder="votre.email@anistour.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="password"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none p-4 pl-12 rounded-xl text-sm transition-all text-neutral-100"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full group flex items-center justify-center gap-2 bg-red-700 hover:bg-red-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-red-900/20 transition-all hover:-translate-y-0.5"
            >
              Connexion sécurisée
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="text-center">
            <p className="text-[9px] text-neutral-600 uppercase font-black tracking-widest">
              Système de gestion exclusif Anistour &copy; 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
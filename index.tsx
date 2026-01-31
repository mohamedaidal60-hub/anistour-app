import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-4">
    <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
    <p className="text-neutral-500 font-black uppercase tracking-widest text-[10px]">Chargement des modules Anistour...</p>
  </div>
);

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * RootErrorBoundary handles critical failures in the application tree.
 * Prevents "Minified React error #31" by ensuring only primitives are rendered.
 */
// Fix: Use React.Component to ensure props and state are correctly inherited and typed.
class RootErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.group('%c 🛑 CRASH REACT ', 'background: #dc2626; color: white; font-weight: bold;');
    console.error("Erreur détectée dans l'arbre des composants.");
    console.error("Message:", error.message);
    console.error("Stack:", info.componentStack);
    console.groupEnd();
  }

  render() {
    if (this.state.hasError) {
      // Robust fallback UI that only renders strings to avoid Error #31
      const errorMessage = this.state.error?.message || 'Une erreur inattendue est survenue.';
      
      return (
        <div className="h-screen bg-neutral-950 flex flex-col items-center justify-center p-10 font-sans">
          <div className="max-w-md w-full bg-neutral-900 border border-red-900/50 p-8 rounded-[2rem] text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-600/30">
              <span className="text-2xl" role="img" aria-label="warning">⚠️</span>
            </div>
            <h1 className="text-red-500 text-xl font-black uppercase tracking-tighter mb-4">Interruption du Système</h1>
            <p className="text-neutral-500 text-sm mb-8 leading-relaxed">
              Une erreur critique est survenue dans le noyau de l'application. 
              <br/>
              <span className="text-xs font-mono mt-4 block p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-400 break-words">
                {String(errorMessage)}
              </span>
            </p>
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }} 
              className="w-full py-4 bg-red-700 hover:bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-red-900/20"
            >
              Réinitialiser & Relancer
            </button>
          </div>
        </div>
      );
    }
    // Fix: Access children from props inherited from React.Component
    return this.props.children;
  }
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <RootErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <App />
      </Suspense>
    </RootErrorBoundary>
  );
} else {
  console.error("Erreur fatale: Conteneur #root introuvable.");
}
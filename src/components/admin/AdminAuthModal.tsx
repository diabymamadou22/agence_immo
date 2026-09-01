import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setAdminAuthenticated, closeAdminAuthModal, addToast } from '../../store/uiSlice';
import { 
  Lock, 
  Unlock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  X, 
  Building2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const AdminAuthModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isAdminAuthModalOpen);
  const agencyConfig = useAppSelector((state) => state.agency.config);
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const correctPassword = agencyConfig.adminPassword || '00223';

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError('Veuillez saisir le code d\'accès / mot de passe.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      if (password.trim() === correctPassword) {
        dispatch(setAdminAuthenticated(true));
        dispatch(
          addToast({
            type: 'success',
            message: `Connexion réussie ! Bienvenue dans le Back-Office de ${agencyConfig.name}.`,
          })
        );
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setError('Mot de passe incorrect. Veuillez réessayer.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    }, 200);
  };

  const handleClose = () => {
    dispatch(closeAdminAuthModal());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        className={`relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transition-all transform duration-200 ${
          isShaking ? 'animate-bounce text-rose-600' : ''
        }`}
      >
        {/* Top Decorative Gradient */}
        <div className="h-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 w-full" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-7 sm:p-8 space-y-6">
          {/* Agency Brand & Lock Icon Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border-2 border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 shadow-xs">
              <KeyRound className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Accès Sécurisé Back-Office</span>
              </div>
              <h3 className="text-xl font-black text-slate-950 font-heading">
                {agencyConfig.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Veuillez saisir votre code d'accès administrateur pour gérer les biens, parcelles, baux et finances.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Mot de passe ou Code PIN
              </label>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>

                <input
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Entrez votre mot de passe..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className={`w-full pl-10 pr-11 py-3 text-sm font-semibold bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    error
                      ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/40 text-rose-900'
                      : 'border-slate-300 focus:ring-amber-500 focus:bg-white text-slate-900'
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold mt-1.5 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Confidentiality Notice */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">Accès Restreint & Confidentiel</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Veuillez saisir votre code PIN secret administrateur pour déverrouiller l'espace de gestion.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Vérification...</span>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 text-amber-400" />
                    <span>Déverrouiller le Back-Office</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Annuler / Retour au site public
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

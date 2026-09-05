import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setAdminAuthenticated, closeAdminAuthModal, addToast, setActiveAdminTab } from '../../store/uiSlice';
import { setCurrentUser } from '../../store/usersSlice';
import { ROLES_CONFIG } from '../../utils/rbac';
import { AgencyUser } from '../../types';
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
  Sparkles,
  UserCheck,
  Users
} from 'lucide-react';

export const AdminAuthModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isAdminAuthModalOpen);
  const agencyConfig = useAppSelector((state) => state.agency.config);
  const users = useAppSelector((state) => state.users.items);
  const currentUser = useAppSelector((state) => state.users.currentUser);
  
  const [selectedUser, setSelectedUser] = useState<AgencyUser | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const globalPassword = agencyConfig.adminPassword || '00223';

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      // Default to currentUser if already selected, or the director
      const initial = currentUser || users.find((u) => u.role === 'directeur') || users[0] || null;
      setSelectedUser(initial);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, currentUser, users]);

  if (!isOpen) return null;

  const handleSelectUser = (user: AgencyUser) => {
    setSelectedUser(user);
    setPassword('');
    setError(null);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = password.trim();
    if (!trimmed) {
      setError('Veuillez saisir le code d\'accès ou code PIN.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Check 1: If selectedUser matches PIN
      let matchedUser: AgencyUser | null = null;

      if (selectedUser && (trimmed === selectedUser.pinCode || trimmed === globalPassword)) {
        matchedUser = selectedUser;
      } else {
        // Check 2: Try to match any active user by their PIN
        const foundByPin = users.find((u) => u.pinCode === trimmed && u.status === 'actif');
        if (foundByPin) {
          matchedUser = foundByPin;
        } else if (trimmed === globalPassword) {
          // Fallback to director
          matchedUser = users.find((u) => u.role === 'directeur') || users[0] || null;
        }
      }

      if (matchedUser) {
        if (matchedUser.status === 'inactif') {
          setIsLoading(false);
          setError('Ce compte collaborateur est temporairement désactivé. Veuillez contacter le Directeur.');
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 500);
          return;
        }

        dispatch(setCurrentUser(matchedUser));
        dispatch(setAdminAuthenticated(true));

        // Adjust default tab according to role
        if (matchedUser.role === 'commercial') {
          dispatch(setActiveAdminTab('leads'));
        } else if (matchedUser.role === 'comptable') {
          dispatch(setActiveAdminTab('financials'));
        } else if (matchedUser.role === 'gestionnaire') {
          dispatch(setActiveAdminTab('locations'));
        } else {
          dispatch(setActiveAdminTab('overview'));
        }

        dispatch(
          addToast({
            type: 'success',
            message: `Bienvenue ${matchedUser.name} (${ROLES_CONFIG[matchedUser.role]?.label}) !`,
          })
        );
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setError('Code PIN ou mot de passe incorrect.');
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
        className={`relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transition-all transform duration-200 ${
          isShaking ? 'animate-bounce text-rose-600' : ''
        }`}
      >
        {/* Top Decorative Gradient */}
        <div className="h-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-indigo-600 w-full" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7 space-y-5">
          {/* Agency Brand & Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border-2 border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 shadow-xs">
              <KeyRound className="w-7 h-7" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-extrabold uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Accès Sécurisé Agence • RBAC</span>
              </div>
              <h3 className="text-xl font-black text-slate-950 font-heading">
                {agencyConfig.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sélectionnez votre profil ou entrez votre code PIN personnel pour accéder à votre espace de travail.
              </p>
            </div>
          </div>

          {/* Quick Collaborator Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
              Collaborateur / Rôle Agence :
            </label>
            <div className="grid grid-cols-2 gap-2">
              {users.map((u) => {
                const isSel = selectedUser?.id === u.id;
                const roleConfig = ROLES_CONFIG[u.role];
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-2.5 ${
                      isSel 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-400/50' 
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      isSel ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {u.avatar || u.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black truncate">{u.name.split(' ')[0]}</p>
                      <span className={`text-[9px] font-bold block truncate ${
                        isSel ? 'text-amber-300' : 'text-slate-500'
                      }`}>
                        {roleConfig?.shortLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  {selectedUser ? `Code PIN de ${selectedUser.name}` : 'Code PIN ou Mot de Passe'}
                </label>
                {selectedUser && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Indice démo : PIN {selectedUser.pinCode}
                  </span>
                )}
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>

                <input
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={selectedUser ? `Entrez le PIN de ${selectedUser.name.split(' ')[0]}...` : "Code PIN..."}
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

            {/* Selected User Privileges Note */}
            {selectedUser && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-900">{ROLES_CONFIG[selectedUser.role]?.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {ROLES_CONFIG[selectedUser.role]?.description}
                  </p>
                </div>
              </div>
            )}

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
                    <span>Déverrouiller ({selectedUser ? selectedUser.name.split(' ')[0] : 'Session'})</span>
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


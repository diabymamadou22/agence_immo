import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { AgencyUser, AgencyUserRole } from '../../types';
import { 
  addUser, 
  updateUser, 
  deleteUser, 
  setCurrentUser, 
  setFilterRole 
} from '../../store/usersSlice';
import { addToast, setActiveAdminTab } from '../../store/uiSlice';
import { ROLES_CONFIG, INITIAL_COLLABORATORS } from '../../utils/rbac';
import { firestoreService } from '../../services/firestoreService';
import {
  Users,
  Shield,
  KeyRound,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Briefcase,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  ShieldAlert,
  Search,
  Check,
  Building2,
  Sparkles,
  AlertTriangle,
  Cloud,
  RefreshCw,
  LayoutGrid,
  List,
  RotateCcw,
  BadgeCheck,
  UserCheck
} from 'lucide-react';

export const AdminTeamManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.users.items);
  const currentUser = useAppSelector((state) => state.users.currentUser);
  const filterRole = useAppSelector((state) => state.users.activeFilterRole);

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AgencyUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AgencyUser | null>(null);
  const [isSyncingWithCloud, setIsSyncingWithCloud] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AgencyUserRole>('commercial');
  const [title, setTitle] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [status, setStatus] = useState<'actif' | 'inactif'>('actif');
  const [showPin, setShowPin] = useState(false);

  // Check if current user is director (by default or selected)
  const isDirector = !currentUser || currentUser.role === 'directeur';

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPhone('');
    setRole('commercial');
    setTitle('');
    setPinCode(Math.floor(1000 + Math.random() * 9000).toString());
    setStatus('actif');
    setShowPin(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: AgencyUser) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email || '');
    setPhone(user.phone);
    setRole(user.role);
    setTitle(user.title || '');
    setPinCode(user.pinCode);
    setStatus(user.status);
    setShowPin(false);
    setIsModalOpen(true);
  };

  const handleGeneratePin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPinCode(randomPin);
    setShowPin(true);
    dispatch(addToast({ type: 'info', message: `Nouveau code PIN généré : ${randomPin}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !pinCode.trim()) {
      dispatch(addToast({ type: 'warning', message: 'Veuillez renseigner le nom, le téléphone et le code PIN.' }));
      return;
    }

    if (editingUser) {
      const updated: AgencyUser = {
        ...editingUser,
        name: name.trim(),
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@maliimmoprestige.ml`,
        phone: phone.trim(),
        role,
        title: title.trim() || ROLES_CONFIG[role].shortLabel,
        pinCode: pinCode.trim(),
        status,
      };

      // 1. Update Redux store (middleware triggers automatic firestoreService.saveUser)
      dispatch(updateUser(updated));
      // 2. Direct guarantee push to Cloud Firestore
      await firestoreService.saveUser(updated);

      dispatch(addToast({ 
        type: 'success', 
        message: `Collaborateur ${updated.name} modifié et synchronisé sur Firebase avec succès.` 
      }));
    } else {
      const newUser: AgencyUser = {
        id: `user_${Date.now()}`,
        name: name.trim(),
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@maliimmoprestige.ml`,
        phone: phone.trim(),
        role,
        title: title.trim() || ROLES_CONFIG[role].shortLabel,
        pinCode: pinCode.trim(),
        avatar: name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AG',
        status,
        createdAt: new Date().toISOString(),
      };

      // 1. Add to Redux store (middleware triggers firestoreService.saveUser)
      dispatch(addUser(newUser));
      // 2. Direct guarantee push to Cloud Firestore
      await firestoreService.saveUser(newUser);

      dispatch(addToast({ 
        type: 'success', 
        message: `Nouveau collaborateur ${newUser.name} créé et synchronisé sur Firebase.` 
      }));
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    if (userToDelete.id === currentUser?.id) {
      dispatch(addToast({ type: 'error', message: 'Impossible de supprimer votre propre compte actuellement connecté.' }));
      setUserToDelete(null);
      return;
    }

    const memberName = userToDelete.name;
    const memberId = userToDelete.id;

    try {
      // 1. Remove from Redux store
      dispatch(deleteUser(memberId));
      // 2. Remove directly from Cloud Firestore
      await firestoreService.deleteUser(memberId);

      dispatch(addToast({ 
        type: 'info', 
        message: `Collaborateur ${memberName} supprimé de Firebase et de l'agence.` 
      }));
    } catch (err) {
      console.error('Delete user error:', err);
      dispatch(addToast({ type: 'error', message: `Erreur lors de la suppression de ${memberName}.` }));
    } finally {
      setUserToDelete(null);
    }
  };

  const handleToggleStatus = async (user: AgencyUser) => {
    const newStatus: 'actif' | 'inactif' = user.status === 'actif' ? 'inactif' : 'actif';
    const updated: AgencyUser = {
      ...user,
      status: newStatus,
    };
    dispatch(updateUser(updated));
    await firestoreService.saveUser(updated);
    dispatch(addToast({
      type: 'info',
      message: `Statut de ${user.name} basculé à "${newStatus === 'actif' ? 'Actif' : 'Inactif'}". Synchronisé sur Firebase.`,
    }));
  };

  const handleForceSyncWithFirebase = async () => {
    setIsSyncingWithCloud(true);
    try {
      const res = await firestoreService.syncUsersToCloud(users);
      if (res.success) {
        dispatch(addToast({
          type: 'success',
          message: `Synchronisation Firebase réussie : ${res.count} membres d'équipe enregistrés dans la collection "agency_users".`,
        }));
      } else {
        dispatch(addToast({
          type: 'warning',
          message: res.message || 'La synchronisation vers Firebase a rencontré un problème.',
        }));
      }
    } catch (e: any) {
      dispatch(addToast({
        type: 'error',
        message: e?.message || 'Erreur de connexion avec Firebase.',
      }));
    } finally {
      setIsSyncingWithCloud(false);
    }
  };

  const handleResetInitialTeam = async () => {
    if (window.confirm('Voulez-vous restaurer l\'équipe par défaut de Mali Immo Prestige ? Les modifications locales seront réinitialisées.')) {
      setIsSyncingWithCloud(true);
      try {
        const res = await firestoreService.syncUsersToCloud(INITIAL_COLLABORATORS);
        // Note: middleware will avoid loop if type is users/set
        dispatch({ type: 'users/setUsers', payload: INITIAL_COLLABORATORS });
        dispatch(addToast({
          type: 'success',
          message: `Équipe par défaut restaurée (${res.count} membres) et synchronisée sur Firebase.`,
        }));
      } catch (err: any) {
        dispatch(addToast({ type: 'error', message: 'Erreur lors de la réinitialisation.' }));
      } finally {
        setIsSyncingWithCloud(false);
      }
    }
  };

  const handleSimulateLogin = (user: AgencyUser) => {
    dispatch(setCurrentUser(user));
    dispatch(addToast({
      type: 'success',
      message: `Session active : ${user.name} (${ROLES_CONFIG[user.role].label}).`,
    }));
    // Redirect to allowed view if current tab is forbidden for this role
    if (user.role === 'commercial') {
      dispatch(setActiveAdminTab('leads'));
    } else if (user.role === 'comptable') {
      dispatch(setActiveAdminTab('financials'));
    } else if (user.role === 'gestionnaire') {
      dispatch(setActiveAdminTab('locations'));
    }
  };

  const handleSwitchBackToDirector = () => {
    const director = users.find((u) => u.role === 'directeur') || INITIAL_COLLABORATORS[0];
    dispatch(setCurrentUser(director));
    dispatch(addToast({
      type: 'success',
      message: `Session Directeur rétablie (${director.name}). Droits complets déverrouillés.`,
    }));
  };

  const filteredUsers = users.filter((u) => {
    const matchesFilter = filterRole === 'all' || u.role === filterRole;
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.title && u.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const activeCount = users.filter((u) => u.status === 'actif').length;
  const directorsCount = users.filter((u) => u.role === 'directeur').length;
  const commercialsCount = users.filter((u) => u.role === 'commercial').length;
  const comptablesCount = users.filter((u) => u.role === 'comptable').length;
  const gestionnairesCount = users.filter((u) => u.role === 'gestionnaire').length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Firebase Live Sync Badge */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              <span>Contrôle d'Accès RBAC & Équipe</span>
            </div>

            {/* Live Firebase Sync Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Firebase Firestore Sync Actif</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
            Gestion de l'Équipe, Rôles & Accès
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Configurez vos collaborateurs, assignez leurs rôles avec cloisonnement strict (marges masquées aux commerciaux et bilans financiers réservés au comptable/directeur). Toutes les modifications et suppressions sont instantanément synchronisées sur Firebase.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleForceSyncWithFirebase}
            disabled={isSyncingWithCloud}
            className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            title="Forcer la synchronisation de tous les collaborateurs vers Firebase"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isSyncingWithCloud ? 'animate-spin' : ''}`} />
            <span>{isSyncingWithCloud ? 'Synchronisation...' : 'Synchroniser Firebase'}</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Ajouter Collaborateur</span>
          </button>
        </div>
      </div>

      {/* Non-Director Warning Banner with Quick Switch Button */}
      {!isDirector && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-amber-950">
                Vous naviguez actuellement avec le rôle <span className="underline">{ROLES_CONFIG[currentUser?.role || 'commercial'].label}</span>
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                Pour modifier ou supprimer les collaborateurs d'équipe, activez le profil Directeur Général.
              </p>
            </div>
          </div>
          <button
            onClick={handleSwitchBackToDirector}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
          >
            <Shield className="w-4 h-4" />
            <span>Activer Mode Directeur</span>
          </button>
        </div>
      )}

      {/* Current Active Session Card & Quick Switcher */}
      {currentUser && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-base border border-slate-800 shadow-xs shrink-0">
              {currentUser.avatar || currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base text-slate-900">{currentUser.name}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${ROLES_CONFIG[currentUser.role]?.badgeClass}`}>
                  {ROLES_CONFIG[currentUser.role]?.shortLabel}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connecté
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Poste : <strong className="text-slate-700">{currentUser.title || ROLES_CONFIG[currentUser.role]?.label}</strong> • Code PIN : <span className="font-mono font-bold text-slate-800">••••</span> • Tél : <span className="font-mono text-slate-700">{currentUser.phone}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            <span className="text-xs font-bold text-slate-500">Tester un autre compte :</span>
            <div className="flex flex-wrap gap-1.5">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSimulateLogin(u)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    currentUser.id === u.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title={`Tester la vue de ${u.name} (${ROLES_CONFIG[u.role].label})`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{u.name.split(' ')[0]}</span>
                  <span className="text-[10px] opacity-75 font-normal">({ROLES_CONFIG[u.role].shortLabel})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Équipe</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-slate-900 font-heading">{users.length}</span>
            <span className="text-[11px] text-slate-500">membres</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Actifs</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-emerald-700 font-heading">{activeCount}</span>
            <span className="text-[11px] text-emerald-600">/ {users.length}</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Directeurs</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-amber-700 font-heading">{directorsCount}</span>
            <span className="text-[11px] text-amber-600">admin</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Comptables</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-emerald-700 font-heading">{comptablesCount}</span>
            <span className="text-[11px] text-emerald-600">trésoriers</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Commerciaux</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-blue-700 font-heading">{commercialsCount}</span>
            <span className="text-[11px] text-blue-600">terrain</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Gestionnaires</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-indigo-700 font-heading">{gestionnairesCount}</span>
            <span className="text-[11px] text-indigo-600">locatif</span>
          </div>
        </div>
      </div>

      {/* RBAC Matrix Cards */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0" />
            <h3 className="font-black text-sm text-slate-900 font-heading uppercase tracking-wider">
              Cloisonnement des Rôles & Confidentialité Agence
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Règles d'accès appliquées en temps réel
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(['directeur', 'comptable', 'commercial', 'gestionnaire'] as AgencyUserRole[]).map((r) => {
            const cfg = ROLES_CONFIG[r];
            return (
              <div key={r} className={`p-4 rounded-2xl bg-white border-2 ${cfg.borderClass} shadow-2xs space-y-2.5`}>
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${cfg.badgeClass}`}>
                    {cfg.shortLabel}
                  </span>
                  {cfg.canViewGlobalMargins ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      Marges Affichées
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                      Marges Masquées
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed min-h-[3.25rem]">
                  {cfg.description}
                </p>

                <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1.5 text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Bilans Financiers :</span>
                    <span className={`font-black ${cfg.canViewFinancialStatements ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {cfg.canViewFinancialStatements ? 'Oui' : 'Masqué'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Visites & Mandats :</span>
                    <span className="font-black text-slate-800">
                      {cfg.canManageLeadsAndVisits ? 'Autorisé' : 'Lecture'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Équipe & Rôles :</span>
                    <span className={`font-black ${cfg.canManageTeam ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {cfg.canManageTeam ? 'Admin (Modif/Suppr)' : 'Non'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter, Search & View Mode Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher nom, téléphone, email, poste..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Role Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {(['all', 'directeur', 'comptable', 'commercial', 'gestionnaire'] as const).map((r) => (
            <button
              key={r}
              onClick={() => dispatch(setFilterRole(r))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                filterRole === r
                  ? 'bg-slate-900 text-white shadow-xs font-extrabold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {r === 'all' ? 'Tous les Rôles' : ROLES_CONFIG[r].shortLabel}
            </button>
          ))}
        </div>

        {/* View Toggle (Cards vs Table) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-end md:self-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Vue Tableau"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Vue Cartes"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notice on Firebase synchronization */}
      <div className="px-4 py-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong>Synchronisation temps réel :</strong> Tout collaborateur ajouté, modifié ou supprimé est répercuté instantanément dans Cloud Firestore (collection <code className="font-mono bg-indigo-100 px-1 py-0.5 rounded text-[11px]">agency_users</code>).
          </span>
        </div>
        <button
          onClick={handleResetInitialTeam}
          className="text-indigo-600 hover:text-indigo-800 font-bold underline text-[11px] shrink-0 cursor-pointer"
        >
          Restaurer équipe initiale
        </button>
      </div>

      {/* COLLABORATORS LIST: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Collaborateur</th>
                  <th className="py-3.5 px-4">Rôle & Droits RBAC</th>
                  <th className="py-3.5 px-4">Coordonnées</th>
                  <th className="py-3.5 px-4">Code PIN d'Accès</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      Aucun collaborateur ne correspond à ces critères.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const roleConfig = ROLES_CONFIG[user.role];
                    const isCurrent = currentUser?.id === user.id;
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Name & Avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {user.avatar || user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {isCurrent && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[9px] font-black border border-amber-300">
                                    Vous
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 font-medium">{user.title || roleConfig.shortLabel}</span>
                            </div>
                          </div>
                        </td>

                        {/* Role & Access */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block ${roleConfig.badgeClass}`}>
                              {roleConfig.label}
                            </span>
                            <p className="text-[10px] text-slate-500">
                              {roleConfig.canViewGlobalMargins ? '• Marges nettes affichées' : '• Marges nettes masquées'}
                            </p>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-800 font-bold">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{user.phone}</span>
                            </div>
                            {user.email && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-[180px]">{user.email}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* PIN Code */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                            <span>{user.pinCode}</span>
                          </div>
                        </td>

                        {/* Status with Quick Toggle */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className="group flex items-center gap-1.5 cursor-pointer text-left"
                            title="Cliquer pour basculer Actif / Inactif"
                          >
                            {user.status === 'actif' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px] bg-emerald-50 group-hover:bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 transition-colors">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Actif</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px] bg-rose-50 group-hover:bg-rose-100 px-2.5 py-1 rounded-full border border-rose-200 transition-colors">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Inactif</span>
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Switch Session Button */}
                            <button
                              onClick={() => handleSimulateLogin(user)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition-colors cursor-pointer border border-slate-200 flex items-center gap-1"
                              title={`Basculer la session sur ${user.name}`}
                            >
                              <ArrowRight className="w-3 h-3 text-slate-500" />
                              <span className="hidden xl:inline">Tester</span>
                            </button>

                            {/* EDIT BUTTON */}
                            <button
                              onClick={() => handleOpenEditModal(user)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              title={`Modifier les informations et le rôle de ${user.name}`}
                            >
                              <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                              <span>Modifier</span>
                            </button>

                            {/* DELETE BUTTON */}
                            {user.id !== currentUser?.id ? (
                              <button
                                onClick={() => setUserToDelete(user)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                title={`Supprimer définitivement ${user.name} de l'équipe et de Firebase`}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Supprimer</span>
                              </button>
                            ) : (
                              <span
                                className="px-2 py-1.5 text-[10px] text-slate-400 font-semibold italic cursor-not-allowed"
                                title="Vous ne pouvez pas supprimer votre propre session"
                              >
                                Connecté
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COLLABORATORS LIST: CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Aucun collaborateur ne correspond à ces critères.
            </div>
          ) : (
            filteredUsers.map((user) => {
              const roleConfig = ROLES_CONFIG[user.role];
              const isCurrent = currentUser?.id === user.id;

              return (
                <div
                  key={user.id}
                  className={`bg-white rounded-2xl p-5 border-2 ${
                    isCurrent ? 'border-amber-400 shadow-md' : 'border-slate-200 shadow-2xs'
                  } space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                        {user.avatar || user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-sm text-slate-900">{user.name}</h4>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[9px] font-black border border-amber-300">
                              Vous
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {user.title || roleConfig.shortLabel}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(user)}
                      className="cursor-pointer shrink-0"
                      title="Changer statut"
                    >
                      {user.status === 'actif' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Actif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Inactif</span>
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Role Badge */}
                  <div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block ${roleConfig.badgeClass}`}>
                      {roleConfig.label}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {roleConfig.canViewGlobalMargins ? 'Marges financières visibles' : 'Marges financières masquées'}
                    </p>
                  </div>

                  {/* Contact & PIN details */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Téléphone :</span>
                      <span className="font-mono font-bold text-slate-900">{user.phone}</span>
                    </div>
                    {user.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Email :</span>
                        <span className="truncate max-w-[170px] text-slate-800">{user.email}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500">Code PIN :</span>
                      <span className="inline-flex items-center gap-1 font-mono font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <KeyRound className="w-3 h-3" />
                        {user.pinCode}
                      </span>
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleSimulateLogin(user)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer border border-slate-200 flex items-center gap-1"
                      title="Tester cette session"
                    >
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span>Tester</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* MODIFIER */}
                      <button
                        onClick={() => handleOpenEditModal(user)}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs border border-amber-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                        <span>Modifier</span>
                      </button>

                      {/* SUPPRIMER */}
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => setUserToDelete(user)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Supprimer</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ================= MODAL: AJOUTER / MODIFIER COLLABORATEUR ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  {editingUser ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white font-heading">
                    {editingUser ? `Modifier ${editingUser.name}` : 'Nouveau Collaborateur Agence'}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Cloud className="w-3 h-3 text-emerald-400" />
                    <span>Synchronisé directement sur Firebase Firestore</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Nom Complet & Prénom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Oumar Sangaré"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Téléphone Mobile *</label>
                  <input
                    type="text"
                    required
                    placeholder="+223 76 00 00 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Adresse Email</label>
                  <input
                    type="email"
                    placeholder="collaborateur@maliimmoprestige.ml"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Titre ou Poste Officiel</label>
                  <input
                    type="text"
                    placeholder="Ex: Agent Commercial & Négociateur Foncier"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* ROLE SELECTION */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Rôle & Niveau d'Autorisation (RBAC) *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as AgencyUserRole)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="directeur">Directeur d'Agence (Tous droits + Marges nettes globales)</option>
                    <option value="comptable">Comptable & Trésorier (Finances, Recouvrement, Quittances)</option>
                    <option value="commercial">Agent Commercial Terrain (Visites, Parcelles, Mandats - Marges MASQUÉES)</option>
                    <option value="gestionnaire">Gestionnaire Locatif (Locataires, Baux, Quittances - Marges MASQUÉES)</option>
                  </select>
                </div>

                {/* PIN CODE INPUT + GENERATE BUTTON */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Code PIN de Connexion *</label>
                    <button
                      type="button"
                      onClick={handleGeneratePin}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                    >
                      Générer
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      required
                      placeholder="Ex: 5678"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 block">Code PIN à 4 ou 5 chiffres pour le déverrouillage</span>
                </div>

                {/* STATUT */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Statut du Compte</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'actif' | 'inactif')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="actif">Actif (Accès autorisé)</option>
                    <option value="inactif">Inactif (Accès suspendu)</option>
                  </select>
                </div>
              </div>

              {/* Role summary alert */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block">{ROLES_CONFIG[role].label}</span>
                  <span className="text-[11px] text-amber-800/90 leading-relaxed block mt-0.5">
                    {ROLES_CONFIG[role].description}
                  </span>
                  <div className="mt-2 text-[10px] font-bold text-amber-900 flex items-center gap-2">
                    <span>Marges : {ROLES_CONFIG[role].canViewGlobalMargins ? 'Visibles' : 'Masquées'}</span>
                    <span>•</span>
                    <span>Bilans : {ROLES_CONFIG[role].canViewFinancialStatements ? 'Autorisé' : 'Masqué'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{editingUser ? 'Enregistrer & Synchroniser' : 'Créer & Synchroniser sur Firebase'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRMATION DE SUPPRESSION ================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden">
            <div className="bg-rose-600 text-white p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white font-heading">
                    Supprimer ce Collaborateur ?
                  </h3>
                  <p className="text-xs text-rose-100">
                    Cette action sera synchronisée sur Firebase Firestore
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Member preview */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                  {userToDelete.avatar || userToDelete.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{userToDelete.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">{userToDelete.title || ROLES_CONFIG[userToDelete.role]?.shortLabel}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider ${ROLES_CONFIG[userToDelete.role]?.badgeClass}`}>
                      {ROLES_CONFIG[userToDelete.role]?.shortLabel}
                    </span>
                    <span className="font-mono text-xs text-slate-600">{userToDelete.phone}</span>
                  </div>
                </div>
              </div>

              {/* Warning box */}
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                <p className="font-bold">⚠️ Attention : Suppression définitive</p>
                <p className="text-rose-800 text-[11px] leading-relaxed">
                  Le compte de <strong>{userToDelete.name}</strong> sera retiré de l'application et supprimé du document Cloud Firestore correspondant dans la collection <code className="font-mono bg-rose-100 px-1 py-0.5 rounded text-[10px]">agency_users/{userToDelete.id}</code>.
                </p>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirmer la Suppression</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

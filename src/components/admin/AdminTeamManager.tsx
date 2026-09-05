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
import { ROLES_CONFIG } from '../../utils/rbac';
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
  AlertTriangle
} from 'lucide-react';

export const AdminTeamManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.users.items);
  const currentUser = useAppSelector((state) => state.users.currentUser);
  const filterRole = useAppSelector((state) => state.users.activeFilterRole);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AgencyUser | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AgencyUserRole>('commercial');
  const [title, setTitle] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [status, setStatus] = useState<'actif' | 'inactif'>('actif');
  const [showPin, setShowPin] = useState(false);

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
    setEmail(user.email);
    setPhone(user.phone);
    setRole(user.role);
    setTitle(user.title || '');
    setPinCode(user.pinCode);
    setStatus(user.status);
    setShowPin(false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !pinCode.trim()) {
      dispatch(addToast({ type: 'warning', message: 'Veuillez renseigner au moins le nom, le téléphone et le code PIN.' }));
      return;
    }

    if (editingUser) {
      const updated: AgencyUser = {
        ...editingUser,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        title: title.trim() || undefined,
        pinCode: pinCode.trim(),
        status,
      };
      dispatch(updateUser(updated));
      dispatch(addToast({ type: 'success', message: `Collaborateur ${updated.name} mis à jour avec succès.` }));
    } else {
      const newUser: AgencyUser = {
        id: `user_${Date.now()}`,
        name: name.trim(),
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@maliimmoprestige.ml`,
        phone: phone.trim(),
        role,
        title: title.trim() || ROLES_CONFIG[role].shortLabel,
        pinCode: pinCode.trim(),
        avatar: name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        status,
        createdAt: new Date().toISOString(),
      };
      dispatch(addUser(newUser));
      dispatch(addToast({ type: 'success', message: `Nouveau collaborateur ${newUser.name} créé (${ROLES_CONFIG[role].label}).` }));
    }

    setIsModalOpen(false);
  };

  const handleDelete = (user: AgencyUser) => {
    if (user.id === currentUser?.id) {
      dispatch(addToast({ type: 'error', message: 'Vous ne pouvez pas supprimer votre propre compte actuellement connecté.' }));
      return;
    }
    if (window.confirm(`Confirmez-vous la suppression du compte de ${user.name} ?`)) {
      dispatch(deleteUser(user.id));
      dispatch(addToast({ type: 'info', message: `Compte de ${user.name} supprimé.` }));
    }
  };

  const handleSimulateLogin = (user: AgencyUser) => {
    dispatch(setCurrentUser(user));
    dispatch(addToast({
      type: 'success',
      message: `Session active : ${user.name} (${ROLES_CONFIG[user.role].label}). Les permissions RBAC s'appliquent immédiatement.`,
    }));
    // Redirect to allowed view if current tab is forbidden
    if (user.role === 'commercial') {
      dispatch(setActiveAdminTab('leads'));
    } else if (user.role === 'comptable') {
      dispatch(setActiveAdminTab('financials'));
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesFilter = filterRole === 'all' || u.role === filterRole;
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.title && u.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            <span>Sécurité & Contrôle d'Accès (RBAC)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
            Gestion de l'Équipe & Rôles Agence
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Attribuez des profils stricts pour sécuriser l'agence : masquez automatiquement les marges globales et les bilans financiers aux commerciaux terrain tout en leur déléguant la gestion des visites, mandats et parcelles.
          </p>
        </div>

        {isDirector && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Ajouter un Collaborateur</span>
          </button>
        )}
      </div>

      {/* Active Session Indicator */}
      {currentUser && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-sm border border-slate-800 shadow-xs">
              {currentUser.avatar || currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">{currentUser.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${ROLES_CONFIG[currentUser.role]?.badgeClass}`}>
                  {ROLES_CONFIG[currentUser.role]?.shortLabel}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs text-slate-500">
                Session active : {currentUser.title || ROLES_CONFIG[currentUser.role]?.label} • Code PIN : ••••
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden md:inline">Simuler un autre rôle :</span>
            <div className="flex flex-wrap gap-1">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSimulateLogin(u)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    currentUser.id === u.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title={`Basculer immédiatement sur ${u.name} (${ROLES_CONFIG[u.role].label})`}
                >
                  {u.name.split(' ')[0]} ({ROLES_CONFIG[u.role].shortLabel})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Permissions Matrix Overview Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <h3 className="font-black text-sm text-slate-900 font-heading uppercase tracking-wider">
              Matrice de Confidentialité & Cloisonnement RBAC
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">En vigueur sur l'application</span>
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
                      Marges Visibles
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                      Marges Masquées
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed min-h-[3.5rem]">
                  {cfg.description}
                </p>

                <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1 text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Bilans financiers :</span>
                    <span className="font-black">{cfg.canViewFinancialStatements ? 'Oui' : 'Non (Masqué)'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Visites & Mandats :</span>
                    <span className="font-black">{cfg.canManageLeadsAndVisits ? 'Autorisé' : 'Lecture'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Gestion équipe RBAC :</span>
                    <span className="font-black">{cfg.canManageTeam ? 'Autorisé' : 'Non'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher collaborateur, téléphone, rôle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
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
      </div>

      {/* Collaborators List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider">
                <th className="py-3 px-4">Collaborateur</th>
                <th className="py-3 px-4">Rôle & Périmètre</th>
                <th className="py-3 px-4">Coordonnées</th>
                <th className="py-3 px-4">Code PIN d'Accès</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
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
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
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
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block ${roleConfig.badgeClass}`}>
                          {roleConfig.label}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 text-slate-600">
                        <div className="space-y-0.5">
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
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 font-mono font-black text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          <span>{user.pinCode}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {user.status === 'actif' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Actif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            <span>Inactif</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSimulateLogin(user)}
                            className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] transition-colors cursor-pointer border border-amber-500 flex items-center gap-1 shadow-2xs"
                            title={`Basculer la session sur ${user.name}`}
                          >
                            <ArrowRight className="w-3 h-3" />
                            <span className="hidden sm:inline">Tester vue</span>
                          </button>

                          {isDirector && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(user)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Modifier ce collaborateur"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {user.id !== currentUser?.id && (
                                <button
                                  onClick={() => handleDelete(user)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Supprimer ce collaborateur"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
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

      {/* Add / Edit Collaborator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white font-heading">
                    {editingUser ? 'Modifier le Collaborateur' : 'Nouveau Collaborateur Agence'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configuration des accès, du rôle RBAC et du code PIN
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Code PIN de Connexion *</label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      required
                      placeholder="Ex: 5678"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400">Code saisi à l'écran de verrouillage</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Statut du Compte</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'actif' | 'inactif')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="actif">Actif (Accès autorisé)</option>
                    <option value="inactif">Inactif (Accès bloqué)</option>
                  </select>
                </div>
              </div>

              {/* Role summary alert */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">{ROLES_CONFIG[role].label}</span>
                  <span className="text-[11px] text-amber-800/90">{ROLES_CONFIG[role].description}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  {editingUser ? 'Enregistrer les Modifications' : 'Créer le Collaborateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

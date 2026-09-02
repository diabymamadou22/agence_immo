import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { addContract, updateContract, deleteContract } from '../../store/contractsSlice';
import { openContractPrintModal, addToast } from '../../store/uiSlice';
import { firestoreService } from '../../services/firestoreService';
import { formatFCFA, formatDate } from '../../utils/formatters';
import { LegalContract, ContractType } from '../../types';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { 
  FileText, 
  Plus, 
  Printer, 
  Share2, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Edit3, 
  Eye, 
  Search, 
  ShieldCheck,
  Building,
  UserCheck,
  FileSpreadsheet
} from 'lucide-react';

export const AdminContractGenerator: React.FC = () => {
  const dispatch = useAppDispatch();
  const contracts = useAppSelector((state) => state.contracts.items);
  const properties = useAppSelector((state) => state.properties.items);
  const tenants = useAppSelector((state) => state.tenants.items);
  const owners = useAppSelector((state) => state.owners.items);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<LegalContract | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDeleteContract = async () => {
    if (!contractToDelete) return;
    setIsDeleting(true);
    try {
      dispatch(deleteContract(contractToDelete.id));
      await firestoreService.deleteContract(contractToDelete.id);
      dispatch(addToast({ type: 'info', message: `Acte juridique ${contractToDelete.reference} supprimé avec succès.` }));
      setContractToDelete(null);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'acte juridique:", error);
      dispatch(addToast({ type: 'error', message: "Erreur lors de la suppression de l'acte juridique." }));
    } finally {
      setIsDeleting(false);
    }
  };

  // New Contract Form State
  const [formData, setFormData] = useState<{
    contractType: ContractType;
    title: string;
    propertyId: string;
    partyAName: string;
    partyAPhone: string;
    partyBName: string;
    partyBPhone: string;
    amountFCFA: number;
    depositFCFA: number;
    startDate: string;
    endDate: string;
    clausesText: string;
  }>({
    contractType: 'bail_habitation',
    title: '',
    propertyId: properties[0]?.id || '',
    partyAName: owners[0]?.name || agencyConfig.name,
    partyAPhone: owners[0]?.phone || agencyConfig.phone,
    partyBName: tenants[0]?.name || '',
    partyBPhone: tenants[0]?.phone || '',
    amountFCFA: properties[0]?.price || 500000,
    depositFCFA: 1000000,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    clausesText: '',
  });

  const getContractTypeBadge = (type: ContractType) => {
    switch (type) {
      case 'bail_habitation':
        return { label: 'Bail Habitation', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'bail_commercial':
        return { label: 'Bail Commercial OHADA', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'mandat_vente':
        return { label: 'Mandat de Vente', color: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'mandat_gestion':
        return { label: 'Mandat de Gestion', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
      case 'bon_visite':
        return { label: 'Bon de Visite', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'compromis_vente':
        return { label: 'Compromis Vente TF', color: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'etat_des_lieux':
        return { label: 'État des Lieux', color: 'bg-teal-100 text-teal-800 border-teal-300' };
      default:
        return { label: type, color: 'bg-slate-100 text-slate-800' };
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    const prop = properties.find((p) => p.id === propertyId);
    if (prop) {
      setFormData((prev) => ({
        ...prev,
        propertyId,
        amountFCFA: prop.price,
        depositFCFA: prop.dealType === 'location' ? prop.price * 2 : 0,
        title: `${prev.contractType === 'bail_habitation' ? 'Contrat de Bail' : 'Mandat'} - ${prop.title}`,
      }));
    }
  };

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    const prop = properties.find((p) => p.id === formData.propertyId);
    const count = contracts.length + 1;
    const year = new Date().getFullYear();
    const prefix = formData.contractType.toUpperCase().slice(0, 4);
    const ref = `${prefix}-${year}-ML-${String(count).padStart(3, '0')}`;

    const defaultClauses = [
      `Montant contractuel convenu de ${formatFCFA(formData.amountFCFA)}.`,
      'Les parties s\'engagent à respecter les termes stricts du présent acte selon le droit malien.',
      'En cas de litige, compétence expresse est attribuée au Tribunal de Grande Instance de Bamako.',
    ];

    const clauses = formData.clausesText
      ? formData.clausesText.split('\n').filter((l) => l.trim().length > 0)
      : defaultClauses;

    const contractId = `cnt-${Date.now()}`;
    const completeContract: LegalContract = {
      id: contractId,
      contractType: formData.contractType,
      reference: ref,
      title: formData.title || `${getContractTypeBadge(formData.contractType).label} - ${prop?.title || 'Bien Immobilier'}`,
      propertyId: formData.propertyId,
      propertyTitle: prop?.title || 'Bien non spécifié',
      partyAName: formData.partyAName,
      partyAPhone: formData.partyAPhone,
      partyBName: formData.partyBName,
      partyBPhone: formData.partyBPhone,
      amountFCFA: formData.amountFCFA,
      depositFCFA: formData.depositFCFA,
      startDate: formData.startDate,
      endDate: formData.endDate,
      clauses,
      status: 'actif',
      createdAt: new Date().toISOString(),
    };

    dispatch(addContract(completeContract));
    firestoreService.saveContract(completeContract);
    setIsCreating(false);
    dispatch(
      addToast({
        type: 'success',
        message: `Contrat officiel ${ref} généré avec succès ! Vous pouvez l'imprimer ou l'exporter.`,
      })
    );
  };

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.partyAName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.partyBName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedTypeFilter === 'all' || c.contractType === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 uppercase tracking-wider">
              Département Juridique & Actes
            </span>
            <span className="text-xs text-slate-400">Conforme Droit Foncier Malien & OHADA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
            Générateur de Contrats & Mandats Officiels
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Édition et impression instantanées de baux d'habitation, baux commerciaux, mandats de vente de parcelles TF, compromis de vente et bons de visite avec le cachet certifié de votre agence.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Fermer le formulaire' : 'Rédiger un Nouveau Contrat'}</span>
        </button>
      </div>

      {/* Contract Creation Form */}
      {isCreating && (
        <form onSubmit={handleCreateContract} className="bg-white rounded-2xl p-6 sm:p-8 border border-amber-300 shadow-md space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-lg text-slate-900 font-heading flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              <span>Génération d'un Acte Juridique Immobilière</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Les données de l'agence sont injectées automatiquement</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Type de Document *
              </label>
              <select
                value={formData.contractType}
                onChange={(e) => setFormData({ ...formData, contractType: e.target.value as ContractType })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-bold"
              >
                <option value="bail_habitation">Contrat de Bail d'Habitation (Mali)</option>
                <option value="bail_commercial">Contrat de Bail Commercial (OHADA)</option>
                <option value="mandat_vente">Mandat Exclusif de Vente de Parcelle/Villa</option>
                <option value="mandat_gestion">Mandat de Gestion Locative</option>
                <option value="bon_visite">Bon de Visite Terrain & Engagement</option>
                <option value="compromis_vente">Compromis de Vente sous Clause TF</option>
                <option value="etat_des_lieux">État des Lieux d'Entrée / Remise de Clés</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Bien Immobilier Associé *
              </label>
              <select
                value={formData.propertyId}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.reference}] {p.title} ({formatFCFA(p.price)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Titre de l'Acte
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Bail d'habitation Villa ACI 2000"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Partie A (Bailleur / Vendeur / Mandant) *
              </label>
              <input
                type="text"
                value={formData.partyAName}
                onChange={(e) => setFormData({ ...formData, partyAName: e.target.value })}
                required
                placeholder="Nom complet du propriétaire ou bailleur"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Téléphone Partie A
              </label>
              <input
                type="text"
                value={formData.partyAPhone}
                onChange={(e) => setFormData({ ...formData, partyAPhone: e.target.value })}
                placeholder="+223 76 ..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Montant Principal (FCFA) *
              </label>
              <input
                type="number"
                value={formData.amountFCFA}
                onChange={(e) => setFormData({ ...formData, amountFCFA: parseFloat(e.target.value) || 0 })}
                required
                placeholder="Montant du loyer ou prix de vente"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Partie B (Locataire / Acquéreur / Agence) *
              </label>
              <input
                type="text"
                value={formData.partyBName}
                onChange={(e) => setFormData({ ...formData, partyBName: e.target.value })}
                required
                placeholder="Nom complet du locataire ou acquéreur"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Téléphone Partie B
              </label>
              <input
                type="text"
                value={formData.partyBPhone}
                onChange={(e) => setFormData({ ...formData, partyBPhone: e.target.value })}
                placeholder="+223 66 ..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Caution / Dépôt de Garantie (FCFA)
              </label>
              <input
                type="number"
                value={formData.depositFCFA}
                onChange={(e) => setFormData({ ...formData, depositFCFA: parseFloat(e.target.value) || 0 })}
                placeholder="Caution en FCFA"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Date de Prise d'Effet *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Date d'Échéance / Fin de Validité
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
              Clauses Particulières & Conditions Spécifiques (1 par ligne)
            </label>
            <textarea
              rows={3}
              value={formData.clausesText}
              onChange={(e) => setFormData({ ...formData, clausesText: e.target.value })}
              placeholder="Ex: Le locataire prendra en charge les frais de vidange et d'entretien du groupe électrogène.&#10;Paiement exigible le 5 du mois au plus tard."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Générer l'Acte & Enregistrer</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher référence, bailleur, locataire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-xs font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Tous les actes' },
            { id: 'bail_habitation', label: 'Baux Habitation' },
            { id: 'bail_commercial', label: 'Baux Commerciaux' },
            { id: 'mandat_vente', label: 'Mandats de Vente' },
            { id: 'bon_visite', label: 'Bons de Visite' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedTypeFilter(type.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedTypeFilter === type.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContracts.map((contract) => {
          const typeBadge = getContractTypeBadge(contract.contractType);
          return (
            <div
              key={contract.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${typeBadge.color}`}>
                    {typeBadge.label}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 font-bold">
                    {contract.reference}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1">
                    {contract.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    📌 {contract.propertyTitle}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500 font-medium">Bailleur / Mandant :</span>
                    <span className="font-bold">{contract.partyAName}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500 font-medium">Preneur / Acquéreur :</span>
                    <span className="font-bold">{contract.partyBName}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-900 pt-1 border-t border-slate-200 font-bold">
                    <span>Montant :</span>
                    <span className="text-emerald-700 font-extrabold font-heading">
                      {formatFCFA(contract.amountFCFA)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Prise d'effet : {formatDate(contract.startDate)}</span>
                  {contract.endDate && <span>Fin : {formatDate(contract.endDate)}</span>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => dispatch(openContractPrintModal(contract))}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Imprimer / PDF</span>
                </button>

                <button
                  onClick={() => {
                    const text = `Document Officiel ${agencyConfig.name}\nRéférence : ${contract.reference}\n${contract.title}\nMontant : ${formatFCFA(contract.amountFCFA)}\nParties : ${contract.partyAName} & ${contract.partyBName}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="Partager le résumé sur WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setContractToDelete(contract)}
                  className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 transition-colors cursor-pointer"
                  title="Supprimer définitivement cet acte"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Legal Contracts & Mandates Deletion */}
      <ConfirmDeleteModal
        isOpen={!!contractToDelete}
        title="Supprimer l'acte juridique / mandat"
        message="Êtes-vous sûr de vouloir supprimer définitivement cet acte juridique ou mandat ? Cette action supprimera la convention légale de la base de données de l'agence."
        itemName={contractToDelete ? `${contractToDelete.reference} - ${contractToDelete.title}` : ''}
        itemType="Contrat / Mandat Notarié"
        details={
          contractToDelete
            ? [
                { label: 'Référence Acte', value: contractToDelete.reference },
                { label: 'Intitulé de la convention', value: contractToDelete.title },
                { label: 'Partie A (Bailleur / Vendeur / Mandant)', value: contractToDelete.partyAName },
                { label: 'Partie B (Preneur / Acquéreur / Mandataire)', value: contractToDelete.partyBName },
                { label: 'Montant de transaction', value: formatFCFA(contractToDelete.amountFCFA) },
                { label: 'Période / Date de début', value: formatDate(contractToDelete.startDate) },
              ]
            : []
        }
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteContract}
        onCancel={() => setContractToDelete(null)}
      />
    </div>
  );
};

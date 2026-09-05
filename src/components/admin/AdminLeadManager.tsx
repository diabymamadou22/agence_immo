import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { updateLeadStatus, updateLeadVisit, deleteLead } from '../../store/leadsSlice';
import { addToast } from '../../store/uiSlice';
import { firestoreService } from '../../services/firestoreService';
import { Lead, LeadStatus } from '../../types';
import { formatDate } from '../../utils/formatters';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  MessageCircle, 
  CheckCircle2, 
  Trash2, 
  Filter, 
  Search,
  MapPin,
  FileCheck
} from 'lucide-react';

export const AdminLeadManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const leads = useAppSelector((state) => state.leads.items);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  const filteredLeads = leads.filter((lead) => {
    if (filterStatus !== 'all' && lead.status !== filterStatus) return false;
    if (filterType !== 'all' && lead.leadType !== filterType) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchesName = lead.clientName?.toLowerCase()?.includes(q) || false;
      const matchesPhone = lead.clientPhone?.toLowerCase()?.includes(q) || false;
      const matchesProp = lead.propertyTitle?.toLowerCase()?.includes(q) || false;
      const matchesRef = lead.propertyRef?.toLowerCase()?.includes(q) || false;
      if (!matchesName && !matchesPhone && !matchesProp && !matchesRef) {
        return false;
      }
    }
    return true;
  });

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    dispatch(updateLeadStatus({ id, status }));
    await firestoreService.updateLeadStatus(id, status);
    dispatch(addToast({
      type: 'success',
      message: `Statut du prospect mis à jour : ${status.replace('_', ' ').toUpperCase()}`,
    }));
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    const { id, clientName } = leadToDelete;
    try {
      dispatch(deleteLead(id));
      await firestoreService.deleteLead(id);
      dispatch(addToast({
        type: 'info',
        message: `Prospect ${clientName} supprimé avec succès.`,
      }));
    } catch (err) {
      console.error('Error deleting lead:', err);
      dispatch(addToast({
        type: 'error',
        message: `Erreur lors de la suppression du prospect ${clientName}.`,
      }));
    }
  };

  const getLeadWhatsAppLink = (lead: Lead) => {
    const cleanPhone = lead.clientPhone.replace(/\s+/g, '').replace('+', '');
    const text = encodeURIComponent(
      `Bonjour ${lead.clientName}, c'est l'agence Mali Immo Prestige suite à votre demande concernant le bien ${lead.propertyRef || ''}. Êtes-vous disponible pour une visite sur le terrain ?`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-extrabold text-slate-900 font-heading">
              Gestion des Prospects & Visites Terrain
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950">
              {filteredLeads.length} Prospects
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Capture des demandes web, WhatsApp, planification des visites sur place et suivi des offres d'achat.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, bien..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
        >
          <option value="all">Tous les Statuts</option>
          <option value="nouveau">Nouveaux prospects</option>
          <option value="contacte">Contacté</option>
          <option value="visite_programmee">Visite programmée</option>
          <option value="offre_recue">Offre d'achat reçue</option>
          <option value="conclu">Conclu / Vendu</option>
          <option value="annule">Annulé</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
        >
          <option value="all">Tous les Types de Demande</option>
          <option value="demande_visite">Demandes de Visite Terrain</option>
          <option value="information">Demandes d'Informations</option>
          <option value="offre_achat">Offres d'Achat</option>
          <option value="location">Demandes de Location</option>
        </select>
      </div>

      {/* Leads Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLeads.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
            Aucun prospect trouvé pour ces filtres.
          </div>
        ) : (
          filteredLeads.map((lead) => {
            const isVisit = lead.leadType === 'demande_visite' || lead.visitDate;
            const waLink = getLeadWhatsAppLink(lead);

            return (
              <div
                key={lead.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
              >
                <div className="space-y-3">
                  {/* Card Header with Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">{formatDate(lead.createdAt)}</span>
                      <h3 className="font-extrabold text-sm text-slate-900 font-heading">
                        {lead.clientName}
                      </h3>
                    </div>

                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border-0 cursor-pointer ${
                        lead.status === 'nouveau'
                          ? 'bg-amber-100 text-amber-900 font-black'
                          : lead.status === 'visite_programmee'
                          ? 'bg-blue-100 text-blue-900 font-bold'
                          : lead.status === 'conclu'
                          ? 'bg-emerald-100 text-emerald-900 font-bold'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <option value="nouveau">Nouveau</option>
                      <option value="contacte">Contacté</option>
                      <option value="visite_programmee">Visite fixée</option>
                      <option value="offre_recue">Offre reçue</option>
                      <option value="conclu">Conclu / Vendu</option>
                      <option value="annule">Annulé</option>
                    </select>
                  </div>

                  {/* Property Targeted */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="text-[10px] text-slate-400 block font-mono">Bien concerné :</span>
                    <span className="font-bold text-slate-900 block truncate">
                      {lead.propertyRef ? `[${lead.propertyRef}] ` : ''}{lead.propertyTitle}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-mono">{lead.clientPhone}</span>
                    </div>
                    {lead.clientEmail && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{lead.clientEmail}</span>
                      </div>
                    )}
                  </div>

                  {/* Visit Appointment Date / Time Badge if set */}
                  {lead.visitDate && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>Visite Terrain Planifiée</span>
                      </div>
                      <p className="text-[11px] text-amber-800 font-mono">
                        📅 {formatDate(lead.visitDate)} à {lead.visitTime || '10h00'}
                      </p>
                    </div>
                  )}

                  {/* Message / Notes */}
                  {lead.message && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                      "{lead.message}"
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    onClick={() => setLeadToDelete(lead)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Supprimer définitivement le prospect"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal for Lead Deletion */}
      <ConfirmDeleteModal
        isOpen={!!leadToDelete}
        onClose={() => setLeadToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer la fiche de ce prospect ?"
        itemType="Prospect / Visiteur"
        itemName={leadToDelete?.clientName}
        itemDetails={leadToDelete ? [
          { label: 'Téléphone', value: leadToDelete.clientPhone },
          { label: 'Bien ciblé', value: leadToDelete.propertyRef ? `${leadToDelete.propertyRef} - ${leadToDelete.propertyTitle || ''}` : 'Demande générale' },
          { label: 'Type de demande', value: leadToDelete.leadType === 'achat' ? 'Achat foncier / immobilier' : 'Location' },
          { label: 'Date création', value: formatDate(leadToDelete.createdAt) },
        ] : []}
        warningMessage="Attention : La suppression de ce prospect effacera l'historique des prises de contact, notes et rendez-vous de visite programmés."
        confirmLabel="Supprimer le prospect"
      />
    </div>
  );
};

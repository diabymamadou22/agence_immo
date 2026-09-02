import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setFilters, resetFilters } from '../../store/propertiesSlice';
import { openNotaryModal, openMortgageModal, openOwnerDepositModal, setViewMode } from '../../store/uiSlice';
import { Building2, ShieldCheck, MapPin, Phone, Mail, Clock, MessageSquare, MessageCircle, ArrowUpRight } from 'lucide-react';
import { cleanPhoneNumberForTel, cleanWhatsAppNumber } from '../../utils/formatters';

export const Footer: React.FC = () => {
  const dispatch = useAppDispatch();
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const agencyPhoneDisplay = agencyConfig.phoneDisplay || agencyConfig.phone || '+223 76 00 11 22';
  const agencyCallTel = cleanPhoneNumberForTel(agencyConfig.phone || agencyConfig.phoneDisplay);
  const agencyWhatsAppNumber = cleanWhatsAppNumber(agencyConfig.whatsappNumber);

  const handleFilterClick = (dealType: 'vente' | 'location', propertyType?: any) => {
    dispatch(resetFilters());
    dispatch(setFilters({ dealType, ...(propertyType ? { propertyType } : {}) }));
    dispatch(setViewMode('client'));
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-sm no-print">
      {/* Top Banner with trust badges for Mali real estate */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Garantie Titre Foncier</h4>
              <p className="text-xs text-slate-400 mt-0.5">Vérification rigoureuse auprès de la Conservation Foncière et du Cadastre du Mali.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Gestion Locative & Reversements</h4>
              <p className="text-xs text-slate-400 mt-0.5">Contrats conformes OHADA / Droit Malien, quittances digitales et bordereaux propriétaires.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Réactivité WhatsApp Directe</h4>
              <p className="text-xs text-slate-400 mt-0.5">Prise de rendez-vous pour visite sur le terrain en moins de 15 minutes.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Accompagnement Notarié</h4>
              <p className="text-xs text-slate-400 mt-0.5">Assistance complète de la rédaction du compromis jusqu'à la signature de l'acte notarié.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Presentation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-white text-lg tracking-tight font-heading uppercase">
                {agencyConfig.name}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              {agencyConfig.tagline || 'Société Immobilière et Foncière agréée. Spécialiste de la vente de parcelles avec Titre Foncier, lotissements sécurisés, villas haut standing et gestion de patrimoine locatif.'}
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <p><span className="text-slate-300 font-medium">NIF :</span> {agencyConfig.nif}</p>
              <p><span className="text-slate-300 font-medium">RCCM :</span> {agencyConfig.rccm}</p>
            </div>
          </div>

          {/* Quick Real Estate Search Links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Nos Opportunités
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => handleFilterClick('vente', 'parcelle')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />
                  <span>Parcelles avec Titre Foncier (TF)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleFilterClick('vente', 'maison')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />
                  <span>Villas & Duplex à Vendre</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleFilterClick('location', 'maison')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />
                  <span>Locations Résidentielles</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => dispatch(openOwnerDepositModal())}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 text-amber-400 font-semibold cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Confier un Bien / Parcelle</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => dispatch(openMortgageModal())}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                  <span>Simulateur Prêt Bancaire Mali</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => dispatch(openNotaryModal())}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                  <span>Simulateur Frais Notariés Mali</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Zones & Communes Prisées */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Secteurs & Quartiers
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center justify-between">
                <span>Hamdallaye ACI 2000</span>
                <span className="text-amber-500 font-medium">Bureaux & Luxe</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Kalaban Coura / Baco-Djicoroni</span>
                <span className="text-slate-500">Parcelles & Villas</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Yirimadio & Stade 26 Mars</span>
                <span className="text-slate-500">Foncier d'Avenir</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Sotuba ACI & 3ème Pont</span>
                <span className="text-slate-500">Résidences VIP</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Kati, Sanankoroba & Périurbain</span>
                <span className="text-slate-500">Domaines Agro-Pastoraux</span>
              </li>
            </ul>
          </div>

          {/* Contact & Agence Bamako */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Contact Client & Agence
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">Ligne Directe Client</span>
                  <a href={`tel:${agencyCallTel}`} className="text-amber-400 hover:text-amber-300 font-bold text-sm transition-colors">
                    {agencyPhoneDisplay}
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">WhatsApp Assistance</span>
                  <a 
                    href={`https://wa.me/${agencyWhatsAppNumber}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-emerald-400 hover:text-emerald-300 font-bold text-sm transition-colors"
                  >
                    +{agencyWhatsAppNumber}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5 pt-1">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{agencyConfig.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{agencyConfig.email}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{agencyConfig.workingHours}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & Copyright */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {agencyConfig.name}. Tous droits réservés. Monnaie légale : Franc CFA (XOF).</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Conforme Droit Foncier Malien (Loi N°02-008 & Code Domanial et Foncier)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};


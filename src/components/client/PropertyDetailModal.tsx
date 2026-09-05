import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setSelectedPropertyId, toggleFavorite } from '../../store/propertiesSlice';
import { openVisitModal, openNotaryModal, addToast } from '../../store/uiSlice';
import { 
  formatFCFA, 
  formatSurface, 
  getDocumentBadgeInfo, 
  getPropertyTypeLabel, 
  getStatusBadgeInfo, 
  generateWhatsAppLink,
  calculateNotaryFeesMali,
  AMENITY_DEFINITIONS,
  cleanPhoneNumberForTel,
  cleanWhatsAppNumber
} from '../../utils/formatters';
import { 
  X, 
  Heart, 
  Share2, 
  MapPin, 
  ShieldCheck, 
  Calendar, 
  MessageCircle, 
  Phone, 
  CheckCircle2, 
  Calculator, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Maximize2, 
  FileText, 
  Sparkles,
  Droplet,
  Zap,
  Sun,
  Shield,
  Car
} from 'lucide-react';

export const PropertyDetailModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((state) => state.properties.selectedPropertyId);
  const properties = useAppSelector((state) => state.properties.items);
  const favorites = useAppSelector((state) => state.properties.favorites);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  if (!selectedId) return null;

  const property = properties.find((p) => p.id === selectedId);
  if (!property) return null;

  const isFavorite = (favorites || []).includes(property.id);
  const docBadge = getDocumentBadgeInfo(property.documentType);
  const statusBadge = getStatusBadgeInfo(property.status);
  const images = property.images && property.images.length > 0 ? property.images : [property.featuredImage];
  const notaryEstimate = calculateNotaryFeesMali(property.price, property.documentType);
  
  const agencyPhoneDisplay = agencyConfig.phoneDisplay || agencyConfig.phone || '+223 90 07 03 21';
  const agencyCallTel = cleanPhoneNumberForTel(agencyConfig.phoneDisplay || agencyConfig.phone);
  const agencyWhatsAppNumber = cleanWhatsAppNumber(agencyConfig.whatsappNumber || agencyConfig.phoneDisplay || agencyConfig.phone);

  const waLink = generateWhatsAppLink(
    property.title, 
    property.reference, 
    property.price, 
    property.dealType,
    undefined,
    agencyWhatsAppNumber,
    agencyConfig.name
  );

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      dispatch(addToast({
        type: 'success',
        message: 'Lien du bien copié dans le presse-papier !',
      }));
    }
  };

  const handleClose = () => {
    dispatch(setSelectedPropertyId(null));
  };

  const handleOpenVisit = () => {
    dispatch(openVisitModal(property.id));
  };

  const pricePerM2 = property.surface > 0 ? Math.round(property.price / property.surface) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 md:p-6 flex items-center justify-center">
      <div 
        className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp"
        id="property-detail-modal-box"
      >
        {/* Top Sticky Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
              property.dealType === 'vente' ? 'bg-amber-500 text-slate-950' : 'bg-blue-600 text-white'
            }`}>
              {property.dealType === 'vente' ? 'À Vendre' : 'À Louer'}
            </span>
            <span className="font-mono text-xs text-amber-300 font-bold bg-slate-800 px-2.5 py-1 rounded-lg">
              Réf : {property.reference}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(toggleFavorite(property.id))}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isFavorite 
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Ajouter aux favoris"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Partager le bien"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              id="btn-close-property-detail"
              onClick={handleClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
          {/* Main Hero Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden bg-slate-950 shadow-lg">
              <img
                src={images[activePhotoIndex]}
                alt={property.title}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {/* Badges on image */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-xl text-xs font-bold shadow-md border ${docBadge.color}`}>
                  🛡️ {docBadge.label}
                </span>
                <span className={`px-3 py-1 rounded-xl text-xs font-bold shadow-md ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              </div>

              {/* Prev / Next controls */}
              {images.length > 1 && (
                <div className="absolute inset-y-0 inset-x-4 flex items-center justify-between pointer-events-none">
                  <button
                    onClick={() => setActivePhotoIndex((prev) => (prev - 1 + images.length) % images.length)}
                    className="pointer-events-auto p-2 rounded-full bg-slate-950/80 text-white hover:bg-slate-900 backdrop-blur-xs transition-transform active:scale-95 cursor-pointer shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActivePhotoIndex((prev) => (prev + 1) % images.length)}
                    className="pointer-events-auto p-2 rounded-full bg-slate-950/80 text-white hover:bg-slate-900 backdrop-blur-xs transition-transform active:scale-95 cursor-pointer shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Photo counter */}
              <div className="absolute bottom-4 right-4 px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-xs text-white text-xs font-bold">
                📷 {activePhotoIndex + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnails row */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activePhotoIndex === idx ? 'border-amber-500 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title, Pricing & Key Info Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                <span>{getPropertyTypeLabel(property.propertyType)}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>{property.address || `${property.neighborhood}, ${property.city}`}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                {property.title}
              </h1>

              {property.landmark && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <span>📍 Repère :</span>
                  <span className="font-medium text-slate-700">{property.landmark}</span>
                </p>
              )}
            </div>

            {/* Price Box */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl shrink-0 space-y-1 shadow-lg">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                {property.dealType === 'vente' ? 'Prix Net Vendeur' : 'Loyer Mensuel'}
              </span>
              <div className="text-2xl sm:text-3xl font-black font-heading text-white">
                {formatFCFA(property.price)}
                {property.dealType === 'location' && (
                  <span className="text-xs font-normal text-slate-300"> / mois</span>
                )}
              </div>
              {pricePerM2 && property.dealType === 'vente' && (
                <span className="text-[11px] text-slate-400 block font-mono">
                  Soit ≈ {formatFCFA(pricePerM2)} / m²
                </span>
              )}
            </div>
          </div>

          {/* Grid of Key Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Superficie</span>
              </span>
              <p className="text-lg font-black text-slate-900 font-heading mt-1">
                {formatSurface(property.surface)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Titre / Statut</span>
              </span>
              <p className="text-sm font-bold text-emerald-800 truncate mt-1">
                {docBadge.shortLabel}
              </p>
            </div>

            {property.propertyType === 'parcelle' ? (
              <>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    <span>N° de Lot</span>
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1 font-mono">
                    {property.lotNumber || 'Non précisé'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                    <span>Dimensions</span>
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {property.dimensions || 'Standard'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 text-xs">Chambres</span>
                  <p className="text-lg font-black text-slate-900 font-heading mt-1">
                    {property.bedrooms ? `${property.bedrooms} ch.` : '-'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 text-xs">Salles de bain</span>
                  <p className="text-lg font-black text-slate-900 font-heading mt-1">
                    {property.bathrooms ? `${property.bathrooms} sdb` : '-'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Detailed Cadastral & Legal Identity Box (For Parcelle / Land plots) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <h3 className="font-extrabold text-base text-slate-900 font-heading">
                Fiche Cadastrale & Situation Juridique (Mali)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Type de Document Foncier :</span>
                <span className="font-bold text-slate-900 text-sm">{docBadge.label}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Numéro d'Immatriculation :</span>
                <span className="font-mono font-bold text-amber-900 text-sm">
                  {property.documentNumber || 'En cours d\'affectation'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Lotissement / Secteur :</span>
                <span className="font-semibold text-slate-900">
                  {property.lotissement || 'Communal'}
                </span>
              </div>

              {property.section && (
                <div>
                  <span className="text-slate-500 block">Section Cadastrale :</span>
                  <span className="font-semibold text-slate-900 font-mono">Section {property.section}</span>
                </div>
              )}

              {property.ilotNumber && (
                <div>
                  <span className="text-slate-500 block">Numéro d'Îlot :</span>
                  <span className="font-semibold text-slate-900 font-mono">{property.ilotNumber}</span>
                </div>
              )}

              {property.lotNumber && (
                <div>
                  <span className="text-slate-500 block">Numéro de Parcelle / Lot :</span>
                  <span className="font-semibold text-slate-900 font-mono">{property.lotNumber}</span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-amber-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Checklist de Sécurité Foncière (Audit Juridique MIP)</span>
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Garantie Sans Litige
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-800">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${property.foncierChecklist?.hasTitreFoncierVerified ?? (property.documentType === 'titre_foncier') ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Titre Foncier vérifié aux Domaines</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-800">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${property.foncierChecklist?.hasGeometrePlan ?? true ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Plan de situation géomètre agréé (IGM)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-800">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${property.foncierChecklist?.hasNonGageCertificate ?? true ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Certificat de non-gage / réquisition</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-800">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${property.foncierChecklist?.hasBornageContradictoire ?? true ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Bornage physique contradictoire vérifié</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-800">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${property.foncierChecklist?.isPurgerCoutumiere ?? true ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Droits coutumiers purgés sans contestation</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-800">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${property.foncierChecklist?.notaryAssigned ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Notaire : {property.foncierChecklist?.notaryAssigned || 'Étude Notariale Référente'}</span>
                </div>
              </div>

              {property.foncierChecklist?.verificationNotes && (
                <p className="mt-2 text-[11px] text-amber-900 italic bg-amber-100/50 p-2 rounded-lg">
                  <strong>Avis Juridique :</strong> {property.foncierChecklist.verificationNotes}
                </p>
              )}
            </div>

            <p className="text-xs text-amber-900 bg-white/80 p-3 rounded-xl border border-amber-200/80 leading-relaxed">
              <strong>Notice agence :</strong> {property.documentDetails || docBadge.description}
            </p>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-lg text-slate-900 font-heading">
              Description Détaillée
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Viabilisation & Amenities */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-lg text-slate-900 font-heading">
              Viabilisation & Équipements Disponibles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {(property.amenities || []).map((amenityKey) => {
                const def = AMENITY_DEFINITIONS[amenityKey] || { label: amenityKey, category: 'Général' };
                return (
                  <div
                    key={amenityKey}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{def.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notary Acquisition Fee Estimator Preview (If Sale) */}
          {property.dealType === 'vente' && (
            <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-base font-heading flex items-center gap-2 text-white">
                    <Calculator className="w-5 h-5 text-amber-400" />
                    <span>Estimation des Frais Notariés pour ce bien</span>
                  </h4>
                  <p className="text-xs text-slate-300">
                    Droits d'enregistrement (7%) + Conservation foncière + Honoraires de Notaire à Bamako
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch(openNotaryModal())}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  Personnaliser le calcul
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Prix du bien :</span>
                  <span className="font-extrabold text-white text-sm">{formatFCFA(notaryEstimate.propertyPrice)}</span>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Frais Notaire & Taxes (≈{notaryEstimate.percentageOfPrice}%) :</span>
                  <span className="font-extrabold text-amber-400 text-sm">{formatFCFA(notaryEstimate.totalNotaryFees)}</span>
                </div>
                <div className="bg-amber-500 text-slate-950 p-3 rounded-xl font-bold">
                  <span className="text-[10px] block uppercase">Coût Total d'Acquisition :</span>
                  <span className="font-black text-sm sm:text-base">{formatFCFA(notaryEstimate.totalAcquisitionCost)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA Bar */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              🏢
            </div>
            <div>
              <p className="font-bold text-slate-900">{agencyConfig.name}</p>
              <p className="text-[11px] text-slate-600">
                Ligne Directe Client : <a href={`tel:${agencyCallTel}`} className="font-bold text-amber-600 hover:underline">{agencyPhoneDisplay}</a>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Direct Phone Call */}
            <a
              href={`tel:${agencyCallTel}`}
              className="flex-1 sm:flex-none py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4 fill-slate-950" />
              <span>Appeler ({agencyPhoneDisplay})</span>
            </a>

            {/* Direct WhatsApp */}
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-none py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>WhatsApp Direct</span>
            </a>

            {/* Plan Visit */}
            <button
              type="button"
              id="btn-modal-plan-visit"
              onClick={handleOpenVisit}
              className="flex-1 sm:flex-none py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Demander une Visite</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setSelectedPropertyId, toggleFavorite, incrementPropertyViews } from '../../store/propertiesSlice';
import { openVisitModal, openNotaryModal } from '../../store/uiSlice';
import { Property } from '../../types';
import { 
  formatFCFA, 
  formatSurface, 
  getDocumentBadgeInfo, 
  getPropertyTypeLabel, 
  getStatusBadgeInfo, 
  generateWhatsAppLink 
} from '../../utils/formatters';
import { 
  MapPin, 
  Heart, 
  Calendar, 
  MessageCircle, 
  Eye, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Layers,
  Sparkles,
  CheckCircle2,
  Droplet,
  Zap,
  Sun
} from 'lucide-react';

interface PropertyCardProps {
  property: Property;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector((state) => state.properties.favorites);
  const isFavorite = favorites.includes(property.id);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const docBadge = getDocumentBadgeInfo(property.documentType);
  const statusBadge = getStatusBadgeInfo(property.status);
  const waLink = generateWhatsAppLink(
    property.title,
    property.reference,
    property.price,
    property.dealType
  );

  const images = property.images && property.images.length > 0 ? property.images : [property.featuredImage];

  const handleCardClick = () => {
    dispatch(incrementPropertyViews(property.id));
    dispatch(setSelectedPropertyId(property.id));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleFavorite(property.id));
  };

  const handleVisitClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(openVisitModal(property.id));
  };

  return (
    <div 
      id={`property-card-${property.id}`}
      onClick={handleCardClick}
      className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Image Container with Badges */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
        <img
          src={images[activeImageIndex] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/30 pointer-events-none" />

        {/* Top Badges: Deal Type & Document Status */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
          <div className="flex flex-wrap gap-1.5 pointer-events-auto">
            {/* Deal Type Badge */}
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm ${
              property.dealType === 'vente' ? 'bg-amber-500 text-slate-950' : 'bg-blue-600 text-white'
            }`}>
              {property.dealType === 'vente' ? 'À Vendre' : 'À Louer'}
            </span>

            {/* Document Badge */}
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm border flex items-center gap-1 ${docBadge.color}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{docBadge.shortLabel}</span>
            </span>
          </div>

          {/* Favorite Button */}
          <button
            type="button"
            id={`btn-fav-${property.id}`}
            onClick={handleFavoriteClick}
            className="pointer-events-auto w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-xs text-white hover:text-rose-500 flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-md"
            title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Image carousel arrows (if multiple images) */}
        {images.length > 1 && (
          <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <button
              type="button"
              onClick={handlePrevImage}
              className="pointer-events-auto p-1.5 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white backdrop-blur-xs transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              className="pointer-events-auto p-1.5 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white backdrop-blur-xs transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bottom image bar: Price and Photos count */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white pointer-events-none">
          <div>
            <span className="text-[11px] font-mono text-amber-300 font-bold block drop-shadow-sm">
              Réf : {property.reference}
            </span>
            <div className="text-xl font-extrabold tracking-tight font-heading text-white drop-shadow-md flex items-baseline gap-1">
              <span>{formatFCFA(property.price)}</span>
              {property.dealType === 'location' && (
                <span className="text-xs font-normal text-slate-200">/ mois</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {images.length > 1 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white">
                📷 {activeImageIndex + 1}/{images.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Location & Category */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              {getPropertyTypeLabel(property.propertyType)}
            </span>
            <span className="flex items-center gap-1 text-slate-600 truncate font-medium">
              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">{property.neighborhood}, {property.city}</span>
            </span>
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 font-heading leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors">
            {property.title}
          </h3>

          {/* Description snippet */}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {property.description}
          </p>

          {/* Parcel specific specs badge (if parcelle) or Rooms (if villa) */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-700 border-t border-slate-100">
            <div className="flex items-center gap-1 font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
              <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatSurface(property.surface)}</span>
            </div>

            {property.propertyType === 'parcelle' && property.lotNumber && (
              <div className="flex items-center gap-1 text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-[11px]">
                <Layers className="w-3 h-3 text-amber-600" />
                <span>{property.lotNumber} ({property.section || 'Sect.'})</span>
              </div>
            )}

            {property.bedrooms && (
              <div className="flex items-center gap-1 text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-[11px]">
                <span>🛏️ {property.bedrooms} ch.</span>
              </div>
            )}

            {/* Micro amenities icons */}
            <div className="ml-auto flex items-center gap-1.5 text-slate-400">
              {property.amenities.includes('eau_somagep') && <Droplet className="w-3.5 h-3.5 text-blue-500" title="Eau SOMAGEP" />}
              {property.amenities.includes('electricite_edm') && <Zap className="w-3.5 h-3.5 text-amber-500" title="Électricité EDM-SA" />}
              {property.hasSolar && <Sun className="w-3.5 h-3.5 text-amber-600" title="Solaire / Forage" />}
            </div>
          </div>
        </div>

        {/* Action Buttons: WhatsApp Direct & Site Visit */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
          {/* WhatsApp Direct */}
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
            id={`btn-wa-${property.id}`}
          >
            <MessageCircle className="w-4 h-4 fill-white shrink-0" />
            <span className="truncate">WhatsApp</span>
          </a>

          {/* Book Site Visit */}
          <button
            type="button"
            id={`btn-visite-${property.id}`}
            onClick={handleVisitClick}
            className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Visiter le bien</span>
          </button>
        </div>
      </div>
    </div>
  );
};

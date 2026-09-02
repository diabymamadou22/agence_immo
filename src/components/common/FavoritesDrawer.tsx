import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setFavoritesDrawerOpen } from '../../store/uiSlice';
import { setSelectedPropertyId, toggleFavorite } from '../../store/propertiesSlice';
import { formatFCFA, getDocumentBadgeInfo, generateWhatsAppLink, cleanWhatsAppNumber } from '../../utils/formatters';
import { X, Heart, Trash2, ExternalLink, MessageCircle, Building2 } from 'lucide-react';

export const FavoritesDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isFavoritesDrawerOpen);
  const favoriteIds = useAppSelector((state) => state.properties.favorites);
  const allProperties = useAppSelector((state) => state.properties.items);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  if (!isOpen) return null;

  const favoriteProperties = allProperties.filter((p) => favoriteIds.includes(p.id));
  const agencyWhatsAppNumber = cleanWhatsAppNumber(agencyConfig.whatsappNumber);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={() => dispatch(setFavoritesDrawerOpen(false))}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Heart className="w-4 h-4 fill-slate-950" />
              </div>
              <div>
                <h3 className="font-extrabold text-base font-heading">Mes Biens Enregistrés</h3>
                <p className="text-xs text-slate-300">
                  {favoriteProperties.length} bien{favoriteProperties.length > 1 ? 's' : ''} sauvegardé{favoriteProperties.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => dispatch(setFavoritesDrawerOpen(false))}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {favoriteProperties.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Aucun bien favori</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Cliquez sur l'icône cœur sur les annonces de parcelles ou de villas pour les retrouver ici et les comparer.
                </p>
              </div>
            ) : (
              favoriteProperties.map((prop) => {
                const docBadge = getDocumentBadgeInfo(prop.documentType);
                const waLink = generateWhatsAppLink(
                  prop.title, 
                  prop.reference, 
                  prop.price, 
                  prop.dealType,
                  undefined,
                  agencyWhatsAppNumber,
                  agencyConfig.name
                );

                return (
                  <div
                    key={prop.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-3 hover:border-slate-300 transition-all relative group"
                  >
                    <img
                      src={prop.featuredImage || prop.images[0]}
                      alt={prop.title}
                      className="w-20 h-20 rounded-lg object-cover shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${docBadge.color}`}>
                          {docBadge.shortLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {prop.reference}
                        </span>
                      </div>

                      <h4 
                        onClick={() => {
                          dispatch(setSelectedPropertyId(prop.id));
                          dispatch(setFavoritesDrawerOpen(false));
                        }}
                        className="font-bold text-xs text-slate-900 truncate hover:text-amber-600 cursor-pointer"
                      >
                        {prop.title}
                      </h4>

                      <p className="text-[11px] text-slate-500 truncate">
                        📍 {prop.neighborhood}, {prop.city} • {prop.surface} m²
                      </p>

                      <p className="font-extrabold text-xs text-amber-700 mt-1">
                        {formatFCFA(prop.price)}
                        {prop.dealType === 'location' && <span className="text-[10px] font-normal text-slate-500"> / mois</span>}
                      </p>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-200">
                        <button
                          onClick={() => {
                            dispatch(setSelectedPropertyId(prop.id));
                            dispatch(setFavoritesDrawerOpen(false));
                          }}
                          className="text-[11px] font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Détails</span>
                        </button>
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                        <button
                          onClick={() => dispatch(toggleFavorite(prop.id))}
                          className="ml-auto text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          title="Supprimer des favoris"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {favoriteProperties.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <a
                href={`https://wa.me/${agencyWhatsAppNumber}?text=${encodeURIComponent(
                  `Bonjour ${agencyConfig.name}, je souhaiterais des informations sur ma sélection de ${favoriteProperties.length} biens :\n` +
                  favoriteProperties.map((p) => `- ${p.title} (${p.reference}) à ${formatFCFA(p.price)}`).join('\n')
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Demander des infos groupées sur WhatsApp</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

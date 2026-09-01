import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2, ShieldAlert } from 'lucide-react';

export interface DeleteItemDetail {
  label: string;
  value: string;
}

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  itemType?: string;
  itemName?: string;
  itemDetails?: DeleteItemDetail[];
  warningMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmer la suppression définitive',
  itemType = 'Enregistrement',
  itemName,
  itemDetails,
  warningMessage = 'Cette action est irréversible. L\'élément sera définitivement supprimé de la base de données et des registres de l\'agence.',
  confirmLabel = 'Supprimer définitivement',
  cancelLabel = 'Annuler',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error during deletion:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs p-4 flex items-center justify-center animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-rose-100 overflow-hidden my-auto transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Red Accent */}
        <div className="p-5 sm:p-6 bg-rose-50/70 border-b border-rose-100 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-200/80 text-rose-900 mb-1">
                Alerte de Sécurité
              </span>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 font-heading leading-snug">
                {title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-rose-100/50 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Target Item Card Preview */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                Cible concernée :
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-200 text-slate-800">
                {itemType}
              </span>
            </div>

            {itemName && (
              <p className="font-extrabold text-sm sm:text-base text-slate-950 font-heading break-words">
                {itemName}
              </p>
            )}

            {itemDetails && itemDetails.length > 0 && (
              <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
                {itemDetails.map((detail, index) => (
                  <div key={index} className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold block">{detail.label}</span>
                    <span className="font-bold text-slate-900 font-mono text-[11px] break-all">{detail.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warning Callout */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="font-medium">
              {warningMessage}
            </p>
          </div>

          <p className="text-xs text-slate-500 font-medium text-center">
            Êtes-vous certain de vouloir poursuivre cette suppression ?
          </p>
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-extrabold shadow-sm shadow-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Suppression en cours...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

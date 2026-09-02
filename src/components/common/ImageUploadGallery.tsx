import React, { useState, useRef } from 'react';
import { compressImageFile, processMultipleImageFiles } from '../../utils/imageUtils';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  Trash2, 
  Star, 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  X, 
  Link, 
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ImageUploadGalleryProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  helperText?: string;
}

export const ImageUploadGallery: React.FC<ImageUploadGalleryProps> = ({
  images,
  onChange,
  maxImages = 15,
  label = 'Photos & Visuels du Bien (Vos propres images)',
  helperText = 'Importez directement les vraies photos depuis votre téléphone, galerie ou ordinateur. Vos photos sont automatiquement optimisées.',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) {
        setErrorMessage(`Vous avez atteint la limite maximale de ${maxImages} photos.`);
        setIsProcessing(false);
        return;
      }

      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      const newImages = await processMultipleImageFiles(filesToProcess);
      
      if (newImages.length === 0) {
        setErrorMessage('Aucun fichier image valide n\'a été détecté.');
      } else {
        onChange([...images, ...newImages]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de l\'import des photos.');
    } finally {
      setIsProcessing(false);
      // Reset inputs so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const [selected] = newImages.splice(index, 1);
    newImages.unshift(selected);
    onChange(newImages);
  };

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    onChange(newImages);
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, idx) => idx !== index);
    onChange(newImages);
  };

  const handleAddManualUrl = () => {
    if (!manualUrl.trim()) return;
    if (images.length >= maxImages) {
      setErrorMessage(`Limite maximale de ${maxImages} photos atteinte.`);
      return;
    }
    onChange([...images, manualUrl.trim()]);
    setManualUrl('');
    setShowUrlInput(false);
  };

  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const handleConfirmClearAll = () => {
    onChange([]);
    setShowClearConfirm(false);
  };

  return (
    <div className="space-y-4">
      {/* Label and counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-amber-600" />
            <span>{label}</span>
          </label>
          {helperText && (
            <p className="text-[11px] text-slate-500 mt-0.5">{helperText}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {images.length} / {maxImages} photo{images.length > 1 ? 's' : ''}
          </span>
          {images.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] text-rose-600 hover:text-rose-700 underline font-semibold cursor-pointer"
            >
              Tout effacer
            </button>
          )}
        </div>
      </div>

      {/* Hidden file inputs for direct device selection & camera */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Main Drag & Drop / Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
            : 'border-slate-300 hover:border-amber-400 bg-slate-50/70 hover:bg-amber-50/30'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-4 space-y-2">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs font-bold text-slate-700">Traitement et optimisation de vos photos...</p>
            <p className="text-[10px] text-slate-500">Compression automatique pour un affichage ultra-rapide</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shadow-xs">
              <Upload className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-black text-slate-900 font-heading">
                Cliquez pour importer vos photos ou glissez-les ici
              </p>
              <p className="text-xs text-slate-500">
                Formats acceptés : JPG, PNG, WEBP, HEIC depuis smartphone ou ordinateur
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Parcourir mes Fichiers / Galerie</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Prendre une Photo (Appareil Photo)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Link className="w-3.5 h-3.5 text-slate-500" />
                <span>Coller un lien URL</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual URL Input dropdown if toggled */}
      {showUrlInput && (
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-2 animate-fadeIn">
          <input
            type="url"
            placeholder="https://..."
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="button"
            onClick={handleAddManualUrl}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            Ajouter
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Uploaded Images Gallery Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 px-1">
            <span className="font-bold">Galerie des photos ({images.length})</span>
            <span className="text-[11px] text-slate-500">
              La 1ère photo (étoilée) sera la photo de couverture de l'annonce
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((imgUrl, index) => {
              const isPrimary = index === 0;

              return (
                <div
                  key={index}
                  className={`group relative rounded-2xl overflow-hidden border-2 bg-slate-900 transition-all aspect-4/3 flex flex-col justify-between ${
                    isPrimary
                      ? 'border-amber-500 ring-2 ring-amber-400/40 shadow-md'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />

                  {/* Gradient overlay for buttons */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between">
                    {/* Top action row */}
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setPreviewModalUrl(imgUrl)}
                        title="Agrandir la photo"
                        className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        title="Supprimer cette photo"
                        className="p-1.5 rounded-lg bg-rose-600/90 text-white hover:bg-rose-600 backdrop-blur-xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bottom action row: Reorder and Set Primary */}
                    <div className="flex items-center justify-between gap-1 pt-2">
                      <div className="flex items-center gap-1">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMove(index, 'left')}
                            title="Déplacer vers la gauche"
                            className="p-1 rounded bg-black/60 text-white hover:bg-black/90 cursor-pointer"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                        )}
                        {index < images.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMove(index, 'right')}
                            title="Déplacer vers la droite"
                            className="p-1 rounded bg-black/60 text-white hover:bg-black/90 cursor-pointer"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(index)}
                          title="Définir comme photo principale"
                          className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                        >
                          <Star className="w-3 h-3 fill-slate-950" />
                          <span>Principale</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Primary Badge pinned on top */}
                  {isPrimary && (
                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black tracking-wide flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-slate-950" />
                      <span>COUVERTURE</span>
                    </div>
                  )}

                  {/* Number Badge */}
                  <div className="absolute bottom-2 right-2 z-10 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold backdrop-blur-xs">
                    #{index + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Preview Modal */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewModalUrl(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewModalUrl}
              alt="Photo Agrandie"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal to Clear All Photos */}
      <ConfirmDeleteModal
        isOpen={showClearConfirm}
        title="Supprimer toutes les photos"
        message="Êtes-vous certain de vouloir vider l'ensemble des photos actuelles de cette fiche ?"
        itemName={`${images.length} photo(s) sélectionnée(s)`}
        itemType="Galerie de photos"
        onConfirm={handleConfirmClearAll}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
};

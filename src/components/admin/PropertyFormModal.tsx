import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { closePropertyForm, addToast } from '../../store/uiSlice';
import { addProperty, updateProperty } from '../../store/propertiesSlice';
import { firestoreService } from '../../services/firestoreService';
import { Property, PropertyType, DealType, DocumentType, PropertyStatus } from '../../types';
import { AMENITY_DEFINITIONS, MALI_LOCATIONS, formatFCFA } from '../../utils/formatters';
import { ImageUploadGallery } from '../common/ImageUploadGallery';
import { 
  X, 
  Building2, 
  Layers, 
  Save, 
  Image as ImageIcon, 
  ShieldCheck, 
  MapPin, 
  Maximize2, 
  Plus, 
  Trash2,
  CheckCircle2
} from 'lucide-react';

export const PropertyFormModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isPropertyFormOpen);
  const editingProperty = useAppSelector((state) => state.ui.editingProperty);
  const formType = useAppSelector((state) => state.ui.propertyFormType);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>(formType === 'parcelle' ? 'parcelle' : 'maison');
  const [dealType, setDealType] = useState<DealType>('vente');
  const [price, setPrice] = useState<number>(25000000);
  const [surface, setSurface] = useState<number>(300);
  const [city, setCity] = useState('Bamako');
  const [neighborhood, setNeighborhood] = useState('Kalaban Coura');
  const [commune, setCommune] = useState('Commune V');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  
  // Cadastre / Legal
  const [documentType, setDocumentType] = useState<DocumentType>('titre_foncier');
  const [documentNumber, setDocumentNumber] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [ilotNumber, setIlotNumber] = useState('');
  const [section, setSection] = useState('');
  const [lotissement, setLotissement] = useState('');
  const [dimensions, setDimensions] = useState('15m x 20m');

  // Specs
  const [bedrooms, setBedrooms] = useState<number>(3);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [status, setStatus] = useState<PropertyStatus>('disponible');

  // Images (Local uploads from phone / PC or existing property images)
  const [images, setImages] = useState<string[]>([]);

  // Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'eau_somagep',
    'electricite_edmsa',
    'acces_goudron',
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingProperty) {
      setTitle(editingProperty.title);
      setDescription(editingProperty.description);
      setPropertyType(editingProperty.propertyType);
      setDealType(editingProperty.dealType);
      setPrice(editingProperty.price);
      setSurface(editingProperty.surface);
      setCity(editingProperty.city);
      setNeighborhood(editingProperty.neighborhood);
      setCommune(editingProperty.commune || '');
      setAddress(editingProperty.address || '');
      setLandmark(editingProperty.landmark || '');
      setDocumentType(editingProperty.documentType);
      setDocumentNumber(editingProperty.documentNumber || '');
      setLotNumber(editingProperty.lotNumber || '');
      setIlotNumber(editingProperty.ilotNumber || '');
      setSection(editingProperty.section || '');
      setLotissement(editingProperty.lotissement || '');
      setDimensions(editingProperty.dimensions || '');
      setBedrooms(editingProperty.bedrooms || 0);
      setBathrooms(editingProperty.bathrooms || 0);
      setStatus(editingProperty.status);
      setImages(editingProperty.images && editingProperty.images.length > 0 ? editingProperty.images : (editingProperty.featuredImage ? [editingProperty.featuredImage] : []));
      setSelectedAmenities(editingProperty.amenities || []);
    } else {
      // Default reset
      setImages([]); // Fresh empty photos so user imports their real photos
      if (formType === 'parcelle') {
        setPropertyType('parcelle');
        setTitle('Parcelle Titre Foncier');
        setDescription('Magnifique parcelle viabilisée prête pour construction immédiate avec titre foncier vérifié et sans litige.');
        setDimensions('15m x 20m');
        setSurface(300);
        setDocumentType('titre_foncier');
      } else {
        setPropertyType('maison');
        setTitle('Villa Moderne de Standing');
        setDescription('Superbe villa avec finitions de qualité, clôture sécurisée, forage d\'eau et accès facile.');
        setSurface(450);
      }
    }
  }, [editingProperty, formType, isOpen]);

  if (!isOpen) return null;

  const toggleAmenity = (key: string) => {
    if (selectedAmenities.includes(key)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== key));
    } else {
      setSelectedAmenities([...selectedAmenities, key]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || !surface) {
      dispatch(addToast({
        type: 'warning',
        message: 'Veuillez renseigner le titre, le prix et la superficie.',
      }));
      return;
    }

    setIsSubmitting(true);

    const propertyPayload: Property = {
      id: editingProperty ? editingProperty.id : `prop-${Date.now()}`,
      reference: editingProperty ? editingProperty.reference : `MIP-${propertyType === 'parcelle' ? 'PAR' : 'BAT'}-${Math.floor(100 + Math.random() * 900)}`,
      title: title.trim(),
      description: description.trim(),
      propertyType,
      dealType,
      price: Number(price),
      surface: Number(surface),
      city,
      neighborhood,
      commune: commune || undefined,
      address: address || undefined,
      landmark: landmark || undefined,
      documentType,
      documentNumber: documentNumber.trim() || undefined,
      lotNumber: lotNumber.trim() || undefined,
      ilotNumber: ilotNumber.trim() || undefined,
      section: section.trim() || undefined,
      lotissement: lotissement.trim() || undefined,
      dimensions: dimensions.trim() || undefined,
      bedrooms: propertyType !== 'parcelle' ? Number(bedrooms) : undefined,
      bathrooms: propertyType !== 'parcelle' ? Number(bathrooms) : undefined,
      featuredImage: images[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'],
      amenities: selectedAmenities,
      status,
      viewsCount: editingProperty?.viewsCount || 0,
      createdAt: editingProperty ? editingProperty.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingProperty) {
        dispatch(updateProperty(propertyPayload));
        await firestoreService.saveProperty(propertyPayload);
        dispatch(addToast({
          type: 'success',
          message: `Bien ${propertyPayload.reference} mis à jour avec succès.`,
        }));
      } else {
        dispatch(addProperty(propertyPayload));
        await firestoreService.saveProperty(propertyPayload);
        dispatch(addToast({
          type: 'success',
          message: `Nouveau bien ${propertyPayload.reference} ajouté au catalogue.`,
        }));
      }

      dispatch(closePropertyForm());
    } catch (err) {
      console.error(err);
      dispatch(addToast({
        type: 'error',
        message: 'Erreur lors de la sauvegarde du bien.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 md:p-6 flex items-center justify-center animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        id="property-form-modal-box"
      >
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              {propertyType === 'parcelle' ? <Layers className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base font-heading">
                {editingProperty ? `Modifier le Bien (${editingProperty.reference})` : propertyType === 'parcelle' ? 'Ajouter une Parcelle / Terrain au Mali' : 'Ajouter un Bien Immobilier'}
              </h3>
              <p className="text-xs text-slate-300">
                Saisie des coordonnées cadastrales, prix FCFA et statut légal
              </p>
            </div>
          </div>

          <button
            onClick={() => dispatch(closePropertyForm())}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Main Info */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
              1. Informations Générales & Typologie
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Deal Type */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Type de Transaction *</label>
                <select
                  value={dealType}
                  onChange={(e) => setDealType(e.target.value as DealType)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                >
                  <option value="vente">Vente (Achat définitif)</option>
                  <option value="location">Location</option>
                </select>
              </div>

              {/* Property Type */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Type de Bien *</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                >
                  <option value="parcelle">Parcelle / Terrain Nu</option>
                  <option value="maison">Villa / Maison</option>
                  <option value="appartement">Appartement</option>
                  <option value="magasin_bureau">Magasin / Bureau</option>
                  <option value="entrepot">Entrepôt / Zone Industrielle</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Disponibilité *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PropertyStatus)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold text-emerald-800"
                >
                  <option value="disponible">Disponible à la vente/location</option>
                  <option value="reserve">Réservé (Compromis signé)</option>
                  <option value="vendu">Vendu / Mutation effectuée</option>
                  <option value="loue">Loué</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Titre de l'Annonce *</label>
              <input
                type="text"
                required
                placeholder="Ex : Parcelle 300m² Titre Foncier - Kalaban Coura ACI"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
              />
            </div>

            {/* Pricing & Surface */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Prix en FCFA {dealType === 'location' ? '(Loyer / mois)' : '(Net Vendeur)'} *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={price === 0 ? '' : price}
                  placeholder="Ex : 25000000"
                  onChange={(e) => {
                    const val = e.target.value;
                    setPrice(val === '' ? 0 : parseFloat(val) || 0);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-extrabold text-amber-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 font-mono">
                  Affichage : {formatFCFA(price)} {dealType === 'location' ? '/ mois' : ''}
                </span>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Superficie (m²) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={surface === 0 ? '' : surface}
                  placeholder="Ex : 300"
                  onChange={(e) => {
                    const val = e.target.value;
                    setSurface(val === '' ? 0 : parseFloat(val) || 0);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Location Details in Bamako & Mali */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
              2. Localisation Géographique & Commune
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Ville / Cercle *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {MALI_LOCATIONS.cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Quartier *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Kalaban Coura, Yirimadio, ACI 2000..."
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Commune (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex : Commune V, Cercle de Kati..."
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Point de Repère Connu</label>
              <input
                type="text"
                placeholder="Ex : Non loin du Stade du 26 Mars, à 200m du goudron..."
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Cadastral & Legal Identity (Crucial for Mali Parcelle) */}
          <div className="space-y-4 pt-4 border-t border-slate-200 bg-amber-50/50 p-4 rounded-2xl border border-amber-200">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>3. Fiche Cadastrale & Titre de Propriété (Mali)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">Document Juridique *</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                  className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="titre_foncier">Titre Foncier (TF) individuel</option>
                  <option value="lettre_attribution">Lettre d'Attribution</option>
                  <option value="concession_rurale">Concession Rurale</option>
                  <option value="bail">Bail</option>
                  <option value="permis_occuper">Permis d'Occuper</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">Numéro de Titre / TF N°</label>
                <input
                  type="text"
                  placeholder="Ex : TF N° 124 582 / Commune V"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">N° de Lot / Parcelle</label>
                <input
                  type="text"
                  placeholder="Ex : Lot 45"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">Section Cadastrale</label>
                <input
                  type="text"
                  placeholder="Ex : Section C"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">Numéro d'Îlot</label>
                <input
                  type="text"
                  placeholder="Ex : Îlot 12"
                  value={ilotNumber}
                  onChange={(e) => setIlotNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">Dimensions Bornées</label>
                <input
                  type="text"
                  placeholder="Ex : 15m x 20m"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">Nom du Lotissement / Promoteur</label>
              <input
                type="text"
                placeholder="Ex : Lotissement ACI Sogoniko extension, Cité des Cadres..."
                value={lotissement}
                onChange={(e) => setLotissement(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1 pt-2">
            <label className="block text-xs font-bold text-slate-700">Description Complète</label>
            <textarea
              rows={3}
              placeholder="Description détaillée du bien, de son accessibilité et de son environnement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
            ></textarea>
          </div>

          {/* Amenities / Viabilisation */}
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-700">
              Viabilisation & Équipements (Cocher les éléments disponibles)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(AMENITY_DEFINITIONS).map(([key, def]) => {
                const isChecked = selectedAmenities.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleAmenity(key)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${isChecked ? 'text-amber-600 fill-amber-100' : 'text-slate-300'}`} />
                    <span className="truncate">{def.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photos Management (Direct Device Uploads) */}
          <div className="pt-4 border-t border-slate-200">
            <ImageUploadGallery
              images={images}
              onChange={setImages}
              maxImages={20}
              label="Photos & Visuels du Bien (Vos propres images)"
              helperText="Importez directement les vraies photos de la parcelle, du bâtiment, des accès ou des pièces depuis votre téléphone ou ordinateur."
            />
          </div>

          {/* Modal Footer / Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => dispatch(closePropertyForm())}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Enregistrement...' : editingProperty ? 'Mettre à Jour le Bien' : 'Créer et Publier le Bien'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

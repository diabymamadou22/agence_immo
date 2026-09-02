import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  openSaleReceiptModal, 
  openRecordSaleModal, 
  addToast 
} from '../../store/uiSlice';
import { 
  setActiveReceiptForPrint, 
  deleteSaleReceipt,
  setSelectedPropertyForSale 
} from '../../store/salesSlice';
import { SaleReceipt } from '../../types';
import { 
  formatFCFA, 
  formatDate, 
  getSaleOperationLabel, 
  getPropertyTypeLabel,
  getDocumentBadgeInfo 
} from '../../utils/formatters';
import { 
  Receipt, 
  Printer, 
  Plus, 
  Search, 
  FileText, 
  User, 
  Building2, 
  Layers, 
  Trash2, 
  Eye, 
  Phone, 
  CheckCircle2,
  DollarSign,
  Filter
} from 'lucide-react';

export const AdminSaleReceiptsList: React.FC = () => {
  const dispatch = useAppDispatch();
  const sales = useAppSelector((state) => state.sales.items);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all'); // all, parcelle, appartement
  const [filterOp, setFilterOp] = useState<string>('all');

  const filteredSales = sales.filter((sale) => {
    if (filterType !== 'all') {
      if (filterType === 'parcelle' && sale.propertyType !== 'parcelle') return false;
      if (filterType === 'appartement' && sale.propertyType !== 'appartement' && sale.propertyType !== 'maison') return false;
    }
    if (filterOp !== 'all' && sale.operationType !== filterOp) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchesNum = sale.receiptNumber.toLowerCase().includes(q);
      const matchesBuyer = sale.buyerName.toLowerCase().includes(q);
      const matchesPhone = sale.buyerPhone.toLowerCase().includes(q);
      const matchesNina = sale.buyerNinaOrId?.toLowerCase().includes(q);
      const matchesProp = sale.propertyTitle.toLowerCase().includes(q);
      const matchesRef = sale.propertyReference.toLowerCase().includes(q);
      const matchesTF = sale.documentNumber?.toLowerCase().includes(q);
      if (!matchesNum && !matchesBuyer && !matchesPhone && !matchesNina && !matchesProp && !matchesRef && !matchesTF) {
        return false;
      }
    }
    return true;
  });

  const handlePrintReceipt = (receipt: SaleReceipt) => {
    dispatch(setActiveReceiptForPrint(receipt));
    dispatch(openSaleReceiptModal());
  };

  const handleDeleteReceipt = (receipt: SaleReceipt) => {
    if (window.confirm(`Supprimer le reçu N° ${receipt.receiptNumber} pour ${receipt.buyerName} ?`)) {
      dispatch(deleteSaleReceipt(receipt.id));
      dispatch(addToast({
        type: 'info',
        message: `Le reçu N° ${receipt.receiptNumber} a été retiré des archives.`,
      }));
    }
  };

  // Stats
  const totalVolumeEncaissé = sales.reduce((acc, s) => acc + (s.amountPaid || 0), 0);
  const totalParcellesSold = sales.filter((s) => s.propertyType === 'parcelle').length;
  const totalAppartsSold = sales.filter((s) => s.propertyType === 'appartement' || s.propertyType === 'maison').length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Stats & Emit Button */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 font-heading tracking-tight">
                Registre & Impression des Reçus de Vente
              </h2>
              <p className="text-xs text-slate-500">
                Quittances certifiées de vente pour Parcelles de terrain et Appartements avec informations complètes du client.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              dispatch(setSelectedPropertyForSale(null));
              dispatch(openRecordSaleModal());
            }}
            className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Émettre un Reçu de Vente</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Encaissé sur Ventes</span>
          <div className="text-xl font-black text-emerald-700 font-heading">{formatFCFA(totalVolumeEncaissé)}</div>
          <span className="text-[10px] text-slate-400 block">{sales.length} actes & quittances délivrés</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Reçus Parcelles / Foncier</span>
          <div className="text-xl font-black text-amber-700 font-heading">{totalParcellesSold} Parcelles vendues</div>
          <span className="text-[10px] text-slate-400 block">Titres Fonciers (TF) & Attributions</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Reçus Appartements & Bâtis</span>
          <div className="text-xl font-black text-blue-700 font-heading">{totalAppartsSold} Appartements vendus</div>
          <span className="text-[10px] text-slate-400 block">Résidences & Copropriétés</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher par client, tél, NINA, N° reçu, TF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
        >
          <option value="all">Tous les types (Parcelles & Appartements)</option>
          <option value="parcelle">Parcelles de Terrain uniquement</option>
          <option value="appartement">Appartements & Bâtis uniquement</option>
        </select>

        <select
          value={filterOp}
          onChange={(e) => setFilterOp(e.target.value)}
          className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
        >
          <option value="all">Tous les types de règlement</option>
          <option value="vente_totale">Vente Totale (Intégral)</option>
          <option value="acompte">Acompte / Réservation</option>
          <option value="solde">Solde Final</option>
          <option value="versement_echelonne">Versement Échelonné</option>
        </select>
      </div>

      {/* Receipts List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">N° Reçu & Date</th>
                <th className="py-3.5 px-4">Informations Client (Acquéreur)</th>
                <th className="py-3.5 px-4">Bien Vendu & Titre Foncier</th>
                <th className="py-3.5 px-4">Type d'Opération</th>
                <th className="py-3.5 px-4">Montant Versé</th>
                <th className="py-3.5 px-4">Solde Dû</th>
                <th className="py-3.5 px-4 text-right">Imprimer / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p>Aucun reçu de vente trouvé pour ces critères.</p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const op = getSaleOperationLabel(sale.operationType);
                  const isParcelle = sale.propertyType === 'parcelle';

                  return (
                    <tr key={sale.id} className="hover:bg-amber-50/30 transition-colors">
                      {/* Receipt number & date */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-slate-950 block">{sale.receiptNumber}</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          {formatDate(sale.saleDate)}
                        </span>
                      </td>

                      {/* Buyer full details */}
                      <td className="py-3.5 px-4">
                        <span className="font-black text-slate-950 block font-heading">{sale.buyerName}</span>
                        <div className="text-[11px] text-slate-500 space-y-0.5 mt-0.5">
                          <span className="font-mono block">{sale.buyerPhone}</span>
                          {sale.buyerNinaOrId && (
                            <span className="text-[10px] text-slate-600 font-mono bg-slate-100 px-1.5 py-0.2 rounded inline-block">
                              {sale.buyerNinaOrId}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Property details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {isParcelle ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-black text-[9px] uppercase">
                              Parcelle
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-black text-[9px] uppercase">
                              Appart
                            </span>
                          )}
                          <span className="font-bold text-slate-900 line-clamp-1 max-w-[200px]">{sale.propertyTitle}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {sale.documentNumber || sale.documentType} • {sale.neighborhood}, {sale.city}
                        </div>
                      </td>

                      {/* Operation Type */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase border ${op.color}`}>
                          {op.badge}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                          {sale.paymentMethod}
                        </span>
                      </td>

                      {/* Amount paid */}
                      <td className="py-3.5 px-4">
                        <span className="font-black text-emerald-800 font-heading text-xs block">
                          {formatFCFA(sale.amountPaid)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          sur {formatFCFA(sale.totalAgreedPrice)}
                        </span>
                      </td>

                      {/* Remaining balance */}
                      <td className="py-3.5 px-4">
                        {sale.remainingBalance > 0 ? (
                          <span className="font-black text-rose-700 text-xs block">
                            {formatFCFA(sale.remainingBalance)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                            Soldé Intégral
                          </span>
                        )}
                      </td>

                      {/* Print and delete actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handlePrintReceipt(sale)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Imprimer le Reçu Officiel / PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Imprimer</span>
                          </button>

                          <button
                            onClick={() => handleDeleteReceipt(sale)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Supprimer le reçu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
    </div>
  );
};

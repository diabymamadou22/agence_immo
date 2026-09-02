import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
} from 'recharts';
import { Property, Tenant, RentReceipt, OwnerPayout, AgencyExpense, AgencyConfig } from '../../types';
import { formatFCFA } from '../../utils/formatters';
import { TrendingUp, ArrowDownRight, Wallet, BarChart3, Calendar, Percent } from 'lucide-react';

interface FinancialChartProps {
  properties: Property[];
  tenants: Tenant[];
  receipts: RentReceipt[];
  payouts: OwnerPayout[];
  expenses: AgencyExpense[];
  agencyConfig: AgencyConfig;
}

interface MonthlyDataPoint {
  monthKey: string;      // "2024-08"
  label: string;         // "Août 2024"
  shortLabel: string;    // "Août"
  revenus: number;       // Agency gross commission & fees
  depenses: number;      // Agency expenses
  benefice: number;      // revenus - depenses
  rentalCommissions: number;
  salesCommissions: number;
  chargesDetailCount: number;
  marginPercent: number;
}

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const SHORT_MONTH_NAMES_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'
];

export const FinancialChart: React.FC<FinancialChartProps> = ({
  properties,
  tenants,
  receipts,
  payouts,
  expenses,
  agencyConfig,
}) => {
  const [chartType, setChartType] = useState<'bars' | 'composed' | 'area'>('composed');
  const [timeRange, setTimeRange] = useState<'6m' | '12m' | 'all'>('6m');

  // Compute monthly data dynamically from real entities
  const monthlyData = useMemo(() => {
    const map = new Map<string, {
      monthKey: string;
      year: number;
      month: number;
      rentalCommissions: number;
      salesCommissions: number;
      dossierFees: number;
      depenses: number;
      chargesCount: number;
    }>();

    // Helper to get or create map entry
    const getEntry = (year: number, month: number) => {
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      if (!map.has(monthKey)) {
        map.set(monthKey, {
          monthKey,
          year,
          month,
          rentalCommissions: 0,
          salesCommissions: 0,
          dossierFees: 0,
          depenses: 0,
          chargesCount: 0,
        });
      }
      return map.get(monthKey)!;
    };

    // 1. Process payouts (commissions earned by agency from owners' rentals)
    payouts.forEach((p) => {
      const pDate = p.payoutDate ? new Date(p.payoutDate) : new Date();
      if (!isNaN(pDate.getTime())) {
        const entry = getEntry(pDate.getFullYear(), pDate.getMonth());
        entry.rentalCommissions += (p.agencyCommissionAmount || 0);
      }
    });

    // 1b. If some receipts don't have payouts yet, calculate default 10% agency management commission
    receipts.forEach((r) => {
      const rDate = r.paymentDate ? new Date(r.paymentDate) : new Date();
      if (!isNaN(rDate.getTime())) {
        const entry = getEntry(rDate.getFullYear(), rDate.getMonth());
        // Add dossier/admin fees per receipt if no payout
        if (payouts.length === 0) {
          entry.rentalCommissions += Math.round(r.amount * 0.10);
        }
      }
    });

    // 2. Process sold properties (sales commissions earned on conclusion)
    properties
      .filter((p) => p.status === 'vendu' && p.dealType === 'vente')
      .forEach((p) => {
        const dateStr = p.updatedAt || p.createdAt || '2024-08-01';
        const pDate = new Date(dateStr);
        if (!isNaN(pDate.getTime())) {
          const entry = getEntry(pDate.getFullYear(), pDate.getMonth());
          const commissionRate = agencyConfig.defaultSaleCommissionPercent || 5;
          entry.salesCommissions += Math.round(p.price * (commissionRate / 100));
        }
      });

    // 3. Process expenses
    expenses.forEach((e) => {
      const eDate = e.date ? new Date(e.date) : new Date();
      if (!isNaN(eDate.getTime())) {
        const entry = getEntry(eDate.getFullYear(), eDate.getMonth());
        entry.depenses += (e.amount || 0);
        entry.chargesCount += 1;
      }
    });

    // Ensure we have a continuous stream of recent months if data is sparse
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Default to at least last 6 months spanning through current
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      getEntry(d.getFullYear(), d.getMonth());
    }

    // Sort entries chronologically
    const sortedEntries = Array.from(map.values()).sort((a, b) => {
      return a.monthKey.localeCompare(b.monthKey);
    });

    // Format into chart data points
    const points: MonthlyDataPoint[] = sortedEntries.map((item) => {
      const totalRevenus = item.rentalCommissions + item.salesCommissions + item.dossierFees;
      const benefice = totalRevenus - item.depenses;
      const margin = totalRevenus > 0 ? Math.round((benefice / totalRevenus) * 100) : 0;

      return {
        monthKey: item.monthKey,
        label: `${MONTH_NAMES_FR[item.month]} ${item.year}`,
        shortLabel: `${SHORT_MONTH_NAMES_FR[item.month]} ${String(item.year).slice(2)}`,
        revenus: totalRevenus,
        depenses: item.depenses,
        benefice: benefice,
        rentalCommissions: item.rentalCommissions,
        salesCommissions: item.salesCommissions,
        chargesDetailCount: item.chargesCount,
        marginPercent: margin,
      };
    });

    // Filter by selected range
    if (timeRange === '6m') {
      return points.slice(-6);
    } else if (timeRange === '12m') {
      return points.slice(-12);
    }
    return points;
  }, [properties, receipts, payouts, expenses, agencyConfig, timeRange]);

  // Aggregate stats for period
  const totalPeriodRevenue = monthlyData.reduce((acc, d) => acc + d.revenus, 0);
  const totalPeriodExpense = monthlyData.reduce((acc, d) => acc + d.depenses, 0);
  const totalPeriodProfit = totalPeriodRevenue - totalPeriodExpense;
  const averageMargin = totalPeriodRevenue > 0 ? Math.round((totalPeriodProfit / totalPeriodRevenue) * 100) : 0;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload as MonthlyDataPoint;
      if (!dataPoint) return null;

      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-xl border border-slate-700 shadow-2xl text-xs space-y-2.5 min-w-[220px]">
          <div className="font-extrabold text-sm text-amber-400 border-b border-slate-700 pb-1.5 flex items-center justify-between">
            <span>{dataPoint.label}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${dataPoint.benefice >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
              Marge: {dataPoint.marginPercent}%
            </span>
          </div>

          <div className="space-y-1.5 font-medium">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Revenus (Commissions) :
              </span>
              <span className="font-extrabold font-heading text-white">{formatFCFA(dataPoint.revenus)}</span>
            </div>

            {dataPoint.rentalCommissions > 0 && (
              <div className="flex items-center justify-between text-slate-400 pl-3.5 text-[11px]">
                <span>• Gestion locative :</span>
                <span>{formatFCFA(dataPoint.rentalCommissions)}</span>
              </div>
            )}

            {dataPoint.salesCommissions > 0 && (
              <div className="flex items-center justify-between text-slate-400 pl-3.5 text-[11px]">
                <span>• Commissions Ventes TF :</span>
                <span>{formatFCFA(dataPoint.salesCommissions)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-rose-400 pt-1 border-t border-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                Dépenses Opérationnelles :
              </span>
              <span className="font-extrabold font-heading text-white">{formatFCFA(dataPoint.depenses)}</span>
            </div>

            <div className="flex items-center justify-between text-amber-300 pt-1.5 border-t border-slate-700 font-bold">
              <span>Bénéfice Net :</span>
              <span className={`font-black font-heading text-sm ${dataPoint.benefice >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                {formatFCFA(dataPoint.benefice)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="financial-analysis-chart" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      {/* Header with Title and Control Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 font-heading">
              Évolution Mensuelle : Revenus vs Dépenses
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Comparatif dynamique du chiffre d'affaires généré par l'agence face aux charges d'exploitation.
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time range switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setTimeRange('6m')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${timeRange === '6m' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              6 mois
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('12m')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${timeRange === '12m' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              12 mois
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${timeRange === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Tout
            </button>
          </div>

          {/* Chart Style Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setChartType('composed')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${chartType === 'composed' ? 'bg-slate-900 text-white shadow-xs' : 'hover:text-slate-900'}`}
            >
              Mixte
            </button>
            <button
              type="button"
              onClick={() => setChartType('bars')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${chartType === 'bars' ? 'bg-slate-900 text-white shadow-xs' : 'hover:text-slate-900'}`}
            >
              Barres
            </button>
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${chartType === 'area' ? 'bg-slate-900 text-white shadow-xs' : 'hover:text-slate-900'}`}
            >
              Aires
            </button>
          </div>
        </div>
      </div>

      {/* Mini KPI summary banner for selected timeframe */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
        <div className="space-y-0.5">
          <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            Revenus Période
          </span>
          <div className="text-sm font-black text-emerald-700 font-heading">
            {formatFCFA(totalPeriodRevenue)}
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
            <ArrowDownRight className="w-3 h-3 text-rose-500" />
            Dépenses Période
          </span>
          <div className="text-sm font-black text-rose-600 font-heading">
            {formatFCFA(totalPeriodExpense)}
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
            <Wallet className="w-3 h-3 text-amber-500" />
            Bénéfice Cumulé
          </span>
          <div className="text-sm font-black text-slate-900 font-heading">
            {formatFCFA(totalPeriodProfit)}
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
            <Percent className="w-3 h-3 text-blue-500" />
            Marge Nette Moyenne
          </span>
          <div className="text-sm font-black text-blue-700 font-heading">
            {averageMargin}%
          </div>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="w-full h-80 sm:h-96 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="shortLabel"
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(val) => `${(val / 1000).toLocaleString('fr-FR')} k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 16, fontSize: 12, fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="revenus"
                name="Revenus Bruts (FCFA)"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenus)"
              />
              <Area
                type="monotone"
                dataKey="depenses"
                name="Dépenses d'Exploitation (FCFA)"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorDepenses)"
              />
            </ComposedChart>
          ) : chartType === 'bars' ? (
            <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="shortLabel"
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(val) => `${(val / 1000).toLocaleString('fr-FR')} k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 16, fontSize: 12, fontWeight: 600 }}
              />
              <Bar
                dataKey="revenus"
                name="Revenus Bruts"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
              />
              <Bar
                dataKey="depenses"
                name="Dépenses d'Exploitation"
                fill="#f43f5e"
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
              />
            </ComposedChart>
          ) : (
            <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="shortLabel"
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(val) => `${(val / 1000).toLocaleString('fr-FR')} k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 16, fontSize: 12, fontWeight: 600 }}
              />
              <Bar
                dataKey="revenus"
                name="Revenus Bruts"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="depenses"
                name="Dépenses d'Exploitation"
                fill="#f43f5e"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
              <Line
                type="monotone"
                dataKey="benefice"
                name="Bénéfice Net"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#f59e0b' }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Insight Note */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
        <span>* Données compilées à partir des quittances de loyer, reversements bailleurs, ventes de parcelles et du journal des charges.</span>
        <span className="font-semibold text-slate-700 hidden sm:inline">Montants exprimés en Francs CFA (XOF)</span>
      </div>
    </div>
  );
};

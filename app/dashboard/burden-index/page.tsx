'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  TrendingUp,
  Scale,
  Bell,
  FileText,
  GitMerge,
  Loader2,
  AlertTriangle,
  RefreshCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { LexramAPI, type BurdenIndustry } from '@/lib/lexram/api';

const COMPONENT_COLORS = {
  acts: '#d97706',
  sections: '#f59e0b',
  circulars: '#0284c7',
  sub_legislation: '#7c3aed',
};

const DEFAULT_COLOR = '#94A3B8';

type ViewMode = 'ranked' | 'breakdown' | 'distribution';

export default function BurdenIndexPage() {
  const router = useRouter();
  const [data, setData] = useState<BurdenIndustry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('ranked');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await LexramAPI.burdenIndex();
        if (cancelled) return;
        setData(Array.isArray(rows) ? rows : []);
      } catch (e) {
        if (cancelled) return;
        setError((e as Error).message || 'Failed to load burden index');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const ranked = useMemo(() => {
    return [...data].sort((a, b) => Number(b.burden_score) - Number(a.burden_score));
  }, [data]);

  const topChartData = useMemo(
    () =>
      ranked.slice(0, 15).map((row) => ({
        name: row.name.length > 18 ? `${row.name.slice(0, 18)}...` : row.name,
        fullName: row.name,
        score: Number(row.burden_score) || 0,
        color: row.color ?? DEFAULT_COLOR,
      })),
    [ranked],
  );

  const breakdownData = useMemo(
    () =>
      ranked.slice(0, 15).map((row) => ({
        name: row.name.length > 18 ? `${row.name.slice(0, 18)}...` : row.name,
        fullName: row.name,
        acts: row.acts ?? 0,
        sections: row.sections ?? 0,
        circulars: row.circulars ?? 0,
        sub_legislation: row.sub_legislation ?? 0,
      })),
    [ranked],
  );

  const distributionData = useMemo(
    () =>
      ranked.map((row) => ({
        name: row.name,
        value: Number(row.total) || 0,
        color: row.color ?? DEFAULT_COLOR,
      })),
    [ranked],
  );

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="mb-6">
            <button
              onClick={() => router.push('/dashboard/industry-dashboard')}
              className="flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-800 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-charcoal-900">Regulatory Burden Index</h1>
                <p className="text-charcoal-500 text-sm">
                  Industries ranked by composite burden score across acts, sections, circulars, and sub-legislation
                </p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
          )}

          {error && !loading && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="text-rose-700 mb-3">{error}</p>
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="bg-white rounded-xl border border-charcoal-100 p-1 shadow-sm mb-6 inline-flex">
                {[
                  { id: 'ranked' as const, label: 'Ranked' },
                  { id: 'breakdown' as const, label: 'Breakdown' },
                  { id: 'distribution' as const, label: 'Distribution' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setViewMode(tab.id)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      viewMode === tab.id
                        ? 'bg-gold-50 text-gold-700'
                        : 'text-charcoal-500 hover:text-charcoal-800',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {ranked.length === 0 && (
                <div className="bg-white rounded-xl border border-charcoal-100 p-12 text-center">
                  <TrendingUp className="w-12 h-12 text-charcoal-300 mx-auto mb-3" />
                  <p className="text-charcoal-500">No burden index data available</p>
                </div>
              )}

              {ranked.length > 0 && viewMode === 'ranked' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-charcoal-100 p-6 shadow-sm">
                    <h2 className="text-lg font-serif font-semibold text-charcoal-900 mb-4">
                      Top 15 Industries by Burden Score
                    </h2>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topChartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis type="number" stroke="#64748B" fontSize={12} />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={160}
                            stroke="#64748B"
                            fontSize={11}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #E2E8F0',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                            formatter={(value, _name, props) => [
                              `${value}`,
                              (props?.payload as { fullName?: string } | undefined)?.fullName ?? '',
                            ]}
                          />
                          <Bar dataKey="score" name="Burden Score" radius={[0, 4, 4, 0]}>
                            {topChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-charcoal-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-charcoal-50 border-b border-charcoal-100">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wide">
                            #
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wide">
                            Industry
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wide">
                            Score
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wide">
                            Total
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wide">
                            Acts
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wide">
                            Sections
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wide">
                            Circulars
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wide">
                            Sub-Leg
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-charcoal-50">
                        {ranked.map((row, idx) => (
                          <tr key={row.code} className="hover:bg-charcoal-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-mono text-charcoal-400">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{ backgroundColor: row.color ?? DEFAULT_COLOR }}
                                />
                                <div>
                                  <div className="text-sm font-medium text-charcoal-900">{row.name}</div>
                                  <div className="text-xs font-mono text-charcoal-400">{row.code}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-mono font-semibold text-charcoal-900">
                                {Number(row.burden_score).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-mono text-charcoal-600">
                                {Number(row.total).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-mono text-amber-600">{row.acts}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-mono text-amber-500">{row.sections}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-mono text-sky-600">{row.circulars}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-mono text-violet-600">{row.sub_legislation}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {ranked.length > 0 && viewMode === 'breakdown' && (
                <div className="bg-white rounded-xl border border-charcoal-100 p-6 shadow-sm">
                  <h2 className="text-lg font-serif font-semibold text-charcoal-900 mb-4">
                    Component Breakdown (Top 15)
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-xs mb-4">
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <Scale className="w-3.5 h-3.5" /> Acts
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-600">
                      <FileText className="w-3.5 h-3.5" /> Sections
                    </span>
                    <span className="flex items-center gap-1.5 text-sky-700">
                      <Bell className="w-3.5 h-3.5" /> Circulars
                    </span>
                    <span className="flex items-center gap-1.5 text-violet-700">
                      <GitMerge className="w-3.5 h-3.5" /> Sub-Legislation
                    </span>
                  </div>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={breakdownData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis
                          dataKey="name"
                          stroke="#64748B"
                          fontSize={11}
                          angle={-30}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis stroke="#64748B" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #E2E8F0',
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          formatter={(value, _name, props) => [
                            `${value}`,
                            (props?.payload as { fullName?: string } | undefined)?.fullName ?? '',
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="acts" stackId="a" fill={COMPONENT_COLORS.acts} name="Acts" />
                        <Bar dataKey="sections" stackId="a" fill={COMPONENT_COLORS.sections} name="Sections" />
                        <Bar dataKey="circulars" stackId="a" fill={COMPONENT_COLORS.circulars} name="Circulars" />
                        <Bar
                          dataKey="sub_legislation"
                          stackId="a"
                          fill={COMPONENT_COLORS.sub_legislation}
                          name="Sub-Legislation"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {ranked.length > 0 && viewMode === 'distribution' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-charcoal-100 p-6 shadow-sm">
                    <h2 className="text-lg font-serif font-semibold text-charcoal-900 mb-4">
                      Total Entities Distribution
                    </h2>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={distributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={110}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {distributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, _name, props) => [
                              `${value}`,
                              (props?.payload as { name?: string } | undefined)?.name ?? '',
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-charcoal-100 p-6 shadow-sm">
                    <h2 className="text-lg font-serif font-semibold text-charcoal-900 mb-4">Share by Industry</h2>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                      {distributionData.map((row) => {
                        const total = distributionData.reduce((s, r) => s + r.value, 0);
                        const pct = total > 0 ? (row.value / total) * 100 : 0;
                        return (
                          <div key={row.name} className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: row.color }}
                            />
                            <span className="flex-1 text-sm text-charcoal-900 truncate">{row.name}</span>
                            <span className="text-xs font-mono text-charcoal-600">
                              {row.value.toLocaleString()}
                            </span>
                            <span className="text-xs font-mono text-charcoal-400 w-12 text-right">
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

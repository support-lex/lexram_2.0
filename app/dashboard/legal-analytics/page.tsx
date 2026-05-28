'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  LexramAPI,
  type DashboardStats,
  type DashboardDomain,
  type DashboardMinistry,
  type PulseEvent,
} from '@/lib/lexram/api';

const DOMAIN_COLORS = [
  '#C2A35F', '#7c3aed', '#0284c7', '#e11d48', '#0d9488',
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface PulseBucket {
  key: string;
  label: string;
  acts: number;
  circulars: number;
  amendments: number;
}

function bucketPulseByMonth(events: PulseEvent[]): PulseBucket[] {
  const buckets = new Map<string, PulseBucket>();
  for (const ev of events) {
    if (!ev?.event_date) continue;
    const d = new Date(ev.event_date);
    if (Number.isNaN(d.getTime())) continue;
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const label = `${MONTH_LABELS[month]} ${String(year).slice(2)}`;
    const existing = buckets.get(key) ?? { key, label, acts: 0, circulars: 0, amendments: 0 };
    if (ev.type === 'act') existing.acts += 1;
    else if (ev.type === 'circular') existing.circulars += 1;
    else if (ev.type === 'amendment') existing.amendments += 1;
    buckets.set(key, existing);
  }
  return Array.from(buckets.values()).sort((a, b) => a.key.localeCompare(b.key));
}

export default function LegalAnalyticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pulse, setPulse] = useState<PulseEvent[]>([]);
  const [domains, setDomains] = useState<DashboardDomain[]>([]);
  const [ministries, setMinistries] = useState<DashboardMinistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [s, p, d, m] = await Promise.all([
          LexramAPI.dashboardStats(),
          LexramAPI.dashboardPulse(),
          LexramAPI.dashboardDomains(),
          LexramAPI.dashboardMinistries(),
        ]);
        if (cancelled) return;
        setStats(s);
        setPulse(Array.isArray(p) ? p : []);
        setDomains(Array.isArray(d) ? d : []);
        setMinistries(Array.isArray(m) ? m : []);
      } catch (e) {
        if (cancelled) return;
        setError((e as Error).message || 'Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const pulseData = bucketPulseByMonth(pulse);

  const domainData = domains.map((d, i) => ({
    name: d.domain,
    value: Number(d.act_count) || 0,
    color: DOMAIN_COLORS[i % DOMAIN_COLORS.length],
  }));

  const ministryData = [...ministries]
    .map((m) => ({
      name: m.ministry,
      fullName: m.ministry,
      count: Number(m.count) || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((m) => ({
      ...m,
      name: m.name.length > 24 ? `${m.name.slice(0, 24)}...` : m.name,
    }));

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-serif font-bold text-charcoal-900">Legal Intelligence Dashboard</h1>
              {stats && !loading && (
                <p className="text-sm text-charcoal-500 mt-0.5">
                  Live view of {stats.acts.toLocaleString()} Acts · {stats.sections.toLocaleString()} Sections ·{' '}
                  {stats.circulars.toLocaleString()} Circulars
                </p>
              )}
            </div>
            <button
              onClick={() => router.push('/dashboard/search')}
              className="hidden sm:inline-flex items-center gap-2 bg-charcoal-900 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-charcoal-700 transition-colors"
            >
              Open Search
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
          )}

          {error && !loading && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="text-rose-700 dark:text-rose-300 mb-3">{error}</p>
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {!loading && !error && stats && (
            <>
              {/* Hero stats */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {[
                  { label: 'Acts', value: stats.acts, color: '#d97706', href: '/dashboard/acts' },
                  { label: 'Sections', value: stats.sections, color: '#7c3aed', href: '/dashboard/acts' },
                  { label: 'Circulars', value: stats.circulars, color: '#0284c7', href: '/dashboard/circulars' },
                  { label: 'Amendments', value: stats.amendments, color: '#e11d48', href: '/dashboard/amendments' },
                  { label: 'Sub-Leg', value: stats.subordinate_legislation, color: '#0d9488', href: '/dashboard/sub-legislation' },
                  { label: 'Schedules', value: stats.schedules, color: '#6366f1', href: '/dashboard/schedules' },
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() => router.push(s.href)}
                    className="bg-white border border-charcoal-100 rounded-xl p-4 text-left hover:shadow-md transition-all"
                  >
                    <div className="text-xs uppercase tracking-wide text-charcoal-500 mb-1">{s.label}</div>
                    <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>
                      {(s.value ?? 0).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>

              {/* Legislative Pulse line chart */}
              <div className="bg-white border border-charcoal-100 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-serif font-semibold text-charcoal-900 mb-4">Legislative Pulse</h2>
                <div className="h-72">
                  {pulseData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-charcoal-500">
                      No pulse events available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={pulseData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="label" stroke="#64748B" fontSize={12} />
                        <YAxis stroke="#64748B" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #E2E8F0',
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="circulars" stroke="#0284c7" strokeWidth={2} />
                        <Line type="monotone" dataKey="amendments" stroke="#e11d48" strokeWidth={2} />
                        <Line type="monotone" dataKey="acts" stroke="#d97706" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-charcoal-100 rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-serif font-semibold text-charcoal-900 mb-4">Domain Distribution</h2>
                  <div className="h-64">
                    {domainData.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-sm text-charcoal-500">
                        No domain data
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={domainData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {domainData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
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
                    )}
                  </div>
                </div>

                <div className="bg-white border border-charcoal-100 rounded-xl p-6 shadow-sm lg:col-span-2">
                  <h2 className="text-lg font-serif font-semibold text-charcoal-900 mb-4">Top 10 Ministries</h2>
                  <div className="h-64">
                    {ministryData.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-sm text-charcoal-500">
                        No ministry data
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ministryData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis
                            dataKey="name"
                            stroke="#64748B"
                            fontSize={11}
                            angle={-15}
                            textAnchor="end"
                            height={60}
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
                          <Bar dataKey="count" fill="#C2A35F" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Database, FileText, Tags, Scale, RefreshCw, Loader2 } from 'lucide-react';
import { MOCK_ACTS, MOCK_CIRCULARS, MOCK_MINISTRIES } from '@/lib/lexram/mock';

interface CrawlerStats {
  endpoints: number;
  documents: number;
  topics: number;
  acts: number;
}

interface TopicStat {
  topic: string;
  count: number;
}

interface MinistryStat {
  ministry: string;
  count: number;
}

const topicColors: Record<string, string> = {
  'Labour Law': 'bg-amber-500',
  'IP Law': 'bg-purple-500',
  'Family Law': 'bg-blue-500',
  'Tax Law': 'bg-green-500',
  'Banking Law': 'bg-indigo-500',
  'Environmental Law': 'bg-teal-500',
  'Constitutional Law': 'bg-orange-500',
  'Healthcare Law': 'bg-rose-500',
  'Criminal Law': 'bg-red-500',
  'Corporate Law': 'bg-cyan-500',
  'Civil Law': 'bg-emerald-500',
};

export default function CrawlerDashboardPage() {
  const [stats, setStats] = useState<CrawlerStats | null>(null);
  const [topics, setTopics] = useState<TopicStat[]>([]);
  const [ministries, setMinistries] = useState<MinistryStat[]>([]);
  const [loading, setLoading] = useState(true);

  const computed = useMemo(() => {
    const topicMap = new Map<string, number>();
    MOCK_ACTS.forEach((a) => {
      if (a.domain) topicMap.set(a.domain, (topicMap.get(a.domain) ?? 0) + 1);
    });
    const topicStats: TopicStat[] = Array.from(topicMap.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);

    const ministryStats: MinistryStat[] = MOCK_MINISTRIES
      .map((m) => ({ ministry: m.name, count: m.total_acts ?? 0 }))
      .sort((a, b) => b.count - a.count);

    const s: CrawlerStats = {
      endpoints: 12,
      documents: MOCK_ACTS.length + MOCK_CIRCULARS.length,
      topics: topicStats.length,
      acts: MOCK_ACTS.length,
    };

    return { topicStats, ministryStats, s };
  }, []);

  const loadData = () => {
    setLoading(true);
    // simulate async fetch
    const t = setTimeout(() => {
      setStats(computed.s);
      setTopics(computed.topicStats);
      setMinistries(computed.ministryStats);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  };

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-charcoal-900">
                    Government Crawler Dashboard
                  </h1>
                  <p className="text-charcoal-500">Pipeline stats and document overview</p>
                </div>
                <button
                  onClick={() => loadData()}
                  className="p-2 hover:bg-charcoal-100 rounded-lg"
                  aria-label="Refresh"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-charcoal-200">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 rounded-lg">
                      <Database className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.endpoints ?? 0}</p>
                      <p className="text-sm text-charcoal-500">Endpoints</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-charcoal-200">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.documents ?? 0}</p>
                      <p className="text-sm text-charcoal-500">Documents</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-charcoal-200">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Tags className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.topics ?? 0}</p>
                      <p className="text-sm text-charcoal-500">Topic Tags</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-charcoal-200">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Scale className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.acts ?? 0}</p>
                      <p className="text-sm text-charcoal-500">Acts Registered</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Topics */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-charcoal-200">
                  <h2 className="text-lg font-semibold mb-4">Topic Distribution</h2>
                  <div className="space-y-3">
                    {topics.slice(0, 8).map((topic) => (
                      <div key={topic.topic} className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${topicColors[topic.topic] ?? 'bg-charcoal-400'}`}
                        />
                        <span className="flex-1 text-sm">{topic.topic}</span>
                        <span className="text-sm font-medium">{topic.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ministries */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-charcoal-200">
                  <h2 className="text-lg font-semibold mb-4">Top Ministries</h2>
                  <div className="space-y-3">
                    {ministries.slice(0, 8).map((m) => (
                      <div key={m.ministry} className="flex items-center gap-3">
                        <span className="flex-1 text-sm truncate">{m.ministry}</span>
                        <span className="text-sm font-medium bg-amber-100 px-2 py-1 rounded">
                          {m.count}
                        </span>
                      </div>
                    ))}
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

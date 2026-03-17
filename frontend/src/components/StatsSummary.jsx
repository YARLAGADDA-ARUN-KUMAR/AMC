/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { marksApi } from '../api/client';

export default function StatsSummary({ subjectId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subjectId) return;
    setLoading(true);
    marksApi
      .getStats(subjectId)
      .then((res) => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [subjectId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse"
          >
            <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
            <div className="h-7 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-400 text-sm">
        No statistics available for this subject yet.
      </div>
    );
  }

  const passRate =
    stats.total_students > 0
      ? (
          ((stats.total_students - stats.fail_count) / stats.total_students) *
          100
        ).toFixed(1)
      : 0;

  const cards = [
    {
      label: 'Class Average',
      value: stats.class_average?.toFixed(1) ?? '—',
      sub: 'out of 90',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      icon: (
        <svg
          className="w-5 h-5 text-indigo-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      label: 'Topper',
      value: stats.topper_score ?? '—',
      sub: stats.topper ?? '—',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      icon: (
        <svg
          className="w-5 h-5 text-emerald-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      ),
    },
    {
      label: 'Lowest Score',
      value: stats.lowest_score ?? '—',
      sub: 'needs attention',
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      icon: (
        <svg
          className="w-5 h-5 text-rose-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
          />
        </svg>
      ),
    },
    {
      label: 'Failed Students',
      value: stats.fail_count ?? '—',
      sub: `${passRate}% pass rate`,
      color: 'text-red-600',
      bg: 'bg-red-50',
      icon: (
        <svg
          className="w-5 h-5 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <div
              className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}
            >
              {card.icon}
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-0.5">
                {card.label}
              </p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {card.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-700">Pass Rate</p>
          <p className="text-sm font-bold text-slate-800">{passRate}%</p>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700"
            style={{ width: `${passRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>{stats.total_students - stats.fail_count} passed</span>
          <span>{stats.fail_count} failed</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-700 mb-4">
          Score Distribution
        </p>
        <div className="space-y-3">
          {[
            { label: '75 – 90', range: [75, 90], color: 'bg-emerald-500' },
            { label: '50 – 74', range: [50, 74], color: 'bg-amber-400' },
            { label: 'Below 50', range: [0, 49], color: 'bg-red-500' },
          ].map((band) => {
            const count = stats.distribution?.[band.label] ?? 0;
            const pct =
              stats.total_students > 0
                ? ((count / stats.total_students) * 100).toFixed(1)
                : 0;
            return (
              <div key={band.label} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-20 shrink-0">
                  {band.label}
                </span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${band.color} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-600 w-16 text-right">
                  {count} students
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

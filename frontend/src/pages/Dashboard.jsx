import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, attendanceApi } from '../api/client';
import AttendanceChart from '../components/AttendanceChart';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([dashboardApi.getStats(), attendanceApi.getDefaulters()])
      .then(([statsRes, defaultersRes]) => {
        setStats(statsRes.data);
        setDefaulters(defaultersRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats
    ? [
        {
          label: 'Total Students',
          value: stats.total_students,
          sub: 'in your class',
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          ),
          bg: 'bg-indigo-50',
          color: 'text-indigo-600',
          border: 'border-indigo-100',
        },
        {
          label: 'At Risk Students',
          value: stats.at_risk_count,
          sub: 'below 75% attendance',
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
          bg: 'bg-red-50',
          color: 'text-red-600',
          border: 'border-red-100',
          urgent: stats.at_risk_count > 0,
        },
        {
          label: 'Classes Today',
          value: `${stats.classes_taken_today} / ${stats.classes_taken_today + stats.classes_pending_today}`,
          sub: `${stats.classes_pending_today} pending`,
          icon: (
            <svg
              className="w-5 h-5 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          ),
          bg: 'bg-amber-50',
          color: 'text-amber-600',
          border: 'border-amber-100',
        },
        {
          label: 'Last Assessment Avg',
          value: stats.last_assessment_average?.toFixed(1) ?? '—',
          sub: 'class average score',
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          ),
          bg: 'bg-emerald-50',
          color: 'text-emerald-600',
          border: 'border-emerald-100',
        },
      ]
    : [];

  const quickActions = [
    {
      label: 'Take Attendance',
      desc: "Mark today's class attendance",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
      path: '/attendance',
      color: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200',
    },
    {
      label: 'Enter Marks',
      desc: 'Update assessment scores',
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
      path: '/marks',
      color:
        'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200',
    },
    {
      label: 'Send Alerts',
      desc: 'Notify students and parents',
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      ),
      path: '/notifications',
      color: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200',
    },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Good{' '}
            {new Date().getHours() < 12
              ? 'Morning'
              : new Date().getHours() < 17
                ? 'Afternoon'
                : 'Evening'}
            ,{' '}
            <span className="text-indigo-600">
              {user?.name?.split(' ')[0] ?? 'Lecturer'}
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-sm text-indigo-700 font-medium">
            System Active
          </span>
        </div>
      </div>

      {stats?.at_risk_count > 0 && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-red-600"
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
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800">
                {stats.at_risk_count} student
                {stats.at_risk_count > 1 ? 's are' : ' is'} at risk of detention
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Attendance below 75% — immediate action required
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/attendance')}
            className="shrink-0 text-sm font-semibold text-red-700 hover:text-red-900 underline underline-offset-2 transition-colors"
          >
            View Defaulters
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow ${card.urgent ? 'border-red-200 ring-1 ring-red-200' : 'border-slate-200'}`}
          >
            <div
              className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}
            >
              {card.icon}
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
              {card.label}
            </p>
            <p className={`text-3xl font-bold mt-1 ${card.color}`}>
              {card.value}
            </p>
            <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl shadow-lg transition-all hover:-translate-y-0.5 ${action.color}`}
            >
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                {action.icon}
              </div>
              <div className="text-left">
                <p className="font-semibold">{action.label}</p>
                <p className="text-xs opacity-80 mt-0.5">{action.desc}</p>
              </div>
              <svg
                className="w-5 h-5 ml-auto opacity-60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
            Attendance Overview
          </h2>
          <AttendanceChart
            subjectId={null}
            dashboardMode
            stats={stats?.distribution}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
              Defaulter List
            </h2>
            <button
              onClick={() => navigate('/attendance')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View All
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {defaulters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <svg
                  className="w-8 h-8 mb-2 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium text-slate-500">
                  No defaulters
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  All students above 75%
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {defaulters.slice(0, 6).map((d) => (
                  <div
                    key={`${d.student_id}-${d.subject_name}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {d.student_name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {d.subject_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${d.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-red-600 w-10 text-right">
                        {d.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
                {defaulters.length > 6 && (
                  <div className="px-4 py-3 text-center">
                    <button
                      onClick={() => navigate('/attendance')}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      +{defaulters.length - 6} more students
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

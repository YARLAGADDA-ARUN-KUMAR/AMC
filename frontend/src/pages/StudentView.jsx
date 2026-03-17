import { useEffect, useState } from 'react';
import { studentsApi, authApi } from '../api/client';

export default function StudentView({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');

  useEffect(() => {
    if (!user?.id) return;
    studentsApi
      .get(user.id)
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [user]);

  const getAttendanceStatus = (pct) => {
    if (pct >= 85)
      return {
        label: 'Safe',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        bar: 'bg-emerald-500',
        ring: 'ring-emerald-400',
      };
    if (pct >= 75)
      return {
        label: 'Warning',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        bar: 'bg-amber-400',
        ring: 'ring-amber-400',
      };
    return {
      label: 'At Risk',
      color: 'text-red-700 bg-red-50 border-red-200',
      bar: 'bg-red-500',
      ring: 'ring-red-400',
    };
  };

  const getGrade = (total) => {
    if (total == null) return '—';
    if (total >= 81) return 'O';
    if (total >= 71) return 'A+';
    if (total >= 61) return 'A';
    if (total >= 51) return 'B+';
    if (total >= 50) return 'B';
    return 'F';
  };

  const gradeColor = (grade) => {
    if (grade === 'O' || grade === 'A+')
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (grade === 'A' || grade === 'B+')
      return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    if (grade === 'B') return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const tabs = [
    { key: 'attendance', label: 'My Attendance' },
    { key: 'marks', label: 'My Marks' },
    { key: 'notifications', label: 'Notifications' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-6 animate-pulse">
          <div className="h-24 bg-slate-200 rounded-2xl" />
          <div className="h-10 bg-slate-200 rounded-xl" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-3">
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
        <p className="text-slate-500 font-medium">
          Could not load your profile.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-indigo-600 underline underline-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  const avgAttendance =
    profile.attendance.length > 0
      ? (
          profile.attendance.reduce((s, a) => s + a.percentage, 0) /
          profile.attendance.length
        ).toFixed(1)
      : null;

  const arrearCount = profile.marks.filter(
    (m) => m.total != null && m.total < 50,
  ).length;

  const atRiskSubjects = profile.attendance.filter((a) => a.percentage < 75);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 px-6 pt-8 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-indigo-200 text-sm font-medium">
                Academic Monitoring System
              </span>
            </div>
            <button
              onClick={() => {
                authApi.logout().catch(() => {});
                localStorage.removeItem('ams_token');
                localStorage.removeItem('ams_user');
                window.location.href = '/login';
              }}
              className="text-xs text-indigo-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>

          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {profile.student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {profile.student.name}
              </h1>
              <p className="text-indigo-300 font-mono text-sm mt-0.5">
                {profile.student.roll_number}
              </p>
              <p className="text-indigo-300 text-xs mt-0.5">
                {profile.student.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <p className="text-indigo-200 text-xs mb-1">Avg Attendance</p>
              <p className="text-3xl font-bold text-white">
                {avgAttendance ?? '—'}
                <span className="text-lg text-indigo-300">%</span>
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <p className="text-indigo-200 text-xs mb-1">Subjects</p>
              <p className="text-3xl font-bold text-white">
                {profile.attendance.length}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <p className="text-indigo-200 text-xs mb-1">Arrears</p>
              <p
                className={`text-3xl font-bold ${arrearCount > 0 ? 'text-red-300' : 'text-white'}`}
              >
                {arrearCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-10">
        {atRiskSubjects.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-start gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg
                className="w-4 h-4 text-red-600"
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
                Attendance below 75% in {atRiskSubjects.length} subject
                {atRiskSubjects.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                {atRiskSubjects.map((s) => s.subject_name).join(', ')} — Risk of
                detention
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-100">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === t.key
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === 'attendance' && (
              <div className="space-y-4">
                {profile.attendance.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    No attendance records yet.
                  </div>
                ) : (
                  profile.attendance.map((a) => {
                    const status = getAttendanceStatus(a.percentage);
                    const canMiss = Math.max(
                      0,
                      Math.floor((a.attended - 0.75 * a.total) / 0.75),
                    );
                    const needMore = Math.max(
                      0,
                      Math.ceil((0.75 * a.total - a.attended) / 0.25),
                    );
                    return (
                      <div
                        key={a.subject_id}
                        className="rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800">
                              {a.subject_name}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {a.attended} attended out of {a.total} classes
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${status.color}`}
                            >
                              {status.label}
                            </span>
                            <span
                              className={`text-xl font-bold ${a.percentage < 75 ? 'text-red-600' : a.percentage < 85 ? 'text-amber-600' : 'text-emerald-600'}`}
                            >
                              {a.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                          <div
                            className={`h-full rounded-full ${status.bar} transition-all duration-700`}
                            style={{ width: `${Math.min(a.percentage, 100)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>
                              <span className="font-semibold text-slate-700">
                                {a.attended}
                              </span>{' '}
                              present
                            </span>
                            <span>
                              <span className="font-semibold text-slate-700">
                                {a.total - a.attended}
                              </span>{' '}
                              absent
                            </span>
                          </div>
                          <div className="text-xs">
                            {a.percentage < 75 ? (
                              <span className="text-red-600 font-medium bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                                Attend {needMore} more to reach 75%
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                Can miss {canMiss} more class
                                {canMiss !== 1 ? 'es' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'marks' && (
              <div className="space-y-4">
                {profile.marks.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    No marks recorded yet.
                  </div>
                ) : (
                  profile.marks.map((m) => {
                    const grade = getGrade(m.total);
                    const isFail = m.total != null && m.total < 50;
                    return (
                      <div
                        key={m.subject_id}
                        className={`rounded-2xl border p-5 hover:shadow-sm transition-shadow ${isFail ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800">
                              {m.subject_name}
                            </h3>
                            {m.is_locked && (
                              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mt-1 inline-block">
                                Finalized
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-bold px-3 py-1 rounded-full border ${gradeColor(grade)}`}
                            >
                              Grade {grade}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-5 gap-2 mb-4">
                          {[
                            { label: 'IA 1', value: m.ia1_score, max: 25 },
                            { label: 'IA 2', value: m.ia2_score, max: 25 },
                            { label: 'Model', value: m.model_score, max: 25 },
                            {
                              label: 'Assign.',
                              value: m.assignment_score,
                              max: 10,
                            },
                            {
                              label: 'Attend.',
                              value: m.attendance_marks,
                              max: 5,
                            },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="bg-white rounded-xl border border-slate-200 p-2.5 text-center shadow-sm"
                            >
                              <p className="text-xs text-slate-400 mb-1">
                                {item.label}
                              </p>
                              <p className="text-base font-bold text-slate-800">
                                {item.value != null ? item.value : '—'}
                              </p>
                              <p className="text-xs text-slate-300">
                                /{item.max}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3">
                          <span className="text-sm text-slate-600 font-medium">
                            Total Score
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xl font-bold ${isFail ? 'text-red-600' : 'text-slate-800'}`}
                            >
                              {m.total != null ? m.total.toFixed(1) : '—'}
                            </span>
                            <span className="text-sm text-slate-400">/ 90</span>
                            {isFail && (
                              <span className="text-xs font-semibold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">
                                Arrear
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-3">
                {profile.notifications.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    No notifications received yet.
                  </div>
                ) : (
                  profile.notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-2xl border p-4 hover:shadow-sm transition-shadow ${
                        n.status === 'failed'
                          ? 'border-red-200 bg-red-50/20'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-sm font-medium text-slate-800 leading-snug">
                          {n.subject_line}
                        </p>
                        <span
                          className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                            n.status === 'sent'
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : 'text-red-700 bg-red-50 border-red-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${n.status === 'sent' ? 'bg-emerald-500' : 'bg-red-500'}`}
                          />
                          {n.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="capitalize bg-slate-100 px-2 py-0.5 rounded-full">
                          {n.notification_type.replace(/_/g, ' ')}
                        </span>
                        <span>
                          {new Date(n.sent_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6 mb-8">
          Read-only view — Contact your lecturer for any corrections
        </p>
      </div>
    </div>
  );
}

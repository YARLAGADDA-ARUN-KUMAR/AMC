/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { studentsApi } from '../api/client';

export default function StudentPanel({ studentId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    studentsApi
      .get(studentId)
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [studentId]);

  const getAttendanceColor = (pct) => {
    if (pct >= 85)
      return {
        bar: 'bg-emerald-500',
        text: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
      };
    if (pct >= 75)
      return {
        bar: 'bg-amber-400',
        text: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
      };
    return {
      bar: 'bg-red-500',
      text: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
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
      return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (grade === 'A' || grade === 'B+')
      return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    if (grade === 'B') return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const tabs = [
    { key: 'attendance', label: 'Attendance' },
    { key: 'marks', label: 'Marks' },
    { key: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-slide-in">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-4 w-full px-8 animate-pulse">
              <div className="h-12 w-12 rounded-full bg-slate-200 mx-auto" />
              <div className="h-4 w-40 bg-slate-200 rounded mx-auto" />
              <div className="h-3 w-28 bg-slate-100 rounded mx-auto" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
        ) : !profile ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <svg
              className="w-10 h-10 mb-3"
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
            <p className="text-sm">Failed to load student profile.</p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 px-6 pt-6 pb-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-bold">
                    {profile.student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg leading-tight">
                      {profile.student.name}
                    </h2>
                    <p className="text-indigo-200 text-sm font-mono mt-0.5">
                      {profile.student.roll_number}
                    </p>
                    <p className="text-indigo-300 text-xs mt-0.5">
                      {profile.student.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                  <p className="text-indigo-200 text-xs">Subjects</p>
                  <p className="text-white font-bold text-lg">
                    {profile.attendance.length}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                  <p className="text-indigo-200 text-xs">Avg Attendance</p>
                  <p className="text-white font-bold text-lg">
                    {profile.attendance.length > 0
                      ? (
                          profile.attendance.reduce(
                            (s, a) => s + a.percentage,
                            0,
                          ) / profile.attendance.length
                        ).toFixed(1)
                      : '—'}
                    %
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                  <p className="text-indigo-200 text-xs">Arrears</p>
                  <p className="text-white font-bold text-lg">
                    {
                      profile.marks.filter(
                        (m) => m.total != null && m.total < 50,
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="flex border-b border-slate-100 bg-white px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {activeTab === 'attendance' && (
                <div className="space-y-3">
                  {profile.attendance.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">
                      No attendance records found.
                    </p>
                  ) : (
                    profile.attendance.map((a) => {
                      const colors = getAttendanceColor(a.percentage);
                      const canMiss = Math.max(
                        0,
                        Math.floor((a.total * 0.75 - a.attended) / (1 - 0.75)),
                      );
                      const needToAttend = Math.max(
                        0,
                        Math.ceil((0.75 * a.total - a.attended) / (1 - 0.75)),
                      );
                      return (
                        <div
                          key={a.subject_id}
                          className={`rounded-xl border p-4 ${colors.bg} ${colors.border}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-slate-800">
                              {a.subject_name}
                            </p>
                            <span
                              className={`text-sm font-bold ${colors.text}`}
                            >
                              {a.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden mb-2">
                            <div
                              className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
                              style={{
                                width: `${Math.min(a.percentage, 100)}%`,
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>
                              {a.attended} / {a.total} classes
                            </span>
                            {a.percentage < 75 ? (
                              <span className="text-red-600 font-medium">
                                Attend {needToAttend} more to reach 75%
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-medium">
                                Can miss {canMiss} more class
                                {canMiss !== 1 ? 'es' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'marks' && (
                <div className="space-y-3">
                  {profile.marks.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">
                      No marks recorded yet.
                    </p>
                  ) : (
                    profile.marks.map((m) => {
                      const grade = getGrade(m.total);
                      return (
                        <div
                          key={m.subject_id}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-slate-800">
                              {m.subject_name}
                            </p>
                            <div className="flex items-center gap-2">
                              {m.is_locked && (
                                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                  Locked
                                </span>
                              )}
                              <span
                                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${gradeColor(grade)}`}
                              >
                                {grade}
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-5 gap-2 mb-3">
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
                                className="text-center bg-slate-50 rounded-lg py-2"
                              >
                                <p className="text-xs text-slate-400">
                                  {item.label}
                                </p>
                                <p className="text-sm font-bold text-slate-700">
                                  {item.value != null ? item.value : '—'}
                                </p>
                                <p className="text-xs text-slate-300">
                                  /{item.max}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                            <span className="text-xs text-slate-500">
                              Total
                            </span>
                            <span
                              className={`text-base font-bold ${m.total != null && m.total < 50 ? 'text-red-600' : 'text-slate-800'}`}
                            >
                              {m.total != null ? m.total.toFixed(1) : '—'} / 90
                            </span>
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
                    <p className="text-sm text-slate-400 text-center py-8">
                      No notifications sent yet.
                    </p>
                  ) : (
                    profile.notifications.map((n) => (
                      <div
                        key={n.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-medium text-slate-800 leading-snug">
                            {n.subject_line}
                          </p>
                          <span
                            className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${
                              n.status === 'sent'
                                ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                                : 'text-red-600 bg-red-50 border-red-200'
                            }`}
                          >
                            {n.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                          <span className="capitalize">
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
                        <p className="text-xs text-slate-400 mt-1">
                          To: {n.recipient_email} ({n.recipient_role})
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}

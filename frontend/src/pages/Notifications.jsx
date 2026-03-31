/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import { notifyApi, subjectsApi, attendanceApi } from '../api/client';

export default function Notifications() {
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [log, setLog] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [loadingLog, setLoadingLog] = useState(true);
  const [sending, setSending] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    subjectsApi.list().then((res) => {
      setSubjects(res.data);
      if (res.data.length > 0) setSelectedSubject(res.data[0].id);
    });
    fetchLog();
  }, []);

  const fetchLog = () => {
    setLoadingLog(true);
    notifyApi
      .getLog()
      .then((res) => setLog(res.data))
      .catch(() => setLog([]))
      .finally(() => setLoadingLog(false));
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const handleSend = async (type) => {
    setSending(type);
    try {
      switch (type) {
        case 'absent_today':
          if (!selectedSession) {
            showError('Please select a session first.');
            return;
          }
          await notifyApi.sendAbsentToday(selectedSession);
          showSuccess('Absence notifications sent to absent students.');
          break;
        case 'low_attendance':
          if (!selectedSubject) {
            showError('Please select a subject first.');
            return;
          }
          await notifyApi.sendLowAttendance(selectedSubject);
          showSuccess(
            'Low attendance alerts sent to at-risk students and parents.',
          );
          break;
        case 'marks_published':
          if (!selectedSubject) {
            showError('Please select a subject first.');
            return;
          }
          await notifyApi.sendMarksPublished(selectedSubject);
          showSuccess('Marks report sent to all students and parents.');
          break;
        case 'hod_report':
          await notifyApi.sendHodReport();
          showSuccess('Full attendance summary sent to HOD.');
          break;
        default:
          break;
      }
      fetchLog();
    } catch (err) {
      showError(
        err.response?.data?.message ||
          'Failed to send notification. Please try again.',
      );
    } finally {
      setSending('');
    }
  };

  const notificationTypes = [
    {
      id: 'absent_today',
      title: "Today's Absent Students",
      desc: 'Send attendance email to students who were absent in the selected session.',
      recipients: 'Absent students only',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      ),
      color: 'bg-slate-600',
      requiresSession: true,
      requiresSubject: false,
    },
    {
      id: 'low_attendance',
      title: 'Low Attendance Warning',
      desc: "Send warning to students below 85% and urgent alert to students below 75% with 'X classes you can still miss' calculation.",
      recipients: 'Students  (+ HOD if below 75%)',
      icon: (
        <svg
          className="w-5 h-5"
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
      color: 'bg-amber-500',
      requiresSession: false,
      requiresSubject: true,
    },
    {
      id: 'marks_published',
      title: 'Marks Published',
      desc: 'Send full score breakdown — IA1, IA2, Model, Assignment, Total, Grade — to all students and parents.',
      recipients: 'All students',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      color: 'bg-indigo-600',
      requiresSession: false,
      requiresSubject: true,
    },
    {
      id: 'hod_report',
      title: 'Weekly HOD Report',
      desc: 'Send full class attendance summary across all subjects to the HOD. Includes defaulter list and subject-wise breakdown.',
      recipients: 'HOD only',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      color: 'bg-violet-600',
      requiresSession: false,
      requiresSubject: false,
    },
  ];

  const uniqueTypes = [...new Set(log.map((l) => l.notification_type))];

  const filteredLog = log.filter((l) => {
    if (filterType !== 'all' && l.notification_type !== filterType)
      return false;
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    return true;
  });

  const sentCount = log.filter((l) => l.status === 'sent').length;
  const failedCount = log.filter((l) => l.status === 'failed').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">
            Send alerts to students and HOD via email
          </p>
        </div>
        <div className="flex items-center gap-3">
          {successMsg && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
              <svg
                className="w-4 h-4 shrink-0"
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
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              <svg
                className="w-4 h-4 shrink-0"
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
              {errorMsg}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
              Total Sent
            </p>
            <p className="text-2xl font-bold text-indigo-600">{log.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
              Delivered
            </p>
            <p className="text-2xl font-bold text-emerald-600">{sentCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
              Failed
            </p>
            <p className="text-2xl font-bold text-red-600">{failedCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
          Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="">Select a subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Session ID{' '}
              <span className="text-slate-400 normal-case font-normal">
                (for absent-today alert)
              </span>
            </label>
            <input
              type="number"
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              placeholder="Enter session ID"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
          Send Notifications
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notificationTypes.map((n) => (
            <div
              key={n.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl ${n.color} flex items-center justify-center text-white shrink-0`}
                >
                  {n.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-800">
                    {n.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {n.desc}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5 text-slate-400"
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
                  <span className="text-xs text-slate-400">{n.recipients}</span>
                </div>
                <button
                  onClick={() => handleSend(n.id)}
                  disabled={
                    sending === n.id ||
                    (n.requiresSubject && !selectedSubject) ||
                    (n.requiresSession && !selectedSession)
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white ${n.color} hover:opacity-90 shadow-sm`}
                >
                  {sending === n.id ? (
                    <>
                      <svg
                        className="w-3.5 h-3.5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
            Notification Log
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
            <button
              onClick={fetchLog}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loadingLog ? (
            <div className="p-8 text-center text-slate-400 text-sm animate-pulse">
              Loading notification log...
            </div>
          ) : filteredLog.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-10 h-10 text-slate-300 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p className="text-slate-500 font-medium">
                No notifications found
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Send a notification to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-3 text-left font-medium">Type</th>
                    <th className="px-5 py-3 text-left font-medium">
                      Recipient
                    </th>
                    <th className="px-5 py-3 text-left font-medium">Role</th>
                    <th className="px-5 py-3 text-left font-medium">
                      Subject Line
                    </th>
                    <th className="px-5 py-3 text-center font-medium">
                      Status
                    </th>
                    <th className="px-5 py-3 text-right font-medium">
                      Sent At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLog.map((entry) => (
                    <tr
                      key={entry.id}
                      className={`hover:bg-slate-50 transition-colors ${entry.status === 'failed' ? 'bg-red-50/30' : ''}`}
                    >
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                          {entry.notification_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs font-mono">
                        {entry.recipient_email}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${
                            entry.recipient_role === 'student'
                              ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
                              : entry.recipient_role === 'parent'
                                ? 'text-violet-700 bg-violet-50 border-violet-200'
                                : 'text-amber-700 bg-amber-50 border-amber-200'
                          }`}
                        >
                          {entry.recipient_role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-700 max-w-xs truncate">
                        {entry.subject_line}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            entry.status === 'sent'
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : 'text-red-700 bg-red-50 border-red-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${entry.status === 'sent' ? 'bg-emerald-500' : 'bg-red-500'}`}
                          />
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-slate-400 whitespace-nowrap">
                        {new Date(entry.sent_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

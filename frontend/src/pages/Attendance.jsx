import { useEffect, useState } from 'react';
import {
  attendanceApi,
  subjectsApi,
  studentsApi,
  notifyApi,
} from '../api/client';
import AttendanceTable from '../components/AttendanceTable';
import StudentPanel from '../components/StudentPanel';

export default function Attendance() {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [sessionType, setSessionType] = useState('regular');
  const [activeSession, setActiveSession] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [tab, setTab] = useState('mark');
  const [creating, setCreating] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [markingHoliday, setMarkingHoliday] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    subjectsApi.list().then((res) => {
      setSubjects(res.data);
      if (res.data.length > 0) setSelectedSubject(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    Promise.all([
      studentsApi.list(),
      attendanceApi.getSummary(selectedSubject),
      attendanceApi.getDefaulters(),
    ]).then(([studRes, sumRes, defRes]) => {
      setStudents(studRes.data);
      setSummary(sumRes.data);
      setDefaulters(defRes.data);
    });
  }, [selectedSubject]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleCreateSession = async () => {
    if (!selectedSubject) return;
    setCreating(true);
    try {
      const res = await attendanceApi.createSession({
        subject_id: selectedSubject,
        date: selectedDate,
        period: selectedPeriod,
        session_type: sessionType,
      });
      setActiveSession(res.data);
      showSuccess('Session created. Mark attendance below.');
    } catch (err) {
      alert(
        err.response?.data?.message ||
          'Failed to create session. It may already exist.',
      );
    } finally {
      setCreating(false);
    }
  };

  const handleMarkHoliday = async () => {
    if (!selectedSubject || !selectedDate) return;
    setMarkingHoliday(true);
    try {
      await attendanceApi.markHoliday(selectedSubject, selectedDate);
      showSuccess('Date marked as holiday. Excluded from calculations.');
    } catch {
      alert('Failed to mark holiday.');
    } finally {
      setMarkingHoliday(false);
    }
  };

  const handleNotifyAbsent = async () => {
    if (!activeSession) return;
    setNotifying(true);
    try {
      await notifyApi.sendAbsentToday(activeSession.id);
      showSuccess('Absence notification sent to absent students.');
    } catch {
      alert('Failed to send notifications.');
    } finally {
      setNotifying(false);
    }
  };

  const handleNotifyLowAttendance = async () => {
    if (!selectedSubject) return;
    setNotifying(true);
    try {
      await notifyApi.sendLowAttendance(selectedSubject);
      showSuccess(
        'Low attendance alerts sent to at-risk students and parents.',
      );
    } catch {
      alert('Failed to send low attendance alerts.');
    } finally {
      setNotifying(false);
    }
  };

  const getAttendanceColor = (pct) => {
    if (pct >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (pct >= 75) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getBarColor = (pct) => {
    if (pct >= 85) return 'bg-emerald-500';
    if (pct >= 75) return 'bg-amber-400';
    return 'bg-red-500';
  };

  const tabs = [
    { key: 'mark', label: 'Mark Attendance' },
    { key: 'summary', label: 'Summary' },
    { key: 'defaulters', label: `Defaulters (${defaulters.length})` },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage class attendance per subject and period
          </p>
        </div>
        {successMsg && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {successMsg}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
          Session Setup
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              {[1, 2, 3, 4, 5, 6].map((p) => (
                <option key={p} value={p}>
                  Period {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Session Type
            </label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="regular">Regular</option>
              <option value="makeup">Makeup Class</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCreateSession}
            disabled={creating || !selectedSubject}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            {creating ? 'Creating...' : 'Start Session'}
          </button>
          <button
            onClick={handleMarkHoliday}
            disabled={markingHoliday || !selectedSubject}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
          >
            {markingHoliday ? 'Marking...' : 'Mark as Holiday'}
          </button>
          {activeSession && (
            <button
              onClick={handleNotifyAbsent}
              disabled={notifying}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {notifying ? 'Sending...' : 'Notify Absent Students'}
            </button>
          )}
          <button
            onClick={handleNotifyLowAttendance}
            disabled={notifying || !selectedSubject}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-700 text-sm font-semibold rounded-xl border border-red-200 transition-colors"
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {notifying ? 'Sending...' : 'Alert At-Risk Students'}
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'mark' && (
        <div>
          {!activeSession ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <p className="text-slate-600 font-medium">No active session</p>
              <p className="text-slate-400 text-sm mt-1">
                Configure the session above and click Start Session
              </p>
            </div>
          ) : (
            <AttendanceTable
              students={students}
              sessionId={activeSession.id}
              onSaved={() => {
                showSuccess('Attendance saved successfully.');
                attendanceApi
                  .getSummary(selectedSubject)
                  .then((res) => setSummary(res.data));
              }}
            />
          )}
        </div>
      )}

      {tab === 'summary' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">
              Attendance Summary
            </h2>
            <span className="text-xs text-slate-400">
              {summary.length} students
            </span>
          </div>
          {summary.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No attendance data yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="px-6 py-3 text-left font-medium">#</th>
                    <th className="px-6 py-3 text-left font-medium">Roll No</th>
                    <th className="px-6 py-3 text-left font-medium">Student</th>
                    <th className="px-6 py-3 text-center font-medium">
                      Attended
                    </th>
                    <th className="px-6 py-3 text-center font-medium">Total</th>
                    <th className="px-6 py-3 text-center font-medium">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-center font-medium">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center font-medium">
                      Profile
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.map((s, idx) => (
                    <tr
                      key={s.student_id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-3 text-slate-400">{idx + 1}</td>
                      <td className="px-6 py-3 font-mono text-slate-600">
                        {s.roll_number}
                      </td>
                      <td className="px-6 py-3 font-medium text-slate-800">
                        {s.student_name}
                      </td>
                      <td className="px-6 py-3 text-center text-slate-600">
                        {s.attended}
                      </td>
                      <td className="px-6 py-3 text-center text-slate-600">
                        {s.total}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getBarColor(s.percentage)}`}
                              style={{ width: `${s.percentage}%` }}
                            />
                          </div>
                          <span
                            className={`text-xs font-bold ${s.percentage < 75 ? 'text-red-600' : s.percentage < 85 ? 'text-amber-600' : 'text-emerald-600'}`}
                          >
                            {s.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getAttendanceColor(s.percentage)}`}
                        >
                          {s.percentage >= 85
                            ? 'Safe'
                            : s.percentage >= 75
                              ? 'Warning'
                              : 'At Risk'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => setSelectedStudent(s.student_id)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'defaulters' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Defaulter List
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Students below 75% attendance in any subject
              </p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full">
              {defaulters.length} defaulters
            </span>
          </div>
          {defaulters.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-10 h-10 text-emerald-400 mx-auto mb-3"
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
              <p className="text-slate-500 font-medium">No defaulters</p>
              <p className="text-slate-400 text-sm mt-1">
                All students are above 75% attendance
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="px-6 py-3 text-left font-medium">#</th>
                    <th className="px-6 py-3 text-left font-medium">Student</th>
                    <th className="px-6 py-3 text-left font-medium">Roll No</th>
                    <th className="px-6 py-3 text-left font-medium">Subject</th>
                    <th className="px-6 py-3 text-center font-medium">
                      Attended
                    </th>
                    <th className="px-6 py-3 text-center font-medium">
                      Missed
                    </th>
                    <th className="px-6 py-3 text-center font-medium">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-center font-medium">
                      Profile
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {defaulters.map((d, idx) => (
                    <tr
                      key={`${d.student_id}-${d.subject_name}`}
                      className="bg-red-50/30 hover:bg-red-50 transition-colors"
                    >
                      <td className="px-6 py-3 text-slate-400">{idx + 1}</td>
                      <td className="px-6 py-3 font-medium text-slate-800">
                        {d.student_name}
                      </td>
                      <td className="px-6 py-3 font-mono text-slate-600">
                        {d.roll_number}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {d.subject_name}
                      </td>
                      <td className="px-6 py-3 text-center text-slate-600">
                        {d.attended}
                      </td>
                      <td className="px-6 py-3 text-center text-red-600 font-medium">
                        {d.missed}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2.5 py-1 rounded-full">
                          {d.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => setSelectedStudent(d.student_id)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedStudent && (
        <StudentPanel
          studentId={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}

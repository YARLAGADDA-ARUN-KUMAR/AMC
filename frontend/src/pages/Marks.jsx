/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import { subjectsApi, studentsApi, marksApi, notifyApi } from '../api/client';
import MarksTable from '../components/MarksTable';
import StatsSummary from '../components/StatsSummary';
import StudentPanel from '../components/StudentPanel';

export default function Marks() {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [tab, setTab] = useState('entry');
  const [notifying, setNotifying] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [arrears, setArrears] = useState([]);
  const [loadingArrears, setLoadingArrears] = useState(false);

  useEffect(() => {
    subjectsApi.list().then((res) => {
      setSubjects(res.data);
      if (res.data.length > 0) setSelectedSubject(res.data[0].id);
    });
    studentsApi.list().then((res) => setStudents(res.data));
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    setLoadingArrears(true);
    marksApi
      .getBySubject(selectedSubject)
      .then((res) => {
        const failed = res.data.filter((m) => m.total != null && m.total < 50);
        setArrears(failed);
      })
      .catch(() => setArrears([]))
      .finally(() => setLoadingArrears(false));
  }, [selectedSubject]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleNotifyMarks = async () => {
    if (!selectedSubject) return;
    setNotifying(true);
    try {
      await notifyApi.sendMarksPublished(selectedSubject);
      showSuccess('Marks report sent to all students and parents.');
    } catch {
      alert('Failed to send marks notification.');
    } finally {
      setNotifying(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await marksApi.downloadPdf(selectedSubject);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `marksheet_subject_${selectedSubject}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccess('PDF mark sheet downloaded.');
    } catch {
      alert('Failed to download PDF.');
    }
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
    { key: 'entry', label: 'Marks Entry' },
    { key: 'stats', label: 'Statistics' },
    { key: 'arrears', label: `Arrears (${arrears.length})` },
  ];

  const currentSubject = subjects.find((s) => s.id === Number(selectedSubject));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Marks Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Enter and manage assessment scores for each subject
          </p>
        </div>
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
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Select Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.code}
                </option>
              ))}
            </select>
          </div>

          {currentSubject && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-indigo-500 font-medium">
                  Semester {currentSubject.semester}
                </p>
                <p className="text-sm font-semibold text-indigo-800">
                  {currentSubject.code}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleDownloadPdf}
              disabled={!selectedSubject}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              Export PDF
            </button>
            <button
              onClick={handleNotifyMarks}
              disabled={notifying || !selectedSubject}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
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
              {notifying ? 'Sending...' : 'Notify Students'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'IA 1', max: '25', color: 'indigo' },
          { label: 'IA 2', max: '25', color: 'violet' },
          { label: 'Model Exam', max: '25', color: 'emerald' },
          { label: 'Assignment', max: '10', color: 'amber' },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm"
          >
            <div
              className={`w-8 h-8 rounded-lg bg-${item.color}-100 flex items-center justify-center shrink-0`}
            >
              <span className={`text-xs font-bold text-${item.color}-600`}>
                {item.max}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-sm font-semibold text-slate-700">
                Max {item.max} marks
              </p>
            </div>
          </div>
        ))}
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

      {tab === 'entry' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-center gap-3">
            <svg
              className="w-4 h-4 text-amber-600 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-amber-800">
              Use{' '}
              <kbd className="px-1.5 py-0.5 bg-amber-100 border border-amber-300 rounded text-xs font-mono">
                Tab
              </kbd>{' '}
              to move between cells quickly. Click{' '}
              <span className="font-semibold">Save All</span> when done, then{' '}
              <span className="font-semibold">Submit to HOD</span> to lock
              marks.
            </p>
          </div>
          {selectedSubject && (
            <MarksTable
              subjectId={selectedSubject}
              onSubmitted={() =>
                showSuccess('Marks submitted to HOD and locked successfully.')
              }
            />
          )}
        </div>
      )}

      {tab === 'stats' && (
        <div className="space-y-4">
          {selectedSubject && <StatsSummary subjectId={selectedSubject} />}
        </div>
      )}

      {tab === 'arrears' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Arrear Tracker
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Students scoring below 50 marks in this subject
              </p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full">
              {arrears.length} arrear{arrears.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loadingArrears ? (
            <div className="p-8 text-center text-slate-400 text-sm animate-pulse">
              Loading arrear data...
            </div>
          ) : arrears.length === 0 ? (
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
              <p className="text-slate-500 font-medium">No arrears</p>
              <p className="text-slate-400 text-sm mt-1">
                All students have passed this subject
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="px-6 py-3 text-left font-medium">#</th>
                    <th className="px-6 py-3 text-left font-medium">Roll No</th>
                    <th className="px-6 py-3 text-left font-medium">Student</th>
                    <th className="px-6 py-3 text-center font-medium">IA 1</th>
                    <th className="px-6 py-3 text-center font-medium">IA 2</th>
                    <th className="px-6 py-3 text-center font-medium">Model</th>
                    <th className="px-6 py-3 text-center font-medium">
                      Assign.
                    </th>
                    <th className="px-6 py-3 text-center font-medium">
                      Attend.
                    </th>
                    <th className="px-6 py-3 text-center font-medium">Total</th>
                    <th className="px-6 py-3 text-center font-medium">Grade</th>
                    <th className="px-6 py-3 text-center font-medium">
                      Profile
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {arrears.map((m, idx) => {
                    const grade = getGrade(m.total);
                    return (
                      <tr
                        key={m.student_id}
                        className="bg-red-50/40 hover:bg-red-50 transition-colors"
                      >
                        <td className="px-6 py-3 text-slate-400">{idx + 1}</td>
                        <td className="px-6 py-3 font-mono text-slate-600">
                          {m.roll_number}
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-800">
                          {m.student_name}
                        </td>
                        <td className="px-6 py-3 text-center text-slate-600">
                          {m.ia1_score ?? '—'}
                        </td>
                        <td className="px-6 py-3 text-center text-slate-600">
                          {m.ia2_score ?? '—'}
                        </td>
                        <td className="px-6 py-3 text-center text-slate-600">
                          {m.model_score ?? '—'}
                        </td>
                        <td className="px-6 py-3 text-center text-slate-600">
                          {m.assignment_score ?? '—'}
                        </td>
                        <td className="px-6 py-3 text-center text-slate-600">
                          {m.attendance_marks ?? '—'}
                        </td>
                        <td className="px-6 py-3 text-center font-bold text-red-700">
                          {m.total != null ? m.total.toFixed(1) : '—'}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${gradeColor(grade)}`}
                          >
                            {grade}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <button
                            onClick={() => setSelectedStudent(m.student_id)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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

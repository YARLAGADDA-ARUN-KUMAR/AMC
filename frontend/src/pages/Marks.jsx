/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import { marksApi, notifyApi, studentsApi, subjectsApi } from '../api/client';
import MarksTable from '../components/MarksTable';
import StudentPanel from '../components/StudentPanel';

export default function Marks() {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [tab, setTab] = useState('entry');
  const [notifying, setNotifying] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [failedStudents, setFailedStudents] = useState([]);

  useEffect(() => {
    subjectsApi.list().then((res) => {
      setSubjects(res.data);
      if (res.data.length > 0) setSelectedSubject(res.data[0].id);
    });
    studentsApi.list().then((res) => setStudents(res.data));
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    marksApi
      .getBySubject(selectedSubject)
      .then((res) => {
        const failed = res.data.filter((m) => m.total != null && m.total < 50);
        setFailedStudents(failed);
      })
      .catch(() => setFailedStudents([]));
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
    { key: 'failed', label: `Failed (${failedStudents.length})` },
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
          { label: 'CLA 1', max: '15', color: 'indigo' },
          { label: 'CLA 2', max: '15', color: 'violet' },
          { label: 'CLA 3', max: '15', color: 'violet' },
          { label: 'Model Exam', max: '40', color: 'emerald' },
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
              <span className="font-semibold">Save All</span> when done.
            </p>
          </div>
          {selectedSubject && (
            <MarksTable subjectId={selectedSubject} />
          )}
        </div>
      )}

      {tab === 'failed' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">
              Failed Students (Below 50 marks)
            </h2>
          </div>
          {failedStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No failed students in this subject.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="px-6 py-3 text-left font-medium">Student</th>
                    <th className="px-6 py-3 text-left font-medium">Roll No</th>
                    <th className="px-6 py-3 text-center font-medium">
                      Total Marks
                    </th>
                    <th className="px-6 py-3 text-center font-medium">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {failedStudents.map((m) => (
                    <tr key={m.id} className="bg-red-50/30 hover:bg-red-50">
                      <td className="px-6 py-3 font-medium text-slate-800">
                        {m.student_name}
                      </td>
                      <td className="px-6 py-3 font-mono text-slate-600">
                        {m.roll_number}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="text-red-600 font-bold">
                          {m.total}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full border text-red-700 bg-red-50 border-red-200">
                          F
                        </span>
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

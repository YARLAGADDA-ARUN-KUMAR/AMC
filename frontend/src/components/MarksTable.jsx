import { useState, useEffect } from 'react';
import { marksApi, studentsApi } from '../api/client';

export default function MarksTable({ subjectId, onSubmitted }) {
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const PASS_MARK = 50;

  const fields = [
    { key: 'cla1_score', label: 'CLA 1', max: 15 },
    { key: 'cla2_score', label: 'CLA 2', max: 15 },
    { key: 'cla3_score', label: 'CLA 3', max: 15 },
    { key: 'model_score', label: 'Model Exam', max: 40 },
  ];

  useEffect(() => {
    if (!subjectId) return;
    setLoading(true);
    Promise.all([marksApi.getBySubject(subjectId), studentsApi.list()])
      .then(([marksRes, studentsRes]) => {
        const existingMarks = marksRes.data;
        const allStudents = studentsRes.data;
        const marksByStudentId = {};
        existingMarks.forEach((m) => {
          marksByStudentId[m.student_id] = m;
        });
        const merged = allStudents.map((student) => {
          if (marksByStudentId[student.id]) {
            return marksByStudentId[student.id];
          }
          return {
            id: null,
            student_id: student.id,
            student_name: student.name,
            roll_number: student.roll_number,
            subject_id: subjectId,
            cla1_score: null,
            cla2_score: null,
            cla3_score: null,
            model_score: null,
            total: null,
            is_locked: false,
          };
        });
        setMarks(merged);
        setStudents(allStudents);
      })
      .catch(() => alert('Failed to load marks.'))
      .finally(() => setLoading(false));
  }, [subjectId]);

  const computeTotal = (row) => {
    const vals = fields.map((f) => parseFloat(row[f.key]) || 0);
    return vals.reduce((a, b) => a + b, 0);
  };

  const handleChange = (studentId, field, value) => {
    const fieldDef = fields.find((f) => f.key === field);
    let numValue = parseFloat(value);
    if (isNaN(numValue)) numValue = '';
    else if (numValue < 0) numValue = 0;
    else if (fieldDef && numValue > fieldDef.max) numValue = fieldDef.max;

    setMarks((prev) =>
      prev.map((m) => {
        if (m.student_id !== studentId) return m;
        const updated = { ...m, [field]: numValue };
        updated.total = computeTotal(updated);
        return updated;
      }),
    );
  };

  const handleKeyDown = (e, rowIdx, fieldIdx) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const totalCells = marks.length * fields.length;
      const current = rowIdx * fields.length + fieldIdx;
      const next = (current + 1) % totalCells;
      const nextRow = Math.floor(next / fields.length);
      const nextField = next % fields.length;
      const el = document.getElementById(`cell-${nextRow}-${nextField}`);
      if (el) el.focus();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await marksApi.bulkSave(subjectId, marks);
    } catch {
      alert('Failed to save marks.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await marksApi.submit(subjectId);
      setConfirmSubmit(false);
      if (onSubmitted) onSubmitted();
      setMarks((prev) => prev.map((m) => ({ ...m, is_locked: true })));
    } catch {
      alert('Failed to submit marks.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await marksApi.downloadPdf(subjectId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `marks_subject_${subjectId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Failed to download PDF.');
    }
  };

  const isLocked = marks.length > 0 && marks.some((m) => m.is_locked);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        Loading marks...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Marks Entry</h2>
          {isLocked && (
            <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Locked — Submitted to HOD
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
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
          {!isLocked && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving...' : 'Save All'}
              </button>
              <button
                onClick={() => setConfirmSubmit(true)}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
              >
                Submit to HOD
              </button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
              <th className="px-4 py-3 text-left font-medium sticky left-0 bg-slate-50">
                #
              </th>
              <th className="px-4 py-3 text-left font-medium sticky left-8 bg-slate-50">
                Roll No
              </th>
              <th className="px-4 py-3 text-left font-medium">Student Name</th>
              {fields.map((f) => (
                <th key={f.key} className="px-4 py-3 text-center font-medium">
                  {f.label}
                  <span className="text-slate-400 normal-case">/{f.max}</span>
                </th>
              ))}
              <th className="px-4 py-3 text-center font-medium">
                Total<span className="text-slate-400 normal-case">/85</span>
              </th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {marks.map((m, rowIdx) => {
              const isFail = (m.total || 0) < PASS_MARK;
              return (
                <tr
                  key={m.student_id}
                  className={`transition-colors ${isFail ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-4 py-2 text-slate-400 sticky left-0 bg-inherit">
                    {rowIdx + 1}
                  </td>
                  <td className="px-4 py-2 font-mono text-slate-600 sticky left-8 bg-inherit">
                    {m.roll_number}
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-800 whitespace-nowrap">
                    {m.student_name}
                  </td>
                  {fields.map((f, fieldIdx) => (
                    <td key={f.key} className="px-2 py-2 text-center">
                      <input
                        id={`cell-${rowIdx}-${fieldIdx}`}
                        type="number"
                        min={0}
                        max={f.max}
                        disabled={isLocked}
                        value={m[f.key] ?? ''}
                        onChange={(e) =>
                          handleChange(m.student_id, f.key, e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, rowIdx, fieldIdx)}
                        className="w-16 text-center px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2 text-center font-bold text-slate-800">
                    {m.total != null ? m.total.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {m.total != null ? (
                      isFail ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                          Fail
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Pass
                        </span>
                      )
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {confirmSubmit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-amber-600"
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
              <h3 className="text-lg font-semibold text-slate-800">
                Submit to HOD?
              </h3>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Once submitted, marks will be{' '}
              <span className="font-semibold text-slate-700">
                locked and cannot be edited
              </span>
              . Only the admin can unlock them. Make sure all scores are correct
              before proceeding.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmSubmit(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

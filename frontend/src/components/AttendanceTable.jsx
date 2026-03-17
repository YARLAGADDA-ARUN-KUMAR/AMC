import { useState } from 'react';
import { attendanceApi } from '../api/client';

export default function AttendanceTable({ students, sessionId, onSaved }) {
  const [records, setRecords] = useState(
    students.map((s) => ({
      student_id: s.id,
      status: 'present',
      name: s.name,
      roll_number: s.roll_number,
    })),
  );
  const [saving, setSaving] = useState(false);
  const [condoneModal, setCondoneModal] = useState(null);
  const [condoneReason, setCondoneReason] = useState('');

  const markAll = (status) => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  const toggleStatus = (student_id) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.student_id !== student_id) return r;
        const cycle = { present: 'absent', absent: 'late', late: 'present' };
        return { ...r, status: cycle[r.status] };
      }),
    );
  };

  const setStatus = (student_id, status) => {
    setRecords((prev) =>
      prev.map((r) => (r.student_id === student_id ? { ...r, status } : r)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await attendanceApi.bulkMark(
        sessionId,
        records.map(({ student_id, status }) => ({ student_id, status })),
      );
      if (onSaved) onSaved();
    } catch (e) {
      alert('Failed to save attendance. Please try again.' + e);
    } finally {
      setSaving(false);
    }
  };

  const handleCondone = async () => {
    if (!condoneReason.trim()) return;
    try {
      await attendanceApi.condoneRecord(condoneModal.record_id, condoneReason);
      setCondoneModal(null);
      setCondoneReason('');
    } catch (e) {
      alert('Failed to condone record.' + e);
    }
  };

  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const lateCount = records.filter((r) => r.status === 'late').length;

  const statusStyle = {
    present: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
    absent: 'bg-red-100 text-red-700 border border-red-300',
    late: 'bg-amber-100 text-amber-700 border border-amber-300',
  };

  const statusDot = {
    present: 'bg-emerald-500',
    absent: 'bg-red-500',
    late: 'bg-amber-500',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Mark Attendance
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
              {presentCount} Present
            </span>
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
              {absentCount} Absent
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
              {lateCount} Late
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => markAll('present')}
            className="text-sm px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors"
          >
            Mark All Present
          </button>
          <button
            onClick={() => markAll('absent')}
            className="text-sm px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium transition-colors"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-3 text-left font-medium">#</th>
              <th className="px-6 py-3 text-left font-medium">Roll No</th>
              <th className="px-6 py-3 text-left font-medium">Student Name</th>
              <th className="px-6 py-3 text-center font-medium">Status</th>
              <th className="px-6 py-3 text-center font-medium">Quick Set</th>
              <th className="px-6 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((record, idx) => (
              <tr
                key={record.student_id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-3 text-slate-400">{idx + 1}</td>
                <td className="px-6 py-3 font-mono text-slate-600">
                  {record.roll_number}
                </td>
                <td className="px-6 py-3 font-medium text-slate-800">
                  {record.name}
                </td>
                <td className="px-6 py-3 text-center">
                  <button
                    onClick={() => toggleStatus(record.student_id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${statusStyle[record.status]}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${statusDot[record.status]}`}
                    />
                    {record.status.charAt(0).toUpperCase() +
                      record.status.slice(1)}
                  </button>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {['present', 'absent', 'late'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(record.student_id, s)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          record.status === s
                            ? statusStyle[s]
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-3 text-center">
                  {record.status === 'absent' && (
                    <button
                      onClick={() =>
                        setCondoneModal({
                          student_id: record.student_id,
                          name: record.name,
                          record_id: record.student_id,
                        })
                      }
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
                    >
                      Condone
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors shadow-sm"
        >
          {saving ? 'Saving...' : 'Submit Attendance'}
        </button>
      </div>

      {condoneModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">
              Condone Absence
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Condoning absence for{' '}
              <span className="font-medium text-slate-700">
                {condoneModal.name}
              </span>
              . This absence will be excluded from percentage calculation.
            </p>
            <select
              value={condoneReason}
              onChange={(e) => setCondoneReason(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">Select reason</option>
              <option value="NCC">NCC / NSS Activity</option>
              <option value="Medical">Medical Leave</option>
              <option value="Inter-college event">Inter-College Event</option>
              <option value="Sports">Sports / Tournament</option>
              <option value="Other">Other</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCondoneModal(null);
                  setCondoneReason('');
                }}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCondone}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Confirm Condone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

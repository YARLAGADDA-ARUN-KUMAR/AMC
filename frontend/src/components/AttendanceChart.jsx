/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { attendanceApi } from '../api/client';

const BAR_COLORS = {
  '90-100%': '#10b981',
  '75-90%': '#f59e0b',
  'Below 75%': '#ef4444',
};

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill }} className="font-medium">
          {p.value} students
        </p>
      ))}
    </div>
  );
};

const CustomPieLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function AttendanceChart({ subjectId }) {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('bar');

  useEffect(() => {
    if (!subjectId) return;
    setLoading(true);
    attendanceApi
      .getSummary(subjectId)
      .then((res) => setSummary(res.data))
      .catch(() => setSummary([]))
      .finally(() => setLoading(false));
  }, [subjectId]);

  const distribution = [
    {
      name: '90-100%',
      count: summary.filter((s) => s.percentage >= 90).length,
    },
    {
      name: '75-90%',
      count: summary.filter((s) => s.percentage >= 75 && s.percentage < 90)
        .length,
    },
    {
      name: 'Below 75%',
      count: summary.filter((s) => s.percentage < 75).length,
    },
  ];

  const pieData = distribution.map((d) => ({ name: d.name, value: d.count }));

  const topStudents = [...summary]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 8);

  const bottomStudents = [...summary]
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 5);

  const classAvgAttendance =
    summary.length > 0
      ? (
          summary.reduce((sum, s) => sum + s.percentage, 0) / summary.length
        ).toFixed(1)
      : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-40 bg-slate-200 rounded" />
          <div className="h-48 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (summary.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
        No attendance data available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              Attendance Distribution
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Class average:{' '}
              <span className="font-semibold text-indigo-600">
                {classAvgAttendance}%
              </span>
            </p>
          </div>
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setView('bar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'bar'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Bar
            </button>
            <button
              onClick={() => setView('pie')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'pie'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Pie
            </button>
          </div>
        </div>

        {view === 'bar' ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={distribution}
              barSize={48}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {distribution.map((entry) => (
                  <Cell key={entry.name} fill={BAR_COLORS[entry.name]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                labelLine={false}
                label={CustomPieLabel}
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index]} />
                ))}
              </Pie>
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-slate-600">{value}</span>
                )}
              />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}

        <div className="grid grid-cols-3 gap-3 mt-4">
          {distribution.map((d) => (
            <div
              key={d.name}
              className="flex flex-col items-center p-3 rounded-xl"
              style={{ backgroundColor: BAR_COLORS[d.name] + '15' }}
            >
              <span
                className="text-xl font-bold"
                style={{ color: BAR_COLORS[d.name] }}
              >
                {d.count}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 text-center">
                {d.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          Top Attendees
        </h3>
        <div className="space-y-2.5">
          {topStudents.map((s, idx) => (
            <div key={s.student_id} className="flex items-center gap-3">
              <span className="w-5 text-xs text-slate-400 font-medium shrink-0">
                {idx + 1}
              </span>
              <span className="text-sm text-slate-700 flex-1 truncate">
                {s.student_name}
              </span>
              <div className="flex items-center gap-2 w-40">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-emerald-600 w-10 text-right">
                  {s.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <h3 className="text-sm font-semibold text-slate-700">
            At-Risk Students
          </h3>
          <span className="ml-auto text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            Below 75%
          </span>
        </div>
        {bottomStudents.filter((s) => s.percentage < 75).length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-2">
            No students below 75% attendance.
          </p>
        ) : (
          <div className="space-y-2.5">
            {bottomStudents
              .filter((s) => s.percentage < 75)
              .map((s) => (
                <div key={s.student_id} className="flex items-center gap-3">
                  <span className="text-sm text-slate-700 flex-1 truncate">
                    {s.student_name}
                  </span>
                  <div className="flex items-center gap-2 w-40">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-500 transition-all duration-500"
                        style={{ width: `${s.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-red-600 w-10 text-right">
                      {s.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

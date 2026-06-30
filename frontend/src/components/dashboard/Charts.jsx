
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

const PIE_COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

function ChartCard({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 font-display text-lg font-bold text-slate-800 dark:text-slate-50">{title}</h3>
      {children}
    </div>
  );
}

export function DepartmentChart({ data }) {
  return (
    <ChartCard title="Employees by Department">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#88888822" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748B" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748B" }} />
          <Tooltip cursor={{ fill: "#2563EB11" }} contentStyle={{ borderRadius: 12, border: "none", fontSize: 13 }} />
          <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function RoleChart({ data }) {
  return (
    <ChartCard title="Employees by Role">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#88888822" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#64748B" }} />
          <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 11, fill: "#64748B" }} />
          <Tooltip cursor={{ fill: "#2563EB11" }} contentStyle={{ borderRadius: 12, border: "none", fontSize: 13 }} />
          <Bar dataKey="count" fill="#3B82F6" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function StatusChart({ data }) {
  return (
    <ChartCard title="Employee Status Overview">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={3}>
            {data.map((entry, i) => (
              <Cell key={entry.label} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 12, border: "none", fontSize: 13 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-4">
        {data.map((entry, i) => (
          <div key={entry.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            <span className="text-slate-500">{entry.label} ({entry.count})</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

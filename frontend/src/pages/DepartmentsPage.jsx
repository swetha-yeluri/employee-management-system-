// Departments overview with employee counts per department.
import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { employeeService } from "../api/employeeService";
import Spinner from "../components/common/Spinner";
import Badge from "../components/common/Badge";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      employeeService.getDepartments(),
      employeeService.getAll(),
    ])
      .then(([depts, emps]) => {
        setDepartments(depts);
        setEmployees(emps);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading departments..." />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {departments.map((dept) => {
        const count = employees.filter(
          (e) => e.department?.id === dept.id
        ).length;
        return (
          <div
            key={dept.id}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-700/20 dark:text-accent-400">
                <Building2 size={19} />
              </div>
              <Badge tone="accent">{count} staff</Badge>
            </div>
            <h3 className="mt-4 font-display text-lg text-zinc-900 dark:text-zinc-50">
              {dept.name}
            </h3>
          </div>
        );
      })}
    </div>
  );
}

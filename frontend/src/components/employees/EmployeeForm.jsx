
import { useState, useEffect, useMemo } from "react";
import Input from "../common/Input";
import Button from "../common/Button";
import { EMPLOYEE_STATUSES } from "../../utils/constants";

const EMPTY = {
  name: "",
  email: "",
  position: "",
  status: "Active",
  department_id: "",
  first_name: "",
  last_name: "",
  phone: "",
  profile_picture: "",
  address: "",
  date_of_joining: "",
  employee_code: "",
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function EmployeeForm({
  initial,
  departments,
  submitting,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || "",
        email: initial.email || "",
        position: initial.position || "",
        status: initial.status || "Active",
        department_id: initial.department?.id || initial.department_id || "",
        first_name: initial.first_name || "",
        last_name: initial.last_name || "",
        phone: initial.phone || "",
        profile_picture: initial.profile_picture || "",
        address: initial.address || "",
        date_of_joining: initial.date_of_joining || "",
        employee_code: initial.employee_code || "",
      });
    } else {
      setForm(EMPTY);
    }
    setTouched({});
  }, [initial]);

  const errors = useMemo(() => {
    const e = {};
    if (form.name.trim().length < 2) e.name = "Name is required (min 2 characters)";
    if (!EMAIL_RE.test(form.email)) e.email = "A valid email is required";
    if (form.position.trim().length < 2) e.position = "Role is required";
    if (!form.department_id) e.department_id = "Department is required";
    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const markTouched = (key) => () =>
    setTouched((prev) => ({ ...prev, [key]: true }));

  const showError = (key) => (touched[key] ? errors[key] : undefined);

  const handleSubmit = () => {
    if (!isValid) {
      setTouched({ name: true, email: true, position: true, department_id: true });
      return;
    }
    onSubmit({
      ...form,
      department_id: Number(form.department_id),
    });
  };

  return (
    <div className="space-y-4">
      <Input
        label="Full Name *"
        value={form.name}
        onChange={update("name")}
        onBlur={markTouched("name")}
        error={showError("name")}
        placeholder="Jane Doe"
      />
      <Input
        label="Email *"
        type="email"
        value={form.email}
        onChange={update("email")}
        onBlur={markTouched("email")}
        error={showError("email")}
        placeholder="jane@ems.com"
      />
      <Input
        label="Role *"
        value={form.position}
        onChange={update("position")}
        onBlur={markTouched("position")}
        error={showError("position")}
        placeholder="Software Engineer"
      />

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Status
          </span>
          <select
            value={form.status}
            onChange={update("status")}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-accent-500 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {EMPLOYEE_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Department *
          </span>
          <select
            value={form.department_id}
            onChange={update("department_id")}
            onBlur={markTouched("department_id")}
            className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-accent-500 dark:bg-zinc-900 ${
              showError("department_id") ? "border-red-400" : "border-zinc-200 dark:border-zinc-700"
            }`}
          >
            <option value="" disabled>Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {showError("department_id") && (
            <span className="mt-1 block text-xs text-red-500">{showError("department_id")}</span>
          )}
        </label>
      </div>

      
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" value={form.first_name} onChange={update("first_name")} placeholder="Jane" />
        <Input label="Last Name" value={form.last_name} onChange={update("last_name")} placeholder="Doe" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Phone Number" value={form.phone} onChange={update("phone")} placeholder="9876543210" />
        <Input label="Employee ID" value={form.employee_code} onChange={update("employee_code")} placeholder="EMP001" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date of Joining" value={form.date_of_joining} onChange={update("date_of_joining")} placeholder="2024-01-15" />
        <Input label="Profile Picture (URL)" value={form.profile_picture} onChange={update("profile_picture")} placeholder="https://..." />
      </div>
      <Input label="Address" value={form.address} onChange={update("address")} placeholder="123 Main St, City" />

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-zinc-400">* Required fields</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isValid || submitting}>
            {submitting ? "Saving..." : initial ? "Save Changes" : "Add Employee"}
          </Button>
        </div>
      </div>
    </div>
  );
}
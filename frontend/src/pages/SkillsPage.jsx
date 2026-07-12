import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Award, Plus, Trash2, Star } from "lucide-react";

import { skillService } from "../api/skillService";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Spinner from "../components/common/Spinner";

const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const EMPTY_SKILL = { name: "", proficiency: "Beginner", years_experience: 0, is_primary: false };
const EMPTY_CERT = { name: "", issuing_org: "", issue_date: "", expiry_date: "", document_name: "" };

const CERT_STATUS = {
  Valid: "bg-emerald-50 text-emerald-700",
  Expired: "bg-red-50 text-red-600",
  "Expiring Soon": "bg-amber-50 text-amber-700",
};

export default function SkillsPage() {
  const [mySkills, setMySkills] = useState([]);
  const [myCerts, setMyCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skillForm, setSkillForm] = useState(EMPTY_SKILL);
  const [certForm, setCertForm] = useState(EMPTY_CERT);
  const [editSkillId, setEditSkillId] = useState(null);
  const [editCertId, setEditCertId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setMySkills(await skillService.getMySkills());
      setMyCerts(await skillService.getMyCerts());
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sUpdate = (k) => (e) =>
    setSkillForm((p) => ({ ...p, [k]: k === "is_primary" ? e.target.checked : k === "years_experience" ? Number(e.target.value) : e.target.value }));
  const cUpdate = (k) => (e) => setCertForm((p) => ({ ...p, [k]: e.target.value }));

  // ---------- skills ----------
  const startEditSkill = (s) => {
    setEditSkillId(s.id);
    setSkillForm({ name: s.name, proficiency: s.proficiency, years_experience: s.years_experience, is_primary: s.is_primary });
  };
  const saveSkill = async () => {
    if (!skillForm.name) { toast.error("Skill name is required"); return; }
    try {
      if (editSkillId) { await skillService.updateSkill(editSkillId, skillForm); toast.success("Skill updated"); }
      else { await skillService.addSkill(skillForm); toast.success("Skill added"); }
      setSkillForm(EMPTY_SKILL); setEditSkillId(null); load();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };
  const delSkill = async (id) => {
    try { await skillService.deleteSkill(id); toast.success("Deleted"); load(); }
    catch { toast.error("Failed"); }
  };

  // ---------- certifications ----------
  const startEditCert = (c) => {
    setEditCertId(c.id);
    setCertForm({ name: c.name, issuing_org: c.issuing_org || "", issue_date: c.issue_date || "", expiry_date: c.expiry_date || "", document_name: c.document_name || "" });
  };
  const saveCert = async () => {
    if (!certForm.name) { toast.error("Certification name is required"); return; }
    try {
      if (editCertId) { await skillService.updateCert(editCertId, certForm); toast.success("Certification updated"); }
      else { await skillService.addCert(certForm); toast.success("Certification added"); }
      setCertForm(EMPTY_CERT); setEditCertId(null); load();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };
  const delCert = async (id) => {
    try { await skillService.deleteCert(id); toast.success("Deleted"); load(); }
    catch { toast.error("Failed"); }
  };
  const uploadDoc = async (certId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await skillService.uploadDocument(certId, file);
      toast.success("Document uploaded");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    }
  };

  if (loading) return <Spinner label="Loading..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Award className="text-accent-600" size={22} />
        <h1 className="font-display text-2xl text-zinc-900 dark:text-zinc-50">Skills & Certifications</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Total Skills" value={mySkills.length} />
        <Stat label="Primary Skills" value={mySkills.filter((s) => s.is_primary).length} />
        <Stat label="Active Certs" value={myCerts.filter((c) => c.status !== "Expired").length} />
        <Stat label="Expired Certs" value={myCerts.filter((c) => c.status === "Expired").length} />
      </div>

      {/* SKILLS */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 font-display text-lg">{editSkillId ? "Edit Skill" : "My Skills"}</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          <Input label="Skill *" value={skillForm.name} onChange={sUpdate("name")} placeholder="React" />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Level</span>
            <select value={skillForm.proficiency} onChange={sUpdate("proficiency")}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </label>
          <Input label="Years" type="number" value={skillForm.years_experience} onChange={sUpdate("years_experience")} />
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" checked={skillForm.is_primary} onChange={sUpdate("is_primary")} /> Primary
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={saveSkill}><Plus size={16} /> {editSkillId ? "Update Skill" : "Add Skill"}</Button>
          {editSkillId && <Button variant="secondary" onClick={() => { setSkillForm(EMPTY_SKILL); setEditSkillId(null); }}>Cancel</Button>}
        </div>

        <div className="mt-4 space-y-2">
          {mySkills.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-4 py-2 dark:border-zinc-800">
              <div>
                <span className="font-semibold">{s.name}</span>
                {s.is_primary && <Star size={13} className="ml-1 inline text-amber-500" />}
                <span className="ml-2 text-xs text-zinc-500">{s.proficiency} · {s.years_experience} yr</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => startEditSkill(s)} className="text-sm text-accent-600">Edit</button>
                <button onClick={() => delSkill(s.id)} className="text-red-500"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CERTIFICATIONS */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 font-display text-lg">{editCertId ? "Edit Certification" : "My Certifications"}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Certification *" value={certForm.name} onChange={cUpdate("name")} placeholder="AWS Certified" />
          <Input label="Issuing Organization" value={certForm.issuing_org} onChange={cUpdate("issuing_org")} placeholder="Amazon" />
          <Input label="Issue Date" type="date" value={certForm.issue_date} onChange={cUpdate("issue_date")} />
          <Input label="Expiry Date" type="date" value={certForm.expiry_date} onChange={cUpdate("expiry_date")} />
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={saveCert}><Plus size={16} /> {editCertId ? "Update Certification" : "Add Certification"}</Button>
          {editCertId && <Button variant="secondary" onClick={() => { setCertForm(EMPTY_CERT); setEditCertId(null); }}>Cancel</Button>}
        </div>

        <div className="mt-4 space-y-2">
          {myCerts.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-4 py-2 dark:border-zinc-800">
              <div>
                <span className="font-semibold">{c.name}</span>
                <span className="ml-2 text-xs text-zinc-500">{c.issuing_org} {c.expiry_date && `· exp ${c.expiry_date}`}</span>
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${CERT_STATUS[c.status] || CERT_STATUS.Valid}`}>{c.status}</span>
                {c.document_name && <span className="ml-2 text-xs text-emerald-600">📎 {c.document_name}</span>}
              </div>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer text-sm text-accent-600">
                  {c.document_name ? "Re-upload" : "Upload"}
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden"
                    onChange={(e) => uploadDoc(c.id, e)} />
                </label>
                <button onClick={() => startEditCert(c)} className="text-sm text-accent-600">Edit</button>
                <button onClick={() => delCert(c.id)} className="text-red-500"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 font-display text-3xl text-zinc-900 dark:text-zinc-50">{value}</p>
    </div>
  );
}
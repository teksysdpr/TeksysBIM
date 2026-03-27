"use client";


import { useEffect, useMemo, useState } from "react";
import { ALLOWED_FORMATS, formatDateForUI, type AllowedDateFormat } from "../../lib/datefmt";

type Project = {
  id: number;
  tenant_id: number;
  project_owner: string;
  project_name: string;
  project_location: string;
};

type Task = {
  id: number;
  schedule_id: number;
  wbs_code: string;
  activity_name: string;
  duration_days: number;
  planned_start: string | null;
  planned_finish: string | null;
  wbs_level: number;
};

export default function ProjectsPage() {
  const [token, setToken] = useState<string>("");
  const [me, setMe] = useState<any>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);


  // --- Schedule Tasks (MSP-like) ---
  const [scheduleId, setScheduleId] = useState<string>("3");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [dateFmt, setDateFmt] = useState<AllowedDateFormat>(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("dpr_date_fmt")) || "";
    return (ALLOWED_FORMATS.includes(saved as any) ? (saved as AllowedDateFormat) : "DD/MM/YYYY");
  });

  const [form, setForm] = useState({
    project_owner: "",
    project_name: "",
    project_location: "",
  });

  const canCreate = useMemo(() => {
    const role = me?.role;
    return role === "ADMIN" || role === "PLANNER";
  }, [me]);

  async function fetchMe(t: string) {
    const r = await fetch("/api/proxy/auth/me", { headers: { Authorization: `Bearer ${t}` } });
    if (!r.ok) throw new Error("auth/me failed");
    return r.json();
  }

  async function fetchProjects(t: string) {
    const r = await fetch("/api/proxy/projects", { headers: { Authorization: `Bearer ${t}` } });
    if (!r.ok) throw new Error("projects list failed");
    return r.json();
  }

  async function fetchTasks(t: string, sid: string) {
    const id = (sid || "").trim();
    if (!id) throw new Error("schedule id required");
    const r = await fetch(`/api/proxy/schedules/${id}/tasks`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!r.ok) throw new Error("tasks list failed");
    return r.json();
  }


  async function loadAll(t: string) {
    setLoading(true);
    try {
      const meData = await fetchMe(t);
      setMe(meData);
      const list = await fetchProjects(t);
      setProjects(list || []);
    } finally {
      setLoading(false);
    }
  }

  async function onLoginWithToken() {
    if (!token.trim()) return;
    localStorage.setItem("dpr_token", token.trim());
    await loadAll(token.trim());
  }

  async function onLoadTasks() {
    if (!token.trim()) {
      alert("Paste token and click Load first.");
      return;
    }
    setTasksLoading(true);
    try {
      const rows = await fetchTasks(token.trim(), scheduleId);
      setTasks(rows || []);
    } catch (e: any) {
      alert("Load tasks failed: " + (e?.message || String(e)));
    } finally {
      setTasksLoading(false);
    }
  }


  async function onCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate) return;

    const payload = {
      project_owner: form.project_owner.trim(),
      project_name: form.project_name.trim(),
      project_location: form.project_location.trim(),
    };

    if (!payload.project_owner || !payload.project_name || !payload.project_location) {
      alert("Please fill Project Owner, Project Name and Project Location.");
      return;
    }

    const r = await fetch("/api/proxy/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      alert("Create failed: " + txt);
      return;
    }

    setForm({ project_owner: "", project_name: "", project_location: "" });
    await loadAll(token);
  }

  useEffect(() => {
    const t = localStorage.getItem("dpr_token") || "";
    if (t) {
      setToken(t);
      loadAll(t).catch(() => {});
    }
  }, []);

  return (
    <div className="wrap">
      <div className="top">
        <h1 className="h1">Projects</h1>
        <div className="tokenRow">
          <input
            className="inp"
            placeholder="Paste your access token here (temporary)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button className="btn" onClick={onLoginWithToken}>Load</button>
        </div>
        <div className="meta">
          {me ? (
            <span>
              Logged in as <b>{me.email}</b> • Role: <b>{me.role}</b>
            </span>
          ) : (
            <span>Not loaded yet</span>
          )}
        </div>
      </div>

      {canCreate && (
        <div className="card">
          <h2 className="h2">Create New Project</h2>
          <form onSubmit={onCreateProject}>
            <div className="grid">
              <Field label="Project Owner" value={form.project_owner} onChange={(v) => setForm({ ...form, project_owner: v })} />
              <Field label="Project Name" value={form.project_name} onChange={(v) => setForm({ ...form, project_name: v })} />
              <Field label="Project Location" value={form.project_location} onChange={(v) => setForm({ ...form, project_location: v })} />
            </div>
            <button className="btnPrimary" type="submit">Create Project</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="h2">Project List</h2>
        {loading ? (
          <div className="muted">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="muted">No projects found.</div>
        ) : (
          <div className="list">
            {projects.map((p) => (
              <div key={p.id} className="row">
                <div className="rowTitle">{p.project_name}</div>
                <div className="rowSub">
                  <span><b>Owner:</b> {p.project_owner}</span>
                  <span className="dot">•</span>
                  <span><b>Location:</b> {p.project_location}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">

        <div className="schTop">

          <h2 className="h2">Schedule Tasks (MSP-like)</h2>

          <div className="schControls">

            <input

              className="inp2"

              style={{ maxWidth: 140 }}

              placeholder="Schedule ID"

              value={scheduleId}

              onChange={(e) => setScheduleId(e.target.value)}

            />

            <select
                className="inp2"
                style={{ maxWidth: 190 }}
                value={dateFmt}
                onChange={(e) => {
                  const v = e.target.value as AllowedDateFormat;
                  if (ALLOWED_FORMATS.includes(v)) {
                    setDateFmt(v);
                    localStorage.setItem("dpr_date_fmt", v);
                  }
                }}
              >

              {ALLOWED_FORMATS.map((f) => (

                <option key={f} value={f}>

                  {f === "DD/MM/YYYY" ? "20/03/2026" : f === "DD-MMM-YYYY" ? "20-MAR-2026" : f === "DD/MM/YY" ? "20/03/26" : "20-MAR-26"}

                </option>

              ))}

            </select>


            <button className="btn" onClick={onLoadTasks} disabled={tasksLoading}>

              {tasksLoading ? "Loading…" : "Load Tasks"}

            </button>

            <button className="btnPrint" onClick={() => window.print()}>Print</button>

          </div>

        </div>


        {tasks.length === 0 ? (

          <div className="muted">No tasks loaded yet. (Enter Schedule ID and click Load Tasks)</div>

        ) : (

          <div className="tableWrap">

            <table className="tbl">

              <thead>

                <tr>

                  <th style={{ width: 90 }}>WBS</th>

                  <th>Activity</th>

                  <th style={{ width: 130 }}>Start</th>

                  <th style={{ width: 130 }}>Finish</th>

                  <th style={{ width: 90 }}>Days</th>

                </tr>

              </thead>

              <tbody>

                {tasks.map((t) => {

                  const level = Math.max(1, Number((t as any).wbs_level || 1));

                  const pad = (level - 1) * 18;

                  return (

                    <tr key={t.id}>

                      <td className="mono">{t.wbs_code}</td>

                      <td>

                        <div className="act" style={{ paddingLeft: pad }}>

                          <span className={level === 1 ? "lvl1" : level === 2 ? "lvl2" : "lvl3"}>

                            {t.activity_name}

                          </span>

                        </div>

                      </td>

                      <td>{formatDateForUI(t.planned_start, dateFmt)}</td>

                      <td>{formatDateForUI(t.planned_finish, dateFmt)}</td>

                      <td>{t.duration_days}</td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        )}

      </div>



      <style>{`
        .wrap{ max-width: 1100px; margin: 0 auto; padding: 18px; color:#111; }
        .top{ margin: 14px 0 12px; }
        .h1{ margin:0 0 10px; font-size: 26px; font-weight: 900; }
        .tokenRow{ display:flex; gap:10px; }
        .inp{ flex:1; padding: 10px 12px; border-radius: 12px; border: 1px solid #d7d7d7; }
        .btn{ padding: 10px 14px; border-radius: 12px; border:0; font-weight: 900; background:#4F46E5; color:#fff; cursor:pointer; }
        .meta{ margin-top: 8px; font-size: 13px; color:#444; }

        .card{ background:#fff; border:1px solid #e6e6e6; border-radius: 16px; padding: 14px; margin-top: 12px; box-shadow: 0 6px 18px rgba(0,0,0,0.05); }
        .h2{ margin:0 0 10px; font-size: 18px; font-weight: 900; }
        .grid{ display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .lbl{ display:block; font-size: 12px; color:#333; margin-bottom: 6px; font-weight: 700; }
        .inp2{ width:100%; padding:10px 12px; border-radius: 12px; border: 1px solid #d7d7d7; }
        .btnPrimary{ margin-top: 10px; width: 100%; padding: 11px 14px; border-radius: 14px; border:0; font-weight: 900; background:#0F172A; color:#fff; cursor:pointer; }

        .list{ display:flex; flex-direction:column; gap:10px; }
        .row{ padding: 12px; border-radius: 14px; border: 1px solid #ececec; }
        .rowTitle{ font-weight: 900; font-size: 15px; }
        .rowSub{ margin-top: 6px; font-size: 13px; color:#444; display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
        .dot{ opacity: .7; }
        .muted{ color:#666; font-size: 13px; }

          .schTop{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; }
          .schControls{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
          .btnPrint{ padding: 10px 14px; border-radius: 12px; border:1px solid #d7d7d7; font-weight: 900; background:#fff; color:#111; cursor:pointer; }
          .tableWrap{ overflow:auto; border:1px solid #ececec; border-radius: 14px; }
          .tbl{ width:100%; border-collapse: collapse; min-width: 760px; }
          .tbl th{ text-align:left; font-size: 12px; padding: 10px 10px; border-bottom:1px solid #ececec; background:#fafafa; }
          .tbl td{ font-size: 13px; padding: 10px 10px; border-bottom:1px solid #f0f0f0; vertical-align: top; }
          .mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
          .act{ white-space: nowrap; }
          .lvl1{ font-weight: 900; }
          .lvl2{ font-weight: 800; }
          .lvl3{ font-weight: 700; }
          @media print{
            .tokenRow, .btn, .btnPrimary, .schControls, .meta { display:none !important; }
            .wrap{ max-width: none; padding: 0; }
            .card{ border:0; box-shadow:none; margin-top: 8px; }
            .tableWrap{ overflow: visible; border:0; }
            .tbl{ min-width: 0; }
            .tbl th, .tbl td{ border-bottom:1px solid #ddd; }
          }

        @media (max-width: 860px){
          .grid{ grid-template-columns: 1fr; }
          .tokenRow{ flex-direction:column; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="lbl">{label}</label>
      <input className="inp2" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

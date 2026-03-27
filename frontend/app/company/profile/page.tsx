"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Sparkles } from "lucide-react";
import { getAccessToken } from "@/lib/storage";
import {
  buildVersionedLogoUrl,
  bumpCompanyLogoVersion,
  COMPANY_LOGO_CHANGED_EVENT,
  COMPANY_LOGO_VERSION_KEY,
  readCompanyLogoVersion,
} from "@/lib/companyLogoVersion";
import CompanyPageHeader from "@/app/components/company/CompanyPageHeader";
import Link from "next/link";

type CompanyProfile = {
  company_id?: number;
  settings_id?: number;
  company_name?: string;
  company_code?: string;
  company_public_id?: string | null;
  sector?: string | null;
  city?: string | null;
  pin_code?: string | null;
  state?: string | null;
  company_email?: string | null;
  company_mobile?: string | null;
  company_address?: string | null;
  admin_name?: string | null;
  admin_email?: string | null;
  admin_mobile?: string | null;
  company_is_active?: boolean;
  timezone?: string | null;
  date_format?: string | null;
  currency_code?: string | null;
  logo_url?: string | null;
  logo_style?: string | null;
  primary_contact_name?: string | null;
  primary_contact_email?: string | null;
  primary_contact_mobile?: string | null;
  otp_required_for_project_team?: boolean;
  settings_is_active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

type EditSection = "registration" | "primary" | "preferences" | null;

const STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const SECTORS = ["Real Estate", "Industrial", "Infrastructure", "Others"];
const TIMEZONES = ["Asia/Kolkata"];
const DATE_FORMATS = ["DD-MM-YYYY", "MM-DD-YYYY", "YYYY-MM-DD"];
const CURRENCIES = ["INR", "USD", "EUR", "GBP"];

const LOGO_STYLE_OPTIONS = [
  { key: "round", label: "Round" },
  { key: "square", label: "Square" },
  { key: "square_rounded", label: "Square Rounded" },
  { key: "rectangle", label: "Rectangle" },
  { key: "rectangle_rounded", label: "Rectangle Rounded" },
];

function isRectangleLogoStyle(style: string) {
  return style === "rectangle" || style === "rectangle_rounded";
}

function getLogoShapeClass(style: string) {
  switch (style) {
    case "round":
      return "rounded-full";
    case "square":
      return "rounded-none";
    case "square_rounded":
      return "rounded-2xl";
    case "rectangle":
      return "rounded-none";
    case "rectangle_rounded":
      return "rounded-2xl";
    default:
      return "rounded-2xl";
  }
}

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function normalizeMobile(v: string) {
  let s = (v || "").trim().replace(/\s+/g, "");
  if (s.startsWith("+91")) s = s.slice(3);
  return s;
}

function formatBoolean(v: boolean | undefined) {
  return v ? "Yes" : "No";
}

function FieldRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
}) {
  return (
    <div className="group flex items-start justify-between gap-3 rounded-xl border border-[#e7d4c6] bg-[#fffdfb] px-3.5 py-3 shadow-sm transition hover:border-[#d3bca8] hover:shadow-md">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
        <div className="mt-1 text-sm font-semibold text-slate-900 break-words">{value || "-"}</div>
      </div>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 rounded-lg border border-[#e5d1bf] bg-[#fff7f0] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700 transition hover:border-[#c69d7f] hover:bg-[#f9eee4]"
        >
          Edit
        </button>
      ) : null}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.10)]">
      <div className="flex items-start justify-between gap-4 border-b border-[#ead8cb] px-6 py-5">
        <div>
          <h2 className="text-xl font-black tracking-wide text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500/90">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default function CompanyProfilePage() {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [form, setForm] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoBusyMessage, setLogoBusyMessage] = useState("");
  const [logoRefreshToken, setLogoRefreshToken] = useState<number>(() => readCompanyLogoVersion());
  const [logoStyleBusy, setLogoStyleBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editSection, setEditSection] = useState<EditSection>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [accessToken, setAccessToken] = useState("");
  const [selectedLogoStyle, setSelectedLogoStyle] = useState("square_rounded");

  const sectionPrimaryButtonClass =
    "rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60";
  const sectionSecondaryButtonClass =
    "rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-[#fffaf6] disabled:opacity-60";
  const sectionEditButtonClass =
    "rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-[#fffaf6]";
  const formLabelClass = "mb-1 block text-sm font-semibold text-slate-700";
  const formInputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";
  const formDisabledClass =
    "w-full rounded-xl border border-[#E8DDD6] bg-[#F4EEEA] px-4 py-2.5 text-sm text-[#7A665B]";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = getAccessToken() || "";
    if (!token) {
      window.location.href = "/login";
      return;
    }
    setAccessToken(token);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncLogoVersion = () => {
      setLogoRefreshToken(readCompanyLogoVersion());
    };

    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === COMPANY_LOGO_VERSION_KEY) {
        syncLogoVersion();
      }
    };

    syncLogoVersion();
    window.addEventListener("storage", onStorage);
    window.addEventListener(COMPANY_LOGO_CHANGED_EVENT, syncLogoVersion as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(COMPANY_LOGO_CHANGED_EVENT, syncLogoVersion as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");
        setNotice("");

        const res = await fetch("/api/proxy/company/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.detail || "Failed to load company profile");
        }

        setCompany(data);
        setForm(data);
        setSelectedLogoStyle(data?.logo_style || "round");
      } catch (err: any) {
        setError(err.message || "Unable to load company profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [accessToken]);

  function openEdit(section: EditSection) {
    setNotice("");
    setError("");
    setForm(company);
    setEditSection(section);
  }

  function cancelEdit() {
    setForm(company);
    setEditSection(null);
    setNotice("");
    setError("");
  }

  function updateForm<K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) {
    setForm((prev) => ({ ...(prev || {}), [key]: value }));
  }

  async function saveSection(section: EditSection) {
    if (!form || !accessToken || !section) return;

    let payload: Record<string, any> = {};

    if (section === "registration") {
      payload = {
        company_name: (form.company_name || "").trim(),
        company_email: (form.company_email || "").trim(),
        company_mobile: normalizeMobile(form.company_mobile || ""),
        company_address: (form.company_address || "").trim(),
        sector: (form.sector || "").trim(),
        state: (form.state || "").trim(),
        pin_code: (form.pin_code || "").trim(),
        admin_name: (form.admin_name || "").trim(),
        admin_email: (form.admin_email || "").trim(),
        admin_mobile: normalizeMobile(form.admin_mobile || ""),
        logo_style: selectedLogoStyle,
      };

      if (!payload.company_name) return setError("Company Name is required.");
      if (!payload.company_address) return setError("Company Address is required.");
      if (!payload.state) return setError("State is required.");
      if (!/^\d{6}$/.test(payload.pin_code)) return setError("PIN Code must be exactly 6 digits.");
      if (!SECTORS.includes(payload.sector)) return setError("Please select a valid sector.");
    }

    if (section === "primary") {
      payload = {
        primary_contact_name: (form.primary_contact_name || "").trim(),
        primary_contact_email: (form.primary_contact_email || "").trim(),
        primary_contact_mobile: normalizeMobile(form.primary_contact_mobile || ""),
      };
    }

    if (section === "preferences") {
      payload = {
        timezone: (form.timezone || "").trim(),
        date_format: (form.date_format || "").trim(),
        currency_code: (form.currency_code || "").trim(),
        otp_required_for_project_team: !!form.otp_required_for_project_team,
      };
    }

    try {
      setSaving(true);
      setError("");
      setNotice("");

      const res = await fetch("/api/proxy/company/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail || "Failed to update company profile");
      }

      setCompany(data);
      setForm(data);
      setSelectedLogoStyle(data?.logo_style || selectedLogoStyle || "round");
      setEditSection(null);
      setNotice("Company profile updated successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to update company profile.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo(file: File) {
    if (!accessToken) return;

    try {
      setLogoBusy(true);
      setLogoBusyMessage("Uploading logo...");
      setError("");
      setNotice("");

      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/proxy/company/profile/logo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail || "Failed to upload company logo");
      }

      setLogoBusyMessage("Applying new logo...");
      setLogoRefreshToken(bumpCompanyLogoVersion());
      setCompany((prev) => ({ ...(prev || {}), logo_url: data.logo_url || null }));
      setForm((prev) => ({ ...(prev || {}), logo_url: data.logo_url || null }));
      setNotice(data?.message || "Company logo uploaded successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to upload logo.");
    } finally {
      setLogoBusy(false);
      setLogoBusyMessage("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function setActiveLogoStyle(style: string) {
    if (!accessToken) return;
    if (!LOGO_STYLE_OPTIONS.some((opt) => opt.key === style)) return;
    if (style === selectedLogoStyle && company?.logo_style === style) return;

    const previousStyle = selectedLogoStyle;
    setSelectedLogoStyle(style);

    try {
      setLogoStyleBusy(true);
      setError("");
      setNotice("");

      const res = await fetch("/api/proxy/company/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ logo_style: style }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail || "Failed to set active logo variant");
      }

      const updatedStyle = data?.logo_style || style;
      setSelectedLogoStyle(updatedStyle);
      setCompany((prev) => ({ ...(prev || {}), ...data, logo_style: updatedStyle }));
      setForm((prev) => ({ ...(prev || {}), ...data, logo_style: updatedStyle }));
      setNotice("Logo variant updated successfully.");
    } catch (err: any) {
      setSelectedLogoStyle(previousStyle);
      setError(err.message || "Failed to update logo variant.");
    } finally {
      setLogoStyleBusy(false);
    }
  }

  async function deleteLogo() {
    if (!accessToken) return;

    try {
      setLogoBusy(true);
      setLogoBusyMessage("Removing logo...");
      setError("");
      setNotice("");

      const res = await fetch("/api/proxy/company/profile/logo", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail || "Failed to delete company logo");
      }

      setCompany((prev) => ({ ...(prev || {}), logo_url: null }));
      setForm((prev) => ({ ...(prev || {}), logo_url: null }));
      setLogoRefreshToken(bumpCompanyLogoVersion());
      setNotice(data?.message || "Company logo deleted successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to delete logo.");
    } finally {
      setLogoBusy(false);
      setLogoBusyMessage("");
    }
  }

  const displayName = company?.company_name || "-";
  const displayInitial = displayName.trim().charAt(0).toUpperCase() || "C";
  const displayCompanyId = company?.company_public_id || company?.company_code || "-";
  const displayCode = company?.company_code || "-";
  const displaySector = company?.sector || "-";
  const displayStatePin = `${company?.state || "-"}${company?.pin_code ? ` • ${company.pin_code}` : ""}`;
  const displayAddress = company?.company_address || "-";
  const displayLogoUrl = buildVersionedLogoUrl(company?.logo_url, logoRefreshToken);

  if (loading) {
    return (
      <div
        className="min-h-screen px-4 py-5 md:px-6 lg:px-8"
        style={{
          background:
            "radial-gradient(circle at top, #1e3a8a 0%, #172554 26%, #0f172a 68%, #020617 100%)",
        }}
      >
        <div className="mx-auto max-w-7xl rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.10)]">
          <h1 className="text-2xl font-black text-slate-900">Loading company profile...</h1>
        </div>
      </div>
    );
  }

  if (error && !company) {
    return (
      <div
        className="min-h-screen px-4 py-5 md:px-6 lg:px-8"
        style={{
          background:
            "radial-gradient(circle at top, #1e3a8a 0%, #172554 26%, #0f172a 68%, #020617 100%)",
        }}
      >
        <div className="mx-auto max-w-7xl rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.10)]">
          <h1 className="text-2xl font-black text-slate-900">Company Profile</h1>
          <p className="mt-3 text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-5 md:px-6 lg:px-8"
      style={{
        background:
          "radial-gradient(circle at top, #1e3a8a 0%, #172554 26%, #0f172a 68%, #020617 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <CompanyPageHeader />

        <section className="relative overflow-hidden rounded-[30px] border border-white/15 bg-gradient-to-br from-[#0B1120]/95 via-[#172554]/90 to-[#0F172A]/95 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] md:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#f0c98f]/15 blur-2xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-2xl" />
          <div className="relative z-10 flex flex-col gap-4">
            <div className="text-white">
              <div className="mb-2">
                <Link
                  href="/company/dashboard"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-4 py-2 text-xs font-bold tracking-wide text-white shadow-sm transition hover:bg-black/30 sm:text-sm"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  Back to Dashboard
                </Link>
              </div>
              <h2 className="text-3xl font-black tracking-wide md:text-4xl">Company Profile</h2>
              <p className="mt-2 text-sm text-white/85 md:text-base">
                Manage identity, branding, contacts and workspace defaults from one place.
              </p>
              <p className="mt-1 text-xs uppercase tracking-wider text-[#f8dfbd]">
                <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                Profile Console
              </p>
            </div>
          </div>
        </section>

        {(notice || error) && (
          <div
            className={classNames(
              "rounded-2xl border px-4 py-3 text-sm font-medium shadow-[0_12px_28px_rgba(25,11,5,0.14)]",
              notice ? "border-slate-200 bg-white text-slate-900" : "",
              error ? "border-red-200 bg-red-50 text-red-700" : ""
            )}
          >
            {notice || error}
          </div>
        )}

        <div className="space-y-6">
          <SectionCard
            title="Company Identity & Registration"
            subtitle="Registered identity, company details and admin information."
            actions={
              editSection === "registration" ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => saveSection("registration")}
                    className={sectionPrimaryButtonClass}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={cancelEdit}
                    className={sectionSecondaryButtonClass}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openEdit("registration")}
                  className={sectionEditButtonClass}
                >
                  Edit Section
                </button>
              )
            }
          >
            {editSection === "registration" && form ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label className={formLabelClass}>Company Name</label>
                  <input className={formInputClass} value={form.company_name || ""} onChange={(e) => updateForm("company_name", e.target.value)} />
                </div>

                <div>
                  <label className={formLabelClass}>Sector</label>
                  <select className={formInputClass} value={form.sector || ""} onChange={(e) => updateForm("sector", e.target.value)}>
                    {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className={formLabelClass}>Company Public ID</label>
                  <input disabled className={formDisabledClass} value={company?.company_public_id || ""} />
                </div>

                <div>
                  <label className={formLabelClass}>Company Code</label>
                  <input disabled className={formDisabledClass} value={company?.company_code || ""} />
                </div>

                <div>
                  <label className={formLabelClass}>Company Email</label>
                  <input type="email" className={formInputClass} value={form.company_email || ""} onChange={(e) => updateForm("company_email", e.target.value)} />
                </div>

                <div>
                  <label className={formLabelClass}>Company Mobile</label>
                  <input className={formInputClass} value={form.company_mobile || ""} onChange={(e) => updateForm("company_mobile", e.target.value)} />
                </div>

                <div>
                  <label className={formLabelClass}>State</label>
                  <select className={formInputClass} value={form.state || ""} onChange={(e) => updateForm("state", e.target.value)}>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className={formLabelClass}>PIN Code</label>
                  <input inputMode="numeric" maxLength={6} className={formInputClass} value={form.pin_code || ""} onChange={(e) => updateForm("pin_code", e.target.value.replace(/\D/g, ""))} />
                </div>

                <div className="md:col-span-2 xl:col-span-3">
                  <label className={formLabelClass}>Company Address</label>
                  <textarea className={formInputClass} rows={3} value={form.company_address || ""} onChange={(e) => updateForm("company_address", e.target.value)} />
                </div>

                <div className="border-t border-[#ead8cb] pt-3 md:col-span-2 xl:col-span-3">
                  <div className="mb-2 text-sm font-bold text-slate-900">Registration Admin Contact</div>
                </div>

                <div>
                  <label className={formLabelClass}>Admin Name</label>
                  <input className={formInputClass} value={form.admin_name || ""} onChange={(e) => updateForm("admin_name", e.target.value)} />
                </div>

                <div>
                  <label className={formLabelClass}>Admin Email</label>
                  <input type="email" className={formInputClass} value={form.admin_email || ""} onChange={(e) => updateForm("admin_email", e.target.value)} />
                </div>

                <div>
                  <label className={formLabelClass}>Admin Mobile</label>
                  <input className={formInputClass} value={form.admin_mobile || ""} onChange={(e) => updateForm("admin_mobile", e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="mb-3 text-sm font-bold text-slate-900">Company Identity</div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <FieldRow label="Company Name" value={company?.company_name || "-"} onEdit={() => openEdit("registration")} />
                    <FieldRow label="Company Public ID" value={company?.company_public_id || "-"} />
                    <FieldRow label="Company Code" value={company?.company_code || "-"} />
                    <FieldRow label="Sector" value={company?.sector || "-"} onEdit={() => openEdit("registration")} />
                    <FieldRow label="Company Email" value={company?.company_email || "-"} onEdit={() => openEdit("registration")} />
                    <FieldRow label="Company Mobile" value={company?.company_mobile || "-"} onEdit={() => openEdit("registration")} />
                    <FieldRow label="State" value={company?.state || "-"} onEdit={() => openEdit("registration")} />
                    <FieldRow label="PIN Code" value={company?.pin_code || "-"} onEdit={() => openEdit("registration")} />
                    <div className="md:col-span-2 xl:col-span-3">
                      <FieldRow label="Company Address" value={company?.company_address || "-"} onEdit={() => openEdit("registration")} />
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#ead8cb] pt-5">
                  <div className="mb-3 text-sm font-bold text-slate-900">Registration Admin Contact</div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <FieldRow label="Admin Name" value={company?.admin_name || "-"} onEdit={() => openEdit("registration")} />
                    <FieldRow label="Admin Email" value={company?.admin_email || "-"} onEdit={() => openEdit("registration")} />
                    <FieldRow label="Admin Mobile" value={company?.admin_mobile || "-"} onEdit={() => openEdit("registration")} />
                  </div>
                </div>
              </div>
            )}
          </SectionCard>
          
          <SectionCard
            title="Logo Management"
            subtitle="Upload company branding and preview logo display shapes."
          >
            <div className="rounded-[24px] border border-slate-200 bg-[#efe2d6] p-4 md:p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
                {LOGO_STYLE_OPTIONS.map((option) => {
                  const active = selectedLogoStyle === option.key;
                  const isRectangle = isRectangleLogoStyle(option.key);
                  const hasLogo = !!company?.logo_url;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setActiveLogoStyle(option.key)}
                      disabled={logoStyleBusy}
                      className={classNames(
                        "flex min-h-[190px] flex-col items-center justify-between rounded-2xl border bg-white p-4 text-center shadow-sm transition",
                        active
                          ? "border-indigo-600 ring-2 ring-indigo-200"
                          : "border-slate-200 hover:border-[#bfa28f]",
                        logoStyleBusy ? "cursor-not-allowed opacity-70" : ""
                      )}
                    >
                      <div className="w-full text-left">
                        <div className="text-sm font-bold text-slate-900">{option.label}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {active ? "Selected preview style" : "Click to preview this style"}
                        </div>
                      </div>

                      <div className="flex flex-1 items-center justify-center py-3">
                        <div
                          className={classNames(
                            "flex items-center justify-center overflow-hidden border border-slate-200 bg-[#F6EEE8] text-2xl font-extrabold text-slate-700 shadow-inner",
                            isRectangle
                              ? hasLogo
                                ? "h-12 w-fit max-w-[170px]"
                                : "h-12 w-[170px] max-w-full"
                              : "h-20 w-20",
                            getLogoShapeClass(option.key)
                          )}
                        >
                          {company?.logo_url ? (
                            <img
                              src={displayLogoUrl || company.logo_url || ""}
                              alt="Company Logo"
                              className="h-full w-auto max-w-full object-contain"
                            />
                          ) : (
                            displayInitial
                          )}
                        </div>
                      </div>

                      <div
                        className={classNames(
                          "rounded-full px-3 py-1 text-[11px] font-bold tracking-wide",
                          active
                            ? "bg-slate-900 text-white"
                            : "bg-[#F6EEE8] text-slate-700"
                        )}
                      >
                        {active ? (logoStyleBusy ? "UPDATING" : "ACTIVE") : "OPTION"}
                      </div>
                    </button>
                  );
                })}

                <div className="flex min-h-[190px] flex-col justify-between rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-sm">
                  <div>
                    <div className="text-sm font-bold text-white">Preview</div>
                    <div className="mt-1 text-xs text-white/80">
                      Current selected company logo shape preview.
                    </div>
                  </div>

                  <div className="flex flex-1 items-center justify-center py-4">
                    <div
                      className={classNames(
                        "flex items-center justify-center overflow-hidden border border-slate-200 bg-white text-2xl font-extrabold text-slate-700 shadow-inner",
                        isRectangleLogoStyle(selectedLogoStyle)
                          ? company?.logo_url
                            ? "h-12 w-fit max-w-[170px]"
                            : "h-12 w-[170px] max-w-full"
                          : "h-20 w-20",
                        getLogoShapeClass(selectedLogoStyle)
                      )}
                    >
                      {company?.logo_url ? (
                        <img
                          src={displayLogoUrl || company.logo_url || ""}
                          alt="Company Logo"
                          className="h-full w-auto max-w-full object-contain"
                        />
                      ) : (
                        displayInitial
                      )}
                    </div>
                  </div>

                  <div className="text-center text-[11px] font-bold tracking-wide text-white/80">
                    {selectedLogoStyle.replace(/_/g, " ").toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-200 pt-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadLogo(file);
                  }}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    disabled={logoBusy}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {logoBusy ? "Uploading..." : company?.logo_url ? "Replace Logo" : "Upload Logo"}
                  </button>

                  <button
                    type="button"
                    disabled={logoBusy}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {logoBusy ? "Please wait..." : "Choose File"}
                  </button>

                  <button
                    type="button"
                    disabled={logoBusy || !company?.logo_url}
                    onClick={deleteLogo}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    Delete Logo
                  </button>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Allowed formats: PNG, JPG, JPEG, WEBP. Maximum size: 300 KB.
                </p>
                {logoBusy ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-900">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                    {logoBusyMessage || "Uploading and applying logo..."}
                  </div>
                ) : null}
                {logoStyleBusy ? (
                  <p className="mt-2 text-xs font-semibold text-slate-900">
                    Updating active logo variant...
                  </p>
                ) : null}
              </div>
            </div>
          </SectionCard>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard
              title="Primary Contact"
              subtitle="Operational point of contact for the company."
              actions={
                editSection === "primary" ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => saveSection("primary")}
                      className={sectionPrimaryButtonClass}
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={cancelEdit}
                      className={sectionSecondaryButtonClass}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openEdit("primary")}
                    className={sectionEditButtonClass}
                  >
                    Edit Section
                  </button>
                )
              }
            >
              {editSection === "primary" && form ? (
                <div className="space-y-2">
                  <div>
                    <label className={formLabelClass}>Primary Contact Name</label>
                    <input className={formInputClass} value={form.primary_contact_name || ""} onChange={(e) => updateForm("primary_contact_name", e.target.value)} />
                  </div>
                  <div>
                    <label className={formLabelClass}>Primary Contact Email</label>
                    <input type="email" className={formInputClass} value={form.primary_contact_email || ""} onChange={(e) => updateForm("primary_contact_email", e.target.value)} />
                  </div>
                  <div>
                    <label className={formLabelClass}>Primary Contact Mobile</label>
                    <input className={formInputClass} value={form.primary_contact_mobile || ""} onChange={(e) => updateForm("primary_contact_mobile", e.target.value)} />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <FieldRow label="Primary Contact Name" value={company?.primary_contact_name || "-"} onEdit={() => openEdit("primary")} />
                  <FieldRow label="Primary Contact Email" value={company?.primary_contact_email || "-"} onEdit={() => openEdit("primary")} />
                  <FieldRow label="Primary Contact Mobile" value={company?.primary_contact_mobile || "-"} onEdit={() => openEdit("primary")} />
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="System Preferences"
              subtitle="Portal defaults and workflow preferences."
              actions={
                editSection === "preferences" ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => saveSection("preferences")}
                      className={sectionPrimaryButtonClass}
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={cancelEdit}
                      className={sectionSecondaryButtonClass}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openEdit("preferences")}
                    className={sectionEditButtonClass}
                  >
                    Edit Section
                  </button>
                )
              }
            >
              {editSection === "preferences" && form ? (
                <div className="space-y-4">
                  <div>
                    <label className={formLabelClass}>Timezone</label>
                    <select className={formInputClass} value={form.timezone || "Asia/Kolkata"} onChange={(e) => updateForm("timezone", e.target.value)}>
                      {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={formLabelClass}>Date Format</label>
                    <select className={formInputClass} value={form.date_format || "DD-MM-YYYY"} onChange={(e) => updateForm("date_format", e.target.value)}>
                      {DATE_FORMATS.map((fmt) => <option key={fmt} value={fmt}>{fmt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={formLabelClass}>Currency Code</label>
                    <select className={formInputClass} value={form.currency_code || "INR"} onChange={(e) => updateForm("currency_code", e.target.value)}>
                      {CURRENCIES.map((cc) => <option key={cc} value={cc}>{cc}</option>)}
                    </select>
                  </div>
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900">
                    <input
                      type="checkbox"
                      checked={!!form.otp_required_for_project_team}
                      onChange={(e) => updateForm("otp_required_for_project_team", e.target.checked)}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    OTP Required for Project Team
                  </label>
                </div>
              ) : (
                <div className="space-y-1">
                  <FieldRow label="Timezone" value={company?.timezone || "-"} onEdit={() => openEdit("preferences")} />
                  <FieldRow label="Date Format" value={company?.date_format || "-"} onEdit={() => openEdit("preferences")} />
                  <FieldRow label="Currency Code" value={company?.currency_code || "-"} onEdit={() => openEdit("preferences")} />
                  <FieldRow label="OTP Required for Project Team" value={formatBoolean(company?.otp_required_for_project_team)} onEdit={() => openEdit("preferences")} />
                </div>
              )}
            </SectionCard>
          </div>
        </div>
    </div>
    </div>
  );
}

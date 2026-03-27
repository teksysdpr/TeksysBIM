"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import CompanyPageHeader from "@/app/components/company/CompanyPageHeader";

export default function EditUserPage() {
  const params = useParams();
  const userId = params?.id;

  return (
    <div className="min-h-screen erp-page-bg p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <CompanyPageHeader />

        <section className="text-white">
          <div className="mb-2">
            <Link
              href="/company/users"
              className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-bold tracking-wide text-white shadow-sm sm:text-sm"
            >
              Back to User Management
            </Link>
          </div>

          <h2 className="text-3xl font-extrabold tracking-wide">Edit User</h2>
          <p className="mt-2 text-sm text-white/85 md:text-base">
            Editing record for User ID: {String(userId)}
          </p>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input className="rounded-2xl border border-[#d6c1b0] bg-white px-4 py-3 text-sm text-slate-900 outline-none" placeholder="Full Name" />
            <input className="rounded-2xl border border-[#d6c1b0] bg-white px-4 py-3 text-sm text-slate-900 outline-none" placeholder="User ID" />
            <input className="rounded-2xl border border-[#d6c1b0] bg-white px-4 py-3 text-sm text-slate-900 outline-none" placeholder="Password" />
            <input className="rounded-2xl border border-[#d6c1b0] bg-white px-4 py-3 text-sm text-slate-900 outline-none" placeholder="Email" />
            <input className="rounded-2xl border border-[#d6c1b0] bg-white px-4 py-3 text-sm text-slate-900 outline-none" placeholder="Mobile Number" />
            <select className="rounded-2xl border border-[#d6c1b0] bg-white px-4 py-3 text-sm text-slate-900 outline-none">
              <option>Company Admin</option>
              <option>Contract Manager</option>
              <option>Project Team</option>
            </select>
            <select className="rounded-2xl border border-[#d6c1b0] bg-white px-4 py-3 text-sm text-slate-900 outline-none">
              <option>Administrator</option>
              <option>Planning Manager</option>
              <option>Site Engineer</option>
            </select>
            <select className="rounded-2xl border border-[#d6c1b0] bg-white px-4 py-3 text-sm text-slate-900 outline-none">
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg">
              Save Changes
            </button>
            <button className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg">
              Reset Password
            </button>
            <button className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg">
              Delete User
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

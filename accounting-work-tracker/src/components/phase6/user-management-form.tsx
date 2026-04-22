"use client";

import { useActionState, useMemo, useState } from "react";
import { createUserAction, type CreateUserActionState } from "@/app/settings/actions";
import { ROLE_OPTIONS, type AppRole } from "@/lib/constants";

type UserFormState = {
  fullName: string;
  email: string;
  password: string;
  role: AppRole;
};

const initialForm: UserFormState = {
  fullName: "",
  email: "",
  password: "",
  role: "staff",
};

const initialActionState: CreateUserActionState = {};

export function UserManagementForm() {
  const [form, setForm] = useState<UserFormState>(initialForm);
  const [state, formAction, isPending] = useActionState(createUserAction, initialActionState);

  const isDisabled = useMemo(() => {
    return !form.fullName.trim() || !form.email.trim() || !form.password.trim();
  }, [form]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
            ชื่อแสดงผล
          </label>
          <input
            id="fullName"
            name="fullName"
            value={form.fullName}
            onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
            placeholder="เช่น สมหญิง ใจดี"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            อีเมลสำหรับเข้าสู่ระบบ
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="staff1@company.com"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            autoComplete="email"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            รหัสผ่านเริ่มต้น
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="อย่างน้อย 8 ตัวอักษร"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="role" className="text-sm font-medium text-slate-700">
            บทบาท
          </label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as AppRole }))}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-800">สิ่งที่ระบบจะทำให้อัตโนมัติ</p>
        <ul className="mt-2 space-y-1">
          <li>- สร้างบัญชีใน Supabase Auth ด้วย email และ password</li>
          <li>- สร้าง profile พร้อม role ในตาราง user_profiles</li>
          <li>- เปิด active ให้พร้อมใช้งานทันที</li>
        </ul>
      </div>

      {state.error ? (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{state.error}</div>
      ) : null}

      {state.success ? (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{state.success}</div>
      ) : null}

      <button
        type="submit"
        disabled={isDisabled || isPending}
        className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isPending ? "กำลังสร้างผู้ใช้งาน..." : "สร้างผู้ใช้งานใหม่"}
      </button>
    </form>
  );
}

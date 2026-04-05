"use client";

import { useMemo, useState } from "react";
import type { LoginFormState } from "@/types/auth";

const initialState: LoginFormState = {
  email: "",
  password: "",
};

export function LoginForm() {
  const [form, setForm] = useState<LoginFormState>(initialState);

  const isDisabled = useMemo(() => {
    return form.email.trim() === "" || form.password.trim() === "";
  }, [form]);

  return (
    <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">เข้าสู่ระบบ</h1>
        <p className="mt-1 text-sm text-slate-500">
          ใช้อีเมลและรหัสผ่านของทีมงานเพื่อเข้าใช้งานระบบ
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="email">
          อีเมล
        </label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(event) =>
            setForm((current) => ({ ...current, email: event.target.value }))
          }
          placeholder="name@company.com"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">
            รหัสผ่าน
          </label>
          <button
            type="button"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ลืมรหัสผ่าน
          </button>
        </div>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={(event) =>
            setForm((current) => ({ ...current, password: event.target.value }))
          }
          placeholder="••••••••"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <button
        type="submit"
        disabled={isDisabled}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        เข้าสู่ระบบ
      </button>

      <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-800">สถานะตอนนี้</p>
        <p className="mt-1">
          หน้านี้เป็น UI สำหรับ Phase 1 เพื่อเตรียม auth flow ก่อนเชื่อม Supabase Auth
        </p>
      </div>
    </form>
  );
}

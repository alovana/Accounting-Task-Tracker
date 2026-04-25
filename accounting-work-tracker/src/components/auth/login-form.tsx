"use client";

import { useActionState, useMemo, useState } from "react";
import { loginAction, type LoginActionState } from "@/app/login/actions";
import type { LoginFormState } from "@/types/auth";

const initialState: LoginFormState = {
  email: "",
  password: "",
};

const initialActionState: LoginActionState = {};

export function LoginForm() {
  const [form, setForm] = useState<LoginFormState>(initialState);
  const [state, formAction, isPending] = useActionState(loginAction, initialActionState);

  const isDisabled = useMemo(() => {
    return form.email.trim() === "" || form.password.trim() === "";
  }, [form]);

  return (
    <form action={formAction} className="space-y-5 rounded-[28px] border border-white/70 bg-white/90 p-8 shadow-[0_28px_80px_-34px_rgba(15,23,42,0.32)] backdrop-blur xl:p-10">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-900">เข้าสู่ระบบ</h1>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="email">
          อีเมล
        </label>
        <input
          id="email"
          type="email"
          name="email"
          value={form.email}
          onChange={(event) =>
            setForm((current) => ({ ...current, email: event.target.value }))
          }
          placeholder="name@company.com"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="password">
          รหัสผ่าน
        </label>
        <input
          id="password"
          type="password"
          name="password"
          value={form.password}
          onChange={(event) =>
            setForm((current) => ({ ...current, password: event.target.value }))
          }
          placeholder="••••••••"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          autoComplete="current-password"
        />
      </div>

      <button
        type="submit"
        disabled={isDisabled || isPending}
        className="w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>

      {state.error ? (
        <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{state.error}</div>
      ) : null}
    </form>
  );
}

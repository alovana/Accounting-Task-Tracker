"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginActionState } from "@/app/login/actions";

type LoginFormState = {
  email: string;
  password: string;
};

const initialState: LoginFormState = {
  email: "",
  password: "",
};

const initialActionState: LoginActionState = {};

export function LoginForm() {
  const [form, setForm] = useState<LoginFormState>(initialState);
  const [state, formAction, isPending] = useActionState(loginAction, initialActionState);

  return (
    <form action={formAction} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="email">
          อีเมล
        </label>
        <input
          id="email"
          type="email"
          name="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          placeholder="name@company.com"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-500"
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
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          placeholder="รหัสผ่าน"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-500"
          autoComplete="current-password"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="min-h-12 w-full rounded-2xl bg-slate-900 px-4 py-3 text-base font-semibold text-white transition active:scale-[0.99] disabled:cursor-wait disabled:bg-slate-500"
      >
        {isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>

      {state.error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{state.error}</div> : null}
    </form>
  );
}

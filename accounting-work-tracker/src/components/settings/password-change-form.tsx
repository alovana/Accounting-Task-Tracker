"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { changePasswordAction, type ChangePasswordActionState } from "@/app/settings/actions";

type PasswordFormState = {
  password: string;
  confirmPassword: string;
};

const initialForm: PasswordFormState = {
  password: "",
  confirmPassword: "",
};

const initialActionState: ChangePasswordActionState = {};

export function PasswordChangeForm() {
  const [form, setForm] = useState<PasswordFormState>(initialForm);
  const [state, formAction, isPending] = useActionState(changePasswordAction, initialActionState);

  const isDisabled = useMemo(() => {
    return !form.password.trim() || !form.confirmPassword.trim();
  }, [form]);

  useEffect(() => {
    if (state.success) {
      setForm(initialForm);
    }
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            รหัสผ่านใหม่
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
          <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
            ยืนยันรหัสผ่านใหม่
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
            placeholder="พิมพ์ซ้ำอีกครั้ง"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        ระบบจะเปลี่ยนรหัสผ่านของบัญชีที่คุณกำลังใช้งานอยู่ผ่าน Supabase Auth ทันที
      </div>

      {state.error ? <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{state.error}</div> : null}
      {state.success ? <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{state.success}</div> : null}

      <button
        type="submit"
        disabled={isDisabled || isPending}
        className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isPending ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { queueLineTestNotificationAction } from "@/app/notifications/actions";

const initialState = {
  success: false,
  message: "",
  error: "",
};

export function LineTestForm() {
  const [state, formAction, isPending] = useActionState(queueLineTestNotificationAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div>
        <label className="text-sm font-medium text-slate-700">ข้อความทดสอบ LINE OA</label>
        <textarea
          name="message"
          rows={4}
          placeholder="เช่น ทดสอบส่งแจ้งเตือนจาก Accounting Task Tracker"
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-300"
      >
        {isPending ? "กำลังเพิ่มคิว..." : "เพิ่ม test notification"}
      </button>

      {state.error ? <p className="text-sm text-rose-700">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-emerald-700">{state.message}</p> : null}
    </form>
  );
}

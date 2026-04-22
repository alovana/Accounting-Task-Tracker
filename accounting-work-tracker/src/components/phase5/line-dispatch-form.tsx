"use client";

import { useActionState } from "react";
import { dispatchLineQueueAction } from "@/app/settings/actions";

const initialState = {
  success: false,
  message: "",
  error: "",
};

export function LineDispatchForm() {
  const [state, formAction, isPending] = useActionState(dispatchLineQueueAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="space-y-1 text-sm text-slate-600">
        <p className="font-medium text-slate-800">Manual LINE dispatch</p>
        <p>กดปุ่มเพื่อให้ server ดึงรายการ queued จาก line_notifications แล้วส่งออกไปยัง LINE group ที่ตั้งค่าไว้</p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-slate-300"
      >
        {isPending ? "กำลัง dispatch..." : "Dispatch queued notifications"}
      </button>

      {state.error ? <p className="text-sm text-rose-700">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-emerald-700">{state.message}</p> : null}
    </form>
  );
}

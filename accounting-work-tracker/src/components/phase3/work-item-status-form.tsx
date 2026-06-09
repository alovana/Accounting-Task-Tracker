"use client";

import { useActionState } from "react";
import { updateWorkItemStatusAction } from "@/app/work-cycles/actions";
import { getNextAllowedStatuses, getWorkItemStatusLabel } from "@/lib/phase3/status-mappers";
import type { WorkItemStatus } from "@/lib/mock/phase3-data";

const initialState = {
  success: false,
  message: "",
  error: "",
};

type WorkItemStatusFormProps = {
  workItemId: string;
  workCycleId: string;
  currentStatus: WorkItemStatus;
  updatedByName: string;
};

export function WorkItemStatusForm({
  workItemId,
  workCycleId,
  currentStatus,
  updatedByName,
}: WorkItemStatusFormProps) {
  const [state, formAction, isPending] = useActionState(updateWorkItemStatusAction, initialState);
  const nextStatuses = getNextAllowedStatuses(currentStatus);

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
      <input type="hidden" name="workItemId" value={workItemId} />
      <input type="hidden" name="workCycleId" value={workCycleId} />
      <input type="hidden" name="currentStatus" value={currentStatus} />
      <input type="hidden" name="updatedBy" value={updatedByName} />

      <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
        <select
          name="nextStatus"
          defaultValue={nextStatuses[0]}
          className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-slate-500"
        >
          {nextStatuses.map((status) => (
            <option key={status} value={status}>
              {getWorkItemStatusLabel(status)}
            </option>
          ))}
        </select>
        <input
          name="comment"
          placeholder="หมายเหตุสั้น ๆ ถ้ามี"
          className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-500"
        />
        <button
          type="submit"
          disabled={isPending || nextStatuses.length === 0}
          className="min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:cursor-wait disabled:bg-slate-400"
        >
          {isPending ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>

      {state.error ? <p className="text-sm text-rose-700">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-emerald-700">{state.message}</p> : null}
    </form>
  );
}

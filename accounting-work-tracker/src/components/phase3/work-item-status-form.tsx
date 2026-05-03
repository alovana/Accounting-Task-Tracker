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
  compact?: boolean;
};

export function WorkItemStatusForm({
  workItemId,
  workCycleId,
  currentStatus,
  updatedByName,
  compact = false,
}: WorkItemStatusFormProps) {
  const [state, formAction, isPending] = useActionState(updateWorkItemStatusAction, initialState);
  const nextStatuses = getNextAllowedStatuses(currentStatus);

  if (nextStatuses.length === 0) {
    return null;
  }

  return (
    <form
      action={formAction}
      className={`mt-4 rounded-xl border p-4 ${
        compact ? "border-slate-100 bg-white" : "border-slate-200 bg-slate-50"
      }`}
    >
      <input type="hidden" name="workItemId" value={workItemId} />
      <input type="hidden" name="workCycleId" value={workCycleId} />
      <input type="hidden" name="currentStatus" value={currentStatus} />
      <input type="hidden" name="updatedBy" value={updatedByName} />

      <div className={`grid gap-3 ${compact ? "grid-cols-1" : "md:grid-cols-[1fr_1.2fr_auto]"}`}>
        <div>
          <label className="text-xs font-medium text-slate-600">สถานะถัดไป</label>
          <select
            name="nextStatus"
            defaultValue={nextStatuses[0]}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {nextStatuses.map((status) => (
              <option key={status} value={status}>
                {getWorkItemStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">หมายเหตุ</label>
          <input
            name="comment"
            placeholder="เช่น รอเอกสารเพิ่ม หรือเริ่มทำแล้ว"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-300"
          >
            {isPending ? "กำลังบันทึก..." : "อัปเดตสถานะ"}
          </button>
        </div>
      </div>

      {state.error ? <p className="mt-3 text-sm text-rose-700">{state.error}</p> : null}
      {state.message ? <p className="mt-3 text-sm text-emerald-700">{state.message}</p> : null}
    </form>
  );
}

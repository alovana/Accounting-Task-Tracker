"use client";

import { useActionState } from "react";
import {
  updateCustomerAssignmentsAction,
  type UpdateCustomerAssignmentsActionState,
} from "@/app/customers/actions";
import type { Customer } from "@/types/domain";
import type { UserAssignmentOption } from "@/lib/supabase/queries";

type CustomerAssignmentFormProps = {
  customer: Customer;
  staffOptions: UserAssignmentOption[];
  managerOptions: UserAssignmentOption[];
};

const initialState: UpdateCustomerAssignmentsActionState = {};

function renderOptionLabel(option: UserAssignmentOption) {
  return `${option.fullName} (${option.role})${option.email ? ` • ${option.email}` : ""}`;
}

export function CustomerAssignmentForm({
  customer,
  staffOptions,
  managerOptions,
}: CustomerAssignmentFormProps) {
  const [state, formAction, isPending] = useActionState(updateCustomerAssignmentsAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <input type="hidden" name="customerId" value={customer.id} />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={`assignedUserId-${customer.id}`} className="text-xs font-medium text-slate-600">
            Staff owner
          </label>
          <select
            id={`assignedUserId-${customer.id}`}
            name="assignedUserId"
            defaultValue={customer.assignedUserId || ""}
            disabled={isPending}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">ยังไม่กำหนด</option>
            {staffOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {renderOptionLabel(option)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`managerUserId-${customer.id}`} className="text-xs font-medium text-slate-600">
            Manager owner
          </label>
          <select
            id={`managerUserId-${customer.id}`}
            name="managerUserId"
            defaultValue={customer.managerUserId || ""}
            disabled={isPending}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">ยังไม่กำหนด</option>
            {managerOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {renderOptionLabel(option)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          บันทึกแล้ว ระบบจะซิงก์ owner ของงานที่ยังเปิดอยู่ให้ใช้ชื่อจริงจาก user_profiles
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isPending ? "กำลังบันทึก..." : "บันทึก assignment"}
        </button>
      </div>

      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
    </form>
  );
}

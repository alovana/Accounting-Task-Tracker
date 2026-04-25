"use client";

import { useActionState } from "react";
import {
  createCustomerAction,
  type CreateCustomerActionState,
} from "@/app/customers/actions";
import { getServiceStatusLabel } from "@/lib/mappers";
import type { UserAssignmentOption } from "@/lib/supabase/queries";
import type { BusinessType, ServiceStatus } from "@/types/domain";

const initialState: CreateCustomerActionState = {};
const serviceStatusOptions: ServiceStatus[] = ["active", "onboarding", "paused"];

type CustomerCreateFormProps = {
  businessTypes: BusinessType[];
  staffOptions: UserAssignmentOption[];
  managerOptions: UserAssignmentOption[];
};

function renderOptionLabel(option: UserAssignmentOption) {
  return `${option.fullName} (${option.role})${option.email ? ` • ${option.email}` : ""}`;
}

export function CustomerCreateForm({
  businessTypes,
  staffOptions,
  managerOptions,
}: CustomerCreateFormProps) {
  const [state, formAction, isPending] = useActionState(createCustomerAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="customer-code" className="text-xs font-medium text-slate-600">
            รหัสลูกค้า
          </label>
          <input
            id="customer-code"
            name="code"
            required
            disabled={isPending}
            placeholder="เช่น CUST-001"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="customer-name" className="text-xs font-medium text-slate-600">
            ชื่อลูกค้า
          </label>
          <input
            id="customer-name"
            name="name"
            required
            disabled={isPending}
            placeholder="ชื่อบริษัทหรือร้านค้า"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="customer-tax-id" className="text-xs font-medium text-slate-600">
            Tax ID
          </label>
          <input
            id="customer-tax-id"
            name="taxId"
            required
            disabled={isPending}
            placeholder="เลขประจำตัวผู้เสียภาษี"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="customer-business-type" className="text-xs font-medium text-slate-600">
            ประเภทธุรกิจ
          </label>
          <select
            id="customer-business-type"
            name="businessTypeId"
            required
            defaultValue={businessTypes[0]?.id || ""}
            disabled={isPending || businessTypes.length === 0}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {businessTypes.length === 0 ? <option value="">ยังไม่มี business type</option> : null}
            {businessTypes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="customer-service-status" className="text-xs font-medium text-slate-600">
            สถานะบริการ
          </label>
          <select
            id="customer-service-status"
            name="serviceStatus"
            defaultValue="onboarding"
            disabled={isPending}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {serviceStatusOptions.map((status) => (
              <option key={status} value={status}>
                {getServiceStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="customer-active" className="text-xs font-medium text-slate-600">
            สถานะใช้งาน
          </label>
          <label className="flex h-[42px] items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm text-slate-700">
            <input type="checkbox" id="customer-active" name="active" defaultChecked disabled={isPending} />
            ลูกค้านี้ยัง active อยู่
          </label>
        </div>

        <div className="space-y-1.5 md:col-span-2 xl:col-span-1">
          <label htmlFor="customer-assigned-user" className="text-xs font-medium text-slate-600">
            Assigned staff
          </label>
          <select
            id="customer-assigned-user"
            name="assignedUserId"
            defaultValue=""
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

        <div className="space-y-1.5 md:col-span-2 xl:col-span-1">
          <label htmlFor="customer-manager-user" className="text-xs font-medium text-slate-600">
            Manager owner
          </label>
          <select
            id="customer-manager-user"
            name="managerUserId"
            defaultValue=""
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

      <div className="space-y-1.5">
        <label htmlFor="customer-notes" className="text-xs font-medium text-slate-600">
          Notes
        </label>
        <textarea
          id="customer-notes"
          name="notes"
          rows={4}
          disabled={isPending}
          placeholder="บันทึกเพิ่มเติมเกี่ยวกับลูกค้ารายนี้"
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-slate-500">
          สร้างแล้วข้อมูลจะพร้อมใช้ในหน้า work cycles, dashboard และการ assign งานทันที
        </p>
        <button
          type="submit"
          disabled={isPending || businessTypes.length === 0}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isPending ? "กำลังเพิ่มลูกค้า..." : "เพิ่มลูกค้า"}
        </button>
      </div>

      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
    </form>
  );
}

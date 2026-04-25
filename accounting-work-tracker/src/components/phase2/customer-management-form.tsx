"use client";

import { useActionState, useMemo, useState } from "react";
import {
  deleteCustomerAction,
  updateCustomerAction,
  type DeleteCustomerActionState,
  type UpdateCustomerActionState,
} from "@/app/customers/actions";
import { getServiceStatusLabel } from "@/lib/mappers";
import type { UserAssignmentOption } from "@/lib/supabase/queries";
import type { BusinessType, Customer, ServiceStatus } from "@/types/domain";

type CustomerManagementFormProps = {
  customer: Customer;
  businessTypes: BusinessType[];
  staffOptions: UserAssignmentOption[];
  managerOptions: UserAssignmentOption[];
};

const initialUpdateState: UpdateCustomerActionState = {};
const initialDeleteState: DeleteCustomerActionState = {};
const serviceStatusOptions: ServiceStatus[] = ["active", "onboarding", "paused"];

function renderOptionLabel(option: UserAssignmentOption) {
  return `${option.fullName} (${option.role})${option.email ? ` • ${option.email}` : ""}`;
}

export function CustomerManagementForm({
  customer,
  businessTypes,
  staffOptions,
  managerOptions,
}: CustomerManagementFormProps) {
  const [updateState, updateAction, isUpdating] = useActionState(updateCustomerAction, initialUpdateState);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteCustomerAction, initialDeleteState);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>(customer.serviceStatus);
  const [active, setActive] = useState(customer.active);

  const isBusy = isUpdating || isDeleting;
  const businessTypeName = useMemo(
    () => businessTypes.find((item) => item.id === customer.businessTypeId)?.name ?? "-",
    [businessTypes, customer.businessTypeId],
  );

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <form action={updateAction} className="space-y-4">
        <input type="hidden" name="customerId" value={customer.id} />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor={`code-${customer.id}`} className="text-xs font-medium text-slate-600">
              รหัสลูกค้า
            </label>
            <input
              id={`code-${customer.id}`}
              name="code"
              required
              defaultValue={customer.code}
              disabled={isBusy}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor={`name-${customer.id}`} className="text-xs font-medium text-slate-600">
              ชื่อลูกค้า
            </label>
            <input
              id={`name-${customer.id}`}
              name="name"
              required
              defaultValue={customer.name}
              disabled={isBusy}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor={`taxId-${customer.id}`} className="text-xs font-medium text-slate-600">
              Tax ID
            </label>
            <input
              id={`taxId-${customer.id}`}
              name="taxId"
              required
              defaultValue={customer.taxId}
              disabled={isBusy}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor={`businessTypeId-${customer.id}`} className="text-xs font-medium text-slate-600">
              ประเภทธุรกิจ
            </label>
            <select
              id={`businessTypeId-${customer.id}`}
              name="businessTypeId"
              defaultValue={customer.businessTypeId}
              disabled={isBusy || businessTypes.length === 0}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {businessTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor={`serviceStatus-${customer.id}`} className="text-xs font-medium text-slate-600">
              สถานะบริการ
            </label>
            <select
              id={`serviceStatus-${customer.id}`}
              name="serviceStatus"
              value={serviceStatus}
              onChange={(event) => setServiceStatus(event.target.value as ServiceStatus)}
              disabled={isBusy}
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
            <label htmlFor={`active-${customer.id}`} className="text-xs font-medium text-slate-600">
              สถานะใช้งาน
            </label>
            <label className="flex h-[42px] items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm text-slate-700">
              <input
                type="checkbox"
                id={`active-${customer.id}`}
                name="active"
                checked={active}
                onChange={() => setActive((current) => !current)}
                disabled={isBusy}
              />
              ลูกค้านี้ยัง active อยู่
            </label>
          </div>

          <div className="space-y-1.5 md:col-span-2 xl:col-span-1">
            <label htmlFor={`assignedUserId-${customer.id}`} className="text-xs font-medium text-slate-600">
              Assigned staff
            </label>
            <select
              id={`assignedUserId-${customer.id}`}
              name="assignedUserId"
              defaultValue={customer.assignedUserId || ""}
              disabled={isBusy}
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
            <label htmlFor={`managerUserId-${customer.id}`} className="text-xs font-medium text-slate-600">
              Manager owner
            </label>
            <select
              id={`managerUserId-${customer.id}`}
              name="managerUserId"
              defaultValue={customer.managerUserId || ""}
              disabled={isBusy}
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
          <label htmlFor={`notes-${customer.id}`} className="text-xs font-medium text-slate-600">
            Notes
          </label>
          <textarea
            id={`notes-${customer.id}`}
            name="notes"
            rows={4}
            defaultValue={customer.notes}
            disabled={isBusy}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <ul className="space-y-1">
            <li>- บันทึกแล้ว ระบบจะอัปเดตข้อมูลลูกค้าและซิงก์ owner ของงานที่ยังเปิดอยู่</li>
            <li>- หน้าที่เกี่ยวข้องอย่าง dashboard และ work cycles จะถูก revalidate อัตโนมัติ</li>
            <li>- ลูกค้าปัจจุบันอยู่ในประเภทธุรกิจ {businessTypeName}</li>
          </ul>
        </div>

        {updateState.error ? <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{updateState.error}</div> : null}
        {updateState.success ? <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{updateState.success}</div> : null}

        <button
          type="submit"
          disabled={isBusy}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isUpdating ? "กำลังบันทึก..." : "บันทึกข้อมูลลูกค้า"}
        </button>
      </form>

      <form action={deleteAction} className="border-t border-slate-100 pt-4">
        <input type="hidden" name="customerId" value={customer.id} />
        <input type="hidden" name="customerName" value={customer.name} />
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            ลบลูกค้าได้เฉพาะกรณียังไม่มี work cycles หรือประวัติงาน หากมีงานแล้วระบบจะบล็อกและแนะนำให้ปิด active แทน
          </p>
          <button
            type="submit"
            disabled={isBusy}
            onClick={(event) => {
              if (!window.confirm(`ลบลูกค้า ${customer.name} ถาวรใช่หรือไม่? การลบนี้ไม่สามารถย้อนกลับได้`)) {
                event.preventDefault();
              }
            }}
            className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          >
            {isDeleting ? "กำลังลบ..." : "ลบลูกค้าถาวร"}
          </button>
        </div>
        {deleteState.error ? <div className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{deleteState.error}</div> : null}
        {deleteState.success ? <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{deleteState.success}</div> : null}
      </form>
    </div>
  );
}

"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createBusinessTypeAction,
  deleteBusinessTypeAction,
  updateBusinessTypeAction,
  type CreateBusinessTypeActionState,
  type DeleteBusinessTypeActionState,
  type UpdateBusinessTypeActionState,
} from "@/app/customers/actions";
import { StatusBadge } from "@/components/phase2/status-badge";
import type { BusinessType } from "@/types/domain";

const initialCreateState: CreateBusinessTypeActionState = {};
const initialUpdateState: UpdateBusinessTypeActionState = {};
const initialDeleteState: DeleteBusinessTypeActionState = {};

type BusinessTypeManagementProps = {
  businessTypes: BusinessType[];
  isConnectedMode: boolean;
};

function CreateBusinessTypeForm({ disabled }: { disabled: boolean }) {
  const [state, formAction, isPending] = useActionState(createBusinessTypeAction, initialCreateState);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="new-business-type-name" className="text-xs font-medium text-slate-600">
            ชื่อประเภทธุรกิจ
          </label>
          <input
            id="new-business-type-name"
            name="name"
            required
            disabled={disabled || isPending}
            placeholder="เช่น บริษัทบริการ"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-business-type-active" className="text-xs font-medium text-slate-600">
            สถานะใช้งาน
          </label>
          <label className="flex h-[42px] items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm text-slate-700">
            <input type="checkbox" id="new-business-type-active" name="active" defaultChecked disabled={disabled || isPending} />
            เปิดใช้งานทันที
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="new-business-type-description" className="text-xs font-medium text-slate-600">
          คำอธิบาย
        </label>
        <textarea
          id="new-business-type-description"
          name="description"
          rows={3}
          disabled={disabled || isPending}
          placeholder="อธิบายสั้น ๆ ว่าธุรกิจกลุ่มนี้ใช้กับลูกค้าแบบไหน"
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-slate-500">เพิ่มแล้วจะนำไปใช้กับลูกค้าใหม่และ checklist templates ได้ทันที</p>
        <button
          type="submit"
          disabled={disabled || isPending}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isPending ? "กำลังเพิ่ม..." : "เพิ่ม business type"}
        </button>
      </div>

      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
    </form>
  );
}

function BusinessTypeEditor({ businessType, disabled }: { businessType: BusinessType; disabled: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [updateState, updateAction, isUpdating] = useActionState(updateBusinessTypeAction, initialUpdateState);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteBusinessTypeAction, initialDeleteState);

  const isBusy = disabled || isUpdating || isDeleting;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-900">{businessType.name}</p>
            <StatusBadge
              label={businessType.active ? "active" : "inactive"}
              tone={businessType.active ? "green" : "slate"}
            />
          </div>
          <p className="mt-1 text-sm text-slate-600">{businessType.description || "-"}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
        >
          {isExpanded ? "ซ่อนฟอร์ม" : "แก้ไข / ลบ"}
        </button>
      </div>

      {isExpanded ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_auto]">
          <form action={updateAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
            <input type="hidden" name="businessTypeId" value={businessType.id} />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor={`business-type-name-${businessType.id}`} className="text-xs font-medium text-slate-600">
                  ชื่อประเภทธุรกิจ
                </label>
                <input
                  id={`business-type-name-${businessType.id}`}
                  name="name"
                  required
                  defaultValue={businessType.name}
                  disabled={isBusy}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor={`business-type-active-${businessType.id}`} className="text-xs font-medium text-slate-600">
                  สถานะใช้งาน
                </label>
                <label className="flex h-[42px] items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    id={`business-type-active-${businessType.id}`}
                    name="active"
                    defaultChecked={businessType.active}
                    disabled={isBusy}
                  />
                  เปิดให้เลือกใช้งาน
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor={`business-type-description-${businessType.id}`} className="text-xs font-medium text-slate-600">
                คำอธิบาย
              </label>
              <textarea
                id={`business-type-description-${businessType.id}`}
                name="description"
                rows={3}
                defaultValue={businessType.description}
                disabled={isBusy}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={isBusy}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isUpdating ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </button>
            </div>

            {updateState.error ? <p className="text-sm text-rose-600">{updateState.error}</p> : null}
            {updateState.success ? <p className="text-sm text-emerald-600">{updateState.success}</p> : null}
          </form>

          <form action={deleteAction} className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 xl:w-72">
            <input type="hidden" name="businessTypeId" value={businessType.id} />
            <input type="hidden" name="businessTypeName" value={businessType.name} />
            <div>
              <p className="text-sm font-medium text-rose-900">ลบ business type</p>
              <p className="mt-1 text-xs text-rose-700">
                ถ้ายังมีลูกค้าหรือ checklist template อ้างอิงอยู่ ระบบจะไม่ให้ลบ และควรปิด active แทน
              </p>
            </div>
            <button
              type="submit"
              disabled={isBusy}
              className="w-full rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
            >
              {isDeleting ? "กำลังลบ..." : "ลบ business type"}
            </button>
            {deleteState.error ? <p className="text-sm text-rose-600">{deleteState.error}</p> : null}
            {deleteState.success ? <p className="text-sm text-emerald-600">{deleteState.success}</p> : null}
          </form>
        </div>
      ) : null}
    </div>
  );
}

export function BusinessTypeManagement({ businessTypes, isConnectedMode }: BusinessTypeManagementProps) {
  const [query, setQuery] = useState("");

  const filteredBusinessTypes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return businessTypes;
    }

    return businessTypes.filter((item) => {
      const haystack = [item.name, item.description, item.active ? "active" : "inactive"].join(" ").toLowerCase();
      return haystack.includes(normalized);
    });
  }, [businessTypes, query]);

  return (
    <div className="space-y-4">
      <CreateBusinessTypeForm disabled={!isConnectedMode} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">รายการประเภทธุรกิจ</p>
            <p className="text-xs text-slate-500">ค้นหาและจัดการ business types ที่ใช้ทั้งฝั่งลูกค้าและ checklist</p>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาชื่อหรือคำอธิบาย"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:max-w-xs"
          />
        </div>
      </div>

      {filteredBusinessTypes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          ไม่พบ business type ที่ตรงกับคำค้น
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBusinessTypes.map((businessType) => (
            <BusinessTypeEditor
              key={businessType.id}
              businessType={businessType}
              disabled={!isConnectedMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

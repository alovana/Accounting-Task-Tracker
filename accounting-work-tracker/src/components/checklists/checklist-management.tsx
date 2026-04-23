"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createChecklistTemplateAction,
  createChecklistTemplateItemAction,
  deleteChecklistTemplateAction,
  deleteChecklistTemplateItemAction,
  type ChecklistActionState,
  updateChecklistTemplateAction,
  updateChecklistTemplateItemAction,
} from "@/app/checklists/actions";
import type { AppRole } from "@/lib/constants";
import type { BusinessType, ChecklistTemplate, ChecklistTemplateItem } from "@/types/domain";

type ChecklistManagementProps = {
  businessTypes: BusinessType[];
  checklistTemplates: ChecklistTemplate[];
  checklistTemplateItems: ChecklistTemplateItem[];
  isConnectedMode: boolean;
};

const initialActionState: ChecklistActionState = {};

function ActionMessage({ state }: { state: ChecklistActionState }) {
  if (state.error) {
    return <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</div>;
  }

  if (state.success) {
    return <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</div>;
  }

  return null;
}

function TemplateCreateForm({ businessTypes, disabled }: { businessTypes: BusinessType[]; disabled: boolean }) {
  const [state, formAction, isPending] = useActionState(createChecklistTemplateAction, initialActionState);
  const [active, setActive] = useState(true);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="space-y-2">
          <label htmlFor="new-business-type" className="text-sm font-medium text-slate-700">ประเภทธุรกิจ</label>
          <select id="new-business-type" name="businessTypeId" defaultValue={businessTypes[0]?.id || ""} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" disabled={disabled || isPending}>
            {businessTypes.map((businessType) => (
              <option key={businessType.id} value={businessType.id}>{businessType.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="new-template-name" className="text-sm font-medium text-slate-700">ชื่อ template</label>
          <input id="new-template-name" name="name" placeholder="เช่น ปิดงานบัญชีรายเดือน - ร้านอาหาร" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" disabled={disabled || isPending} />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="new-template-description" className="text-sm font-medium text-slate-700">คำอธิบาย</label>
        <textarea id="new-template-description" name="description" rows={3} placeholder="สรุปวัตถุประสงค์ของ template นี้" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" disabled={disabled || isPending} />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="active" checked={active} onChange={() => setActive((current) => !current)} disabled={disabled || isPending} />
        เปิดใช้งานทันที
      </label>
      <ActionMessage state={state} />
      <button type="submit" disabled={disabled || isPending} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300">
        {isPending ? "กำลังสร้าง template..." : "เพิ่ม checklist template"}
      </button>
    </form>
  );
}

function ItemCreateForm({ templateId, disabled }: { templateId: string; disabled: boolean }) {
  const [state, formAction, isPending] = useActionState(createChecklistTemplateItemAction, initialActionState);
  const [isRequired, setIsRequired] = useState(true);
  const [active, setActive] = useState(true);
  const [role, setRole] = useState<AppRole>("staff");

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-dashed border-slate-200 bg-white p-4">
      <input type="hidden" name="templateId" value={templateId} />
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.8fr_0.7fr_0.7fr]">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">ชื่องานย่อย</label>
          <input name="title" placeholder="เช่น กระทบยอดธนาคาร" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" disabled={disabled || isPending} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Responsible role</label>
          <select name="defaultAssigneeRole" value={role} onChange={(event) => setRole(event.target.value as AppRole)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" disabled={disabled || isPending}>
            <option value="staff">staff</option>
            <option value="manager">manager</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Sort order</label>
          <input name="sortOrder" type="number" min={1} defaultValue={1} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" disabled={disabled || isPending} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Due + วัน</label>
          <input name="dueDayOffset" type="number" defaultValue={0} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" disabled={disabled || isPending} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">รายละเอียดงาน</label>
          <textarea name="description" rows={3} placeholder="คำอธิบายงานย่อย" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" disabled={disabled || isPending} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Due day detail</label>
          <textarea name="dueDayDetail" rows={3} placeholder="เช่น ภายในวันที่ 5 หลังรับ statement ครบ" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" disabled={disabled || isPending} />
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-slate-700">
        <label className="flex items-center gap-2"><input type="checkbox" name="isRequired" checked={isRequired} onChange={() => setIsRequired((current) => !current)} disabled={disabled || isPending} />งานบังคับ</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="active" checked={active} onChange={() => setActive((current) => !current)} disabled={disabled || isPending} />เปิดใช้งาน</label>
      </div>
      <ActionMessage state={state} />
      <button type="submit" disabled={disabled || isPending} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300">
        {isPending ? "กำลังเพิ่ม item..." : "เพิ่ม item"}
      </button>
    </form>
  );
}

function TemplateItemEditor({ item, disabled }: { item: ChecklistTemplateItem; disabled: boolean }) {
  const [state, formAction, isPending] = useActionState(updateChecklistTemplateItemAction, initialActionState);
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteChecklistTemplateItemAction, initialActionState);
  const [role, setRole] = useState<AppRole>(item.defaultAssigneeRole);
  const [isRequired, setIsRequired] = useState(item.isRequired);
  const [active, setActive] = useState(item.active);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={item.id} />
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.8fr_0.65fr_0.65fr]">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">ชื่องานย่อย</label>
            <input name="title" defaultValue={item.title} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" disabled={disabled || isPending || isDeletePending} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Responsible role</label>
            <select name="defaultAssigneeRole" value={role} onChange={(event) => setRole(event.target.value as AppRole)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" disabled={disabled || isPending || isDeletePending}>
              <option value="staff">staff</option>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Sort order</label>
            <input name="sortOrder" type="number" min={1} defaultValue={item.sortOrder} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" disabled={disabled || isPending || isDeletePending} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Due + วัน</label>
            <input name="dueDayOffset" type="number" defaultValue={item.dueDayOffset} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" disabled={disabled || isPending || isDeletePending} />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">รายละเอียดงาน</label>
            <textarea name="description" rows={3} defaultValue={item.description} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" disabled={disabled || isPending || isDeletePending} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Due day detail</label>
            <textarea name="dueDayDetail" rows={3} defaultValue={item.dueDayDetail || ""} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" disabled={disabled || isPending || isDeletePending} />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-700">
          <label className="flex items-center gap-2"><input type="checkbox" name="isRequired" checked={isRequired} onChange={() => setIsRequired((current) => !current)} disabled={disabled || isPending || isDeletePending} />งานบังคับ</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="active" checked={active} onChange={() => setActive((current) => !current)} disabled={disabled || isPending || isDeletePending} />เปิดใช้งาน</label>
        </div>
        <ActionMessage state={state} />
        <ActionMessage state={deleteState} />
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={disabled || isPending || isDeletePending} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300">{isPending ? "กำลังบันทึก..." : "บันทึก item"}</button>
        </div>
      </form>
      <form action={deleteAction} className="mt-3">
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="title" value={item.title} />
        <button type="submit" disabled={disabled || isPending || isDeletePending} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-60">{isDeletePending ? "กำลังลบ..." : "ลบ item"}</button>
      </form>
    </div>
  );
}

function TemplateEditor({ template, businessTypes, items, disabled }: { template: ChecklistTemplate; businessTypes: BusinessType[]; items: ChecklistTemplateItem[]; disabled: boolean }) {
  const [state, formAction, isPending] = useActionState(updateChecklistTemplateAction, initialActionState);
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteChecklistTemplateAction, initialActionState);
  const [active, setActive] = useState(template.active);

  return (
    <article className="rounded-2xl bg-slate-50 p-5">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={template.id} />
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">ประเภทธุรกิจ</label>
            <select name="businessTypeId" defaultValue={template.businessTypeId} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" disabled={disabled || isPending || isDeletePending}>
              {businessTypes.map((businessType) => (
                <option key={businessType.id} value={businessType.id}>{businessType.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">ชื่อ template</label>
            <input name="name" defaultValue={template.name} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" disabled={disabled || isPending || isDeletePending} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">คำอธิบาย</label>
          <textarea name="description" rows={3} defaultValue={template.description} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" disabled={disabled || isPending || isDeletePending} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="active" checked={active} onChange={() => setActive((current) => !current)} disabled={disabled || isPending || isDeletePending} />
          เปิดใช้งาน template นี้
        </label>
        <ActionMessage state={state} />
        <ActionMessage state={deleteState} />
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={disabled || isPending || isDeletePending} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300">{isPending ? "กำลังบันทึก..." : "บันทึก template"}</button>
        </div>
      </form>
      <form action={deleteAction} className="mt-3">
        <input type="hidden" name="id" value={template.id} />
        <input type="hidden" name="name" value={template.name} />
        <button type="submit" disabled={disabled || isPending || isDeletePending} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-60">{isDeletePending ? "กำลังลบ..." : "ลบ template และ items"}</button>
      </form>

      <div className="mt-5 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Checklist items</h4>
          <p className="mt-1 text-sm text-slate-500">แก้ไขลำดับ, วันครบกำหนด, ผู้รับผิดชอบ และสถานะได้จากหน้านี้</p>
        </div>

        {items.map((item) => (
          <TemplateItemEditor key={item.id} item={item} disabled={disabled} />
        ))}

        <ItemCreateForm templateId={template.id} disabled={disabled} />
      </div>
    </article>
  );
}

export function ChecklistManagement({ businessTypes, checklistTemplates, checklistTemplateItems, isConnectedMode }: ChecklistManagementProps) {
  const orderedTemplates = useMemo(
    () => [...checklistTemplates].sort((left, right) => left.name.localeCompare(right.name)),
    [checklistTemplates],
  );

  return (
    <div className="space-y-6">
      {!isConnectedMode ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          หน้านี้พร้อมสำหรับจัดการ checklist แล้ว แต่การบันทึกจะใช้งานได้เมื่อเชื่อมต่อ Supabase service role key
        </div>
      ) : null}

      <TemplateCreateForm businessTypes={businessTypes} disabled={!isConnectedMode} />

      {orderedTemplates.length === 0 ? null : (
        <div className="grid gap-4 xl:grid-cols-2">
          {orderedTemplates.map((template) => {
            const items = checklistTemplateItems
              .filter((item) => item.templateId === template.id)
              .sort((left, right) => left.sortOrder - right.sortOrder);

            return (
              <TemplateEditor
                key={template.id}
                template={template}
                businessTypes={businessTypes}
                items={items}
                disabled={!isConnectedMode}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

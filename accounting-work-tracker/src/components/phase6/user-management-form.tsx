"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createUserAction,
  deleteUserAction,
  updateUserAction,
  type CreateUserActionState,
  type DeleteUserActionState,
  type UpdateUserActionState,
} from "@/app/settings/actions";
import { ROLE_OPTIONS, type AppRole } from "@/lib/constants";
import type { AdminUserRecord } from "@/lib/supabase/queries";

type UserFormState = {
  fullName: string;
  email: string;
  password: string;
  role: AppRole;
  active: boolean;
};

type UserManagementFormProps = {
  users: AdminUserRecord[];
  currentUserId: string;
};

type UserRowProps = {
  user: AdminUserRecord;
  currentUserId: string;
};

const initialCreateForm: UserFormState = {
  fullName: "",
  email: "",
  password: "",
  role: "staff",
  active: true,
};

const initialCreateActionState: CreateUserActionState = {};
const initialUpdateActionState: UpdateUserActionState = {};
const initialDeleteActionState: DeleteUserActionState = {};

function RoleSelect({ value, name, onChange }: { value: AppRole; name: string; onChange: (value: AppRole) => void }) {
  return (
    <select
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value as AppRole)}
      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    >
      {ROLE_OPTIONS.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </select>
  );
}

function UserRow({ user, currentUserId }: UserRowProps) {
  const [form, setForm] = useState<UserFormState>({
    fullName: user.fullName,
    email: user.email,
    password: "",
    role: user.role,
    active: user.active,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [updateState, updateAction, isUpdating] = useActionState(updateUserAction, initialUpdateActionState);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteUserAction, initialDeleteActionState);
  const isSelf = user.id === currentUserId;
  const hasChanges =
    form.fullName.trim() !== user.fullName ||
    form.email.trim().toLowerCase() !== user.email.toLowerCase() ||
    form.password.trim().length > 0 ||
    form.role !== user.role ||
    form.active !== user.active;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-slate-900">{user.fullName}</p>
            {isSelf ? (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">บัญชีของคุณ</span>
            ) : null}
            {!user.active ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">inactive</span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-600">{user.email}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">role: {user.role}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing((current) => !current)}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {isEditing ? "ซ่อนฟอร์มแก้ไข" : "แก้ไขข้อมูล"}
        </button>
      </div>

      {isEditing ? (
        <div className="mt-4 space-y-4">
          <form action={updateAction} className="space-y-4">
            <input type="hidden" name="id" value={user.id} />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor={`fullName-${user.id}`} className="text-sm font-medium text-slate-700">
                  ชื่อแสดงผล
                </label>
                <input
                  id={`fullName-${user.id}`}
                  name="fullName"
                  value={form.fullName}
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor={`email-${user.id}`} className="text-sm font-medium text-slate-700">
                  อีเมล
                </label>
                <input
                  id={`email-${user.id}`}
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[220px_180px_1fr]">
              <div className="space-y-2">
                <label htmlFor={`role-${user.id}`} className="text-sm font-medium text-slate-700">
                  บทบาท
                </label>
                <RoleSelect
                  name="role"
                  value={form.role}
                  onChange={(role) => setForm((current) => ({ ...current, role }))}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor={`active-${user.id}`} className="text-sm font-medium text-slate-700">
                  สถานะ
                </label>
                <select
                  id={`active-${user.id}`}
                  name="active"
                  value={form.active ? "true" : "false"}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, active: event.target.value === "true" }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="true">active</option>
                  <option value="false">inactive</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor={`password-${user.id}`} className="text-sm font-medium text-slate-700">
                  ตั้งรหัสผ่านใหม่ (ไม่บังคับ)
                </label>
                <input
                  id={`password-${user.id}`}
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="เว้นว่างถ้าไม่ต้องการรีเซ็ต"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <ul className="space-y-1">
                <li>- การแก้ไขจะ sync ทั้ง Supabase Auth และตาราง user_profiles</li>
                <li>- หากกรอกรหัสผ่านใหม่ ระบบจะรีเซ็ตรหัสผ่านให้ทันที</li>
                <li>- แนะนำให้ใช้ inactive เมื่อต้องการหยุดใช้งานแต่ยังเก็บประวัติงานไว้</li>
              </ul>
            </div>

            {updateState.error ? <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{updateState.error}</div> : null}
            {updateState.success ? <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{updateState.success}</div> : null}

            <button
              type="submit"
              disabled={!hasChanges || isUpdating}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isUpdating ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </button>
          </form>

          <form action={deleteAction} className="border-t border-slate-100 pt-4">
            <input type="hidden" name="id" value={user.id} />
            <input type="hidden" name="email" value={user.email} />
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-600">ลบถาวรเมื่อไม่ต้องการเก็บบัญชีนี้อีกต่อไป หากต้องการเก็บประวัติ แนะนำให้เปลี่ยนเป็น inactive แทน</p>
              <button
                type="submit"
                disabled={isSelf || isDeleting}
                onClick={(event) => {
                  if (!window.confirm(`ลบผู้ใช้งาน ${user.email} ถาวรใช่หรือไม่? การลบจะทำให้เข้าสู่ระบบไม่ได้อีก`)) {
                    event.preventDefault();
                  }
                }}
                className="rounded-xl border border-rose-200 px-5 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                {isDeleting ? "กำลังลบ..." : isSelf ? "ไม่อนุญาตให้ลบบัญชีตัวเอง" : "ลบผู้ใช้งานถาวร"}
              </button>
            </div>
            {deleteState.error ? <div className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{deleteState.error}</div> : null}
            {deleteState.success ? <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{deleteState.success}</div> : null}
          </form>
        </div>
      ) : null}
    </div>
  );
}

export function UserManagementForm({ users, currentUserId }: UserManagementFormProps) {
  const [form, setForm] = useState<UserFormState>(initialCreateForm);
  const [state, formAction, isPending] = useActionState(createUserAction, initialCreateActionState);

  const isDisabled = useMemo(() => {
    return !form.fullName.trim() || !form.email.trim() || !form.password.trim();
  }, [form]);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-base font-semibold text-slate-900">เพิ่มผู้ใช้งานใหม่</p>
          <p className="mt-1 text-sm text-slate-600">สร้างบัญชีใหม่พร้อม email, role, สถานะ และรหัสผ่านเริ่มต้นจากหน้าเว็บได้ทันที</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
              ชื่อแสดงผล
            </label>
            <input
              id="fullName"
              name="fullName"
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              placeholder="เช่น สมหญิง ใจดี"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              อีเมลสำหรับเข้าสู่ระบบ
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="staff1@company.com"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              autoComplete="email"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_220px_180px]">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              รหัสผ่านเริ่มต้น
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
            <label htmlFor="role" className="text-sm font-medium text-slate-700">
              บทบาท
            </label>
            <RoleSelect name="role" value={form.role} onChange={(role) => setForm((current) => ({ ...current, role }))} />
          </div>

          <div className="space-y-2">
            <label htmlFor="active" className="text-sm font-medium text-slate-700">
              สถานะเริ่มต้น
            </label>
            <select
              id="active"
              name="active"
              value={form.active ? "true" : "false"}
              onChange={(event) => setForm((current) => ({ ...current, active: event.target.value === "true" }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="true">active</option>
              <option value="false">inactive</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800">สิ่งที่ระบบจะทำให้อัตโนมัติ</p>
          <ul className="mt-2 space-y-1">
            <li>- สร้างบัญชีใน Supabase Auth ด้วย email และ password</li>
            <li>- สร้าง profile พร้อม role และ active status ในตาราง user_profiles</li>
            <li>- ผู้ดูแลสามารถกลับมาแก้ไข role, email, ชื่อ หรือรีเซ็ตรหัสผ่านภายหลังได้</li>
          </ul>
        </div>

        {state.error ? <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{state.error}</div> : null}
        {state.success ? <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{state.success}</div> : null}

        <button
          type="submit"
          disabled={isDisabled || isPending}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isPending ? "กำลังสร้างผู้ใช้งาน..." : "สร้างผู้ใช้งานใหม่"}
        </button>
      </form>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-slate-900">รายชื่อพนักงานและผู้ใช้ทั้งหมด</p>
            <p className="mt-1 text-sm text-slate-600">ดู แก้ไข ปิดใช้งาน รีเซ็ตรหัสผ่าน หรือลบบัญชีผู้ใช้ทุกบทบาทจากจุดเดียว</p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{users.length} users</div>
        </div>

        {users.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">ยังไม่มีข้อมูลผู้ใช้ในระบบ</div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <UserRow key={user.id} user={user} currentUserId={currentUserId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

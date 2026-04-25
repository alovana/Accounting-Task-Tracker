"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/phase2/empty-state";
import { StatusBadge } from "@/components/phase2/status-badge";
import { CustomerManagementForm } from "@/components/phase2/customer-management-form";
import { getBusinessTypeName, getServiceStatusLabel } from "@/lib/mappers";
import type { UserAssignmentOption } from "@/lib/supabase/queries";
import type { BusinessType, Customer, ServiceStatus } from "@/types/domain";

const serviceStatusOptions: Array<ServiceStatus | "all"> = ["all", "active", "onboarding", "paused"];
type ActiveFilter = "all" | "active" | "inactive";

type CustomerListPanelProps = {
  customers: Customer[];
  businessTypes: BusinessType[];
  staffOptions: UserAssignmentOption[];
  managerOptions: UserAssignmentOption[];
  profilesCount: number;
};

export function CustomerListPanel({
  customers,
  businessTypes,
  staffOptions,
  managerOptions,
  profilesCount,
}: CustomerListPanelProps) {
  const [query, setQuery] = useState("");
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | "all">("all");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  const normalizedQuery = query.trim().toLowerCase();
  const filteredCustomers = useMemo(() => {
    return customers.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          item.code,
          item.name,
          item.taxId,
          item.assignedUserName,
          item.managerUserName,
          item.notes,
          getBusinessTypeName(item.businessTypeId, businessTypes),
          getServiceStatusLabel(item.serviceStatus),
          item.active ? "active" : "inactive",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesStatus = serviceStatus === "all" || item.serviceStatus === serviceStatus;
      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" && item.active) ||
        (activeFilter === "inactive" && !item.active);

      return matchesQuery && matchesStatus && matchesActive;
    });
  }, [activeFilter, businessTypes, customers, normalizedQuery, serviceStatus]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_180px_180px_auto]">
          <div>
            <label htmlFor="customer-search" className="text-xs font-medium text-slate-600">
              ค้นหาลูกค้า
            </label>
            <input
              id="customer-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาจากรหัส ชื่อ Tax ID owner หรือโน้ต"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="customer-service-filter" className="text-xs font-medium text-slate-600">
              สถานะบริการ
            </label>
            <select
              id="customer-service-filter"
              value={serviceStatus}
              onChange={(event) => setServiceStatus(event.target.value as ServiceStatus | "all")}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">ทั้งหมด</option>
              {serviceStatusOptions.filter((value) => value !== "all").map((status) => (
                <option key={status} value={status}>
                  {getServiceStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="customer-active-filter" className="text-xs font-medium text-slate-600">
              การใช้งาน
            </label>
            <select
              id="customer-active-filter"
              value={activeFilter}
              onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">ทั้งหมด</option>
              <option value="active">เฉพาะ active</option>
              <option value="inactive">เฉพาะ inactive</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setQuery("");
              setServiceStatus("all");
              setActiveFilter("all");
            }}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100 lg:self-end"
          >
            ล้างตัวกรอง
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-white px-3 py-1">แสดง {filteredCustomers.length} จาก {customers.length} ลูกค้า</span>
          <span className="rounded-full bg-white px-3 py-1">พร้อม assign {profilesCount} คน</span>
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <EmptyState
          title="ไม่พบลูกค้าที่ตรงเงื่อนไข"
          description="ลองค้นหาด้วยรหัสลูกค้า ชื่อ Tax ID หรือปรับตัวกรองสถานะใหม่"
        />
      ) : (
        filteredCustomers.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-slate-500">{item.code}</p>
                  <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">Tax ID: {item.taxId}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span>{getBusinessTypeName(item.businessTypeId, businessTypes)}</span>
                  <span className="text-slate-300">•</span>
                  <span>Staff: {item.assignedUserName}</span>
                  <span className="text-slate-300">•</span>
                  <span>Manager: {item.managerUserName}</span>
                  <span className="text-slate-300">•</span>
                  <span>{item.active ? "active" : "inactive"}</span>
                </div>
                {item.notes ? <p className="text-sm text-slate-500">{item.notes}</p> : null}
              </div>
              <StatusBadge
                label={getServiceStatusLabel(item.serviceStatus)}
                tone={item.serviceStatus === "onboarding" ? "amber" : "green"}
              />
            </div>

            <div className="mt-4">
              <CustomerManagementForm
                customer={item}
                businessTypes={businessTypes}
                staffOptions={staffOptions}
                managerOptions={managerOptions}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

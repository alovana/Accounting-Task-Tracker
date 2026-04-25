import type { SessionUser } from "@/types/auth";
import type { Customer } from "@/types/domain";
import type { WorkCycle, WorkItem } from "@/lib/mock/phase3-data";

function isStaffScopedUser(role: string) {
  return role === "staff";
}

export function getVisibleWorkScope(params: {
  currentUser: SessionUser;
  customers: Customer[];
  workCycles: WorkCycle[];
  workItems: WorkItem[];
}) {
  const { currentUser, customers, workCycles, workItems } = params;
  const isStaffView = isStaffScopedUser(currentUser.role);
  const visibleCustomers = isStaffView
    ? customers.filter(
        (customer) =>
          customer.assignedUserId === currentUser.id ||
          customer.managerUserId === currentUser.id ||
          customer.assignedUserName === currentUser.fullName ||
          customer.managerUserName === currentUser.fullName,
      )
    : customers;
  const visibleCustomerIds = new Set(visibleCustomers.map((customer) => customer.id));
  const visibleWorkCycles = workCycles.filter((cycle) => visibleCustomerIds.has(cycle.customerId));
  const visibleWorkCycleIds = new Set(visibleWorkCycles.map((cycle) => cycle.id));
  const visibleWorkItems = workItems.filter(
    (item) =>
      visibleWorkCycleIds.has(item.workCycleId) &&
      (!isStaffView || item.assignedTo === currentUser.fullName),
  );

  return {
    isStaffView,
    visibleCustomers,
    visibleWorkCycles,
    visibleWorkItems,
    visibleWorkItemIds: new Set(visibleWorkItems.map((item) => item.id)),
  };
}

export function canUserAccessWorkItem(workItemId: string, visibleWorkItems: WorkItem[]) {
  return visibleWorkItems.some((item) => item.id === workItemId);
}

import type { SessionUser } from "@/types/auth";
import type { Customer } from "@/types/domain";
import type { WorkCycle, WorkItem } from "@/lib/mock/phase3-data";

function isStaffScopedUser(role: string) {
  return role === "staff";
}

function isManagerScopedUser(role: string) {
  return role === "manager";
}

export function getVisibleWorkScope(params: {
  currentUser: SessionUser;
  customers: Customer[];
  workCycles: WorkCycle[];
  workItems: WorkItem[];
}) {
  const { currentUser, customers, workCycles, workItems } = params;
  const isStaffView = isStaffScopedUser(currentUser.role);
  const isManagerView = isManagerScopedUser(currentUser.role);
  const visibleCustomers = isStaffView || isManagerView
    ? customers.filter(
        (customer) =>
          customer.assignedUserId === currentUser.id ||
          customer.managerUserId === currentUser.id,
      )
    : customers;
  const visibleCustomerIds = new Set(visibleCustomers.map((customer) => customer.id));
  const visibleWorkCycles = workCycles.filter((cycle) => visibleCustomerIds.has(cycle.customerId));
  const visibleWorkCycleIds = new Set(visibleWorkCycles.map((cycle) => cycle.id));
  const visibleWorkItems = workItems.filter((item) => {
    if (!visibleWorkCycleIds.has(item.workCycleId)) {
      return false;
    }

    if (isStaffView) {
      return item.assignedUserId === currentUser.id;
    }

    if (isManagerView) {
      return true;
    }

    return true;
  });

  return {
    isStaffView,
    isManagerView,
    visibleCustomers,
    visibleWorkCycles,
    visibleWorkItems,
    visibleWorkItemIds: new Set(visibleWorkItems.map((item) => item.id)),
  };
}

export function canUserAccessWorkItem(workItemId: string, visibleWorkItems: WorkItem[]) {
  return visibleWorkItems.some((item) => item.id === workItemId);
}

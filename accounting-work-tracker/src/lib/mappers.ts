import { businessTypes } from "@/lib/mock/phase2-data";
import type { BusinessType, ServiceStatus } from "@/types/domain";

export function getBusinessTypeName(
  businessTypeId: string,
  availableBusinessTypes: BusinessType[] = businessTypes
) {
  return availableBusinessTypes.find((item) => item.id === businessTypeId)?.name ?? "-";
}

export function getServiceStatusLabel(status: ServiceStatus) {
  switch (status) {
    case "active":
      return "ให้บริการอยู่";
    case "onboarding":
      return "กำลังเริ่มต้น";
    case "paused":
      return "พักบริการ";
    default:
      return status;
  }
}

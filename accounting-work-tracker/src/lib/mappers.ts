import { businessTypes } from "@/lib/mock/phase2-data";

export function getBusinessTypeName(businessTypeId: string) {
  return businessTypes.find((item) => item.id === businessTypeId)?.name ?? "-";
}

export function getServiceStatusLabel(status: string) {
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

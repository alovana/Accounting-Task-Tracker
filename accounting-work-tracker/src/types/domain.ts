import type { AppRole } from "@/lib/constants";

export type ServiceStatus = "active" | "onboarding" | "paused";

export type BusinessType = {
  id: string;
  name: string;
  description: string;
  active: boolean;
};

export type Customer = {
  id: string;
  code: string;
  name: string;
  taxId: string;
  businessTypeId: string;
  assignedUserId?: string;
  managerUserId?: string;
  assignedUserName: string;
  managerUserName: string;
  serviceStatus: ServiceStatus;
  notes: string;
  active: boolean;
};

export type ChecklistTemplate = {
  id: string;
  name: string;
  businessTypeId: string;
  description: string;
  active: boolean;
};

export type ChecklistTemplateItem = {
  id: string;
  templateId: string;
  title: string;
  description: string;
  sortOrder: number;
  isRequired: boolean;
  dueDayOffset: number;
  dueDayDetail?: string;
  defaultAssigneeRole: AppRole;
  active: boolean;
};

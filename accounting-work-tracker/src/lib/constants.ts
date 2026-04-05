export const APP_NAME = "Accounting Work Tracker";
export const APP_NAME_TH = "ระบบติดตามงานบัญชี";

export const ROLE_OPTIONS = ["admin", "manager", "staff"] as const;
export type AppRole = (typeof ROLE_OPTIONS)[number];

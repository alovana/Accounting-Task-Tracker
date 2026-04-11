import type { DemoUser } from "@/types/auth";

export const demoUsers: Array<DemoUser & { password: string }> = [
  {
    id: "demo-admin",
    fullName: "ผู้ดูแลระบบ",
    email: "admin@company.com",
    role: "admin",
    password: "admin1234",
  },
  {
    id: "demo-manager-1",
    fullName: "ผู้จัดการทีม 1",
    email: "manager1@company.com",
    role: "manager",
    password: "manager1234",
  },
  {
    id: "demo-staff-1",
    fullName: "พนักงาน A",
    email: "staff1@company.com",
    role: "staff",
    password: "staff1234",
  },
];

export function findDemoUserByCredentials(email: string, password: string) {
  return demoUsers.find(
    (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password,
  );
}

export function findDemoUserByEmail(email: string) {
  return demoUsers.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

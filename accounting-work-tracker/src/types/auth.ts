import type { AppRole } from "@/lib/constants";

export type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  role: AppRole;
};

export type DemoUser = SessionUser;

export type LoginFormState = {
  email: string;
  password: string;
};

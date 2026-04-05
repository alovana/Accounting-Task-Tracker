import type { AppRole } from "@/lib/constants";

export type DemoUser = {
  id: string;
  fullName: string;
  email: string;
  role: AppRole;
};

export type LoginFormState = {
  email: string;
  password: string;
};

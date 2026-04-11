import { AppShell } from "@/components/app-shell";
import { requireSessionUser } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireSessionUser();

  return <AppShell>{children}</AppShell>;
}

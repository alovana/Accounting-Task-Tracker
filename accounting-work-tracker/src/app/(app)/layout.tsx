import { AppShell } from "@/components/app-shell";
import { resolveRoleFromSearchParams } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const role = resolveRoleFromSearchParams();

  return <AppShell role={role}>{children}</AppShell>;
}

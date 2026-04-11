import { AppShell } from "@/components/app-shell";
import { requireSessionUser } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireSessionUser();

  return <AppShell role={user.role}>{children}</AppShell>;
}

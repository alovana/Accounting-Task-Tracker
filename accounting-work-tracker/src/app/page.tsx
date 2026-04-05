import Link from "next/link";
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/login");

  return (
    <main>
      <Link href="/login">ไปหน้าเข้าสู่ระบบ</Link>
    </main>
  );
}

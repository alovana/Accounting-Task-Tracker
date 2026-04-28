import { logoutAction } from "@/app/login/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 shadow-[0_12px_28px_-20px_rgba(225,29,72,0.45)] transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2"
      >
        ออกจากระบบ
      </button>
    </form>
  );
}

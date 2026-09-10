import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-6">
          <div />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-ink">{user.name}</div>
              <div className="text-xs text-muted">{user.role === "ADMIN" ? "Administrator" : "Team member"}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-volt font-display text-lg font-semibold text-ink">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

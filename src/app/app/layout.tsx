import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabase/server";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();

  if (!user) {
    redirect("/");
  }

  return <AppShell user={user}>{children}</AppShell>;
}

import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/statements/new" className="font-semibold text-zinc-900">
              Statement Spending Analyzer
            </Link>
            <Link href="/statements/new" className="text-sm text-zinc-600 hover:text-zinc-900">
              Upload
            </Link>
            <Link href="/statements" className="text-sm text-zinc-600 hover:text-zinc-900">
              Statements
            </Link>
          </div>
          <SignOutButton />
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}

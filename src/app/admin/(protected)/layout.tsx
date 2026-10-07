import { requireAdmin } from "@/lib/admin-auth";
import { AppError } from "@/lib/errors";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AppError && e.status === 401) redirect("/admin/login");
    return (
      <main className="max-w-lg mx-auto p-8">
        <h1 className="text-2xl mb-4">Ylläpito ei ole käytettävissä</h1>
        <p>Tarkista yhteys ja yritä uudelleen.</p>
        <a href="/admin" className="text-green-glow underline">
          Yritä uudelleen
        </a>
      </main>
    );
  }
  return children;
}

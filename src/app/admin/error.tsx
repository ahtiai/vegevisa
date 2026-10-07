"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl mb-4">Tietojen lataaminen epäonnistui</h1>
      <p className="mb-6">Palvelu ei ole juuri nyt käytettävissä.</p>
      <button className="arcade-btn p-4" onClick={reset}>
        Yritä uudelleen
      </button>
    </main>
  );
}

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">Pyme Analytics</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
          Plataforma de analítica para librerías
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Reuní tus ventas, validá los datos y mirá KPIs y insights en minutos.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 font-medium text-white transition hover:bg-sky-700">
            Crear cuenta
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-100">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}

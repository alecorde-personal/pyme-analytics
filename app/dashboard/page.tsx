'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getBusiness, getSession, saveSession } from '@/lib/app-state';

type DashboardData = {
  business: { id: string; name: string };
  summary: { total: number; margin: number; averageTicket: number };
  categoryBreakdown: Record<string, number>;
  topProducts: { product: string; quantity: number; revenue: number }[];
  saleCount: number;
};

const templateCsv = [
  'fecha,producto,categoria,cantidad,precioUnitario,medioDePago,costoUnitario',
  '2026-09-21,Ejemplo de producto,Novela,1,1000,Efectivo,600',
].join('\n');

export default function DashboardPage() {
  const [session, setSession] = useState(getSession());
  const [data, setData] = useState<DashboardData | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [sheetInput, setSheetInput] = useState('');
  const [sheetMessage, setSheetMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setSession(getSession());
    setIsClient(true);
    Promise.all([fetch('/api/dashboard'), fetch('/api/sheets/template')])
      .then(async ([dashboardResponse, sheetResponse]) => {
        const dashboard = await dashboardResponse.json();
        const sheet = await sheetResponse.json();
        if (!dashboardResponse.ok) throw new Error(dashboard.error || 'No se pudo cargar el dashboard.');
        setData(dashboard);
        if (sheet.url) setSheetUrl(sheet.url);
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar el dashboard.'));
  }, []);

  if (!isClient) return null;
  if (!session?.user) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-bold text-slate-900">Necesitás iniciar sesión</h1><Link href="/login" className="mt-5 inline-block rounded-xl bg-sky-600 px-4 py-2.5 font-medium text-white">Ir a login</Link></div></main>;
  }

  const business = data?.business ?? session.business ?? getBusiness();
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); saveSession(null); window.location.href = '/login'; };
  const connectSheet = async () => {
    setSheetMessage('Conectando hoja...');
    const response = await fetch('/api/sheets/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sheetUrl: sheetInput }) });
    const result = await response.json();
    setSheetMessage(response.ok ? 'Hoja conectada.' : result.error || 'No se pudo conectar la hoja.');
    if (response.ok) setSheetUrl(result.connection.sheetUrl);
  };
  const syncSheet = async () => {
    setIsSyncing(true);
    setSheetMessage('Sincronizando ventas...');
    const response = await fetch('/api/sheets/sync', { method: 'POST' });
    const result = await response.json();
    setSheetMessage(response.ok ? `${result.rowsImported} filas importadas.` : result.error || 'No se pudo sincronizar la hoja.');
    if (response.ok) window.location.reload();
    setIsSyncing(false);
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Dashboard</p><h1 className="mt-2 text-2xl font-bold text-slate-900">{business?.name ?? 'Mi negocio'}</h1></div><button onClick={logout} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50">Cerrar sesión</button></header>
        {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h2 className="text-lg font-semibold text-slate-900">Cargar ventas</h2><p className="mt-1 text-sm text-slate-600">Pegá una URL de Google Sheets compartida con la cuenta de servicio y sincronizá tus ventas.</p><p className="mt-2 text-xs text-slate-500">Columnas obligatorias: fecha, producto, categoria, cantidad y precioUnitario. Opcionales: medioDePago y costoUnitario.</p></div><div className="flex flex-col gap-2 sm:flex-row"><a href={`data:text/csv;charset=utf-8,${encodeURIComponent(templateCsv)}`} download="plantilla-ventas.csv" className="rounded-xl border border-sky-300 bg-white px-4 py-3 text-center text-sm font-medium text-sky-700">Descargar plantilla CSV</a>{sheetUrl ? <a href={sheetUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-sky-600 px-4 py-3 text-center text-sm font-medium text-white">Abrir Google Sheet</a> : null}</div></div><div className="mt-4 flex flex-col gap-2 md:flex-row"><input value={sheetInput} onChange={(event) => setSheetInput(event.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900" /><button onClick={connectSheet} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">Conectar hoja</button><button onClick={syncSheet} disabled={!sheetUrl || isSyncing} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{isSyncing ? 'Sincronizando...' : 'Sincronizar ventas'}</button></div>{sheetMessage ? <p className="mt-2 text-sm text-slate-700">{sheetMessage}</p> : null}<div className="mt-4 overflow-x-auto rounded-xl border border-sky-100 bg-white"><table className="min-w-full text-left text-xs text-slate-600"><thead><tr className="border-b border-slate-100">{['fecha', 'producto', 'categoria', 'cantidad', 'precioUnitario', 'medioDePago', 'costoUnitario'].map((column) => <th key={column} className="px-3 py-2 font-semibold">{column}</th>)}</tr></thead><tbody><tr>{['2026-09-21', 'Ejemplo de producto', 'Novela', '1', '1000', 'Efectivo', '600'].map((value, index) => <td key={`${value}-${index}`} className="whitespace-nowrap px-3 py-2">{value || '-'}</td>)}</tr></tbody></table></div></section>

        {!data ? <p className="mt-8 text-slate-600">Cargando tus datos...</p> : data.saleCount === 0 ? <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h2 className="text-xl font-semibold text-slate-900">Todavía no hay ventas cargadas</h2><p className="mt-2 text-slate-600">Completá la plantilla y sincronizá tus datos para ver métricas reales.</p></section> : <><section className="mt-8 grid gap-4 md:grid-cols-3"><StatCard label="Ventas totales" value={`$${data.summary.total.toLocaleString('es-AR')}`} /><StatCard label="Ticket promedio" value={`$${data.summary.averageTicket.toLocaleString('es-AR')}`} /><StatCard label="Margen bruto" value={`$${data.summary.margin.toLocaleString('es-AR')}`} /></section><section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]"><Panel title="Ventas por categoría"><div className="space-y-4">{Object.entries(data.categoryBreakdown).map(([category, value]) => <div key={category}><div className="mb-1 flex justify-between text-sm text-slate-600"><span>{category}</span><span>${value.toLocaleString('es-AR')}</span></div><div className="h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-sky-500" style={{ width: `${Math.min((value / data.summary.total) * 100, 100)}%` }} /></div></div>)}</div></Panel><Panel title="Productos más vendidos"><ul className="space-y-3">{data.topProducts.map((item) => <li key={item.product} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><div><p className="font-medium text-slate-800">{item.product}</p><p className="text-xs text-slate-500">{item.quantity} unidades</p></div><span className="text-sm font-semibold text-slate-700">${item.revenue.toLocaleString('es-AR')}</span></li>)}</ul></Panel></section></>}
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-slate-900">{title}</h2><div className="mt-5">{children}</div></div>; }
function StatCard({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-2xl font-bold text-slate-900">{value}</p></div>; }

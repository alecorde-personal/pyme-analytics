'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { getSession, saveBusiness, saveSession } from '@/lib/app-state';

const INDUSTRIES = ['Librería', 'Kiosco', 'Ferretería', 'Otro'];
const BUSINESS_SIZES = ['1 a 5 empleados', '5 a 20 empleados', '20+ empleados'];

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('Librería');
  const [address, setAddress] = useState('');
  const [size, setSize] = useState('1 a 5 empleados');
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session?.user) {
      router.push('/login');
      return;
    }
    setIsReady(true);
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const session = getSession();
    if (!session?.user) {
      router.push('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/business/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, industry, address, size }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo guardar el negocio.');
      }

      const business = data.business ?? { name, industry, address, size, createdAt: new Date().toISOString() };
      saveBusiness(business);
      saveSession({ ...session, business });
      router.push('/dashboard');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar el negocio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isReady) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Onboarding</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Completá los datos de tu negocio</h1>
        <p className="mt-2 text-slate-600">Esto nos sirve para personalizar el template y el dashboard de tu librería.</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
              Nombre del negocio
            </label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500"
              placeholder="Librería El Ateneo"
              required
            />
          </div>

          <div>
            <label htmlFor="industry" className="mb-2 block text-sm font-medium text-slate-700">
              Rubro
            </label>
            <select
              id="industry"
              value={industry}
              onChange={(event) => setIndustry(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500"
            >
              {INDUSTRIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="address" className="mb-2 block text-sm font-medium text-slate-700">
              Dirección
            </label>
            <input
              id="address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500"
              placeholder="Av. Córdoba 1234"
            />
          </div>

          <div>
            <label htmlFor="size" className="mb-2 block text-sm font-medium text-slate-700">
              Tamaño del negocio
            </label>
            <select
              id="size"
              value={size}
              onChange={(event) => setSize(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500"
            >
              {BUSINESS_SIZES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-sky-600 px-4 py-3 font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70">
            {isSubmitting ? 'Guardando...' : 'Guardar y entrar al dashboard'}
          </button>
        </form>
      </div>
    </main>
  );
}

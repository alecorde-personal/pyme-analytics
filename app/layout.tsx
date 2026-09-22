import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pyme Analytics',
  description: 'Plataforma de analítica para pequeños comercios',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

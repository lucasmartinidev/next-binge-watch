import type { ReactNode } from 'react';
import { CyberBackground } from '@/components/ds/CyberBackground';
import { FooterAttribution } from './FooterAttribution';
import { Header } from './Header';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col text-ds-text">
      <CyberBackground />
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <FooterAttribution />
    </div>
  );
}

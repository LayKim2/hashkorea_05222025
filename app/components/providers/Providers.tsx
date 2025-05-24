'use client';

import { SessionProvider } from 'next-auth/react';
import Header from '../common/Header';
import ClientLayout from '../../ClientLayout';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <Header />
      <ClientLayout>
        {children}
      </ClientLayout>
    </SessionProvider>
  );
}
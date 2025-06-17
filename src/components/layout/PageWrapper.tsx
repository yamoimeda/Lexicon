// src/components/layout/PageWrapper.tsx
import React, { type ReactNode } from 'react';
import Header from '@/components/layout/Header';
// import Footer from '@/components/layout/Footer'; // Optional: Add if a footer is desired

interface PageWrapperProps {
  children: ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      {/* <Footer /> */}
    </div>
  );
}

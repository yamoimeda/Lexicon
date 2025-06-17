// src/components/layout/Header.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle } from 'lucide-react';

export default function Header() {
  const { username, logout, isAuthenticated } = useUser();

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="text-3xl font-headline font-bold hover:opacity-90 transition-opacity">
          WordDuel
        </Link>
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <UserCircle size={24} />
              <span className="text-sm font-medium">{username}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="text-primary-foreground hover:bg-primary/80">
              <LogOut size={18} className="mr-2" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

// src/components/auth/LoginForm.tsx
"use client";

import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LogIn } from 'lucide-react';

const translations = {
  en: {
    usernameLabel: "Username",
    usernamePlaceholder: "Enter your username",
    enterGameButton: "Enter Game",
  },
  es: {
    usernameLabel: "Nombre de usuario",
    usernamePlaceholder: "Ingresa tu nombre de usuario",
    enterGameButton: "Entrar al Juego",
  }
};

export default function LoginForm() {
  const [name, setName] = useState('');
  const { login, language } = useUser();
  const T = translations[language as keyof typeof translations] || translations.en;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      login(name.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-foreground/80">{T.usernameLabel}</Label>
        <Input
          id="username"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={T.usernamePlaceholder}
          required
          className="bg-input border-border focus:ring-primary"
        />
      </div>
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!name.trim()}>
        <LogIn size={18} className="mr-2" />
        {T.enterGameButton}
      </Button>
    </form>
  );
}

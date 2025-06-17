// src/app/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, PlusCircle, Users } from 'lucide-react';

export default function HomePage() {
  const { username, isAuthenticated } = useUser();
  const router = useRouter();
  const [roomIdToJoin, setRoomIdToJoin] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center h-full">
          <p>Loading...</p> {/* Or a spinner component */}
        </div>
      </PageWrapper>
    );
  }

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomIdToJoin.trim()) {
      router.push(`/rooms/${roomIdToJoin.trim()}/lobby`);
    }
  };

  return (
    <PageWrapper>
      <div className="text-center mb-12">
        <h1 className="text-5xl font-headline font-bold text-primary mb-4">
          Welcome, <span className="text-accent">{username}!</span>
        </h1>
        <p className="text-xl text-foreground/80">Ready to duel with words?</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
              <PlusCircle className="mr-2 text-primary" />
              Create a New Room
            </CardTitle>
            <CardDescription>Set up your own game and invite friends.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Customize rounds, categories, time limits, and more. Be the master of your WordDuel arena!</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/rooms/create">
                Create Room
                <ArrowRight className="ml-2" size={18} />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
              <Users className="mr-2 text-primary" />
              Join a Room
            </CardTitle>
            <CardDescription>Enter a Room ID to join an existing game.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <Label htmlFor="roomId" className="text-foreground/80">Room ID</Label>
                <Input
                  id="roomId"
                  type="text"
                  value={roomIdToJoin}
                  onChange={(e) => setRoomIdToJoin(e.target.value)}
                  placeholder="Enter Room ID"
                  className="bg-input border-border focus:ring-primary"
                />
              </div>
              <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground" disabled={!roomIdToJoin.trim()}>
                Join Room
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}

// src/components/room/CreateRoomForm.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Settings, Languages, Users, Clock, ListOrdered } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// This would typically be stored in a global state / context or persisted
interface RoomSettings {
  roomName: string;
  numberOfRounds: number;
  timePerRound: number; // in seconds
  categories: string; // Comma-separated string
  language: string;
  // endMode: 'rounds' | 'score'; // Example, not fully implemented
  // targetScore?: number; // Example, not fully implemented
  // scoringSystem: 'letters' | 'word'; // Example, not fully implemented
}

// Helper to generate a simple room ID
const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export default function CreateRoomForm() {
  const router = useRouter();
  const { username } = useUser();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<RoomSettings>({
    roomName: `${username}'s Game`,
    numberOfRounds: 3,
    timePerRound: 60,
    categories: "Animals, Countries, Fruits, Colors, Sports",
    language: 'English',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const val = type === 'number' ? parseInt(value, 10) : value;
    setSettings(prev => ({ ...prev, [name]: val }));
  };

  const handleSelectChange = (name: keyof RoomSettings, value: string) => {
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const roomId = generateRoomId();
    // Here, you would typically save the room settings to a backend or global state.
    // For this scaffold, we'll simulate by navigating.
    // Store settings in localStorage for the lobby page to pick up (simplified).
    try {
      localStorage.setItem(`room-${roomId}-settings`, JSON.stringify({...settings, admin: username}));
      localStorage.setItem(`room-${roomId}-players`, JSON.stringify([{id: "1", name: username, score: 0}])); // Mock player list
      toast({
        title: "Room Created!",
        description: `Room ${settings.roomName} (ID: ${roomId}) is ready.`,
      });
      router.push(`/rooms/${roomId}/lobby`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create room",
        description: "Could not save room settings locally. Please try again.",
      });
      console.error("Error saving room settings to localStorage:", error);
    }
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center"><Settings className="mr-2" />Customize Your Game</CardTitle>
        <CardDescription>Set the rules for your WordDuel!</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="roomName" className="font-semibold">Room Name</Label>
            <Input id="roomName" name="roomName" value={settings.roomName} onChange={handleChange} required className="mt-1"/>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="numberOfRounds" className="font-semibold flex items-center"><ListOrdered className="mr-2 h-4 w-4 text-muted-foreground"/>Number of Rounds</Label>
              <Input id="numberOfRounds" name="numberOfRounds" type="number" min="1" max="10" value={settings.numberOfRounds} onChange={handleChange} required className="mt-1"/>
            </div>
            <div>
              <Label htmlFor="timePerRound" className="font-semibold flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground"/>Time Per Round (seconds)</Label>
              <Input id="timePerRound" name="timePerRound" type="number" min="30" max="180" step="10" value={settings.timePerRound} onChange={handleChange} required className="mt-1"/>
            </div>
          </div>
          
          <div>
            <Label htmlFor="categories" className="font-semibold">Categories (comma-separated)</Label>
            <Input 
              id="categories" 
              name="categories" 
              value={settings.categories} 
              onChange={handleChange} 
              placeholder="e.g., Animals, Countries, Fruits" 
              required 
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Enter a list of categories for players to find words for.</p>
          </div>

          <div>
            <Label htmlFor="language" className="font-semibold flex items-center"><Languages className="mr-2 h-4 w-4 text-muted-foreground"/>Language</Label>
            <Select name="language" value={settings.language} onValueChange={(value) => handleSelectChange('language', value)}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Spanish">Español (Spanish)</SelectItem>
                <SelectItem value="French">Français (French)</SelectItem>
                <SelectItem value="German">Deutsch (German)</SelectItem>
                {/* Add more languages as needed */}
              </SelectContent>
            </Select>
          </div>

          {/* Placeholder for more advanced settings if needed later
          <div className="space-y-2">
            <Label className="font-semibold">Advanced Settings (Optional)</Label>
            <div className="flex items-center space-x-2">
              <Checkbox id="customEndMode" />
              <Label htmlFor="customEndMode">Specific end condition (e.g., first to X points)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="customScoring" />
              <Label htmlFor="customScoring">Custom scoring system</Label>
            </div>
          </div>
          */}

        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3">
            <PlusCircle className="mr-2" /> Create Room
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}


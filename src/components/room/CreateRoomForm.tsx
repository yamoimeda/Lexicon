// src/components/room/CreateRoomForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Settings, Languages, Clock, ListOrdered } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RoomSettings {
  roomName: string;
  numberOfRounds: number;
  timePerRound: number; // in seconds
  categories: string; // Comma-separated string
  language: string; // Game content language
}

const defaultCategories = {
  en: ["Animals", "Countries", "Fruits", "Colors", "Sports"],
  es: ["Animales", "Países", "Frutas", "Colores", "Deportes"],
};

const translations = {
  en: {
    customizeTitle: "Customize Your Game",
    customizeDescription: "Set the rules for your WordDuel!",
    roomNameLabel: "Room Name",
    roundsLabel: "Number of Rounds",
    timePerRoundLabel: "Time Per Round (seconds)",
    categoriesLabel: "Categories (comma-separated)",
    categoriesDescription: "Enter a list of categories for players to find words for.",
    languageLabel: "Language (Game Content)",
    selectLanguagePlaceholder: "Select language",
    english: "English",
    spanish: "Español (Spanish)",
    french: "Français (French)",
    german: "Deutsch (German)",
    createRoomButton: "Create Room",
    toastRoomCreatedTitle: "Room Created!",
    toastRoomCreatedDescription: (roomName: string, roomId: string) => `Room ${roomName} (ID: ${roomId}) is ready.`,
    toastCreationFailedTitle: "Failed to create room",
    toastCreationFailedDescription: "Could not save room settings locally. Please try again.",
    defaultCategoriesPlaceholder: "e.g., Animals, Countries, Fruits",
  },
  es: {
    customizeTitle: "Personaliza Tu Juego",
    customizeDescription: "¡Establece las reglas para tu WordDuel!",
    roomNameLabel: "Nombre de la Sala",
    roundsLabel: "Número de Rondas",
    timePerRoundLabel: "Tiempo por Ronda (segundos)",
    categoriesLabel: "Categorías (separadas por coma)",
    categoriesDescription: "Ingresa una lista de categorías para que los jugadores encuentren palabras.",
    languageLabel: "Idioma (Contenido del Juego)",
    selectLanguagePlaceholder: "Seleccionar idioma",
    english: "Inglés (English)",
    spanish: "Español",
    french: "Francés (French)",
    german: "Alemán (German)",
    createRoomButton: "Crear Sala",
    toastRoomCreatedTitle: "¡Sala Creada!",
    toastRoomCreatedDescription: (roomName: string, roomId: string) => `La sala ${roomName} (ID: ${roomId}) está lista.`,
    toastCreationFailedTitle: "Error al crear la sala",
    toastCreationFailedDescription: "No se pudieron guardar los ajustes de la sala localmente. Por favor, inténtalo de nuevo.",
    defaultCategoriesPlaceholder: "ej: Animales, Países, Frutas",
  }
};

const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const mapUiLangToGameLang = (uiLang: string): string => {
  if (uiLang === 'es') {
    return 'Spanish';
  }
  return 'English'; // Default to English
};

export default function CreateRoomForm() {
  const router = useRouter();
  const { username, language: uiLanguage } = useUser(); 
  const { toast } = useToast();
  const T = translations[uiLanguage as keyof typeof translations] || translations.en;
  
  const getTranslatedDefaultCategories = (lang: string): string => {
    const categories = defaultCategories[lang as keyof typeof defaultCategories] || defaultCategories.en;
    return categories.join(', ');
  };

  const [settings, setSettings] = useState<RoomSettings>({
    roomName: `${username || 'Player'}'s Game`,
    numberOfRounds: 3,
    timePerRound: 60,
    categories: getTranslatedDefaultCategories(uiLanguage),
    language: mapUiLangToGameLang(uiLanguage),
  });

  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      language: mapUiLangToGameLang(uiLanguage),
      categories: getTranslatedDefaultCategories(uiLanguage),
      roomName: `${username || 'Player'}'s Game`, // Also update room name if username changes or becomes available
    }));
  }, [uiLanguage, username]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseInt(value, 10) : value;
    setSettings(prev => ({ ...prev, [name]: val }));
  };

  const handleSelectChange = (name: keyof RoomSettings, value: string) => {
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const roomId = generateRoomId();
    try {
      localStorage.setItem(`room-${roomId}-settings`, JSON.stringify({...settings, admin: username}));
      localStorage.setItem(`room-${roomId}-players`, JSON.stringify([{id: "creator", name: username, score: 0}])); 
      toast({
        title: T.toastRoomCreatedTitle,
        description: T.toastRoomCreatedDescription(settings.roomName, roomId),
      });
      router.push(`/rooms/${roomId}/lobby`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: T.toastCreationFailedTitle,
        description: T.toastCreationFailedDescription,
      });
      console.error("Error saving room settings to localStorage:", error);
    }
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center"><Settings className="mr-2" />{T.customizeTitle}</CardTitle>
        <CardDescription>{T.customizeDescription}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="roomName" className="font-semibold">{T.roomNameLabel}</Label>
            <Input id="roomName" name="roomName" value={settings.roomName} onChange={handleChange} required className="mt-1"/>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="numberOfRounds" className="font-semibold flex items-center"><ListOrdered className="mr-2 h-4 w-4 text-muted-foreground"/>{T.roundsLabel}</Label>
              <Input id="numberOfRounds" name="numberOfRounds" type="number" min="1" max="10" value={settings.numberOfRounds} onChange={handleChange} required className="mt-1"/>
            </div>
            <div>
              <Label htmlFor="timePerRound" className="font-semibold flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground"/>{T.timePerRoundLabel}</Label>
              <Input id="timePerRound" name="timePerRound" type="number" min="30" max="180" step="10" value={settings.timePerRound} onChange={handleChange} required className="mt-1"/>
            </div>
          </div>
          
          <div>
            <Label htmlFor="categories" className="font-semibold">{T.categoriesLabel}</Label>
            <Input 
              id="categories" 
              name="categories" 
              value={settings.categories} 
              onChange={handleChange} 
              placeholder={T.defaultCategoriesPlaceholder}
              required 
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">{T.categoriesDescription}</p>
          </div>

          <div>
            <Label htmlFor="language" className="font-semibold flex items-center"><Languages className="mr-2 h-4 w-4 text-muted-foreground"/>{T.languageLabel}</Label>
            <Select name="language" value={settings.language} onValueChange={(value) => handleSelectChange('language', value)}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder={T.selectLanguagePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="English">{T.english}</SelectItem>
                <SelectItem value="Spanish">{T.spanish}</SelectItem>
                <SelectItem value="French">{T.french}</SelectItem>
                <SelectItem value="German">{T.german}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">This sets the language for word validation and suggestions during the game.</p>
          </div>

        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3">
            <PlusCircle className="mr-2" /> {T.createRoomButton}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

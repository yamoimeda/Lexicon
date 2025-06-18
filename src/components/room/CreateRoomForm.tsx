
// src/components/room/CreateRoomForm.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Settings, Languages, Clock, ListOrdered, Loader2, Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface RoomSettings {
  roomName: string;
  numberOfRounds: number;
  timePerRound: number; // in seconds
  categories: string; // Comma-separated string
  language: string; // Game content language
  endRoundOnFirstSubmit: boolean;
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
    endRoundOnFirstSubmitLabel: "Quick Finish",
    endRoundOnFirstSubmitDescription: "If active, round ends for all when one player submits. If inactive, round ends on timer.",
    createRoomButton: "Create Room",
    creatingRoomButton: "Creating Room...",
    toastRoomCreatedTitle: "Room Created!",
    toastRoomCreatedDescription: (roomName: string, roomId: string) => `Room ${roomName} (ID: ${roomId}) is ready.`,
    toastCreationFailedTitle: "Failed to create room",
    toastCreationFailedDescription: "Could not save room settings locally. Please try again.",
    defaultCategoriesPlaceholder: (lang: string) => (defaultCategories[lang as keyof typeof defaultCategories] || defaultCategories.en).join(', '),
    usernameNotAvailableError: "Username not available. Cannot create room.",
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
    endRoundOnFirstSubmitLabel: "Final Rápido",
    endRoundOnFirstSubmitDescription: "Si está activo, la ronda termina para todos cuando un jugador envía. Si está inactivo, la ronda termina con el temporizador.",
    createRoomButton: "Crear Sala",
    creatingRoomButton: "Creando Sala...",
    toastRoomCreatedTitle: "¡Sala Creada!",
    toastRoomCreatedDescription: (roomName: string, roomId: string) => `La sala ${roomName} (ID: ${roomId}) está lista.`,
    toastCreationFailedTitle: "Error al crear la sala",
    toastCreationFailedDescription: "No se pudieron guardar los ajustes de la sala localmente. Por favor, inténtalo de nuevo.",
    defaultCategoriesPlaceholder: (lang: string) => (defaultCategories[lang as keyof typeof defaultCategories] || defaultCategories.es).join(', '),
    usernameNotAvailableError: "Nombre de usuario no disponible. No se puede crear la sala.",
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
  const [isCreating, setIsCreating] = useState(false);
  
  const getTranslatedDefaultCategories = useCallback((langKey: string): string => {
    const categories = defaultCategories[langKey as keyof typeof defaultCategories] || defaultCategories.en;
    return categories.join(', ');
  }, []);

  const [settings, setSettings] = useState<RoomSettings>(() => {
    const initialGameLanguage = mapUiLangToGameLang(uiLanguage);
    const initialCategories = getTranslatedDefaultCategories(uiLanguage);
    const initialRoomName = `${username || 'Player'}'s Game`;
    return {
      roomName: initialRoomName,
      numberOfRounds: 3,
      timePerRound: 60,
      categories: initialCategories,
      language: initialGameLanguage,
      endRoundOnFirstSubmit: false, // Default to false
    };
  });

  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      language: mapUiLangToGameLang(uiLanguage),
      categories: getTranslatedDefaultCategories(uiLanguage),
      roomName: `${username || 'Player'}'s Game`,
      // Keep endRoundOnFirstSubmit as is, or reset if needed based on uiLanguage (if applicable)
    }));
  }, [uiLanguage, username, getTranslatedDefaultCategories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseInt(value, 10) : value;
    setSettings(prev => ({ ...prev, [name]: val }));
  };

  const handleSelectChange = (name: keyof RoomSettings, value: string) => {
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: keyof RoomSettings, checked: boolean) => {
    setSettings(prev => ({ ...prev, [name]: checked as any })); // Cast to any to satisfy type for boolean
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      toast({
        variant: "destructive",
        title: "Error",
        description: T.usernameNotAvailableError,
      });
      return;
    }
    setIsCreating(true);
    const roomId = generateRoomId();
    try {
      // Simulate network delay for loader visibility
      setTimeout(() => {
        const roomSettingsToStore = { ...settings, admin: username, currentRound: 0 }; // currentRound 0 means not started
        localStorage.setItem(`room-${roomId}-settings`, JSON.stringify(roomSettingsToStore));
        localStorage.setItem(`room-${roomId}-players`, JSON.stringify([{id: username, name: username, score: 0}])); 
        localStorage.removeItem(`room-${roomId}-used-letters`); // Clear used letters for a new room instance
        toast({
          title: T.toastRoomCreatedTitle,
          description: T.toastRoomCreatedDescription(settings.roomName, roomId),
        });
        router.push(`/rooms/${roomId}/lobby`);
        // No need to setIsCreating(false) here as component will unmount
      }, 500); // Small delay to show loader
    } catch (error) {
      toast({
        variant: "destructive",
        title: T.toastCreationFailedTitle,
        description: T.toastCreationFailedDescription,
      });
      console.error("Error saving room settings to localStorage:", error);
      setIsCreating(false);
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
            <Input id="roomName" name="roomName" value={settings.roomName} onChange={handleChange} required className="mt-1" disabled={isCreating}/>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="numberOfRounds" className="font-semibold flex items-center"><ListOrdered className="mr-2 h-4 w-4 text-muted-foreground"/>{T.roundsLabel}</Label>
              <Input id="numberOfRounds" name="numberOfRounds" type="number" min="1" max="10" value={settings.numberOfRounds} onChange={handleChange} required className="mt-1" disabled={isCreating}/>
            </div>
            <div>
              <Label htmlFor="timePerRound" className="font-semibold flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground"/>{T.timePerRoundLabel}</Label>
              <Input id="timePerRound" name="timePerRound" type="number" min="30" max="180" step="10" value={settings.timePerRound} onChange={handleChange} required className="mt-1" disabled={isCreating}/>
            </div>
          </div>
          
          <div>
            <Label htmlFor="categories" className="font-semibold">{T.categoriesLabel}</Label>
            <Input 
              id="categories" 
              name="categories" 
              value={settings.categories} 
              onChange={handleChange} 
              placeholder={T.defaultCategoriesPlaceholder(uiLanguage)}
              required 
              className="mt-1"
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground mt-1">{T.categoriesDescription}</p>
          </div>

          <div>
            <Label htmlFor="language" className="font-semibold flex items-center"><Languages className="mr-2 h-4 w-4 text-muted-foreground"/>{T.languageLabel}</Label>
            <Select name="language" value={settings.language} onValueChange={(value) => handleSelectChange('language', value)} disabled={isCreating}>
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

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="endRoundOnFirstSubmit" className="font-semibold flex items-center">
                <Zap className="mr-2 h-4 w-4 text-muted-foreground"/>
                {T.endRoundOnFirstSubmitLabel}
              </Label>
              <Switch
                id="endRoundOnFirstSubmit"
                checked={settings.endRoundOnFirstSubmit}
                onCheckedChange={(checked) => handleSwitchChange('endRoundOnFirstSubmit', checked)}
                disabled={isCreating}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{T.endRoundOnFirstSubmitDescription}</p>
          </div>


        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3" disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {T.creatingRoomButton}
              </>
            ) : (
              <>
                <PlusCircle className="mr-2" /> {T.createRoomButton}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}


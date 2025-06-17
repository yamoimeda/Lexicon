
// src/app/rooms/[roomId]/play/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, HelpCircle, Lightbulb, Send, Clock, Users, Gamepad2 } from 'lucide-react';
import { validateWord, ValidateWordInput } from '@/ai/flows/validate-word';
import { suggestValidWords, SuggestValidWordsInput } from '@/ai/flows/suggest-valid-words';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface Player {
  id: string;
  name: string;
  score: number;
}

interface CategoryWord {
  category: string;
  word: string;
  isValid?: boolean;
  validationReason?: string;
  isLoading?: boolean;
}

interface RoomSettingsData {
  numberOfRounds: number;
  timePerRound: number;
  categories: string[];
  gameLanguage: string; // Language for AI interactions
}

// StoredRoomSettings is the shape of the object in localStorage
interface StoredRoomSettings {
  roomName: string;
  numberOfRounds: number;
  timePerRound: number;
  categories: string; // Comma-separated string
  language: string; // Game content language, e.g., "English"
  admin: string;
}

const translations = {
  en: {
    round: "Round",
    timeLeft: "Time Left",
    yourLetter: "Your Letter:",
    enterCategoryWord: (category: string) => `Enter a ${category.toLowerCase()}`,
    validateWord: "Validate Word",
    getSuggestion: "Get Suggestion",
    wordInvalidToastTitle: (word: string, category: string) => `Word "${word}" invalid for ${category}`,
    wordInvalidToastDescription: (reason?: string) => reason || "AI determined this word is not valid.",
    errorValidatingToast: "Error validating word",
    errorValidatingDescription: "Could not connect to AI service.",
    suggestionToastTitle: (category: string) => `Suggestion for ${category}`,
    suggestionToastDescription: (suggestion: string) => `How about: ${suggestion}?`,
    noSuggestionsToast: "No suggestions found",
    noSuggestionsDescription: (category: string, letter: string) => `Could not find a suggestion for ${category} with the letter "${letter}".`,
    errorSuggestingToast: "Error getting suggestions",
    errorSuggestingDescription: "Could not connect to AI service.",
    submitWordsForRound: "Submit Words for Round",
    submitting: "Submitting...",
    nextRoundToastTitle: (round: number) => `Round ${round} starting!`,
    nextRoundToastDescription: "Get ready for new letters.",
    gameInfo: "Game Info",
    roomIdLabel: "Room ID:",
    yourNameLabel: "Your Name:",
    scoreboard: "Scoreboard",
    pointsSuffix: "pts",
    loadingRoomSettings: "Loading game settings...",
    errorLoadingRoomSettings: "Could not load game settings. AI features might use default language. Please ensure room settings are available.",
    secondsSuffix: "s",
    gameOver: "Game Over! Calculating results...",
  },
  es: {
    round: "Ronda",
    timeLeft: "Tiempo Restante",
    yourLetter: "Tu Letra:",
    enterCategoryWord: (category: string) => `Ingresa ${category.toLowerCase()}`,
    validateWord: "Validar Palabra",
    getSuggestion: "Sugerencia",
    wordInvalidToastTitle: (word: string, category: string) => `Palabra "${word}" inválida para ${category}`,
    wordInvalidToastDescription: (reason?: string) => reason || "La IA determinó que esta palabra no es válida.",
    errorValidatingToast: "Error al validar palabra",
    errorValidatingDescription: "No se pudo conectar al servicio de IA.",
    suggestionToastTitle: (category: string) => `Sugerencia para ${category}`,
    suggestionToastDescription: (suggestion: string) => `¿Qué tal: ${suggestion}?`,
    noSuggestionsToast: "No se encontraron sugerencias",
    noSuggestionsDescription: (category: string, letter: string) => `No se pudo encontrar una sugerencia para ${category} con la letra "${letter}".`,
    errorSuggestingToast: "Error al obtener sugerencias",
    errorSuggestingDescription: "No se pudo conectar al servicio de IA.",
    submitWordsForRound: "Enviar Palabras de la Ronda",
    submitting: "Enviando...",
    nextRoundToastTitle: (round: number) => `¡Ronda ${round} iniciando!`,
    nextRoundToastDescription: "Prepárate para nuevas letras.",
    gameInfo: "Info del Juego",
    roomIdLabel: "ID de Sala:",
    yourNameLabel: "Tu Nombre:",
    scoreboard: "Marcador",
    pointsSuffix: "pts",
    loadingRoomSettings: "Cargando configuración del juego...",
    errorLoadingRoomSettings: "No se pudo cargar la configuración del juego. Las funciones de IA podrían usar el idioma predeterminado. Asegúrate que la configuración de la sala esté disponible.",
    secondsSuffix: "s",
    gameOver: "¡Juego Terminado! Calculando resultados...",
  }
};

export default function GamePage() {
  const { isAuthenticated, username, language: uiLanguage } = useUser();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const { toast } = useToast();
  const T = translations[uiLanguage as keyof typeof translations] || translations.en;

  const [roomSettings, setRoomSettings] = useState<RoomSettingsData | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const [currentRound, setCurrentRound] = useState(1);
  const [letters, setLetters] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [words, setWords] = useState<CategoryWord[]>([]);
  const [usedLetters, setUsedLetters] = useState<string[]>([]);

  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: username || "You", score: 0 },
    { id: "2", name: "Player2", score: 0 }, // Mock player
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!roomId) return;
    setIsLoadingSettings(true);
    const storedSettingsRaw = localStorage.getItem(`room-${roomId}-settings`);
    if (storedSettingsRaw) {
      try {
        const parsedSettings: StoredRoomSettings = JSON.parse(storedSettingsRaw);
        const loadedSettings = {
          numberOfRounds: parsedSettings.numberOfRounds,
          timePerRound: parsedSettings.timePerRound,
          categories: parsedSettings.categories.split(',').map(c => c.trim()),
          gameLanguage: parsedSettings.language,
        };
        setRoomSettings(loadedSettings);
        setTimeLeft(loadedSettings.timePerRound); // Initialize timeLeft from settings
      } catch (e) {
        console.error("Error parsing room settings for game page:", e);
        toast({ variant: "destructive", title: T.errorLoadingRoomSettings });
        // Fallback to some defaults if parsing fails or settings are incomplete
        setRoomSettings({ 
            numberOfRounds: 3, 
            timePerRound: 60, 
            categories: ["Animals", "Countries", "Fruits"], 
            gameLanguage: "English" 
        });
      }
    } else {
      toast({ variant: "destructive", title: T.errorLoadingRoomSettings });
       setRoomSettings({ 
            numberOfRounds: 3, 
            timePerRound: 60, 
            categories: ["Animals", "Countries", "Fruits"], 
            gameLanguage: "English" 
        });
    }
    setIsLoadingSettings(false);
  }, [roomId, T, toast]);

  useEffect(() => {
    if (roomSettings?.categories) {
      setWords(roomSettings.categories.map(cat => ({ category: cat, word: "", isLoading: false })));
    }
  }, [roomSettings?.categories]);


  useEffect(() => {
    if (isLoadingSettings || !roomSettings) return; 

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const availableLetters = alphabet.split('').filter(l => !usedLetters.includes(l));
    
    let randomLetter;
    if (availableLetters.length > 0) {
      randomLetter = availableLetters[Math.floor(Math.random() * availableLetters.length)];
    } else {
      randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
      // console.warn("All letters used, repeating letters for new round.");
    }
    setLetters(randomLetter);
  }, [currentRound, usedLetters, isLoadingSettings, roomSettings]);

  useEffect(() => {
    if (timeLeft > 0 && !isLoadingSettings && roomSettings) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isSubmitting) {
        // Auto-submit if time runs out
        // console.log("Time ran out, auto-submitting.");
        // handleSubmitAllWords(); // Potentially enable this, careful with multiple submissions
    }
  }, [timeLeft, isLoadingSettings, roomSettings, isSubmitting]);


  const handleWordChange = (category: string, newWord: string) => {
    setWords(prevWords => 
      prevWords.map(cw => 
        cw.category === category ? { ...cw, word: newWord, isValid: undefined, validationReason: undefined } : cw
      )
    );
  };

  const handleValidateWord = async (category: string, word: string) => {
    if (!word.trim() || !roomSettings) return;
    setWords(prevWords => prevWords.map(cw => cw.category === category ? {...cw, isLoading: true} : cw));
    try {
      const input: ValidateWordInput = { word, category, language: roomSettings.gameLanguage };
      const result = await validateWord(input);
      setWords(prevWords => 
        prevWords.map(cw => 
          cw.category === category ? { ...cw, isValid: result.isValid, validationReason: result.reason, isLoading: false } : cw
        )
      );
      if (!result.isValid) {
        toast({
          variant: "destructive",
          title: T.wordInvalidToastTitle(word, category),
          description: T.wordInvalidToastDescription(result.reason),
        });
      }
    } catch (error) {
      console.error("Validation error:", error);
      toast({variant: "destructive", title: T.errorValidatingToast, description: T.errorValidatingDescription});
      setWords(prevWords => prevWords.map(cw => cw.category === category ? {...cw, isLoading: false} : cw));
    }
  };

  const handleSuggestWords = async (category: string) => {
    if (!roomSettings || !letters) return;
    setWords(prevWords => prevWords.map(cw => cw.category === category ? {...cw, isLoading: true} : cw));
    try {
      const input: SuggestValidWordsInput = { letters: letters, category, language: roomSettings.gameLanguage, numberOfSuggestions: 1 };
      const result = await suggestValidWords(input);
      if (result.suggestions && result.suggestions.length > 0) {
        toast({
          title: T.suggestionToastTitle(category),
          description: T.suggestionToastDescription(result.suggestions[0]),
        });
      } else {
        toast({title: T.noSuggestionsToast, description: T.noSuggestionsDescription(category, letters)});
      }
    } catch (error) {
      console.error("Suggestion error:", error);
      toast({variant: "destructive", title: T.errorSuggestingToast, description: T.errorSuggestingDescription});
    } finally {
      setWords(prevWords => prevWords.map(cw => cw.category === category ? {...cw, isLoading: false} : cw));
    }
  };

  const handleSubmitAllWords = async () => {
    if (!roomSettings) return;
    setIsSubmitting(true);
    
    let currentRoundScore = 0;
    for (const cw of words) {
      if (cw.word.trim()) {
        if (cw.isValid === undefined) { // Validate if not already validated
          try {
            const input: ValidateWordInput = { word: cw.word, category: cw.category, language: roomSettings.gameLanguage };
            const result = await validateWord(input);
            // Update word state immediately after validation
             setWords(prevWords => 
                prevWords.map(item => 
                    item.category === cw.category ? { ...item, isValid: result.isValid, validationReason: result.reason, isLoading: false } : item
                )
            );
            if (result.isValid) {
              currentRoundScore += 10; // Example scoring
            }
          } catch (error) {
            console.error("Validation error during submission:", error);
            setWords(prevWords => prevWords.map(item => item.category === cw.category ? {...item, isLoading: false} : item));
          }
        } else if (cw.isValid === true) {
            currentRoundScore += 10; // Add score for already validated words
        }
      }
    }

    // Update player score (mocking for current user)
    setPlayers(prevPlayers => prevPlayers.map(p => p.name === username ? {...p, score: p.score + currentRoundScore} : p));

    setUsedLetters(prev => [...prev, letters]);
    
    if (currentRound >= roomSettings.numberOfRounds) {
      toast({ title: T.gameOver });
      // TODO: Store final player scores in localStorage before redirecting to results
      // For now, just redirect
      router.push(`/rooms/${roomId}/results`);
    } else {
      setCurrentRound(prev => prev + 1);
      setTimeLeft(roomSettings.timePerRound);
      if (roomSettings.categories) {
        setWords(roomSettings.categories.map(cat => ({ category: cat, word: "", isLoading: false })));
      }
      toast({title: T.nextRoundToastTitle(currentRound + 1), description: T.nextRoundToastDescription})
    }
    setIsSubmitting(false);
  };

  if (!isAuthenticated || isLoadingSettings) {
    return <PageWrapper><div className="flex justify-center items-center h-full pt-10">{T.loadingRoomSettings}</div></PageWrapper>;
  }
  if (!roomSettings) {
     return <PageWrapper><div className="flex justify-center items-center h-full pt-10">{T.errorLoadingRoomSettings}</div></PageWrapper>;
  }


  return (
    <PageWrapper>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-3xl font-headline text-primary">{T.round} {currentRound}/{roomSettings.numberOfRounds}</CardTitle>
                <div className="flex items-center gap-2 text-xl font-semibold text-accent">
                  <Clock size={24} />
                  <span>{Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}</span>
                </div>
              </div>
              <Progress value={(timeLeft / (roomSettings.timePerRound || 1)) * 100} className="w-full h-2 mt-2 [&>div]:bg-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6 p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-primary font-medium mb-1">{T.yourLetter}</p>
                <p className="text-6xl font-headline font-bold tracking-widest text-primary">{letters}</p>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleSubmitAllWords(); }} className="space-y-4">
                {words.map((cw, index) => (
                  <Card key={index} className={`p-4 ${cw.isValid === true ? 'border-green-500' : cw.isValid === false ? 'border-red-500' : ''}`}>
                    <Label htmlFor={`word-${index}`} className="text-lg font-semibold text-foreground/90">{cw.category}</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id={`word-${index}`}
                        type="text"
                        value={cw.word}
                        onChange={(e) => handleWordChange(cw.category, e.target.value)}
                        placeholder={T.enterCategoryWord(cw.category)}
                        className="flex-grow"
                        disabled={cw.isLoading || isSubmitting || timeLeft === 0}
                        autoCapitalize="words"
                      />
                       <Button type="button" size="icon" variant="ghost" onClick={() => handleValidateWord(cw.category, cw.word)} disabled={!cw.word.trim() || cw.isLoading || isSubmitting  || timeLeft === 0} title={T.validateWord}>
                        {cw.isLoading && cw.word ? <HelpCircle className="animate-spin h-5 w-5"/> : cw.isValid === true ? <CheckCircle className="text-green-500 h-5 w-5"/> : cw.isValid === false ? <AlertCircle className="text-red-500 h-5 w-5"/> : <HelpCircle className="h-5 w-5"/>}
                      </Button>
                      <Button type="button" size="icon" variant="ghost" onClick={() => handleSuggestWords(cw.category)} disabled={cw.isLoading || isSubmitting || timeLeft === 0} title={T.getSuggestion}>
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                      </Button>
                    </div>
                    {cw.isValid === false && cw.validationReason && (
                      <p className="text-xs text-red-600 mt-1">{cw.validationReason}</p>
                    )}
                  </Card>
                ))}
                <Button type="submit" className="w-full text-lg py-3 bg-primary hover:bg-primary/90" disabled={isSubmitting || timeLeft === 0}>
                  <Send className="mr-2 h-5 w-5"/> {isSubmitting ? T.submitting : T.submitWordsForRound}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-primary flex items-center"><Gamepad2 className="mr-2"/>{T.gameInfo}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><strong>{T.roomIdLabel}</strong> {roomId}</p>
              <p><strong>{T.yourNameLabel}</strong> {username}</p>
              <p><strong>{T.round}:</strong> {currentRound}/{roomSettings.numberOfRounds}</p>
              <p><strong>{translations.en.timePerRound}:</strong> {roomSettings.timePerRound}{T.secondsSuffix}</p>
              <p><strong>{translations.en.language}:</strong> {roomSettings.gameLanguage}</p>
              <p><strong>{translations.en.categories}:</strong> {roomSettings.categories.join(', ')}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-primary flex items-center"><Users className="mr-2"/>{T.scoreboard}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {players.sort((a,b) => b.score - a.score).map((player, idx) => (
                  <li key={player.id} className={`flex justify-between items-center p-3 rounded-md ${player.name === username ? 'bg-accent/20' : 'bg-muted/50'}`}>
                    <span className="font-semibold">{idx + 1}. {player.name}</span>
                    <span className="text-lg font-bold text-primary">{player.score} {T.pointsSuffix}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
    
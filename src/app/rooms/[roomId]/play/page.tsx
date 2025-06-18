
// src/app/rooms/[roomId]/play/page.tsx
"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import RealtimeGamePage from './RealtimeGamePage';

export default function GamePage() {
  const params = useParams();
  const roomId = params.roomId as string;

  return <RealtimeGamePage roomId={roomId} />;
}

interface Player {
  id: string;
  name: string;
  score: number; // Total score
}

interface CategoryWordSubmission {
  category: string;
  word: string;
  // isLoading, isValid, validationReason are removed as AI interaction is removed from this page
}

interface RoomSettingsData {
  numberOfRounds: number;
  timePerRound: number;
  categories: string[];
  gameLanguage: string;
  admin: string;
  currentRound: number;
  endRoundOnFirstSubmit: boolean;
}

interface StoredRoomSettings {
  roomName: string;
  numberOfRounds: number;
  timePerRound: number;
  categories: string;
  language: string;
  endRoundOnFirstSubmit: boolean;
  admin: string;
  currentRound: number;
}

const translations = {
  en: {
    round: "Round",
    timeLeft: "Time Left",
    yourLetter: "Your Letter:",
    enterCategoryWord: (category: string) => `Enter a ${category.toLowerCase()}`,
    submitWordsForRound: "Submit Words for Review",
    submitting: "Submitting...",
    gameInfo: "Game Info",
    roomIdLabel: "Room ID:",
    yourNameLabel: "Your Name:",
    scoreboard: "Scoreboard",
    pointsSuffix: "pts",
    loadingRoomSettings: "Loading game settings...",
    errorLoadingRoomSettings: "Could not load game settings. Please ensure room settings are available.",
    secondsSuffix: "s",
    timeUp: "Time's Up! Submitting your words...",
  },
  es: {
    round: "Ronda",
    timeLeft: "Tiempo Restante",
    yourLetter: "Tu Letra:",
    enterCategoryWord: (category: string) => `Ingresa ${category.toLowerCase()}`,
    submitWordsForRound: "Enviar Palabras para Revisión",
    submitting: "Enviando...",
    gameInfo: "Info del Juego",
    roomIdLabel: "ID de Sala:",
    yourNameLabel: "Tu Nombre:",
    scoreboard: "Marcador",
    pointsSuffix: "pts",
    loadingRoomSettings: "Cargando configuración del juego...",
    errorLoadingRoomSettings: "No se pudo cargar la configuración del juego. Asegúrate que la configuración de la sala esté disponible.",
    secondsSuffix: "s",
    timeUp: "¡Se acabó el tiempo! Enviando tus palabras...",
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

  const [currentLetter, setCurrentLetter] = useState("");
  const [timeLeft, setTimeLeft] = useState(0); // Will be set from roomSettings
  const [wordSubmissions, setWordSubmissions] = useState<CategoryWordSubmission[]>([]);
  const [usedLetters, setUsedLetters] = useState<string[]>([]);

  const [players, setPlayers] = useState<Player[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !username) {
      router.replace('/login');
    }
  }, [isAuthenticated, username, router]);

  // Load room settings and player data
  useEffect(() => {
    if (!roomId) return;
    setIsLoadingSettings(true);
    const storedSettingsRaw = localStorage.getItem(`room-${roomId}-settings`);
    if (storedSettingsRaw) {
      try {
        const parsedSettings: StoredRoomSettings = JSON.parse(storedSettingsRaw);
        if (!parsedSettings.currentRound) {
          toast({ variant: "destructive", title: "Error", description: "Game round not initialized. Returning to lobby." });
          router.push(`/rooms/${roomId}/lobby`);
          return;
        }
        const loadedSettings: RoomSettingsData = {
          numberOfRounds: parsedSettings.numberOfRounds,
          timePerRound: parsedSettings.timePerRound,
          categories: parsedSettings.categories.split(',').map(c => c.trim()),
          gameLanguage: parsedSettings.language,
          admin: parsedSettings.admin,
          currentRound: parsedSettings.currentRound,
          endRoundOnFirstSubmit: parsedSettings.endRoundOnFirstSubmit || false,
        };
        setRoomSettings(loadedSettings);
        setTimeLeft(loadedSettings.timePerRound);
        setWordSubmissions(loadedSettings.categories.map(cat => ({ category: cat, word: "" })));

        const storedUsedLetters = localStorage.getItem(`room-${roomId}-used-letters`);
        if (storedUsedLetters) {
          setUsedLetters(JSON.parse(storedUsedLetters));
        }

      } catch (e) {
        console.error("Error parsing room settings for game page:", e);
        toast({ variant: "destructive", title: T.errorLoadingRoomSettings, description: T.errorLoadingRoomSettings });
        setRoomSettings(null); 
      }
    } else {
      toast({ variant: "destructive", title: T.errorLoadingRoomSettings, description: T.errorLoadingRoomSettings });
      setRoomSettings(null); 
    }

    const storedPlayersRaw = localStorage.getItem(`room-${roomId}-players`);
    if (storedPlayersRaw) {
        try {
            setPlayers(JSON.parse(storedPlayersRaw));
        } catch (e) {
            console.error("Error parsing players for game page:", e);
        }
    }

    setIsLoadingSettings(false);
  }, [roomId, T, toast, router]);


  // Generate new letter for the current round if not already generated
  useEffect(() => {
    if (isLoadingSettings || !roomSettings || !username) return;

    const roundLetterKey = `room-${roomId}-round-${roomSettings.currentRound}-letter`;
    let letterForRound = localStorage.getItem(roundLetterKey);

    if (!letterForRound) {
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const availableLetters = alphabet.split('').filter(l => !usedLetters.includes(l));
      
      if (availableLetters.length > 0) {
        letterForRound = availableLetters[Math.floor(Math.random() * availableLetters.length)];
      } else {
        letterForRound = alphabet[Math.floor(Math.random() * alphabet.length)];
        console.warn("All unique letters used, repeating letters for new round.");
      }
      localStorage.setItem(roundLetterKey, letterForRound);
      setUsedLetters(prev => {
          const newUsedLetters = [...prev, letterForRound!];
          localStorage.setItem(`room-${roomId}-used-letters`, JSON.stringify(newUsedLetters));
          return newUsedLetters;
      });
    }
    setCurrentLetter(letterForRound);
  }, [roomSettings, isLoadingSettings, usedLetters, roomId, username]);


  const handleSubmitWordsAndGoToReview = useCallback(async () => {
    if (!roomSettings || !username || isSubmitting) return;
    setIsSubmitting(true);

    const submissionsToStore = wordSubmissions.map(s => ({ category: s.category, word: s.word }));
    localStorage.setItem(`room-${roomId}-round-${roomSettings.currentRound}-player-${username}-submissions`, JSON.stringify(submissionsToStore));

    router.push(`/rooms/${roomId}/round/${roomSettings.currentRound}/review`);
  }, [roomSettings, username, wordSubmissions, roomId, router, isSubmitting]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isLoadingSettings && roomSettings && !isSubmitting) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isSubmitting && roomSettings && !isLoadingSettings) {
      if (!isSubmitting) { 
        toast({ title: T.timeUp });
        handleSubmitWordsAndGoToReview();
      }
    }
  }, [timeLeft, isLoadingSettings, roomSettings, isSubmitting, T, toast, handleSubmitWordsAndGoToReview]);


  const handleWordChange = (category: string, newWord: string) => {
    setWordSubmissions(prevWords =>
      prevWords.map(cw =>
        cw.category === category ? { ...cw, word: newWord } : cw
      )
    );
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
                <CardTitle className="text-3xl font-headline text-primary">{T.round} {roomSettings.currentRound}/{roomSettings.numberOfRounds}</CardTitle>
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
                <p className="text-6xl font-headline font-bold tracking-widest text-primary">{currentLetter}</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSubmitWordsAndGoToReview(); }} className="space-y-4">
                {wordSubmissions.map((cw, index) => (
                  <Card key={index} className="p-4">
                    <Label htmlFor={`word-${index}`} className="text-lg font-semibold text-foreground/90">{cw.category}</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id={`word-${index}`}
                        type="text"
                        value={cw.word}
                        onChange={(e) => handleWordChange(cw.category, e.target.value)}
                        placeholder={T.enterCategoryWord(cw.category)}
                        className="flex-grow"
                        disabled={isSubmitting || timeLeft === 0}
                        autoCapitalize="words"
                      />
                    </div>
                  </Card>
                ))}
                {roomSettings.endRoundOnFirstSubmit && (
                  <Button type="submit" className="w-full text-lg py-3 bg-primary hover:bg-primary/90" disabled={isSubmitting || timeLeft === 0}>
                    <Send className="mr-2 h-5 w-5"/> {isSubmitting ? T.submitting : T.submitWordsForRound}
                  </Button>
                )}
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
              <p><strong>{T.round}:</strong> {roomSettings.currentRound}/{roomSettings.numberOfRounds}</p>
              <p><strong>{T.yourLetter}</strong> {currentLetter}</p>
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


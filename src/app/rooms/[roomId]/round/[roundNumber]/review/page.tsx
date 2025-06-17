
// src/app/rooms/[roomId]/round/[roundNumber]/review/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, CheckCircle, HelpCircle, Send } from 'lucide-react';
import { validateWord, ValidateWordInput } from '@/ai/flows/validate-word';
import { useToast } from '@/hooks/use-toast';

interface Player {
  id: string;
  name: string;
  score: number; // Total score
}

interface CategoryWordSubmission {
  category: string;
  word: string;
  isValid?: boolean;
  validationReason?: string;
  isLoading?: boolean; // For UI during validation
}

interface StoredRoomSettings {
  roomName: string;
  numberOfRounds: number;
  timePerRound: number;
  categories: string;
  language: string; // Game language
  admin: string;
  currentRound: number;
}

const translations = {
  en: {
    pageTitle: (round: number) => `Review Round ${round} Submissions`,
    pageDescription: "Validate your words for this round.",
    category: "Category:",
    wordSubmitted: "Word Submitted:",
    status: "Status:",
    validateButton: "Validate",
    validating: "Validating...",
    unvalidated: "Not validated yet",
    valid: "Valid",
    invalid: "Invalid",
    confirmSubmissionsButton: "Confirm and Calculate Score",
    calculatingScore: "Calculating Score...",
    errorLoadingSubmissions: "Error loading your submissions for this round.",
    errorLoadingSettings: "Error loading game settings.",
    wordInvalidToastTitle: (word: string) => `Word "${word}" Invalid`,
    wordValidToastTitle: (word: string) => `Word "${word}" Valid!`,
    errorValidatingToast: "Error validating word",
    scoreCalculatedToast: (score: number) => `Round Score: ${score} points!`,
    pointsSuffix: "pts",
  },
  es: {
    pageTitle: (round: number) => `Revisar Envíos Ronda ${round}`,
    pageDescription: "Valida tus palabras para esta ronda.",
    category: "Categoría:",
    wordSubmitted: "Palabra Enviada:",
    status: "Estado:",
    validateButton: "Validar",
    validating: "Validando...",
    unvalidated: "Sin validar",
    valid: "Válida",
    invalid: "Inválida",
    confirmSubmissionsButton: "Confirmar y Calcular Puntuación",
    calculatingScore: "Calculando Puntuación...",
    errorLoadingSubmissions: "Error al cargar tus envíos para esta ronda.",
    errorLoadingSettings: "Error al cargar la configuración del juego.",
    wordInvalidToastTitle: (word: string) => `Palabra "${word}" Inválida`,
    wordValidToastTitle: (word: string) => `¡Palabra "${word}" Válida!`,
    errorValidatingToast: "Error al validar palabra",
    scoreCalculatedToast: (score: number) => `Puntuación de Ronda: ¡${score} puntos!`,
    pointsSuffix: "pts",
  }
};

export default function ReviewRoundPage() {
  const { isAuthenticated, username, language: uiLanguage } = useUser();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const roundNumber = parseInt(params.roundNumber as string, 10);
  const { toast } = useToast();
  const T = translations[uiLanguage as keyof typeof translations] || translations.en;

  const [submissions, setSubmissions] = useState<CategoryWordSubmission[]>([]);
  const [roomSettings, setRoomSettings] = useState<StoredRoomSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !username) {
      router.replace('/login');
      return;
    }
    if (!roomId || isNaN(roundNumber)) {
      router.replace('/'); // Invalid path
      return;
    }

    setIsLoading(true);
    const storedSettingsRaw = localStorage.getItem(`room-${roomId}-settings`);
    if (storedSettingsRaw) {
      setRoomSettings(JSON.parse(storedSettingsRaw));
    } else {
      toast({ variant: "destructive", title: T.errorLoadingSettings });
      router.push('/');
      return;
    }

    const storedSubmissionsRaw = localStorage.getItem(`room-${roomId}-round-${roundNumber}-player-${username}-submissions`);
    if (storedSubmissionsRaw) {
      const parsedSubmissions: Array<{ category: string, word: string }> = JSON.parse(storedSubmissionsRaw);
      setSubmissions(parsedSubmissions.map(s => ({ ...s, isValid: undefined, isLoading: false })));
    } else {
      toast({ variant: "destructive", title: T.errorLoadingSubmissions });
      // Maybe redirect to play page if submissions are missing for review
      router.push(`/rooms/${roomId}/play`);
      return;
    }
    setIsLoading(false);
  }, [roomId, roundNumber, username, isAuthenticated, router, toast, T]);

  const handleValidateSingleWord = async (index: number) => {
    const submission = submissions[index];
    if (!submission.word.trim() || !roomSettings) return;

    setSubmissions(prev => prev.map((s, i) => i === index ? { ...s, isLoading: true } : s));
    try {
      const input: ValidateWordInput = { word: submission.word, category: submission.category, language: roomSettings.language };
      const result = await validateWord(input);
      setSubmissions(prev => prev.map((s, i) =>
        i === index ? { ...s, isValid: result.isValid, validationReason: result.reason, isLoading: false } : s
      ));
      if (result.isValid) {
        toast({ title: T.wordValidToastTitle(submission.word) });
      } else {
        toast({ variant: "destructive", title: T.wordInvalidToastTitle(submission.word), description: result.reason });
      }
    } catch (error) {
      console.error("Validation error:", error);
      toast({ variant: "destructive", title: T.errorValidatingToast });
      setSubmissions(prev => prev.map((s, i) => i === index ? { ...s, isLoading: false } : s));
    }
  };

  const handleConfirmAndScore = async () => {
    if (!roomSettings || !username) return;
    setIsConfirming(true);

    let roundScore = 0;
    const validatedSubmissions = [...submissions]; // Create a mutable copy

    for (let i = 0; i < validatedSubmissions.length; i++) {
      const sub = validatedSubmissions[i];
      if (sub.word.trim() && sub.isValid === undefined) { // Only validate if not already validated
        try {
          const input: ValidateWordInput = { word: sub.word, category: sub.category, language: roomSettings.language };
          const result = await validateWord(input);
          validatedSubmissions[i] = { ...sub, isValid: result.isValid, validationReason: result.reason, isLoading: false };
          if (result.isValid) roundScore += 10; // Example scoring
        } catch (error) {
          console.error(`Error validating "${sub.word}" during confirmation:`, error);
          validatedSubmissions[i] = { ...sub, isValid: false, validationReason: "Validation system error", isLoading: false };
        }
      } else if (sub.isValid === true) {
        roundScore += 10; // Add score for pre-validated words
      }
    }
    setSubmissions(validatedSubmissions); // Update UI with all validation results

    // Save validated submissions and round score
    localStorage.setItem(`room-${roomId}-round-${roundNumber}-player-${username}-submissions`, JSON.stringify(validatedSubmissions.map(s => ({category: s.category, word: s.word, isValid: s.isValid, validationReason: s.validationReason }))));
    localStorage.setItem(`room-${roomId}-round-${roundNumber}-player-${username}-roundScore`, JSON.stringify(roundScore));

    // Update total player score
    const playersRaw = localStorage.getItem(`room-${roomId}-players`);
    if (playersRaw) {
      let players: Player[] = JSON.parse(playersRaw);
      players = players.map(p => p.name === username ? { ...p, score: p.score + roundScore } : p);
      localStorage.setItem(`room-${roomId}-players`, JSON.stringify(players));
    }

    toast({ title: T.scoreCalculatedToast(roundScore) });
    setIsConfirming(false);
    router.push(`/rooms/${roomId}/round/${roundNumber}/wait`);
  };


  if (isLoading) {
    return <PageWrapper><div className="text-center pt-10">{T.errorLoadingSubmissions}</div></PageWrapper>;
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-primary">{T.pageTitle(roundNumber)}</CardTitle>
            <CardDescription>{T.pageDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {submissions.map((sub, index) => (
              <Card key={index} className={`p-4 ${sub.isValid === true ? 'border-green-500' : sub.isValid === false ? 'border-red-500' : 'border-border'}`}>
                <h3 className="text-lg font-semibold">{T.category} {sub.category}</h3>
                <p><span className="font-medium">{T.wordSubmitted}</span> {sub.word || "(No word submitted)"}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-sm">
                    <span className="font-medium">{T.status} </span>
                    {sub.isLoading ? (
                      <span className="italic">{T.validating}</span>
                    ) : sub.isValid === true ? (
                      <span className="text-green-600 font-semibold flex items-center"><CheckCircle className="mr-1 h-4 w-4"/>{T.valid}</span>
                    ) : sub.isValid === false ? (
                      <span className="text-red-600 font-semibold flex items-center"><AlertCircle className="mr-1 h-4 w-4"/>{T.invalid} {sub.validationReason && `(${sub.validationReason})`}</span>
                    ) : (
                      <span className="text-muted-foreground flex items-center"><HelpCircle className="mr-1 h-4 w-4"/>{T.unvalidated}</span>
                    )}
                  </div>
                  {sub.word.trim() && sub.isValid === undefined && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleValidateSingleWord(index)}
                      disabled={sub.isLoading || isConfirming}
                    >
                      {sub.isLoading ? T.validating : T.validateButton}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
            <Button
              onClick={handleConfirmAndScore}
              className="w-full text-lg py-3 bg-primary hover:bg-primary/90"
              disabled={isConfirming || submissions.length === 0}
            >
              <Send className="mr-2 h-5 w-5"/>
              {isConfirming ? T.calculatingScore : T.confirmSubmissionsButton}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}


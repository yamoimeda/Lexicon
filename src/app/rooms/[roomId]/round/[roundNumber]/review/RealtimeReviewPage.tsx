// src/app/rooms/[roomId]/round/[roundNumber]/review/RealtimeReviewPage.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AlertCircle, CheckCircle, HelpCircle, Send, Users, Sparkles } from 'lucide-react';
import { validateWord, ValidateWordInput } from '@/ai/flows/validate-word';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useGameRoom } from '@/hooks/useGameRoom';
import { GameService } from '@/services/gameService';
import { Player, Room, RoundData, PlayerSubmission } from '@/services/gameService';

interface PlayerRoundReviewData {
  category: string;
  word: string;
  isValid?: boolean;
  validationReason?: string;
  isLoading?: boolean;
}

interface AggregatedWordInfo {
  word: string;
  submittedBy: Array<{ playerName: string; originalIsValid?: boolean; originalValidationReason?: string }>;
  isValidByAdmin?: boolean;
  validationReasonByAdmin?: string;
  isAiValidating?: boolean;
  aiValidated?: boolean;
}

interface AggregatedCategoryView {
  categoryName: string;
  words: AggregatedWordInfo[];
}

const translations = {
  en: {
    pageTitlePlayer: (round: number) => `Review Your Round ${round} Submissions`,
    pageTitleAdmin: (round: number) => `Admin Review: Round ${round}`,
    pageDescriptionPlayer: "Validate your words and see your preliminary score.",
    pageDescriptionAdmin: "Validate all submitted words and finalize scores for this round.",
    category: "Category:",
    wordSubmitted: "Word Submitted:",
    yourWord: "Your Word:",
    status: "Status:",
    validateButton: "Validate with AI",
    validating: "Validating...",
    unvalidated: "Not validated yet",
    valid: "Valid",
    invalid: "Invalid",
    confirmSubmissionsPlayerButton: "Confirm My Validations & Continue",
    confirmSubmissionsAdminButton: "Finalize Round Scores",
    calculatingScore: "Calculating...",
    finalizingScores: "Finalizing Scores...",
    errorLoadingSubmissions: "Error loading submissions.",
    errorLoadingSettings: "Error loading game settings.",
    wordInvalidToastTitle: (word: string) => `Word "${word}" Invalid`,
    wordValidToastTitle: (word: string) => `Word "${word}" Valid!`,
    errorValidatingToast: "Error validating word",
    playerRoundScoreToast: (score: number) => `Your preliminary round score: ${score} pts!`,
    adminScoresFinalizedToast: "Round scores finalized!",
    pointsSuffix: "pts",
    adminWordValidationSectionTitle: "Words Submitted by Players",
    submittedByLabel: "Submitted by:",
    markAsValid: "Mark Valid",
    markAsInvalid: "Mark Invalid",
    aiValidationPending: "AI Check Pending",
    pointsMapping: (count: number) => {
      if (count === 1) return `(Unique: 100 ${translations.en.pointsSuffix})`;
      if (count === 2) return `(2 players: 75 ${translations.en.pointsSuffix} each)`;
      if (count === 3) return `(3 players: 50 ${translations.en.pointsSuffix} each)`;
      return `(${count} players: 25 ${translations.en.pointsSuffix} each)`;
    },
    aiChecked: "AI Checked",
    adminOverride: "Admin Override",
    noSubmissionsForCategory: "No submissions for this category.",
    playersInRoom: "Players in Room:",
    loading: "Loading...",
    roomNotFound: "Room not found.",
    roundNotFound: "Round not found.",
  },
  es: {
    pageTitlePlayer: (round: number) => `Revisar Tus Envíos Ronda ${round}`,
    pageTitleAdmin: (round: number) => `Revisión Admin: Ronda ${round}`,
    pageDescriptionPlayer: "Valida tus palabras y ve tu puntuación preliminar.",
    pageDescriptionAdmin: "Valida todas las palabras enviadas y finaliza las puntuaciones de esta ronda.",
    category: "Categoría:",
    wordSubmitted: "Palabra Enviada:",
    yourWord: "Tu Palabra:",
    status: "Estado:",
    validateButton: "Validar con IA",
    validating: "Validando...",
    unvalidated: "Sin validar",
    valid: "Válida",
    invalid: "Inválida",
    confirmSubmissionsPlayerButton: "Confirmar Mis Validaciones y Continuar",
    confirmSubmissionsAdminButton: "Finalizar Puntuaciones de Ronda",
    calculatingScore: "Calculando...",
    finalizingScores: "Finalizando Puntuaciones...",
    errorLoadingSubmissions: "Error al cargar envíos.",
    errorLoadingSettings: "Error al cargar la configuración del juego.",
    wordInvalidToastTitle: (word: string) => `Palabra "${word}" Inválida`,
    wordValidToastTitle: (word: string) => `¡Palabra "${word}" Válida!`,
    errorValidatingToast: "Error al validar palabra",
    playerRoundScoreToast: (score: number) => `Tu puntuación preliminar de ronda: ¡${score} pts!`,
    adminScoresFinalizedToast: "¡Puntuaciones de ronda finalizadas!",
    pointsSuffix: "pts",
    adminWordValidationSectionTitle: "Palabras Enviadas por Jugadores",
    submittedByLabel: "Enviado por:",
    markAsValid: "Marcar Válida",
    markAsInvalid: "Marcar Inválida",
    aiValidationPending: "Pendiente de IA",
    pointsMapping: (count: number) => {
      if (count === 1) return `(Única: 100 ${translations.es.pointsSuffix})`;
      if (count === 2) return `(2 jugadores: 75 ${translations.es.pointsSuffix} c/u)`;
      if (count === 3) return `(3 jugadores: 50 ${translations.es.pointsSuffix} c/u)`;
      return `(${count} jugadores: 25 ${translations.es.pointsSuffix} c/u)`;
    },
    aiChecked: "Verificado por IA",
    adminOverride: "Decisión del Admin",
    noSubmissionsForCategory: "No hay envíos para esta categoría.",
    playersInRoom: "Jugadores en la Sala:",
    loading: "Cargando...",
    roomNotFound: "Sala no encontrada.",
    roundNotFound: "Ronda no encontrada.",
  }
};

export default function RealtimeReviewPage() {
  const { isAuthenticated, username, language: uiLanguage } = useUser();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const roundNumber = parseInt(params.roundNumber as string, 10);
  const { toast } = useToast();
  const T = translations[uiLanguage as keyof typeof translations] || translations.en;

  const { room, loading, error } = useGameRoom(roomId);
  const [currentRound, setCurrentRound] = useState<RoundData | null>(null);
  const [playerSubmissions, setPlayerSubmissions] = useState<PlayerSubmission[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<PlayerSubmission[]>([]);
  
  // For player's own review
  const [playerReviewData, setPlayerReviewData] = useState<PlayerRoundReviewData[]>([]);
  // For admin's aggregated review
  const [adminAggregatedData, setAdminAggregatedData] = useState<AggregatedCategoryView[]>([]);

  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !username) {
      router.replace('/login');
      return;
    }
    if (!roomId || isNaN(roundNumber)) {
      router.replace('/');
      return;
    }
  }, [isAuthenticated, username, roomId, roundNumber, router]);

  // Load round data when room is available
  useEffect(() => {
    if (!room || loading) return;

    const loadRoundData = async () => {
      try {
        const round = await GameService.getRound(roomId, roundNumber);
        if (!round) {
          toast({ variant: "destructive", title: T.roundNotFound });
          router.push(`/rooms/${roomId}/lobby`);
          return;
        }
        setCurrentRound(round);

        // Load submissions for this round
        const submissions = await GameService.getRoundSubmissions(roomId, roundNumber);
        setAllSubmissions(submissions);

        // Filter player's own submissions
        const currentPlayerSubmissions = submissions.filter(s => s.playerId === username);
        setPlayerSubmissions(currentPlayerSubmissions);

        if (room.adminId === username) {
          loadAdminData(room, submissions);
        } else {
          loadPlayerData(currentPlayerSubmissions);
        }
      } catch (error) {
        console.error('Error loading round data:', error);
        toast({ variant: "destructive", title: T.errorLoadingSettings });
      }
    };

    loadRoundData();
  }, [room, roomId, roundNumber, username, loading, toast, T, router]);

  const loadPlayerData = (submissions: PlayerSubmission[]) => {
    const reviewData: PlayerRoundReviewData[] = room?.settings.categories.map((category: string) => {
      const submission = submissions.find(s => s.category === category);
      return {
        category,
        word: submission?.word || '',
        isValid: submission?.isValid,
        validationReason: submission?.validationReason,
        isLoading: false
      };
    }) || [];
    setPlayerReviewData(reviewData);
  };

  const loadAdminData = (gameRoom: Room, submissions: PlayerSubmission[]) => {
    const aggregated: AggregatedCategoryView[] = [];

    for (const category of gameRoom.settings.categories) {
      const categoryWords: Record<string, AggregatedWordInfo> = {};
      
      const categorySubmissions = submissions.filter(s => s.category === category && s.word?.trim());
      
      for (const submission of categorySubmissions) {
        const word = submission.word!.trim();
        if (!categoryWords[word]) {
          categoryWords[word] = {
            word,
            submittedBy: [],
            isValidByAdmin: submission.isValid,
            validationReasonByAdmin: submission.validationReason,
            isAiValidating: false,
            aiValidated: submission.isValid !== undefined,
          };
        }
        categoryWords[word].submittedBy.push({ 
          playerName: submission.playerId,
          originalIsValid: submission.isValid,
          originalValidationReason: submission.validationReason
        });
      }

      aggregated.push({
        categoryName: category,
        words: Object.values(categoryWords).sort((a, b) => b.submittedBy.length - a.submittedBy.length),
      });
    }
    
    setAdminAggregatedData(aggregated);
  };

  // For player's own validation
  const handlePlayerValidateSingleWord = async (index: number) => {
    const submission = playerReviewData[index];
    if (!submission.word.trim() || !room) return;

    setPlayerReviewData(prev => prev.map((s, i) => i === index ? { ...s, isLoading: true } : s));
    
    try {
      const input: ValidateWordInput = { 
        word: submission.word, 
        category: submission.category, 
        language: room.language 
      };
      const result = await validateWord(input);
      
      setPlayerReviewData(prev => prev.map((s, i) =>
        i === index ? { 
          ...s, 
          isValid: result.isValid, 
          validationReason: result.reason, 
          isLoading: false 
        } : s
      ));

      toast({
        title: result.isValid ? T.wordValidToastTitle(submission.word) : T.wordInvalidToastTitle(submission.word),
        description: result.isValid ? undefined : result.reason,
        variant: result.isValid ? "default" : "destructive"
      });
    } catch (error) {
      console.error("Player validation error:", error);
      toast({ variant: "destructive", title: T.errorValidatingToast });
      setPlayerReviewData(prev => prev.map((s, i) => i === index ? { ...s, isLoading: false } : s));
    }
  };

  // For admin validating a unique word using AI
  const handleAdminAiValidateWord = async (categoryIndex: number, wordIndex: number) => {
    if (!room) return;
    const wordInfo = adminAggregatedData[categoryIndex].words[wordIndex];
    if (!wordInfo || wordInfo.aiValidated) return;

    setAdminAggregatedData(prev => {
      const newData = [...prev];
      newData[categoryIndex].words[wordIndex].isAiValidating = true;
      return newData;
    });

    try {
      const input: ValidateWordInput = { 
        word: wordInfo.word, 
        category: adminAggregatedData[categoryIndex].categoryName, 
        language: room.language 
      };
      const result = await validateWord(input);
      
      setAdminAggregatedData(prev => {
        const newData = [...prev];
        newData[categoryIndex].words[wordIndex].isValidByAdmin = result.isValid;
        newData[categoryIndex].words[wordIndex].validationReasonByAdmin = result.reason;
        newData[categoryIndex].words[wordIndex].isAiValidating = false;
        newData[categoryIndex].words[wordIndex].aiValidated = true;
        return newData;
      });

      toast({
        title: result.isValid ? T.wordValidToastTitle(wordInfo.word) : T.wordInvalidToastTitle(wordInfo.word),
        description: result.isValid ? T.aiChecked : `${T.aiChecked}: ${result.reason || ''}`,
        variant: result.isValid ? "default" : "destructive"
      });
    } catch (error) {
      console.error("Admin AI validation error:", error);
      toast({ variant: "destructive", title: T.errorValidatingToast });
      setAdminAggregatedData(prev => {
        const newData = [...prev];
        newData[categoryIndex].words[wordIndex].isAiValidating = false;
        return newData;
      });
    }
  };

  const toggleAdminWordValidation = (categoryIndex: number, wordIndex: number, makeValid: boolean) => {
    setAdminAggregatedData(prev => {
      const newData = [...prev];
      newData[categoryIndex].words[wordIndex].isValidByAdmin = makeValid;
      newData[categoryIndex].words[wordIndex].validationReasonByAdmin = makeValid 
        ? T.adminOverride 
        : `${T.adminOverride}: Marked as invalid by admin.`;
      if (!newData[categoryIndex].words[wordIndex].aiValidated && !makeValid) {
        newData[categoryIndex].words[wordIndex].aiValidated = true;
      }
      return newData;
    });
  };

  const handleConfirm = async () => {
    if (!room || !username || !currentRound) return;
    setIsConfirming(true);

    try {
      if (room.adminId === username) {
        // Admin finalizes scores for everyone
        const playerRoundScores: Record<string, number> = {};
        room.players.forEach((p: Player) => playerRoundScores[p.id] = 0);

        // Auto-validate unvalidated words with AI
        for (const catView of adminAggregatedData) {
          for (const wordInfo of catView.words) {
            if (wordInfo.isValidByAdmin === undefined && wordInfo.word.trim() && !wordInfo.aiValidated) {
              try {
                const input: ValidateWordInput = { 
                  word: wordInfo.word, 
                  category: catView.categoryName, 
                  language: room.language 
                };
                const result = await validateWord(input);
                wordInfo.isValidByAdmin = result.isValid;
              } catch (e) {
                console.error("Error auto-validating during admin confirm:", e);
                wordInfo.isValidByAdmin = false;
              }
            }

            // Calculate scores for valid words
            if (wordInfo.isValidByAdmin === true) {
              const submitterCount = wordInfo.submittedBy.length;
              let points = 0;
              if (submitterCount === 1) points = 100;
              else if (submitterCount === 2) points = 75;
              else if (submitterCount === 3) points = 50;
              else if (submitterCount >= 4) points = 25;

              wordInfo.submittedBy.forEach(submitter => {
                playerRoundScores[submitter.playerName] = (playerRoundScores[submitter.playerName] || 0) + points;
              });
            }
          }
        }

        // Update player scores and mark round as completed
        for (const playerId in playerRoundScores) {
          const roundScore = playerRoundScores[playerId] || 0;          const player = room.players.find((p: Player) => p.id === playerId);
          if (player) {
            await GameService.updatePlayerScore(roomId, playerId, player.score + roundScore);
          }
        }

        // Update round status to completed
        await GameService.updateRound(roomId, roundNumber, {
          status: 'completed',
          completedAt: new Date()
        });

        toast({ title: T.adminScoresFinalizedToast });

      } else {
        // Player confirms their own validations
        let playerScore = 0;
        const updatedSubmissions = [...playerReviewData];

        for (let i = 0; i < updatedSubmissions.length; i++) {
          const sub = updatedSubmissions[i];
          if (sub.word.trim() && sub.isValid === undefined) {
            try {
              const input: ValidateWordInput = { 
                word: sub.word, 
                category: sub.category, 
                language: room.language 
              };
              const result = await validateWord(input);
              updatedSubmissions[i] = { 
                ...sub, 
                isValid: result.isValid, 
                validationReason: result.reason 
              };
              if (result.isValid) playerScore += 10;
            } catch (e) {
              updatedSubmissions[i] = { 
                ...sub, 
                isValid: false, 
                validationReason: "Validation error" 
              };
            }
          } else if (sub.isValid) {
            playerScore += 10;
          }
        }

        // Update submissions in Firestore
        for (const sub of updatedSubmissions) {
          if (sub.word.trim()) {
            await GameService.updateSubmission(roomId, roundNumber, username, sub.category, {
              isValid: sub.isValid,
              validationReason: sub.validationReason
            });
          }
        }

        setPlayerReviewData(updatedSubmissions);
        toast({ title: T.playerRoundScoreToast(playerScore) });
      }

      router.push(`/rooms/${roomId}/round/${roundNumber}/wait`);
    } catch (error) {
      console.error('Error confirming review:', error);
      toast({ variant: "destructive", title: "Error confirming review" });
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading) {
    return <PageWrapper><div className="text-center pt-10">{T.loading}</div></PageWrapper>;
  }

  if (error || !room) {
    return <PageWrapper><div className="text-center pt-10">{T.roomNotFound}</div></PageWrapper>;
  }

  const isCurrentUserAdmin = room.adminId === username;

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-primary">
              {isCurrentUserAdmin ? T.pageTitleAdmin(roundNumber) : T.pageTitlePlayer(roundNumber)}
            </CardTitle>
            <CardDescription>
              {isCurrentUserAdmin ? T.pageDescriptionAdmin : T.pageDescriptionPlayer}
            </CardDescription>
            {isCurrentUserAdmin && (
              <div className="text-sm text-muted-foreground mt-2">
                <p><strong>{T.playersInRoom}</strong> {players.map(p => p.name).join(', ')}</p>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {!isCurrentUserAdmin && playerReviewData.map((sub, index) => (
              <Card key={index} className={`p-4 ${sub.isValid === true ? 'border-green-500' : sub.isValid === false ? 'border-red-500' : 'border-border'}`}>
                <h3 className="text-lg font-semibold">{T.category} {sub.category}</h3>
                <p><span className="font-medium">{T.yourWord}</span> {sub.word || "(No word submitted)"}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-sm">
                    <span className="font-medium">{T.status} </span>
                    {sub.isLoading ? (
                      <span className="italic">{T.validating}</span>
                    ) : sub.isValid === true ? (
                      <span className="text-green-600 font-semibold flex items-center">
                        <CheckCircle className="mr-1 h-4 w-4"/>{T.valid}
                      </span>
                    ) : sub.isValid === false ? (
                      <span className="text-red-600 font-semibold flex items-center">
                        <AlertCircle className="mr-1 h-4 w-4"/>{T.invalid} {sub.validationReason && `(${sub.validationReason})`}
                      </span>
                    ) : (
                      <span className="text-muted-foreground flex items-center">
                        <HelpCircle className="mr-1 h-4 w-4"/>{T.unvalidated}
                      </span>
                    )}
                  </div>
                  {sub.word.trim() && sub.isValid === undefined && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePlayerValidateSingleWord(index)}
                      disabled={sub.isLoading || isConfirming}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {sub.isLoading ? T.validating : T.validateButton}
                    </Button>
                  )}
                </div>
              </Card>
            ))}

            {isCurrentUserAdmin && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-center text-primary">{T.adminWordValidationSectionTitle}</h2>
                {adminAggregatedData.map((catView, catIndex) => (
                  <Card key={catIndex} className="p-4 border-primary/50">
                    <CardHeader className="p-2">
                      <CardTitle className="text-xl text-primary">{T.category} {catView.categoryName}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 space-y-3">
                      {catView.words.length === 0 && <p className="text-muted-foreground text-sm">{T.noSubmissionsForCategory}</p>}
                      {catView.words.map((wordInfo, wordIndex) => (
                        <Card key={wordIndex} className={`p-3 ${wordInfo.isValidByAdmin === true ? 'bg-green-500/10 border-green-500' : wordInfo.isValidByAdmin === false ? 'bg-red-500/10 border-red-500' : ''}`}>
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                            <div>
                              <p className="text-lg font-semibold">
                                {wordInfo.word} 
                                <span className="text-sm font-normal text-muted-foreground ml-2">
                                  {T.pointsMapping(wordInfo.submittedBy.length)}
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {T.submittedByLabel} {wordInfo.submittedBy.map(s => s.playerName).join(', ')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {wordInfo.isValidByAdmin === undefined && !wordInfo.aiValidated && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleAdminAiValidateWord(catIndex, wordIndex)} 
                                  disabled={wordInfo.isAiValidating || isConfirming}
                                >
                                  {wordInfo.isAiValidating ? T.validating : <><Sparkles className="mr-2 h-4 w-4" /> {T.validateButton}</>}
                                </Button>
                              )}
                              {wordInfo.isValidByAdmin !== undefined && (
                                <Badge variant={wordInfo.isValidByAdmin ? "default" : "destructive"} className="text-xs">
                                  {wordInfo.isValidByAdmin ? T.valid : T.invalid}
                                  {wordInfo.validationReasonByAdmin && (
                                    <span className="ml-1 text-xs opacity-80">
                                      ({wordInfo.validationReasonByAdmin})
                                    </span>
                                  )}
                                </Badge>
                              )}
                              {wordInfo.isValidByAdmin !== true && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-green-600 hover:text-green-700" 
                                  onClick={() => toggleAdminWordValidation(catIndex, wordIndex, true)} 
                                  disabled={isConfirming}
                                >
                                  <CheckCircle className="mr-1 h-4 w-4"/> {T.markAsValid}
                                </Button>
                              )}
                              {wordInfo.isValidByAdmin !== false && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700" 
                                  onClick={() => toggleAdminWordValidation(catIndex, wordIndex, false)} 
                                  disabled={isConfirming}
                                >
                                  <AlertCircle className="mr-1 h-4 w-4"/> {T.markAsInvalid}
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleConfirm}
              className="w-full text-lg py-3 bg-primary hover:bg-primary/90"
              disabled={isConfirming || (playerReviewData.length === 0 && !isCurrentUserAdmin) || (adminAggregatedData.length === 0 && isCurrentUserAdmin)}
            >
              <Send className="mr-2 h-5 w-5"/>
              {isConfirming ? 
                (isCurrentUserAdmin ? T.finalizingScores : T.calculatingScore) : 
                (isCurrentUserAdmin ? T.confirmSubmissionsAdminButton : T.confirmSubmissionsPlayerButton)
              }
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PageWrapper>
  );
}

// src/app/rooms/[roomId]/play/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import { useUser } from '@/contexts/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label }
from '@/components/ui/label';
import { AlertCircle, CheckCircle, HelpCircle, Lightbulb, Send, Clock, ListChecks, Users, Gamepad2 } from 'lucide-react';
import { validateWord, ValidateWordInput } from '@/ai/flows/validate-word';
import { suggestValidWords, SuggestValidWordsInput } from '@/ai/flows/suggest-valid-words';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';


// Mock data structures, replace with actual context/state management
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

export default function GamePage() {
  const { isAuthenticated, username } = useUser();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const { toast } = useToast();

  // Mock game state
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(3);
  const [letters, setLetters] = useState("A"); // Example single letter
  const [timeLeft, setTimeLeft] = useState(60); // seconds
  const [categories, setCategories] = useState<string[]>(["Animals", "Countries", "Fruits"]);
  const [words, setWords] = useState<CategoryWord[]>(
    categories.map(cat => ({ category: cat, word: "", isLoading: false }))
  );
  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: username || "You", score: 0 },
    { id: "2", name: "Player2", score: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Handle round end
      // For now, just log it
      console.log("Round ended");
      // Potentially auto-submit or move to next phase
    }
  }, [timeLeft]);
  
  // Function to generate a single random letter
  useEffect(() => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
    setLetters(randomLetter);
  }, [currentRound]);


  const handleWordChange = (category: string, newWord: string) => {
    setWords(prevWords => 
      prevWords.map(cw => 
        cw.category === category ? { ...cw, word: newWord, isValid: undefined, validationReason: undefined } : cw
      )
    );
  };

  const handleValidateWord = async (category: string, word: string) => {
    if (!word.trim()) return;
    setWords(prevWords => prevWords.map(cw => cw.category === category ? {...cw, isLoading: true} : cw));
    try {
      const input: ValidateWordInput = { word, category, language: "English" }; // Language from room settings
      const result = await validateWord(input);
      setWords(prevWords => 
        prevWords.map(cw => 
          cw.category === category ? { ...cw, isValid: result.isValid, validationReason: result.reason, isLoading: false } : cw
        )
      );
      if (!result.isValid) {
        toast({
          variant: "destructive",
          title: `Word "${word}" invalid for ${category}`,
          description: result.reason || "AI determined this word is not valid.",
        });
      }
    } catch (error) {
      console.error("Validation error:", error);
      toast({variant: "destructive", title: "Error validating word", description: "Could not connect to AI service."});
      setWords(prevWords => prevWords.map(cw => cw.category === category ? {...cw, isLoading: false} : cw));
    }
  };

  const handleSuggestWords = async (category: string) => {
    setWords(prevWords => prevWords.map(cw => cw.category === category ? {...cw, isLoading: true} : cw));
    try {
      // The AI flow for suggestions might need adjustment if it strictly expects multiple letters.
      // For now, we pass the single letter. The prompt might need to be more generic for "given letter(s)".
      const input: SuggestValidWordsInput = { letters: letters, category, language: "English", numberOfSuggestions: 1 };
      const result = await suggestValidWords(input);
      if (result.suggestions && result.suggestions.length > 0) {
        toast({
          title: `Suggestion for ${category}`,
          description: `How about: ${result.suggestions[0]}?`,
        });
        // Optionally fill the input:
        // handleWordChange(category, result.suggestions[0]);
      } else {
        toast({title: "No suggestions found", description: `Could not find a suggestion for ${category} with the letter "${letters}".`});
      }
    } catch (error) {
      console.error("Suggestion error:", error);
      toast({variant: "destructive", title: "Error getting suggestions", description: "Could not connect to AI service."});
    } finally {
      setWords(prevWords => prevWords.map(cw => cw.category === category ? {...cw, isLoading: false} : cw));
    }
  };

  const handleSubmitAllWords = async () => {
    setIsSubmitting(true);
    // Here you would typically validate all words if not already done, calculate score, and submit to backend.
    // For now, just simulate:
    for (const cw of words) {
      if (cw.word.trim() && cw.isValid === undefined) { // Only validate if not already validated
        await handleValidateWord(cw.category, cw.word);
      }
    }
    // Simulate score calculation and moving to next round/results
    // This needs to be robust based on actual validation results.
    
    // Mock moving to results if last round
    if (currentRound === totalRounds) {
        router.push(`/rooms/${roomId}/results`);
    } else {
        // Mock moving to next round logic (could be a waiting page or state update)
        setCurrentRound(prev => prev + 1);
        setTimeLeft(60); // Reset timer
        setWords(categories.map(cat => ({ category: cat, word: "" }))); // Clear words
        toast({title: `Round ${currentRound + 1} starting!`, description: "Get ready for new letters and categories."})
    }
    setIsSubmitting(false);
  };

  if (!isAuthenticated) {
    return null; // Or loading spinner
  }

  return (
    <PageWrapper>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Game Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-3xl font-headline text-primary">Round {currentRound}/{totalRounds}</CardTitle>
                <div className="flex items-center gap-2 text-xl font-semibold text-accent">
                  <Clock size={24} />
                  <span>{Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}</span>
                </div>
              </div>
              <Progress value={(timeLeft/60)*100} className="w-full h-2 mt-2 [&>div]:bg-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6 p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-primary font-medium mb-1">Your Letter:</p>
                <p className="text-4xl font-headline font-bold tracking-widest text-primary">{letters}</p>
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
                        placeholder={`Enter a ${cw.category.toLowerCase()}`}
                        className="flex-grow"
                        disabled={cw.isLoading || isSubmitting}
                      />
                       <Button type="button" size="icon" variant="ghost" onClick={() => handleValidateWord(cw.category, cw.word)} disabled={!cw.word.trim() || cw.isLoading || isSubmitting} title="Validate Word">
                        {cw.isLoading && cw.word ? <HelpCircle className="animate-spin h-5 w-5"/> : cw.isValid === true ? <CheckCircle className="text-green-500 h-5 w-5"/> : cw.isValid === false ? <AlertCircle className="text-red-500 h-5 w-5"/> : <HelpCircle className="h-5 w-5"/>}
                      </Button>
                      <Button type="button" size="icon" variant="ghost" onClick={() => handleSuggestWords(cw.category)} disabled={cw.isLoading || isSubmitting} title="Get Suggestion">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                      </Button>
                    </div>
                    {cw.isValid === false && cw.validationReason && (
                      <p className="text-xs text-red-600 mt-1">{cw.validationReason}</p>
                    )}
                  </Card>
                ))}
                <Button type="submit" className="w-full text-lg py-3 bg-primary hover:bg-primary/90" disabled={isSubmitting || timeLeft === 0}>
                  <Send className="mr-2 h-5 w-5"/> {isSubmitting ? "Submitting..." : "Submit Words for Round"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Scoreboard & Info Area */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-primary flex items-center"><Gamepad2 className="mr-2"/>Game Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p><strong>Room ID:</strong> {roomId}</p>
              <p><strong>Your Name:</strong> {username}</p>
              {/* More info like current category theme etc. */}
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-primary flex items-center"><Users className="mr-2"/>Scoreboard</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {players.sort((a,b) => b.score - a.score).map((player, idx) => (
                  <li key={player.id} className={`flex justify-between items-center p-3 rounded-md ${player.name === username ? 'bg-accent/20' : 'bg-muted/50'}`}>
                    <span className="font-semibold">{idx + 1}. {player.name}</span>
                    <span className="text-lg font-bold text-primary">{player.score} pts</span>
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


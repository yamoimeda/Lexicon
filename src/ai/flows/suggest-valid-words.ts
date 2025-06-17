'use server';

/**
 * @fileOverview AI flow to suggest valid words for a given category and letters.
 *
 * - suggestValidWords - A function that suggests valid words based on the given input.
 * - SuggestValidWordsInput - The input type for the suggestValidWords function.
 * - SuggestValidWordsOutput - The return type for the suggestValidWords function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestValidWordsInputSchema = z.object({
  letters: z
    .string()
    .describe('The letters that the suggested words must be composed of.'),
  category: z.string().describe('The category for which the word should belong.'),
  language: z.string().describe('The language of the suggested words.'),
  numberOfSuggestions: z
    .number()
    .default(3)
    .describe('The number of word suggestions to return.'),
});
export type SuggestValidWordsInput = z.infer<typeof SuggestValidWordsInputSchema>;

const SuggestValidWordsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of valid word suggestions for the given category and letters.'),
});
export type SuggestValidWordsOutput = z.infer<typeof SuggestValidWordsOutputSchema>;

export async function suggestValidWords(input: SuggestValidWordsInput): Promise<SuggestValidWordsOutput> {
  return suggestValidWordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestValidWordsPrompt',
  input: {schema: SuggestValidWordsInputSchema},
  output: {schema: SuggestValidWordsOutputSchema},
  prompt: `You are a word game expert. Given the following letters, category, and language, suggest {{numberOfSuggestions}} valid words.

Letters: {{{letters}}}
Category: {{{category}}}
Language: {{{language}}}

Return the suggestions as an array of strings.
`,
});

const suggestValidWordsFlow = ai.defineFlow(
  {
    name: 'suggestValidWordsFlow',
    inputSchema: SuggestValidWordsInputSchema,
    outputSchema: SuggestValidWordsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

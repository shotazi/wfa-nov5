import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = 'https://siadmiaedvscibnfxrmm.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYWRtaWFlZHZzY2libmZ4cm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgzMjk1OTEsImV4cCI6MjA0MzkwNTU5MX0.7zfz4FPXe01lnXaQaM4iNx7g_LcTTTqpPAu9hQShmuI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const API_KEY = 'AIzaSyBd562lnDOg-xQAWwQwS3AGWQidAQY_Xe0';
const genAI = new GoogleGenerativeAI(API_KEY);

export async function generateDefinition(
  word: string,
  context: string,
  examples: string[]
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-002' });

  const prompt = `
    Word: "${word}"
    Context: "${context}"
    Real examples from text: ${examples[0]}

    Please provide a comprehensive flashcard definition in Georgian language with the following structure:

    <div class="flashcard-content">
      <div class="word">
        <h2>${word} <span>[IPA transcription]</span></h2>
      </div>
      
      <div class="definition">
        <h3>განმარტება:</h3>
        <p>[Georgian definition]</p>
      </div>
      
      <div class="context">
        <h3>კონტექსტი:</h3>
        <p>[How the word is used in the given context]</p>
      </div>
    </div>
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  const html = extractHTML(text);
  console.log('text from gemini', text, html);

  return html;
}

function extractHTML(geminiResponse) {
  const match = geminiResponse.match(/```html(.*?)```/s); // 's' flag for dotAll
  if (match) {
    return match[1].trim();
  } else {
    return geminiResponse;
  }
}

export async function createDeck(name: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('decks')
    .insert({ name })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating deck:', error);
    return null;
  }

  return data.id;
}

export async function deleteDeck(deckId: string): Promise<void> {
  const { error: flashcardsError } = await supabase
    .from('flashcards')
    .delete()
    .eq('deck_id', deckId);

  if (flashcardsError) {
    console.error('Error deleting flashcards:', flashcardsError);
    return;
  }

  const { error: deckError } = await supabase
    .from('decks')
    .delete()
    .eq('id', deckId);

  if (deckError) {
    console.error('Error deleting deck:', deckError);
  }
}

export async function saveFlashcard(
  deckId: string,
  front: string,
  back: string,
  examples: string[]
): Promise<void> {
  const { error } = await supabase.from('flashcards').insert({
    deck_id: deckId,
    front,
    back,
    examples: examples,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Error saving flashcard:', error);
  }
}

export async function getDeckHistory(): Promise<any[]> {
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching deck history:', error);
    return [];
  }

  return data;
}

export async function getFlashcardsForDeck(deckId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('deck_id', deckId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching flashcards:', error);
    return [];
  }

  console.log('data: ', data);
  return data;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StudyMaterialType = 'audio' | 'document' | 'youtube' | 'text';

export interface KeyTakeaway {
  topic: string;
  detail: string;
}

export interface LazyBagItem {
  question: string;
  answer: string;
}

export interface Flashcard {
  term: string;
  definition: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number; // 0-indexed
  explanation: string;
}

export interface StudyProcessResult {
  title: string;
  summary: string;
  keyTakeaways: KeyTakeaway[];
  lazyBag: LazyBagItem[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

import type { Question } from "@shared/schema";

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function selectRandomQuestions(
  questions: Question[], 
  count: number
): Question[] {
  const shuffled = shuffleArray(questions);
  return shuffled.slice(0, count);
}

export function calculateScore(
  questions: Question[],
  answers: Record<string, string>
): number {
  let correct = 0;
  
  questions.forEach(question => {
    const userAnswer = answers[question.id];
    if (userAnswer === question.correctAnswer) {
      correct++;
    }
  });
  
  return Math.round((correct / questions.length) * 100);
}

export function calculateChapterPerformance(
  questions: Question[],
  answers: Record<string, string>
): Record<string, { correct: number; total: number }> {
  const performance: Record<string, { correct: number; total: number }> = {};
  
  questions.forEach(question => {
    const chapter = question.chapter;
    const userAnswer = answers[question.id];
    const isCorrect = userAnswer === question.correctAnswer;
    
    if (!performance[chapter]) {
      performance[chapter] = { correct: 0, total: 0 };
    }
    
    performance[chapter].total++;
    if (isCorrect) {
      performance[chapter].correct++;
    }
  });
  
  return performance;
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function validateQuestionFormat(question: any): boolean {
  return (
    typeof question.year === 'number' &&
    typeof question.statement === 'string' &&
    Array.isArray(question.options) &&
    question.options.length >= 4 &&
    question.options.length <= 5 &&
    typeof question.correctAnswer === 'string' &&
    question.correctAnswer.length === 1 &&
    /^[A-E]$/.test(question.correctAnswer) &&
    typeof question.chapter === 'string' &&
    typeof question.bookSection === 'string'
  );
}

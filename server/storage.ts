import { type Question, type InsertQuestion, type Quiz, type InsertQuiz, type QuizResult, type InsertQuizResult } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Question methods
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestion(id: string): Promise<Question | undefined>;
  getAllQuestions(): Promise<Question[]>;
  getQuestionsByFilters(chapters: string[], years: number[]): Promise<Question[]>;
  getQuestionsCount(): Promise<number>;
  getChapters(): Promise<string[]>;
  getYears(): Promise<number[]>;
  importQuestions(questions: InsertQuestion[]): Promise<void>;
  
  // Quiz methods
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  
  // Quiz result methods
  createQuizResult(result: InsertQuizResult): Promise<QuizResult>;
  getQuizResult(id: string): Promise<QuizResult | undefined>;
  getRecentQuizResults(limit?: number): Promise<QuizResult[]>;
}

export class MemStorage implements IStorage {
  private questions: Map<string, Question>;
  private quizzes: Map<string, Quiz>;
  private quizResults: Map<string, QuizResult>;

  constructor() {
    this.questions = new Map();
    this.quizzes = new Map();
    this.quizResults = new Map();
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = { ...insertQuestion, id } as Question;
    this.questions.set(id, question);
    return question;
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async getAllQuestions(): Promise<Question[]> {
    return Array.from(this.questions.values());
  }

  async getQuestionsByFilters(chapters: string[], years: number[]): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(
      (question) => 
        chapters.includes(question.chapter) && years.includes(question.year)
    );
  }

  async getQuestionsCount(): Promise<number> {
    return this.questions.size;
  }

  async getChapters(): Promise<string[]> {
    const chapters = Array.from(this.questions.values()).map(q => q.chapter);
    return Array.from(new Set(chapters));
  }

  async getYears(): Promise<number[]> {
    const years = Array.from(this.questions.values()).map(q => q.year);
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }

  async importQuestions(questions: InsertQuestion[]): Promise<void> {
    for (const question of questions) {
      await this.createQuestion(question);
    }
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = randomUUID();
    const quiz: Quiz = { 
      ...insertQuiz, 
      id,
      createdAt: new Date().toISOString()
    } as Quiz;
    this.quizzes.set(id, quiz);
    return quiz;
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async createQuizResult(insertResult: InsertQuizResult): Promise<QuizResult> {
    const id = randomUUID();
    const result: QuizResult = { 
      ...insertResult, 
      id,
      completedAt: new Date().toISOString()
    };
    this.quizResults.set(id, result);
    return result;
  }

  async getQuizResult(id: string): Promise<QuizResult | undefined> {
    return this.quizResults.get(id);
  }

  async getRecentQuizResults(limit: number = 10): Promise<QuizResult[]> {
    return Array.from(this.quizResults.values())
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();

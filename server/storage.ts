import { type Question, type InsertQuestion, type Quiz, type InsertQuiz, type QuizResult, type InsertQuizResult, type User, type InsertUser, type Disagreement, type InsertDisagreement, type BookPartWithChapters, questions, quizzes, quizResults, users, disagreements, BOOK_PARTS } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, inArray, desc, and, count } from "drizzle-orm";

export interface IStorage {
  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getUserBySessionId(sessionId: string): Promise<User | undefined>;
  updateUserActivity(id: string): Promise<void>;
  
  // Question methods
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestion(id: string): Promise<Question | undefined>;
  getAllQuestions(): Promise<Question[]>;
  getQuestionsByFilters(chapters: string[], years: number[]): Promise<Question[]>;
  getQuestionsCount(): Promise<number>;
  getChapters(): Promise<string[]>;
  getYears(): Promise<number[]>;
  getBookParts(): Promise<BookPartWithChapters[]>;
  importQuestions(questions: InsertQuestion[]): Promise<void>;
  clearAllQuestions(): Promise<void>;
  
  // Quiz methods
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  updateQuizEndTime(id: string, endTime: string): Promise<void>;
  
  // Quiz result methods
  createQuizResult(result: InsertQuizResult): Promise<QuizResult>;
  getQuizResult(id: string): Promise<QuizResult | undefined>;
  getQuizResultByQuizId(quizId: string): Promise<QuizResult | undefined>;
  getRecentQuizResults(limit?: number): Promise<QuizResult[]>;
  getUserQuizResults(userId: string, limit?: number): Promise<QuizResult[]>;
  
  // Disagreement methods
  createDisagreement(disagreement: InsertDisagreement): Promise<Disagreement>;
  getDisagreement(id: string): Promise<Disagreement | undefined>;
  getDisagreementsByQuestion(questionId: string): Promise<Disagreement[]>;
  getDisagreementsByStatus(status: string): Promise<Disagreement[]>;
  updateDisagreementStatus(id: string, status: string, adminNotes?: string): Promise<void>;
  getAllDisagreements(): Promise<Disagreement[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserBySessionId(sessionId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.sessionId, sessionId));
    return user || undefined;
  }

  async updateUserActivity(id: string): Promise<void> {
    await db.update(users)
      .set({ lastActiveAt: new Date().toISOString() })
      .where(eq(users.id, id));
  }

  async getUserQuizResults(userId: string, limit: number = 10): Promise<QuizResult[]> {
    return await db.select().from(quizResults)
      .where(eq(quizResults.userId, userId))
      .orderBy(desc(quizResults.completedAt))
      .limit(limit);
  }

  // Question methods
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values({
        ...insertQuestion,
        options: insertQuestion.options as string[]
      })
      .returning();
    return question;
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question || undefined;
  }

  async getAllQuestions(): Promise<Question[]> {
    return await db.select().from(questions);
  }

  async getQuestionsByFilters(chapters: string[], years: number[]): Promise<Question[]> {
    return await db.select().from(questions)
      .where(
        and(
          inArray(questions.chapter, chapters),
          inArray(questions.year, years)
        )
      );
  }

  async getQuestionsCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(questions);
    return result.count;
  }

  async getChapters(): Promise<string[]> {
    const result = await db.selectDistinct({ chapter: questions.chapter }).from(questions);
    return result.map(r => r.chapter);
  }

  async getYears(): Promise<number[]> {
    const result = await db.selectDistinct({ year: questions.year }).from(questions).orderBy(desc(questions.year));
    return result.map(r => r.year);
  }

  async getBookParts(): Promise<BookPartWithChapters[]> {
    const result = await db.selectDistinct({
      bookSection: questions.bookSection,
      chapter: questions.chapter
    }).from(questions);
    
    // Group chapters by book section
    const partMap = new Map<string, string[]>();
    
    result.forEach(({ bookSection, chapter }) => {
      const sectionId = bookSection.toString();
      if (!partMap.has(sectionId)) {
        partMap.set(sectionId, []);
      }
      partMap.get(sectionId)!.push(chapter);
    });
    
    // Convert to BookPartWithChapters array
    const bookParts: BookPartWithChapters[] = [];
    
    partMap.forEach((chapters, sectionId) => {
      const partName = BOOK_PARTS[sectionId] || `PARTE ${sectionId}: Não especificado`;
      bookParts.push({
        id: sectionId,
        name: partName,
        chapters: chapters.sort()
      });
    });
    
    // Sort by part number
    return bookParts.sort((a, b) => {
      const numA = parseInt(a.id) || 999;
      const numB = parseInt(b.id) || 999;
      return numA - numB;
    });
  }

  async importQuestions(insertQuestions: InsertQuestion[]): Promise<void> {
    if (insertQuestions.length > 0) {
      const formattedQuestions = insertQuestions.map(q => ({
        ...q,
        options: q.options as string[]
      }));
      await db.insert(questions).values(formattedQuestions);
    }
  }

  async clearAllQuestions(): Promise<void> {
    await db.delete(questions);
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const [quiz] = await db
      .insert(quizzes)
      .values({
        ...insertQuiz,
        selectedChapters: insertQuiz.selectedChapters as string[],
        selectedYears: insertQuiz.selectedYears as number[],
        questionIds: insertQuiz.questionIds as string[]
      })
      .returning();
    return quiz;
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz || undefined;
  }

  async updateQuizEndTime(id: string, endTime: string): Promise<void> {
    await db.update(quizzes)
      .set({ endTime })
      .where(eq(quizzes.id, id));
  }

  async createQuizResult(insertResult: InsertQuizResult): Promise<QuizResult> {
    const [result] = await db
      .insert(quizResults)
      .values(insertResult)
      .returning();
    return result;
  }

  async getQuizResult(id: string): Promise<QuizResult | undefined> {
    const [result] = await db.select().from(quizResults).where(eq(quizResults.id, id));
    return result || undefined;
  }

  async getQuizResultByQuizId(quizId: string): Promise<QuizResult | undefined> {
    const [result] = await db.select().from(quizResults).where(eq(quizResults.quizId, quizId));
    return result || undefined;
  }

  async getRecentQuizResults(limit: number = 10): Promise<QuizResult[]> {
    return await db.select().from(quizResults)
      .orderBy(desc(quizResults.completedAt))
      .limit(limit);
  }

  // Disagreement methods
  async createDisagreement(insertDisagreement: InsertDisagreement): Promise<Disagreement> {
    const [disagreement] = await db
      .insert(disagreements)
      .values(insertDisagreement)
      .returning();
    return disagreement;
  }

  async getDisagreement(id: string): Promise<Disagreement | undefined> {
    const [disagreement] = await db.select().from(disagreements).where(eq(disagreements.id, id));
    return disagreement || undefined;
  }

  async getDisagreementsByQuestion(questionId: string): Promise<Disagreement[]> {
    return await db.select().from(disagreements)
      .where(eq(disagreements.questionId, questionId))
      .orderBy(desc(disagreements.createdAt));
  }

  async getDisagreementsByStatus(status: string): Promise<Disagreement[]> {
    return await db.select().from(disagreements)
      .where(eq(disagreements.status, status))
      .orderBy(desc(disagreements.createdAt));
  }

  async updateDisagreementStatus(id: string, status: string, adminNotes?: string): Promise<void> {
    const updateData: any = { 
      status,
      reviewedAt: new Date().toISOString()
    };
    
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    await db.update(disagreements)
      .set(updateData)
      .where(eq(disagreements.id, id));
  }

  async getAllDisagreements(): Promise<Disagreement[]> {
    return await db.select().from(disagreements)
      .orderBy(desc(disagreements.createdAt));
  }
}

export const storage = new DatabaseStorage();
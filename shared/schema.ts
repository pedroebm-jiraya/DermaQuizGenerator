import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table for session tracking
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().unique(), // Browser session ID
  name: varchar("name", { length: 100 }),
  createdAt: text("created_at").notNull().default(sql`now()`),
  lastActiveAt: text("last_active_at").notNull().default(sql`now()`),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull(),
  statement: text("statement").notNull(),
  options: jsonb("options").notNull().$type<string[]>(),
  correctAnswer: varchar("correct_answer", { length: 1 }).notNull(),
  chapter: text("chapter").notNull(),
  bookSection: text("book_section").notNull(),
});

export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  questionCount: integer("question_count").notNull(),
  selectedChapters: jsonb("selected_chapters").notNull().$type<string[]>(),
  selectedYears: jsonb("selected_years").notNull().$type<number[]>(),
  timedMode: boolean("timed_mode").notNull().default(true),
  questionIds: jsonb("question_ids").notNull().$type<string[]>(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const quizResults = pgTable("quiz_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id),
  userId: varchar("user_id").references(() => users.id),
  answers: jsonb("answers").notNull().$type<Record<string, string>>(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  timeSpent: integer("time_spent").notNull(), // in seconds
  chapterPerformance: jsonb("chapter_performance").notNull().$type<Record<string, { correct: number; total: number }>>(),
  completedAt: text("completed_at").notNull().default(sql`now()`),
});

export const disagreements = pgTable("disagreements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => questions.id),
  quizResultId: varchar("quiz_result_id").notNull().references(() => quizResults.id),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(), // 'statement', 'option', 'answer'
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending', 'reviewed', 'resolved'
  adminNotes: text("admin_notes"),
  createdAt: text("created_at").notNull().default(sql`now()`),
  reviewedAt: text("reviewed_at"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  quizzes: many(quizzes),
  quizResults: many(quizResults),
  disagreements: many(disagreements),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  user: one(users, { fields: [quizzes.userId], references: [users.id] }),
  results: many(quizResults),
}));

export const quizResultsRelations = relations(quizResults, ({ one, many }) => ({
  quiz: one(quizzes, { fields: [quizResults.quizId], references: [quizzes.id] }),
  user: one(users, { fields: [quizResults.userId], references: [users.id] }),
  disagreements: many(disagreements),
}));

export const questionsRelations = relations(questions, ({ many }) => ({
  disagreements: many(disagreements),
}));

export const disagreementsRelations = relations(disagreements, ({ one }) => ({
  question: one(questions, { fields: [disagreements.questionId], references: [questions.id] }),
  quizResult: one(quizResults, { fields: [disagreements.quizResultId], references: [quizResults.id] }),
  user: one(users, { fields: [disagreements.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastActiveAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export const insertQuizResultSchema = createInsertSchema(quizResults).omit({
  id: true,
  completedAt: true,
});

export const insertDisagreementSchema = createInsertSchema(disagreements).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
});

export const quizSetupSchema = z.object({
  questionCount: z.number().min(1).max(80),
  selectedChapters: z.array(z.string()).min(1),
  selectedYears: z.array(z.number()).min(1),
  timedMode: z.boolean(),
});

export const quizAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.string().min(1).max(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type QuizResult = typeof quizResults.$inferSelect;
export type InsertDisagreement = z.infer<typeof insertDisagreementSchema>;
export type Disagreement = typeof disagreements.$inferSelect;
export type QuizSetup = z.infer<typeof quizSetupSchema>;
export type QuizAnswer = z.infer<typeof quizAnswerSchema>;

// Book parts mapping
export const BOOK_PARTS: Record<string, string> = {
  "1": "PARTE 1: FUNDAMENTOS DA DERMATOLOGIA",
  "2": "PARTE 2: AFECÇÕES INFLAMATÓRIAS", 
  "3": "PARTE 3: AFECÇÕES RELACIONADAS AO CICLO VITAL",
  "4": "PARTE 4: AFECÇÕES DOS ANEXOS CUTÂNEOS E DAS MUCOSAS",
  "5": "PARTE 5: AFECÇÕES INFECCIOSAS E INFESTAÇÕES",
  "6": "PARTE 6: AFECÇÕES DETERMINADAS OU AGRAVADAS PELA INTERAÇÃO COM O AMBIENTE",
  "7": "PARTE 7: AFECÇÕES METABÓLICAS E NUTRICIONAIS",
  "8": "PARTE 8: AFECÇÕES HEREDITÁRIAS – GENODERMATOSES",
  "9": "PARTE 9: AFECÇÕES TEGUMENTARES E INTERDISCIPLINARES",
  "10": "PARTE 10: AFECÇÕES HAMARTOMATOSAS E NEOPLÁSICAS",
  "11": "PARTE 11: CIRURGIA DERMATOLÓGICA E PROCEDIMENTOS TERAPÊUTICOS OU CORRETIVOS DA PELE",
  "12": "PARTE 12: TERAPÊUTICA MEDICAMENTOSA NA DERMATOLOGIA",
  "13": "PARTE 13: PESQUISA EM DERMATOLOGIA"
};

export interface BookPartWithChapters {
  id: string;
  name: string;
  chapters: string[];
}

// API response types
export interface QuestionStats {
  totalQuestions: number;
  chapters: string[];
  years: number[];
  bookParts: BookPartWithChapters[];
}

export interface QuizWithQuestions {
  quiz: Quiz;
  questions: Question[];
}

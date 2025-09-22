import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  questionCount: integer("question_count").notNull(),
  selectedChapters: jsonb("selected_chapters").notNull().$type<string[]>(),
  selectedYears: jsonb("selected_years").notNull().$type<number[]>(),
  timedMode: boolean("timed_mode").notNull().default(true),
  questionIds: jsonb("question_ids").notNull().$type<string[]>(),
  createdAt: text("created_at").notNull().default(sql`datetime('now')`),
});

export const quizResults = pgTable("quiz_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id),
  answers: jsonb("answers").notNull().$type<Record<string, string>>(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  timeSpent: integer("time_spent").notNull(), // in seconds
  chapterPerformance: jsonb("chapter_performance").notNull().$type<Record<string, { correct: number; total: number }>>(),
  completedAt: text("completed_at").notNull().default(sql`datetime('now')`),
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

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type QuizResult = typeof quizResults.$inferSelect;
export type QuizSetup = z.infer<typeof quizSetupSchema>;
export type QuizAnswer = z.infer<typeof quizAnswerSchema>;

// API response types
export interface QuestionStats {
  totalQuestions: number;
  chapters: string[];
  years: number[];
}

export interface QuizWithQuestions {
  quiz: Quiz;
  questions: Question[];
}

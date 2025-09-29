import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuestionSchema, quizSetupSchema, insertQuizResultSchema, type InsertQuestion, type QuestionStats, type QuizWithQuestions, type User } from "@shared/schema";
import { randomUUID } from "crypto";

// Admin authentication middleware
const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  const adminUsername = process.env.ADMIN_USERNAME || "dermatoufs";
  const adminPassword = process.env.ADMIN_PASSWORD || "Fedr0p0rtugal";

  if (username === adminUsername && password === adminPassword) {
    next();
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
};

// User session middleware - only for API routes
const sessionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.headers['x-session-id'] as string;
  
  if (!sessionId) {
    // No session header - proceed without user
    (req as any).user = null;
    (req as any).sessionId = null;
    next();
    return;
  }
  
  try {
    let user = await storage.getUserBySessionId(sessionId);
    
    if (!user) {
      try {
        // Create new user for this session
        user = await storage.createUser({
          sessionId,
          name: null,
        });
        console.log('Created new user:', user.id, 'for session:', sessionId);
      } catch (createError: any) {
        // Handle race condition - another request may have created the user
        if (createError?.code === '23505') { // Unique constraint violation
          user = await storage.getUserBySessionId(sessionId);
          console.log('User already exists, fetched:', user?.id, 'for session:', sessionId);
        } else {
          throw createError;
        }
      }
    } else {
      // Update last activity
      await storage.updateUserActivity(user.id);
      console.log('Updated activity for user:', user.id, 'session:', sessionId);
    }
    
    // Attach user to request
    (req as any).user = user;
    (req as any).sessionId = sessionId;
  } catch (error) {
    console.error('User session middleware error:', error);
    (req as any).user = null;
    (req as any).sessionId = sessionId;
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Apply session middleware only to API routes
  app.use('/api', sessionMiddleware);
  
  // Get all questions with optional filters
  app.get("/api/questions", async (req, res) => {
    try {
      const { chapters, years } = req.query;
      
      if (chapters || years) {
        const chapterArray = chapters ? (chapters as string).split(',') : [];
        const yearArray = years ? (years as string).split(',').map(Number) : [];
        
        const filteredQuestions = await storage.getQuestionsByFilters(chapterArray, yearArray);
        res.json(filteredQuestions);
      } else {
        const allQuestions = await storage.getAllQuestions();
        res.json(allQuestions);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Get question statistics
  app.get("/api/questions/stats", async (req, res) => {
    try {
      const totalQuestions = await storage.getQuestionsCount();
      const chapters = await storage.getChapters();
      const years = await storage.getYears();
      const bookParts = await storage.getBookParts();
      
      res.json({
        totalQuestions,
        chapters,
        years,
        bookParts
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch question statistics" });
    }
  });


  // Create a new quiz
  app.post("/api/quiz", async (req, res) => {
    try {
      const setupData = quizSetupSchema.parse(req.body);
      const user = (req as any).user as User;
      
      // Get questions based on filters
      const filteredQuestions = await storage.getQuestionsByFilters(
        setupData.selectedChapters, 
        setupData.selectedYears
      );

      if (filteredQuestions.length === 0) {
        return res.status(400).json({ 
          message: `Nenhuma questão encontrada para os filtros selecionados` 
        });
      }

      // Check if we have fewer questions than requested
      if (filteredQuestions.length < setupData.questionCount) {
        return res.status(200).json({
          requiresConfirmation: true,
          availableQuestions: filteredQuestions.length,
          requestedQuestions: setupData.questionCount,
          message: `Encontradas ${filteredQuestions.length} questões com os filtros selecionados. Deseja prosseguir com ${filteredQuestions.length} questões?`
        });
      }

      // Normal case: we have enough questions
      const actualQuestionCount = setupData.questionCount;

      // Randomly select questions
      const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, actualQuestionCount);

      const quiz = await storage.createQuiz({
        userId: user?.id,
        questionCount: actualQuestionCount,
        selectedChapters: setupData.selectedChapters,
        selectedYears: setupData.selectedYears,
        timedMode: setupData.timedMode,
        questionIds: selectedQuestions.map(q => q.id),
        startTime: new Date().toISOString()
      });

      res.json(quiz);
    } catch (error) {
      res.status(400).json({ message: "Failed to create quiz" });
    }
  });

  // Confirm quiz creation with fewer questions
  app.post("/api/quiz/confirm", async (req, res) => {
    try {
      const setupData = quizSetupSchema.parse(req.body);
      const user = (req as any).user as User;
      
      // Get questions based on filters
      const filteredQuestions = await storage.getQuestionsByFilters(
        setupData.selectedChapters, 
        setupData.selectedYears
      );

      if (filteredQuestions.length === 0) {
        return res.status(400).json({ 
          message: `Nenhuma questão encontrada para os filtros selecionados` 
        });
      }

      // Use available questions but don't exceed originally requested count
      const actualQuestionCount = Math.min(filteredQuestions.length, setupData.questionCount);

      // Randomly select questions
      const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, actualQuestionCount);

      const quiz = await storage.createQuiz({
        userId: user?.id,
        questionCount: actualQuestionCount,
        selectedChapters: setupData.selectedChapters,
        selectedYears: setupData.selectedYears,
        timedMode: setupData.timedMode,
        questionIds: selectedQuestions.map(q => q.id),
        startTime: new Date().toISOString()
      });

      res.json(quiz);
    } catch (error) {
      res.status(400).json({ message: "Failed to create quiz" });
    }
  });

  // Get quiz details with questions
  app.get("/api/quiz/:id", async (req, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const questions = [];
      for (const questionId of quiz.questionIds) {
        const question = await storage.getQuestion(questionId);
        if (question) {
          questions.push(question);
        }
      }

      res.json({ quiz, questions });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  // Submit quiz results
  app.post("/api/quiz/:id/results", async (req, res) => {
    try {
      const { answers, timeSpent } = req.body;
      const user = (req as any).user as User;
      const sessionId = (req as any).sessionId as string;
      const quiz = await storage.getQuiz(req.params.id);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Update quiz with end time
      await storage.updateQuizEndTime(quiz.id, new Date().toISOString());

      // Calculate score and chapter performance
      let correctAnswers = 0;
      const chapterPerformance: Record<string, { correct: number; total: number }> = {};

      for (const questionId of quiz.questionIds) {
        const question = await storage.getQuestion(questionId);
        if (question) {
          const userAnswer = answers[questionId];
          const isCorrect = userAnswer === question.correctAnswer;
          
          if (isCorrect) correctAnswers++;

          if (!chapterPerformance[question.chapter]) {
            chapterPerformance[question.chapter] = { correct: 0, total: 0 };
          }
          
          chapterPerformance[question.chapter].total++;
          if (isCorrect) {
            chapterPerformance[question.chapter].correct++;
          }
        }
      }

      const result = await storage.createQuizResult({
        quizId: quiz.id,
        userId: user?.id,
        answers,
        score: Math.round((correctAnswers / quiz.questionCount) * 100),
        totalQuestions: quiz.questionCount,
        timeSpent,
        chapterPerformance
      });

      console.log('Created quiz result:', result.id, 'for user:', user?.id, 'session:', sessionId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit quiz results" });
    }
  });

  // Get recent quiz results
  app.get("/api/results", async (req, res) => {
    try {
      const results = await storage.getRecentQuizResults(10);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });

  // Get quiz results (alternative endpoint)
  app.get("/api/quiz_results", async (req, res) => {
    try {
      const results = await storage.getRecentQuizResults(10);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz results" });
    }
  });

  // Get latest quiz results
  app.get("/api/quiz_results/latest", async (req, res) => {
    try {
      const results = await storage.getRecentQuizResults(5);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch latest quiz results" });
    }
  });

  // Get user-specific quiz results
  app.get("/api/user/results", async (req, res) => {
    try {
      const user = (req as any).user as User;
      const sessionId = (req as any).sessionId as string;
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const limit = parseInt(req.query.limit as string) || 10;
      const results = await storage.getUserQuizResults(user.id, limit);
      console.log('Fetching user results for user:', user.id, 'session:', sessionId, 'found:', results.length, 'results');
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user quiz results" });
    }
  });

  // Get user analytics data
  app.get("/api/user/analytics", async (req, res) => {
    try {
      const user = (req as any).user as User;
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const results = await storage.getUserQuizResults(user.id, 100); // Get more results for analytics
      
      // Calculate performance trends (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentResults = results.filter(result => 
        new Date(result.completedAt) >= thirtyDaysAgo
      );
      
      // Performance over time
      const performanceTrend = recentResults
        .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
        .map(result => ({
          date: result.completedAt,
          score: result.score,
          timeSpent: result.timeSpent
        }));
      
      // Chapter performance aggregation
      const chapterStats: Record<string, { total: number; correct: number; attempts: number }> = {};
      
      results.forEach(result => {
        Object.entries(result.chapterPerformance).forEach(([chapter, performance]) => {
          if (!chapterStats[chapter]) {
            chapterStats[chapter] = { total: 0, correct: 0, attempts: 0 };
          }
          chapterStats[chapter].total += performance.total;
          chapterStats[chapter].correct += performance.correct;
          chapterStats[chapter].attempts += 1;
        });
      });
      
      const chapterAnalytics = Object.entries(chapterStats).map(([chapter, stats]) => ({
        chapter,
        averageScore: Math.round((stats.correct / stats.total) * 100),
        totalQuestions: stats.total,
        correctAnswers: stats.correct,
        attempts: stats.attempts
      }));
      
      // Overall statistics
      const totalQuizzes = results.length;
      const averageScore = totalQuizzes > 0 
        ? Math.round(results.reduce((sum, result) => sum + result.score, 0) / totalQuizzes)
        : 0;
      const totalTimeSpent = results.reduce((sum, result) => sum + result.timeSpent, 0);
      const totalQuestions = results.reduce((sum, result) => sum + result.totalQuestions, 0);
      
      // Best and worst performing chapters
      const sortedChapters = chapterAnalytics.sort((a, b) => b.averageScore - a.averageScore);
      const bestChapter = sortedChapters[0];
      const worstChapter = sortedChapters[sortedChapters.length - 1];
      
      res.json({
        overview: {
          totalQuizzes,
          averageScore,
          totalTimeSpent,
          totalQuestions,
          bestChapter,
          worstChapter
        },
        performanceTrend,
        chapterAnalytics,
        recentActivity: recentResults.slice(0, 5)
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ message: "Failed to fetch user analytics" });
    }
  });

  // Get user session info - creates session if none exists
  app.get("/api/user/session", async (req, res) => {
    try {
      let user = (req as any).user as User;
      let sessionId = (req as any).sessionId as string;
      
      // If no session exists, create one
      if (!user && !sessionId) {
        sessionId = randomUUID();
        
        try {
          user = await storage.createUser({
            sessionId,
            name: null,
          });
          console.log('Created new user for session endpoint:', user.id, 'for session:', sessionId);
        } catch (createError: any) {
          // Handle race condition
          if (createError?.code === '23505') {
            const existingUser = await storage.getUserBySessionId(sessionId);
            if (existingUser) {
              user = existingUser;
              console.log('User already exists for session endpoint, fetched:', user.id, 'for session:', sessionId);
            } else {
              throw new Error('Failed to create or fetch user');
            }
          } else {
            throw createError;
          }
        }
      }
      
      res.json({
        user: user || null,
        sessionId
      });
    } catch (error) {
      console.error('Session endpoint error:', error);
      res.status(500).json({ message: "Failed to fetch session info" });
    }
  });

  // Development endpoint to add sample questions for testing
  if (process.env.NODE_ENV === 'development') {
    app.post("/api/questions/sample", async (req, res) => {
      try {
        const sampleQuestions: InsertQuestion[] = [
          {
            year: 2023,
            statement: "Qual é o principal tratamento para dermatite atópica leve a moderada?",
            options: ["Corticosteroides tópicos", "Antibióticos sistêmicos", "Antifúngicos tópicos", "Imunomoduladores orais"],
            correctAnswer: "A",
            chapter: "Dermatoses Inflamatórias",
            bookSection: "Eczemas"
          },
          {
            year: 2023,
            statement: "O melanoma maligno tem como principal característica:",
            options: ["Crescimento lento", "Coloração uniforme", "Assimetria e irregularidade", "Superfície lisa"],
            correctAnswer: "C",
            chapter: "Neoplasias Cutâneas",
            bookSection: "Tumores Malignos"
          },
          {
            year: 2022,
            statement: "A candidíase cutânea é causada por:",
            options: ["Vírus", "Bactéria", "Fungo", "Parasita"],
            correctAnswer: "C",
            chapter: "Doenças Infecciosas",
            bookSection: "Micoses Superficiais"
          },
          {
            year: 2022,
            statement: "O vitiligo é caracterizado por:",
            options: ["Hiperpigmentação localizada", "Despigmentação em placas", "Descamação intensa", "Formação de vesículas"],
            correctAnswer: "B",
            chapter: "Distúrbios da Pigmentação",
            bookSection: "Hipopigmentação"
          },
          {
            year: 2024,
            statement: "A psoríase em placas apresenta:",
            options: ["Vesículas agrupadas", "Placas eritematosas descamativas", "Nódulos subcutâneos", "Úlceras profundas"],
            correctAnswer: "B",
            chapter: "Dermatoses Inflamatórias",
            bookSection: "Psoríase"
          }
        ];

        await storage.importQuestions(sampleQuestions);
        res.json({ message: "Sample questions added", count: sampleQuestions.length });
      } catch (error) {
        res.status(500).json({ message: "Failed to add sample questions" });
      }
    });
  }

  // Get quiz review data (questions with correct answers and user answers)
  app.get("/api/quiz/:id/review", async (req, res) => {
    try {
      // First, try to get quiz result by the ID directly (in case it's a quiz result ID)
      let quizResult = await storage.getQuizResult(req.params.id);
      let quiz = null;

      if (quizResult) {
        // If we found a quiz result, get the associated quiz
        quiz = await storage.getQuiz(quizResult.quizId);
      } else {
        // If not found, try to treat the ID as a quiz ID
        quiz = await storage.getQuiz(req.params.id);
        if (quiz) {
          quizResult = await storage.getQuizResultByQuizId(req.params.id);
        }
      }

      if (!quizResult || !quiz) {
        return res.status(404).json({ message: "Quiz result or quiz not found" });
      }

      // Get questions for this quiz
      const reviewQuestions = [];
      for (const questionId of quiz.questionIds) {
        const question = await storage.getQuestion(questionId);
        if (question) {
          reviewQuestions.push({
            ...question,
            userAnswer: quizResult.answers[questionId] || null,
            isCorrect: quizResult.answers[questionId] === question.correctAnswer
          });
        }
      }

      // Calculate elapsed time if both start and end times are available
      let elapsedTime = null;
      if (quiz.startTime && quiz.endTime) {
        const startTime = new Date(quiz.startTime).getTime();
        const endTime = new Date(quiz.endTime).getTime();
        elapsedTime = Math.round((endTime - startTime) / 1000); // in seconds
      }

      res.json({
        quiz,
        quizResult,
        questions: reviewQuestions,
        elapsedTime
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz review data" });
    }
  });

  // Get quiz result with elapsed time
  app.get("/api/quiz/:id/result", async (req, res) => {
    try {
      const quizResult = await storage.getQuizResult(req.params.id);
      if (!quizResult) {
        return res.status(404).json({ message: "Quiz result not found" });
      }

      // Get the associated quiz to calculate elapsed time
      const quiz = await storage.getQuiz(quizResult.quizId);
      let elapsedTime = null;
      
      if (quiz && quiz.startTime && quiz.endTime) {
        const startTime = new Date(quiz.startTime).getTime();
        const endTime = new Date(quiz.endTime).getTime();
        elapsedTime = Math.round((endTime - startTime) / 1000); // in seconds
      }

      res.json({
        ...quizResult,
        elapsedTime
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz result" });
    }
  });

  // Create disagreement for a specific question
  app.post("/api/disagreements", async (req, res) => {
    try {
      const { questionId, quizResultId, type, description } = req.body;
      const user = (req as any).user as User;
      const sessionId = (req as any).sessionId as string;

      if (!questionId || !quizResultId || !type || !description) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const disagreement = await storage.createDisagreement({
        questionId,
        quizResultId,
        userId: user?.id || null,
        type,
        description,
        status: "pending"
      });

      res.status(201).json(disagreement);
    } catch (error) {
      res.status(500).json({ message: "Failed to create disagreement" });
    }
  });

  // Get disagreements for admin panel
  app.get("/api/admin/disagreements", adminAuth, async (req, res) => {
    try {
      const { status } = req.query;
      
      let disagreements;
      if (status && typeof status === 'string') {
        disagreements = await storage.getDisagreementsByStatus(status);
      } else {
        disagreements = await storage.getAllDisagreements();
      }
      
      res.json(disagreements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch disagreements" });
    }
  });

  // Update disagreement status (admin only)
  app.patch("/api/admin/disagreements/:id", adminAuth, async (req, res) => {
    try {
      const { status, adminNotes } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      await storage.updateDisagreementStatus(req.params.id, status, adminNotes);
      res.json({ message: "Disagreement updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update disagreement" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

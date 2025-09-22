import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import * as XLSX from "xlsx";
import { storage } from "./storage";
import { insertQuestionSchema, quizSetupSchema, insertQuizResultSchema, type InsertQuestion, type QuestionStats, type QuizWithQuestions } from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  
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
      
      res.json({
        totalQuestions,
        chapters,
        years
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch question statistics" });
    }
  });

  // Upload Excel file and import questions
  app.post("/api/questions/import", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const questions: InsertQuestion[] = [];

      for (const row of data as any[]) {
        // Assuming columns: ano, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e, gabarito, capitulo, parte
        const options: string[] = [];
        
        if (row.alternativa_a) options.push(row.alternativa_a);
        if (row.alternativa_b) options.push(row.alternativa_b);
        if (row.alternativa_c) options.push(row.alternativa_c);
        if (row.alternativa_d) options.push(row.alternativa_d);
        if (row.alternativa_e) options.push(row.alternativa_e);

        if (row.enunciado && row.gabarito && row.capitulo && options.length >= 4) {
          const question: InsertQuestion = {
            year: parseInt(row.ano) || 2024,
            statement: row.enunciado,
            options,
            correctAnswer: row.gabarito.toUpperCase(),
            chapter: row.capitulo,
            bookSection: row.parte || 'Não especificado'
          };

          const validationResult = insertQuestionSchema.safeParse(question);
          if (validationResult.success) {
            questions.push(validationResult.data);
          }
        }
      }

      if (questions.length === 0) {
        return res.status(400).json({ message: "No valid questions found in the uploaded file" });
      }

      await storage.importQuestions(questions);
      res.json({ 
        message: "Questions imported successfully", 
        imported: questions.length 
      });

    } catch (error) {
      console.error('Import error:', error);
      res.status(500).json({ message: "Failed to import questions" });
    }
  });

  // Create a new quiz
  app.post("/api/quiz", async (req, res) => {
    try {
      const setupData = quizSetupSchema.parse(req.body);
      
      // Get questions based on filters
      const filteredQuestions = await storage.getQuestionsByFilters(
        setupData.selectedChapters, 
        setupData.selectedYears
      );

      if (filteredQuestions.length < setupData.questionCount) {
        return res.status(400).json({ 
          message: `Only ${filteredQuestions.length} questions available for selected filters` 
        });
      }

      // Randomly select questions
      const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, setupData.questionCount);

      const quiz = await storage.createQuiz({
        questionCount: setupData.questionCount,
        selectedChapters: setupData.selectedChapters,
        selectedYears: setupData.selectedYears,
        timedMode: setupData.timedMode,
        questionIds: selectedQuestions.map(q => q.id)
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
      const quiz = await storage.getQuiz(req.params.id);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

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
        answers,
        score: Math.round((correctAnswers / quiz.questionCount) * 100),
        totalQuestions: quiz.questionCount,
        timeSpent,
        chapterPerformance
      });

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

  const httpServer = createServer(app);
  return httpServer;
}

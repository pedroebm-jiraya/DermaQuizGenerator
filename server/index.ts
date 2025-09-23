import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import type { InsertQuestion } from "@shared/schema";
import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { insertQuestionSchema } from "@shared/schema";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Load questions from Excel file
async function loadQuestionsFromExcel(): Promise<InsertQuestion[]> {
  const excelPath = path.join(process.cwd(), 'attached_assets', 'banco_TED_1758576231587.xlsx');
  
  if (!fs.existsSync(excelPath)) {
    throw new Error(`Excel file not found at: ${excelPath}`);
  }

  const fileBuffer = fs.readFileSync(excelPath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const questions: InsertQuestion[] = [];

  for (const row of data as any[]) {
    // Expected columns: ano, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e, gabarito, capitulo, parte
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

  return questions;
}

// Load complete question bank from Excel if available, otherwise use samples
async function seedDatabaseIfEmpty() {
  try {
    const questionCount = await storage.getQuestionsCount();
    
    // If we have few questions, try to load the complete Excel bank
    if (questionCount < 50) { // Threshold to detect if we only have sample data
      log(`Database contains ${questionCount} questions. Attempting to load complete question bank from Excel...`);
      
      try {
        // Try to load from Excel file first
        const questionsFromExcel = await loadQuestionsFromExcel();
        
        if (questionsFromExcel.length > questionCount) {
          // Clear existing questions and load complete bank
          await storage.clearAllQuestions();
          await storage.importQuestions(questionsFromExcel);
          log(`Successfully replaced ${questionCount} questions with ${questionsFromExcel.length} questions from Excel file`);
          return;
        } else if (questionsFromExcel.length > 0) {
          log(`Excel file contains ${questionsFromExcel.length} questions, but database already has ${questionCount}. Keeping existing data.`);
          return;
        }
      } catch (excelError) {
        log(`Failed to load from Excel: ${excelError}. Keeping existing data or using fallback...`);
      }
    }
    
    if (questionCount === 0) {
      log("Database is empty. Loading fallback sample questions...");
      
      // Fallback to sample questions if Excel loading fails or no Excel file
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
      log(`Successfully seeded database with ${sampleQuestions.length} fallback sample questions`);
    } else {
      log(`Database already contains ${questionCount} questions. Seeding complete.`);
    }
  } catch (error) {
    log(`Failed to seed database: ${error}`);
  }
}

(async () => {
  const server = await registerRoutes(app);
  
  // Seed database if empty
  await seedDatabaseIfEmpty();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

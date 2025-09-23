import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import type { InsertQuestion } from "@shared/schema";
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


// Simple database seeding - only seed if completely empty
async function seedDatabaseIfEmpty() {
  try {
    const questionCount = await storage.getQuestionsCount();
    
    if (questionCount > 0) {
      log(`Database already contains ${questionCount} questions. Seeding complete.`);
      return;
    }
    
    log("Database is empty. Loading sample questions...");
      
      // Sample questions for seeding
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
      log(`Successfully seeded database with ${sampleQuestions.length} sample questions`);
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

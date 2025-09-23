import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import type { InsertQuestion } from "@shared/schema";

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

// Seed database with sample questions if empty
async function seedDatabaseIfEmpty() {
  try {
    const questionCount = await storage.getQuestionsCount();
    
    if (questionCount === 0) {
      log("Database is empty. Seeding with sample questions...");
      
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
        },
        {
          year: 2024,
          statement: "Qual é a principal causa da rosácea?",
          options: ["Infecção bacteriana", "Alterações vasculares", "Alergia alimentar", "Deficiência vitamínica"],
          correctAnswer: "B",
          chapter: "Dermatoses Inflamatórias",
          bookSection: "Rosácea"
        },
        {
          year: 2023,
          statement: "A dermatite seborreica é mais comum em:",
          options: ["Crianças", "Adolescentes", "Adultos jovens", "Todas as idades"],
          correctAnswer: "D",
          chapter: "Dermatoses Inflamatórias",
          bookSection: "Eczemas"
        },
        {
          year: 2024,
          statement: "O carcinoma basocelular apresenta:",
          options: ["Crescimento rápido", "Metástases frequentes", "Crescimento lento local", "Coloração escura"],
          correctAnswer: "C",
          chapter: "Neoplasias Cutâneas",
          bookSection: "Tumores Malignos"
        },
        {
          year: 2022,
          statement: "A piodermite é causada por:",
          options: ["Vírus", "Fungos", "Bactérias", "Parasitas"],
          correctAnswer: "C",
          chapter: "Doenças Infecciosas",
          bookSection: "Infecções Bacterianas"
        },
        {
          year: 2023,
          statement: "O melasma é caracterizado por:",
          options: ["Despigmentação", "Hiperpigmentação facial", "Descamação", "Prurido intenso"],
          correctAnswer: "B",
          chapter: "Distúrbios da Pigmentação",
          bookSection: "Hiperpigmentação"
        },
        {
          year: 2024,
          statement: "A tinha do couro cabeludo é mais comum em:",
          options: ["Adultos", "Idosos", "Crianças", "Gestantes"],
          correctAnswer: "C",
          chapter: "Doenças Infecciosas",
          bookSection: "Micoses Superficiais"
        },
        {
          year: 2022,
          statement: "A urticária crônica é definida como:",
          options: ["Duração > 2 semanas", "Duração > 6 semanas", "Duração > 3 meses", "Duração > 1 ano"],
          correctAnswer: "B",
          chapter: "Dermatoses Inflamatórias",
          bookSection: "Urticária"
        },
        {
          year: 2023,
          statement: "O líquen plano oral apresenta:",
          options: ["Vesículas", "Estrias esbranquiçadas", "Úlceras profundas", "Placas amareladas"],
          correctAnswer: "B",
          chapter: "Dermatoses Inflamatórias",
          bookSection: "Líquen Plano"
        },
        {
          year: 2024,
          statement: "A escabiose é causada por:",
          options: ["Bactéria", "Vírus", "Ácaro", "Fungo"],
          correctAnswer: "C",
          chapter: "Doenças Infecciosas",
          bookSection: "Parasitoses"
        },
        {
          year: 2022,
          statement: "A alopecia androgenética afeta:",
          options: ["Apenas homens", "Apenas mulheres", "Homens e mulheres", "Apenas crianças"],
          correctAnswer: "C",
          chapter: "Distúrbios da Pigmentação",
          bookSection: "Alopecias"
        }
      ];
      
      await storage.importQuestions(sampleQuestions);
      log(`Successfully seeded database with ${sampleQuestions.length} sample questions`);
    } else {
      log(`Database already contains ${questionCount} questions. Skipping seeding.`);
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

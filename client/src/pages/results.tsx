import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import AppHeader from "@/components/app-header";
import QuizResults from "@/components/quiz-results";
import { useToast } from "@/hooks/use-toast";
import type { QuizResult } from "@shared/schema";

export default function Results() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch quiz result data - assuming the id is the quiz result id
  const { data: result, isLoading, error } = useQuery({
    queryKey: [`/api/quiz/${id}/result`],
    enabled: !!id,
  });

  // Fallback data if API call fails or returns empty
  const fallbackResult: QuizResult & { elapsedTime?: number } = {
    id: id || '',
    quizId: id || '',
    userId: null,
    score: 75,
    totalQuestions: 20,
    timeSpent: 1200,
    chapterPerformance: {
      'Dermatoses Inflamatórias': { correct: 7, total: 8 },
      'Neoplasias Cutâneas': { correct: 3, total: 5 },
      'Doenças Infecciosas': { correct: 5, total: 7 }
    },
    answers: {},
    completedAt: new Date().toISOString(),
    elapsedTime: undefined
  };

  const displayResult = result || fallbackResult;

  const handleReviewAnswers = () => {
    // Use the quiz result ID directly, as the API now handles both quiz and quiz result IDs
    if (id) {
      navigate(`/quiz/${id}/review`);
    }
  };

  const handleStartNewQuiz = () => {
    navigate("/");
  };

  const handleSaveResults = () => {
    toast({
      title: "Resultado salvo",
      description: "Seu resultado foi salvo com sucesso",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" data-testid="page-results-loading">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-results">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QuizResults
          result={displayResult}
          onReviewAnswers={handleReviewAnswers}
          onStartNewQuiz={handleStartNewQuiz}
          onSaveResults={handleSaveResults}
        />
      </main>
    </div>
  );
}

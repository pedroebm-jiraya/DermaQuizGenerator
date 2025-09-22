import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import AppHeader from "@/components/app-header";
import QuizResults from "@/components/quiz-results";
import { useToast } from "@/hooks/use-toast";

export default function Results() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: result, isLoading, error } = useQuery({
    queryKey: [`/api/quiz/${id}/result`], // Note: This endpoint doesn't exist yet, would need to be added
    enabled: !!id,
  });

  // For now, let's create a mock result based on the ID
  // In a real app, you'd fetch this from the backend
  const mockResult = {
    id: id || '',
    score: 75,
    totalQuestions: 20,
    timeSpent: 1200, // 20 minutes
    chapterPerformance: {
      'Dermatoses Inflamatórias': { correct: 7, total: 8 },
      'Neoplasias Cutâneas': { correct: 3, total: 5 },
      'Doenças Infecciosas': { correct: 5, total: 7 }
    },
    answers: {},
    quizId: '',
    completedAt: new Date().toISOString()
  };

  const handleReviewAnswers = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A revisão de respostas estará disponível em breve",
    });
  };

  const handleStartNewQuiz = () => {
    setLocation("/");
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
          result={mockResult}
          onReviewAnswers={handleReviewAnswers}
          onStartNewQuiz={handleStartNewQuiz}
          onSaveResults={handleSaveResults}
        />
      </main>
    </div>
  );
}

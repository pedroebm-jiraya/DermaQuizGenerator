import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import AppHeader from "@/components/app-header";
import QuizInterface from "@/components/quiz-interface";
import { useToast } from "@/hooks/use-toast";
import type { QuizWithQuestions } from "@shared/schema";

export default function Quiz() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: quizData, isLoading, error } = useQuery<QuizWithQuestions>({
    queryKey: [`/api/quiz/${id}`],
    enabled: !!id,
  });

  const handleQuizSubmit = async (answers: Record<string, string>, timeSpent: number) => {
    try {
      const response = await fetch(`/api/quiz/${id}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers, timeSpent }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const result = await response.json();
      setLocation(`/results/${result.id}`);
    } catch (error) {
      toast({
        title: "Erro ao submeter simulado",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleQuizExit = () => {
    if (confirm("Tem certeza que deseja sair do simulado? Seu progresso será perdido.")) {
      setLocation("/");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" data-testid="page-quiz-loading">
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

  if (error || !quizData) {
    return (
      <div className="min-h-screen bg-background" data-testid="page-quiz-error">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Simulado não encontrado
            </h2>
            <p className="text-muted-foreground">
              O simulado que você está procurando não existe ou expirou.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-quiz">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QuizInterface
          questions={quizData.questions}
          quizId={quizData.quiz.id}
          timedMode={quizData.quiz.timedMode}
          onSubmit={handleQuizSubmit}
          onExit={handleQuizExit}
        />
      </main>
    </div>
  );
}

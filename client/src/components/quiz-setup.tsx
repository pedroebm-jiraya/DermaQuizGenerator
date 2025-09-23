import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Filter, Database, ChartLine, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { QuizSetup, QuestionStats, BookPartWithChapters } from "@shared/schema";

interface QuizSetupProps {
  onQuizStart: (quizId: string) => void;
}

export default function QuizSetup({ onQuizStart }: QuizSetupProps) {
  const [questionCount, setQuestionCount] = useState(20);
  const [timedMode, setTimedMode] = useState(true);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([2024]);
  const [creating, setCreating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    availableQuestions: number;
    requestedQuestions: number;
    message: string;
  } | null>(null);
  
  const { toast } = useToast();

  const { data: stats, isLoading } = useQuery<QuestionStats>({
    queryKey: ['/api/questions/stats'],
  });

  const handleChapterToggle = (chapter: string) => {
    setSelectedChapters(prev =>
      prev.includes(chapter)
        ? prev.filter(c => c !== chapter)
        : [...prev, chapter]
    );
  };

  const handleYearToggle = (year: number) => {
    setSelectedYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const handleStartQuiz = async () => {
    if (selectedChapters.length === 0) {
      toast({
        title: "Seleção obrigatória",
        description: "Selecione pelo menos um assunto",
        variant: "destructive",
      });
      return;
    }

    if (selectedYears.length === 0) {
      toast({
        title: "Seleção obrigatória",
        description: "Selecione pelo menos um ano",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);

    try {
      const quizSetup: QuizSetup = {
        questionCount,
        selectedChapters,
        selectedYears,
        timedMode,
      };

      const response = await apiRequest('POST', '/api/quiz', quizSetup);
      const data = await response.json();
      
      if (data.requiresConfirmation) {
        setConfirmationData({
          availableQuestions: data.availableQuestions,
          requestedQuestions: data.requestedQuestions,
          message: data.message
        });
        setShowConfirmDialog(true);
      } else {
        onQuizStart(data.id);
      }
    } catch (error) {
      toast({
        title: "Erro ao criar simulado",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmQuiz = async () => {
    setShowConfirmDialog(false);
    setCreating(true);

    try {
      const quizSetup: QuizSetup = {
        questionCount,
        selectedChapters,
        selectedYears,
        timedMode,
      };

      const response = await apiRequest('POST', '/api/quiz/confirm', quizSetup);
      const quiz = await response.json();
      onQuizStart(quiz.id);
    } catch (error) {
      toast({
        title: "Erro ao criar simulado",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmDialog(false);
    setConfirmationData(null);
  };

  if (isLoading) {
    return <div className="text-center py-8" data-testid="loading-stats">Carregando estatísticas...</div>;
  }

  return (
    <>
      {/* Welcome Section */}
      <section className="mb-12" data-testid="section-welcome">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4" data-testid="text-main-title">
            Prepare-se para o Título de Especialista em Dermatologia
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-main-description">
            Pratique com questões reais de provas anteriores e personalize seus simulados de acordo com suas necessidades de estudo.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6 text-center" data-testid="card-database-stats">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Database className="text-primary text-xl" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Banco de Questões</h3>
            <p className="text-sm text-muted-foreground" data-testid="text-total-questions">
              {stats?.totalQuestions || 0} questões
            </p>
            <p className="text-xs text-muted-foreground">de provas anteriores</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 text-center" data-testid="card-filter-stats">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Filter className="text-secondary text-xl" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Filtros Personalizados</h3>
            <p className="text-sm text-muted-foreground">Por capítulo e ano</p>
            <p className="text-xs text-muted-foreground">da prova oficial</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 text-center" data-testid="card-analysis-stats">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <ChartLine className="text-success text-xl" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Análise Detalhada</h3>
            <p className="text-sm text-muted-foreground">Acompanhe seu progresso</p>
            <p className="text-xs text-muted-foreground">e identifique pontos fracos</p>
          </div>
        </div>
      </section>

      {/* Quiz Setup Card */}
      <Card className="rounded-xl shadow-sm" data-testid="card-quiz-setup">
        <CardContent className="p-8">
          <h3 className="text-2xl font-semibold text-foreground mb-6" data-testid="text-quiz-setup-title">
            Criar Novo Simulado
          </h3>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h4 className="font-medium text-foreground mb-4" data-testid="text-settings-title">
                Configurações do Simulado
              </h4>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Número de Questões
                  </label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[questionCount]}
                      onValueChange={(value) => setQuestionCount(value[0])}
                      min={1}
                      max={80}
                      step={1}
                      className="flex-1"
                      data-testid="slider-question-count"
                    />
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-lg font-medium min-w-12 text-center" data-testid="text-question-count">
                      {questionCount}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Prova oficial: 80 questões</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Modo de Tempo
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={timedMode ? "default" : "outline"}
                      onClick={() => setTimedMode(true)}
                      className="font-medium text-sm"
                      data-testid="button-timed-mode"
                    >
                      Com Tempo
                    </Button>
                    <Button
                      variant={!timedMode ? "default" : "outline"}
                      onClick={() => setTimedMode(false)}
                      className="font-medium text-sm"
                      data-testid="button-untimed-mode"
                    >
                      Sem Tempo
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-4" data-testid="text-filters-title">
                Filtros de Conteúdo
              </h4>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Ano das Provas
                  </label>
                  {stats?.years?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {stats.years.map((year: number) => (
                        <Button
                          key={year}
                          variant={selectedYears.includes(year) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleYearToggle(year)}
                          className="text-sm font-medium"
                          data-testid={`button-year-${year}`}
                        >
                          {year}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border border-border rounded-lg bg-muted/20" data-testid="message-no-years">
                      <p className="text-sm text-muted-foreground text-center">
                        Nenhum ano disponível.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Assuntos
                  </label>
                  {stats?.bookParts?.length ? (
                    <div className="max-h-64 overflow-y-auto space-y-4 border border-border rounded-lg p-4" data-testid="container-chapters">
                      {stats.bookParts.map((part: BookPartWithChapters) => (
                        <div key={part.id} className="space-y-2">
                          <h4 className="text-sm font-semibold text-primary border-b border-border pb-1">
                            {part.name}
                          </h4>
                          <div className="space-y-1 pl-2">
                            {part.chapters.map((chapter: string) => (
                              <label
                                key={chapter}
                                className="flex items-center space-x-3 cursor-pointer hover:bg-muted/30 p-2 rounded"
                                data-testid={`label-chapter-${chapter.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                <Checkbox
                                  checked={selectedChapters.includes(chapter)}
                                  onCheckedChange={() => handleChapterToggle(chapter)}
                                  data-testid={`checkbox-chapter-${chapter.toLowerCase().replace(/\s+/g, '-')}`}
                                />
                                <span className="text-sm text-foreground">{chapter}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border border-border rounded-lg bg-muted/20" data-testid="message-no-chapters">
                      <p className="text-sm text-muted-foreground text-center">
                        Nenhum assunto disponível.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <Button
              onClick={handleStartQuiz}
              disabled={creating || !stats?.years?.length || !stats?.bookParts?.length}
              size="lg"
              className="font-semibold text-lg shadow-lg"
              data-testid="button-start-quiz"
            >
              <Play className="mr-2" />
              {creating ? "Criando Simulado..." : 
               (!stats?.years?.length || !stats?.bookParts?.length) ? "Nenhum dado disponível" : 
               "Iniciar Simulado"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent data-testid="dialog-quiz-confirmation">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-warning w-6 h-6" />
              </div>
              <div>
                <AlertDialogTitle data-testid="text-dialog-title">
                  Poucas questões disponíveis
                </AlertDialogTitle>
                <AlertDialogDescription data-testid="text-dialog-description">
                  {confirmationData?.message}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="bg-muted/30 border border-border rounded-lg p-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Questões solicitadas:</span>
                <span className="font-medium" data-testid="text-requested-count">{confirmationData?.requestedQuestions}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-muted-foreground">Questões disponíveis:</span>
                <span className="font-medium text-success" data-testid="text-available-count">{confirmationData?.availableQuestions}</span>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={handleCancelConfirmation}
              data-testid="button-cancel-quiz"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmQuiz}
              data-testid="button-confirm-quiz"
            >
              Prosseguir com {confirmationData?.availableQuestions} questões
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

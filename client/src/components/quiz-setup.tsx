import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Filter, Database, ChartLine } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import type { QuizSetup, QuestionStats } from "@shared/schema";

interface QuizSetupProps {
  onQuizStart: (quizId: string) => void;
}

export default function QuizSetup({ onQuizStart }: QuizSetupProps) {
  const [questionCount, setQuestionCount] = useState(20);
  const [timedMode, setTimedMode] = useState(true);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([2024]);
  const [creating, setCreating] = useState(false);
  
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
        description: "Selecione pelo menos um capítulo",
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

      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizSetup),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

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
                  <div className="flex flex-wrap gap-2">
                    {stats?.years?.map((year: number) => (
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Capítulos do Livro
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-2 border border-border rounded-lg p-3" data-testid="container-chapters">
                    {stats?.chapters?.map((chapter: string) => (
                      <label
                        key={chapter}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 p-2 rounded"
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
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <Button
              onClick={handleStartQuiz}
              disabled={creating}
              size="lg"
              className="font-semibold text-lg shadow-lg"
              data-testid="button-start-quiz"
            >
              <Play className="mr-2" />
              {creating ? "Criando Simulado..." : "Iniciar Simulado"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

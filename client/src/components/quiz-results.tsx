import { Trophy, Eye, RotateCcw, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { QuizResult } from "@shared/schema";

interface QuizResultsProps {
  result: QuizResult;
  onReviewAnswers: () => void;
  onStartNewQuiz: () => void;
  onSaveResults: () => void;
}

export default function QuizResults({ 
  result, 
  onReviewAnswers, 
  onStartNewQuiz, 
  onSaveResults 
}: QuizResultsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const correctAnswers = Math.round((result.score * result.totalQuestions) / 100);
  const incorrectAnswers = result.totalQuestions - correctAnswers;

  return (
    <Card className="rounded-xl shadow-sm" data-testid="card-quiz-results">
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-8 rounded-t-xl">
        <div className="text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="text-3xl" data-testid="icon-trophy" />
          </div>
          <h3 className="text-2xl font-bold mb-2" data-testid="text-completion-title">
            Simulado Concluído!
          </h3>
          <p className="text-white/90" data-testid="text-completion-message">
            Parabéns! Você completou o simulado de dermatologia.
          </p>
        </div>
      </div>

      <CardContent className="p-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2" data-testid="text-score-percentage">
              {result.score}%
            </div>
            <p className="text-muted-foreground">Pontuação Geral</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-success mb-2" data-testid="text-correct-answers">
              {correctAnswers}
            </div>
            <p className="text-muted-foreground">Respostas Corretas</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-destructive mb-2" data-testid="text-incorrect-answers">
              {incorrectAnswers}
            </div>
            <p className="text-muted-foreground">Respostas Incorretas</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary mb-2" data-testid="text-time-spent">
              {formatTime(result.timeSpent)}
            </div>
            <p className="text-muted-foreground">Tempo Gasto</p>
          </div>
        </div>

        <div className="mb-8">
          <h4 className="font-semibold text-foreground mb-4" data-testid="text-chapter-performance-title">
            Performance por Capítulo
          </h4>
          <div className="space-y-4" data-testid="container-chapter-performance">
            {Object.entries(result.chapterPerformance).map(([chapter, performance]) => {
              const percentage = Math.round((performance.correct / performance.total) * 100);
              const isGoodPerformance = percentage >= 70;
              
              return (
                <div 
                  key={chapter} 
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                  data-testid={`chapter-performance-${chapter.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div>
                    <p className="font-medium text-foreground" data-testid={`text-chapter-name-${chapter.toLowerCase().replace(/\s+/g, '-')}`}>
                      {chapter}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`text-chapter-questions-${chapter.toLowerCase().replace(/\s+/g, '-')}`}>
                      {performance.total} questões
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold mb-1 ${
                      isGoodPerformance ? 'text-success' : 'text-destructive'
                    }`} data-testid={`text-chapter-percentage-${chapter.toLowerCase().replace(/\s+/g, '-')}`}>
                      {percentage}%
                    </p>
                    <div className="w-24 bg-muted rounded-full h-2">
                      <Progress 
                        value={percentage} 
                        className={`h-2 ${isGoodPerformance ? '[&>div]:bg-success' : '[&>div]:bg-destructive'}`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1" data-testid={`text-chapter-score-${chapter.toLowerCase().replace(/\s+/g, '-')}`}>
                      {performance.correct}/{performance.total}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={onReviewAnswers}
            className="font-semibold"
            data-testid="button-review-answers"
          >
            <Eye className="w-4 h-4 mr-2" />
            Revisar Respostas
          </Button>
          <Button
            onClick={onStartNewQuiz}
            variant="secondary"
            className="font-semibold"
            data-testid="button-new-quiz"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Novo Simulado
          </Button>
          <Button
            onClick={onSaveResults}
            variant="outline"
            className="font-semibold"
            data-testid="button-save-results"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Resultado
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Bookmark, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Question } from "@shared/schema";

interface QuizInterfaceProps {
  questions: Question[];
  quizId: string;
  timedMode: boolean;
  onSubmit: (answers: Record<string, string>, timeSpent: number) => void;
  onExit: () => void;
}

export default function QuizInterface({ 
  questions, 
  quizId, 
  timedMode, 
  onSubmit, 
  onExit 
}: QuizInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(timedMode ? questions.length * 60 : 0); // 1 minute per question
  const [startTime] = useState(Date.now());

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  useEffect(() => {
    if (!timedMode || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, timedMode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleMarkForReview = () => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion.id)) {
        newSet.delete(currentQuestion.id);
      } else {
        newSet.add(currentQuestion.id);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    onSubmit(answers, timeSpent);
  };

  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).length;

  return (
    <Card className="rounded-xl shadow-sm" data-testid="card-quiz-interface">
      <div className="border-b border-border p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-foreground" data-testid="text-quiz-title">
              Simulado em Andamento
            </h3>
            <p className="text-sm text-muted-foreground" data-testid="text-question-progress">
              Questão <span data-testid="text-current-question">{currentIndex + 1}</span> de{" "}
              <span data-testid="text-total-questions">{questions.length}</span>
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {timedMode && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Tempo Restante</p>
                <p className="text-lg font-bold text-destructive" data-testid="text-time-remaining">
                  {formatTime(timeLeft)}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onExit}
              data-testid="button-exit-quiz"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <div className="mt-4">
          <Progress value={progress} className="w-full" data-testid="progress-quiz" />
        </div>
      </div>

      <CardContent className="p-6">
        <div className="mb-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" data-testid="text-question-number">
              {currentIndex + 1}
            </div>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-2" data-testid="text-question-metadata">
                Prova {currentQuestion.year} • {currentQuestion.chapter}
              </div>
              <p className="text-foreground leading-relaxed" data-testid="text-question-statement">
                {currentQuestion.statement}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3" data-testid="container-question-options">
          <RadioGroup
            value={answers[currentQuestion.id] || ""}
            onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
          >
            {currentQuestion.options
              .filter((option) => option && option.trim() !== "")
              .map((option, index) => {
                const optionLabel = String.fromCharCode(65 + index); // A, B, C, D, E
                return (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
                    data-testid={`option-${optionLabel.toLowerCase()}`}
                  >
                    <RadioGroupItem
                      value={optionLabel}
                      id={`option-${optionLabel}`}
                      className="mt-1"
                    />
                    <Label
                      htmlFor={`option-${optionLabel}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-primary">{optionLabel})</span>
                        <span className="text-foreground group-hover:text-foreground">
                          {option}
                        </span>
                      </div>
                    </Label>
                  </div>
                );
              })}
          </RadioGroup>
        </div>

        <div className="flex justify-between items-center mt-8">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            data-testid="button-previous-question"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground" data-testid="text-answered-count">
              Respondidas: {answeredCount}/{questions.length}
            </div>
            
            <Button
              variant="outline"
              onClick={handleMarkForReview}
              data-testid="button-mark-review"
            >
              <Bookmark 
                className={`w-4 h-4 mr-2 ${
                  markedForReview.has(currentQuestion.id) ? 'fill-current' : ''
                }`} 
              />
              {markedForReview.has(currentQuestion.id) ? 'Desmarcada' : 'Marcar'}
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                className="font-semibold"
                data-testid="button-submit-quiz"
              >
                <Clock className="w-4 h-4 mr-2" />
                Finalizar Simulado
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                data-testid="button-next-question"
              >
                Próxima
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

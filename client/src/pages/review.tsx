import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import AppHeader from "@/components/app-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

interface ReviewQuestion {
  id: string;
  statement: string;
  options: string[];
  correctAnswer: string;
  userAnswer: string | null;
  isCorrect: boolean;
  chapter: string;
  year: number;
}

interface ReviewData {
  quiz: {
    id: string;
    questionCount: number;
    timedMode: boolean;
    startTime?: string;
    endTime?: string;
  };
  quizResult: {
    id: string;
    score: number;
    totalQuestions: number;
    timeSpent: number;
  };
  questions: ReviewQuestion[];
  elapsedTime: number | null;
}

function DisagreementModal({ questionId, quizResultId }: { questionId: string; quizResultId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<string>("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const disagreementMutation = useMutation({
    mutationFn: (data: { questionId: string; quizResultId: string; type: string; description: string }) =>
      apiRequest(`/api/disagreements`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Discordância enviada",
        description: "Sua discordância foi registrada e será analisada pela equipe.",
      });
      setIsOpen(false);
      setType("");
      setDescription("");
    },
    onError: () => {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível registrar sua discordância. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!type || !description.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione o tipo de problema e descreva a discordância.",
        variant: "destructive",
      });
      return;
    }

    disagreementMutation.mutate({
      questionId,
      quizResultId,
      type,
      description: description.trim(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-orange-600 border-orange-600 hover:bg-orange-50"
          data-testid={`button-disagreement-${questionId}`}
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          Reportar Problema
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reportar Problema com a Questão</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Tipo de Problema</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de problema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="statement">Problema no enunciado</SelectItem>
                <SelectItem value="option">Problema nas alternativas</SelectItem>
                <SelectItem value="answer">Gabarito incorreto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="description">Descrição do Problema</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva detalhadamente o problema encontrado..."
              rows={4}
              data-testid="textarea-disagreement-description"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              data-testid="button-cancel-disagreement"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={disagreementMutation.isPending}
              data-testid="button-submit-disagreement"
            >
              {disagreementMutation.isPending ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Review() {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const { data: reviewData, isLoading } = useQuery<ReviewData>({
    queryKey: [`/api/quiz/${id}/review`],
    enabled: !!id,
  });

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getOptionLabel = (index: number) => {
    return String.fromCharCode(65 + index); // A, B, C, D, E
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" data-testid="page-review-loading">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="min-h-screen bg-background" data-testid="page-review-error">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Dados de revisão não encontrados
            </h1>
            <Button onClick={() => navigate("/")} data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const { quiz, quizResult, questions, elapsedTime } = reviewData;
  const correctAnswers = questions.filter(q => q.isCorrect).length;

  return (
    <div className="min-h-screen bg-background" data-testid="page-review">
      <AppHeader />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with score and time */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/results/${quizResult.id}`)}
              data-testid="button-back-results"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Resultados
            </Button>
            
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-review-title">
              Revisão de Respostas
            </h1>
            
            <div /> {/* Spacer for center alignment */}
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary" data-testid="text-score">
                    {quizResult.score}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {correctAnswers}/{quizResult.totalQuestions} questões corretas
                  </div>
                </div>
                
                {elapsedTime && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary flex items-center justify-center">
                      <Clock className="w-5 h-5 mr-2" />
                      {formatTime(elapsedTime)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Tempo total decorrido
                    </div>
                  </div>
                )}
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary" data-testid="text-mode">
                    {quiz.timedMode ? "Com Tempo" : "Sem Tempo"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Modo do simulado
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions Review */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <Card 
              key={question.id} 
              className={`border-l-4 ${
                question.isCorrect 
                  ? 'border-l-green-500' 
                  : 'border-l-red-500'
              }`}
              data-testid={`card-question-${index + 1}`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Prova {question.year} • {question.chapter}
                      </div>
                      <CardTitle className="text-lg">{question.statement}</CardTitle>
                    </div>
                  </div>
                  
                  <Badge 
                    variant={question.isCorrect ? "default" : "destructive"}
                    className="flex items-center space-x-1"
                    data-testid={`badge-result-${index + 1}`}
                  >
                    {question.isCorrect ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        <span>Correta</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        <span>Incorreta</span>
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {question.options.map((option, optionIndex) => {
                    const optionLabel = getOptionLabel(optionIndex);
                    const isUserAnswer = question.userAnswer === optionLabel;
                    const isCorrectAnswer = question.correctAnswer === optionLabel;
                    
                    let optionStyle = "border border-border rounded-lg p-3";
                    if (isCorrectAnswer) {
                      optionStyle += " bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800";
                    } else if (isUserAnswer && !isCorrectAnswer) {
                      optionStyle += " bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800";
                    }
                    
                    return (
                      <div 
                        key={optionIndex}
                        className={optionStyle}
                        data-testid={`option-${optionLabel.toLowerCase()}-question-${index + 1}`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-primary">
                            {optionLabel})
                          </span>
                          <span className="flex-1">{option}</span>
                          
                          <div className="flex items-center space-x-2">
                            {isCorrectAnswer && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Resposta Correta
                              </Badge>
                            )}
                            {isUserAnswer && !isCorrectAnswer && (
                              <Badge variant="outline" className="text-red-600 border-red-600">
                                Sua Resposta
                              </Badge>
                            )}
                            {isUserAnswer && isCorrectAnswer && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Sua Resposta (Correta)
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {!question.userAnswer && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
                      <span className="text-muted-foreground italic">
                        Questão não respondida
                      </span>
                    </div>
                  )}
                  
                  {/* Disagreement button */}
                  <div className="pt-3 border-t border-border">
                    <div className="flex justify-end">
                      <DisagreementModal 
                        questionId={question.id} 
                        quizResultId={quizResult.id} 
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Back to results button */}
        <div className="mt-8 text-center">
          <Button 
            onClick={() => navigate(`/results/${quizResult.id}`)}
            data-testid="button-back-results-bottom"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos Resultados
          </Button>
        </div>
      </main>
    </div>
  );
}
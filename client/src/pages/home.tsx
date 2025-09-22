import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AppHeader from "@/components/app-header";
import QuizSetup from "@/components/quiz-setup";
import FileUpload from "@/components/file-upload";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const [, setLocation] = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: stats } = useQuery({
    queryKey: ['/api/questions/stats', refreshKey],
  });

  const { data: recentResults } = useQuery({
    queryKey: ['/api/results'],
  });

  const handleQuizStart = (quizId: string) => {
    setLocation(`/quiz/${quizId}`);
  };

  const handleUploadComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 70) return 'text-primary';
    return 'text-destructive';
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-home">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats?.totalQuestions === 0 ? (
          <div className="text-center py-12" data-testid="container-no-questions">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Bem-vindo ao DermaQuiz
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Para começar a usar o simulado, faça o upload do banco de questões em formato Excel.
            </p>
            <div className="max-w-md mx-auto">
              <FileUpload onUploadComplete={handleUploadComplete} />
            </div>
          </div>
        ) : (
          <>
            <QuizSetup onQuizStart={handleQuizStart} />
            
            {recentResults && recentResults.length > 0 && (
              <section className="mt-12" data-testid="section-recent-activity">
                <h3 className="text-xl font-semibold text-foreground mb-6" data-testid="text-recent-title">
                  Simulados Recentes
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentResults.map((result: any) => (
                    <Card 
                      key={result.id} 
                      className="hover:shadow-md transition-shadow"
                      data-testid={`card-recent-result-${result.id}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-sm text-muted-foreground" data-testid={`text-result-date-${result.id}`}>
                            {formatDate(result.completedAt)}
                          </div>
                          <div 
                            className={`text-lg font-bold ${getScoreColor(result.score)}`}
                            data-testid={`text-result-score-${result.id}`}
                          >
                            {result.score}%
                          </div>
                        </div>
                        <h4 className="font-medium text-foreground mb-2" data-testid={`text-result-title-${result.id}`}>
                          Simulado Geral
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4" data-testid={`text-result-details-${result.id}`}>
                          {result.totalQuestions} questões • {formatDuration(result.timeSpent)}
                        </p>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <Progress value={result.score} className="h-2" />
                          </div>
                          <span className="text-xs text-muted-foreground" data-testid={`text-result-fraction-${result.id}`}>
                            {Math.round((result.score * result.totalQuestions) / 100)}/{result.totalQuestions}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-muted border-t border-border mt-16" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <i className="fas fa-brain text-primary-foreground"></i>
                </div>
                <h3 className="font-bold text-primary">DermaQuiz</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Plataforma completa para preparação do título de especialista em dermatologia.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Funcionalidades</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Simulados Personalizados</li>
                <li>Banco de Questões</li>
                <li>Análise de Performance</li>
                <li>Histórico de Estudos</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Central de Ajuda</li>
                <li>Tutoriais</li>
                <li>Contato</li>
                <li>FAQ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Dados</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Questões: <span className="font-medium" data-testid="text-footer-questions">{stats?.totalQuestions || 0}</span></p>
                <p>Provas: <span className="font-medium">2020-2024</span></p>
                <p>Capítulos: <span className="font-medium" data-testid="text-footer-chapters">{stats?.chapters?.length || 0}</span></p>
                <p>Atualizado: <span className="font-medium">Nov 2024</span></p>
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 DermaQuiz. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

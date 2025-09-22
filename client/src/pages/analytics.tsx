import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  Target, 
  Clock, 
  BookOpen, 
  Trophy, 
  AlertCircle,
  BarChart3,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import AppHeader from "@/components/app-header";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format } from "date-fns";

interface AnalyticsData {
  overview: {
    totalQuizzes: number;
    averageScore: number;
    totalTimeSpent: number;
    totalQuestions: number;
    bestChapter: {
      chapter: string;
      averageScore: number;
    };
    worstChapter: {
      chapter: string;
      averageScore: number;
    };
  };
  performanceTrend: Array<{
    date: string;
    score: number;
    timeSpent: number;
  }>;
  chapterAnalytics: Array<{
    chapter: string;
    averageScore: number;
    totalQuestions: number;
    correctAnswers: number;
    attempts: number;
  }>;
  recentActivity: Array<{
    id: string;
    score: number;
    completedAt: string;
    totalQuestions: number;
  }>;
}

export default function Analytics() {
  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['/api/user/analytics'],
  });

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" data-testid="page-analytics-loading">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-96" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-background" data-testid="page-analytics-error">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Dados de Análise Indisponíveis
            </h2>
            <p className="text-muted-foreground">
              Complete alguns simulados para ver suas estatísticas de desempenho.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const { overview, performanceTrend, chapterAnalytics, recentActivity } = analytics;

  // Colors for charts
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  return (
    <div className="min-h-screen bg-background" data-testid="page-analytics">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-analytics-title">
            Análise de Desempenho
          </h1>
          <p className="text-muted-foreground" data-testid="text-analytics-description">
            Acompanhe seu progresso e identifique áreas para melhoria
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-overview-quizzes">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Simulados</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-quizzes">
                    {overview.totalQuizzes}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="text-primary text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-overview-average">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pontuação Média</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-average-score">
                    {overview.averageScore}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Target className="text-success text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-overview-time">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Total</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-time">
                    {formatTime(overview.totalTimeSpent)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Clock className="text-secondary text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-overview-questions">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Questões Respondidas</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-questions">
                    {overview.totalQuestions}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-accent text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trend Chart */}
        {performanceTrend.length > 0 && (
          <Card className="mb-8" data-testid="card-performance-trend">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Evolução do Desempenho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceTrend.map(item => ({
                    ...item,
                    date: formatDate(item.date)
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(label) => `Data: ${label}`}
                      formatter={(value, name) => [
                        name === 'score' ? `${value}%` : formatTime(value as number),
                        name === 'score' ? 'Pontuação' : 'Tempo Gasto'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Chapter Performance */}
          <Card data-testid="card-chapter-performance">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Desempenho por Capítulo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chapterAnalytics.map((chapter, index) => (
                  <div 
                    key={chapter.chapter}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                    data-testid={`chapter-analytics-${chapter.chapter.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground" data-testid={`text-chapter-name-${index}`}>
                        {chapter.chapter}
                      </h4>
                      <p className="text-sm text-muted-foreground" data-testid={`text-chapter-stats-${index}`}>
                        {chapter.totalQuestions} questões • {chapter.attempts} simulados
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold mb-1 ${
                        chapter.averageScore >= 70 ? 'text-success' : 'text-destructive'
                      }`} data-testid={`text-chapter-score-${index}`}>
                        {chapter.averageScore}%
                      </p>
                      <div className="w-24 bg-muted rounded-full h-2">
                        <Progress 
                          value={chapter.averageScore} 
                          className={`h-2 ${chapter.averageScore >= 70 ? '[&>div]:bg-success' : '[&>div]:bg-destructive'}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Best/Worst Chapters */}
          <Card data-testid="card-chapter-highlights">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Capítulos em Destaque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {overview.bestChapter && (
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-5 h-5 text-success" />
                      <h4 className="font-semibold text-success">Melhor Performance</h4>
                    </div>
                    <p className="font-medium text-foreground" data-testid="text-best-chapter">
                      {overview.bestChapter.chapter}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid="text-best-score">
                      {overview.bestChapter.averageScore}% de acertos
                    </p>
                  </div>
                )}

                {overview.worstChapter && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      <h4 className="font-semibold text-destructive">Precisa de Atenção</h4>
                    </div>
                    <p className="font-medium text-foreground" data-testid="text-worst-chapter">
                      {overview.worstChapter.chapter}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid="text-worst-score">
                      {overview.worstChapter.averageScore}% de acertos
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <Card data-testid="card-recent-activity">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div 
                    key={activity.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                    data-testid={`recent-activity-${index}`}
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        Simulado - {activity.totalQuestions} questões
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(activity.completedAt), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                    <div className={`text-lg font-bold ${
                      activity.score >= 70 ? 'text-success' : activity.score >= 50 ? 'text-secondary' : 'text-destructive'
                    }`}>
                      {activity.score}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AppHeader from "@/components/app-header";
import { Eye, EyeOff, Upload, Check, X } from "lucide-react";

interface Disagreement {
  id: string;
  questionId: string;
  quizResultId: string;
  userId: string | null;
  type: string;
  description: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

function LoginForm({ onLogin }: { onLogin: (credentials: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const credentials = btoa(`${username}:${password}`);
      const response = await fetch('/api/admin/disagreements', {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      if (response.ok) {
        localStorage.setItem("admin_credentials", credentials);
        onLogin(credentials);
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo à área administrativa.",
        });
      } else {
        toast({
          title: "Credenciais inválidas",
          description: "Usuário ou senha incorretos.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center" data-testid="page-admin-login">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Área Administrativa</CardTitle>
          <p className="text-muted-foreground">Entre com suas credenciais</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                data-testid="input-admin-username"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-admin-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-admin-login"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function DisagreementsTab() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const { toast } = useToast();

  const { data: disagreements, isLoading } = useQuery<Disagreement[]>({
    queryKey: [`/api/admin/disagreements`, selectedStatus],
    queryFn: () => {
      const credentials = localStorage.getItem("admin_credentials");
      const url = selectedStatus === "all" 
        ? `/api/admin/disagreements` 
        : `/api/admin/disagreements?status=${selectedStatus}`;
      return fetch(url, {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      }).then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      });
    },
  });

  const updateDisagreementMutation = useMutation({
    mutationFn: ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      const credentials = localStorage.getItem("admin_credentials");
      return fetch(`/api/admin/disagreements/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify({ status, adminNotes })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disagreements`] });
      toast({
        title: "Discordância atualizada",
        description: "Status da discordância foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a discordância.",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (id: string, status: string, adminNotes?: string) => {
    updateDisagreementMutation.mutate({ id, status, adminNotes });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600">Pendente</Badge>;
      case "reviewed":
        return <Badge variant="outline" className="text-blue-600">Analisado</Badge>;
      case "resolved":
        return <Badge variant="outline" className="text-green-600">Resolvido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "statement":
        return <Badge variant="secondary">Enunciado</Badge>;
      case "option":
        return <Badge variant="secondary">Alternativas</Badge>;
      case "answer":
        return <Badge variant="secondary">Gabarito</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Discordâncias Reportadas</h2>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="reviewed">Analisados</SelectItem>
            <SelectItem value="resolved">Resolvidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {disagreements?.map((disagreement) => (
            <Card key={disagreement.id} data-testid={`disagreement-${disagreement.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {getTypeBadge(disagreement.type)}
                      {getStatusBadge(disagreement.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Questão: {disagreement.questionId} • 
                      Criado em: {new Date(disagreement.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Descrição do Problema:</h4>
                  <p className="text-sm bg-muted p-3 rounded-lg">{disagreement.description}</p>
                </div>

                {disagreement.adminNotes && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Notas Administrativas:</h4>
                    <p className="text-sm bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                      {disagreement.adminNotes}
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate(disagreement.id, "reviewed")}
                    disabled={updateDisagreementMutation.isPending}
                    data-testid={`button-review-${disagreement.id}`}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Marcar como Analisado
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate(disagreement.id, "resolved")}
                    disabled={updateDisagreementMutation.isPending}
                    data-testid={`button-resolve-${disagreement.id}`}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Marcar como Resolvido
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {disagreements?.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Nenhuma discordância encontrada.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function QuestionsTab() {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) =>
      fetch('/api/upload', {
        method: 'POST',
        body: formData,
      }),
    onSuccess: () => {
      toast({
        title: "Upload realizado com sucesso",
        description: "As questões foram importadas com sucesso.",
      });
      setFile(null);
    },
    onError: () => {
      toast({
        title: "Erro no upload",
        description: "Não foi possível importar as questões.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = () => {
    if (!file) {
      toast({
        title: "Arquivo necessário",
        description: "Por favor, selecione um arquivo Excel para upload.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    uploadMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gerenciamento de Questões</h2>

      <Card>
        <CardHeader>
          <CardTitle>Upload de Questões</CardTitle>
          <p className="text-muted-foreground">
            Envie um arquivo Excel (.xlsx) com as questões para importar para o banco de dados.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Arquivo Excel</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              data-testid="input-file-upload"
            />
          </div>
          
          {file && (
            <div className="text-sm text-muted-foreground">
              Arquivo selecionado: {file.name}
            </div>
          )}

          <Button
            onClick={handleFileUpload}
            disabled={!file || uploadMutation.isPending}
            data-testid="button-upload-questions"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploadMutation.isPending ? "Enviando..." : "Enviar Questões"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Admin() {
  const [credentials, setCredentials] = useState<string | null>(() => {
    return localStorage.getItem("admin_credentials");
  });

  const handleLogin = (newCredentials: string) => {
    setCredentials(newCredentials);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_credentials");
    setCredentials(null);
  };

  if (!credentials) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-admin">
      <AppHeader />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Área Administrativa</h1>
            <p className="text-muted-foreground">
              Gerencie questões e visualize discordâncias do sistema
            </p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleLogout}
            data-testid="button-admin-logout"
          >
            <X className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        <Tabs defaultValue="disagreements" className="space-y-6">
          <TabsList>
            <TabsTrigger value="disagreements" data-testid="tab-disagreements">
              Discordâncias
            </TabsTrigger>
            <TabsTrigger value="questions" data-testid="tab-questions">
              Questões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="disagreements">
            <DisagreementsTab />
          </TabsContent>

          <TabsContent value="questions">
            <QuestionsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
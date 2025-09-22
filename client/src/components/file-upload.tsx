import { useState } from "react";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FileUploadProps {
  onUploadComplete: () => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Erro no arquivo",
        description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls)",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/questions/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      setUploadSuccess(true);
      toast({
        title: "Upload bem-sucedido",
        description: `${result.imported} questões importadas com sucesso`,
      });
      
      onUploadComplete();
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Falha ao importar questões. Verifique o formato do arquivo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors" data-testid="card-file-upload">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
          {uploadSuccess ? (
            <CheckCircle className="w-8 h-8 text-success" data-testid="icon-upload-success" />
          ) : (
            <FileText className="w-8 h-8 text-primary" data-testid="icon-file" />
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-upload-title">
          {uploadSuccess ? "Questões importadas!" : "Importar Banco de Questões"}
        </h3>
        
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-md" data-testid="text-upload-description">
          {uploadSuccess 
            ? "As questões foram adicionadas ao banco de dados e estão prontas para uso."
            : "Faça upload do arquivo Excel (.xlsx) contendo as questões de dermatologia"
          }
        </p>

        {!uploadSuccess && (
          <>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              data-testid="input-file-upload"
            />
            <label htmlFor="file-upload">
              <Button
                disabled={uploading}
                className="cursor-pointer"
                asChild
                data-testid="button-upload"
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Importando..." : "Selecionar Arquivo"}
                </span>
              </Button>
            </label>
            
            <p className="text-xs text-muted-foreground mt-4" data-testid="text-upload-format">
              Formatos suportados: .xlsx, .xls
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { FormatoExportacao } from '@financas-pessoais/shared';
import { relatoriosApi } from '@/lib/api/relatorios';
import { Button } from '@/components/ui/button';

interface Props {
  de: string;
  ate: string;
}

export function ExportarButton({ de, ate }: Props) {
  const [exportando, setExportando] = useState<FormatoExportacao | null>(null);

  async function exportar(formato: FormatoExportacao) {
    setExportando(formato);
    try {
      await relatoriosApi.exportar(formato, de, ate);
    } catch {
      toast.error('Não foi possível exportar o relatório.');
    } finally {
      setExportando(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        disabled={exportando !== null}
        onClick={() => void exportar('pdf')}
      >
        {exportando === 'pdf' ? <Loader2 className="animate-spin" /> : <Download />}
        PDF
      </Button>
      <Button
        variant="outline"
        disabled={exportando !== null}
        onClick={() => void exportar('xlsx')}
      >
        {exportando === 'xlsx' ? <Loader2 className="animate-spin" /> : <Download />}
        Excel
      </Button>
    </div>
  );
}

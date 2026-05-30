import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import type { ConsolidadoDTO } from '@financas-pessoais/shared';

const COLUNAS = [
  { header: 'Competência', chave: 'competencia' as const, largura: 14 },
  { header: 'Líquido recebido', chave: 'liquidoRecebido' as const, largura: 18 },
  { header: 'Gastos', chave: 'gastos' as const, largura: 14 },
  { header: 'Poupança', chave: 'poupanca' as const, largura: 14 },
  { header: 'Viagem', chave: 'viagem' as const, largura: 14 },
  { header: 'Sobras', chave: 'sobras' as const, largura: 14 },
];

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Gera os arquivos de exportação do consolidado localmente (sem serviço externo) — D5. */
@Injectable()
export class ExportacaoService {
  async gerarXlsx(consolidado: ConsolidadoDTO): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Consolidado');
    sheet.columns = COLUNAS.map((c) => ({ header: c.header, key: c.chave, width: c.largura }));
    sheet.getRow(1).font = { bold: true };

    for (const mes of consolidado.meses) {
      sheet.addRow({
        competencia: mes.competencia,
        liquidoRecebido: mes.liquidoRecebido,
        gastos: mes.gastos,
        poupanca: mes.poupanca,
        viagem: mes.viagem,
        sobras: mes.sobras,
      });
    }

    const totais = consolidado.totais;
    const linhaTotais = sheet.addRow({
      competencia: 'Totais',
      liquidoRecebido: totais.liquidoRecebido,
      gastos: totais.gastos,
      poupanca: totais.poupanca,
      viagem: totais.viagem,
      sobras: totais.sobras,
    });
    linhaTotais.font = { bold: true };

    for (const chave of ['liquidoRecebido', 'gastos', 'poupanca', 'viagem', 'sobras']) {
      sheet.getColumn(chave).numFmt = '#,##0.00';
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  gerarPdf(consolidado: ConsolidadoDTO): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40, layout: 'landscape' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text('Consolidado financeiro', { align: 'center' });
      doc
        .moveDown(0.3)
        .fontSize(10)
        .fillColor('#666')
        .text(`Período: ${consolidado.de} a ${consolidado.ate}`, { align: 'center' })
        .fillColor('#000');
      doc.moveDown(1);

      const larguras = [90, 130, 100, 100, 100, 100];
      const inicioX = doc.page.margins.left;
      let y = doc.y;

      const desenharLinha = (valores: string[], negrito: boolean): void => {
        doc.font(negrito ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
        let x = inicioX;
        valores.forEach((valor, i) => {
          doc.text(valor, x + 2, y + 4, { width: larguras[i] - 4, align: i === 0 ? 'left' : 'right' });
          x += larguras[i];
        });
        y += 20;
      };

      desenharLinha(COLUNAS.map((c) => c.header), true);
      for (const mes of consolidado.meses) {
        desenharLinha(
          [
            mes.competencia,
            BRL.format(mes.liquidoRecebido),
            BRL.format(mes.gastos),
            BRL.format(mes.poupanca),
            BRL.format(mes.viagem),
            BRL.format(mes.sobras),
          ],
          false,
        );
        if (y > doc.page.height - doc.page.margins.bottom - 30) {
          doc.addPage();
          y = doc.page.margins.top;
        }
      }

      const totais = consolidado.totais;
      desenharLinha(
        [
          'Totais',
          BRL.format(totais.liquidoRecebido),
          BRL.format(totais.gastos),
          BRL.format(totais.poupanca),
          BRL.format(totais.viagem),
          BRL.format(totais.sobras),
        ],
        true,
      );

      doc.end();
    });
  }
}

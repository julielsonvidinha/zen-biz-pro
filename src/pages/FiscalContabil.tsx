import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, Download, Loader2, Calendar, BookOpen, Calculator,
  Building2, Receipt, ChevronRight, CheckCircle, AlertTriangle
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

type SpedType = "efd_icms" | "efd_pis_cofins" | "ecd" | "simples";

interface SpedBlock {
  id: string;
  name: string;
  description: string;
  records: number;
}

interface GeneratedFile {
  type: SpedType;
  period: string;
  filename: string;
  size: string;
  generatedAt: string;
  blocks: SpedBlock[];
  content: string;
}

const spedTypes: { value: SpedType; label: string; icon: any; description: string; color: string }[] = [
  { value: "efd_icms", label: "SPED Fiscal (EFD ICMS/IPI)", icon: FileText, description: "Blocos 0, C, E, H, 1 — Obrigações estaduais", color: "text-primary" },
  { value: "efd_pis_cofins", label: "SPED Contribuições", icon: Calculator, description: "Blocos 0, A, C, M, 1 — Obrigações federais", color: "text-chart-4" },
  { value: "ecd", label: "SPED Contábil (ECD)", icon: BookOpen, description: "Livro diário digital para contabilidade", color: "text-success" },
  { value: "simples", label: "Simples Nacional (DAS)", icon: Building2, description: "Geração de guias do Simples", color: "text-warning" },
];

const FiscalContabil = () => {
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const canAccess = hasRole("admin") || hasRole("gerente");

  const [selectedType, setSelectedType] = useState<SpedType>("efd_icms");
  const [period, setPeriod] = useState(() => format(new Date(), "yyyy-MM"));
  const [generating, setGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [previewFile, setPreviewFile] = useState<GeneratedFile | null>(null);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    supabase.from("company_settings").select("*").limit(1).maybeSingle().then(({ data }) => {
      if (data) setCompany(data);
    });
  }, []);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const generateSpedFile = async () => {
    if (!canAccess) { toast({ title: "Sem permissão", variant: "destructive" }); return; }
    setGenerating(true);

    const [year, month] = period.split("-").map(Number);
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    const startStr = format(start, "yyyy-MM-dd");
    const endStr = format(end, "yyyy-MM-dd");

    try {
      // Fetch data
      const [salesRes, productsRes, movRes, payablesRes, receivablesRes, invoicesRes] = await Promise.all([
        supabase.from("sales").select("*").gte("created_at", startStr).lte("created_at", endStr + "T23:59:59"),
        supabase.from("products").select("*"),
        supabase.from("financial_movements").select("*").gte("created_at", startStr).lte("created_at", endStr + "T23:59:59"),
        supabase.from("accounts_payable").select("*").gte("due_date", startStr).lte("due_date", endStr),
        supabase.from("accounts_receivable").select("*").gte("due_date", startStr).lte("due_date", endStr),
        supabase.from("invoices").select("*").gte("created_at", startStr).lte("created_at", endStr + "T23:59:59"),
      ]);

      const sales = salesRes.data || [];
      const products = productsRes.data || [];
      const movements = movRes.data || [];
      const payables = payablesRes.data || [];
      const receivables = receivablesRes.data || [];
      const invoices = invoicesRes.data || [];

      const totalRevenue = sales.reduce((s, r) => s + Number(r.total), 0);
      const totalExpenses = payables.reduce((s, r) => s + Number(r.amount), 0);

      let blocks: SpedBlock[] = [];
      let lines: string[] = [];
      const cnpj = company?.cnpj || "00000000000000";
      const companyName = company?.company_name || "EMPRESA";
      const ie = company?.ie || "ISENTO";

      if (selectedType === "efd_icms") {
        // SPED Fiscal EFD ICMS/IPI
        blocks = [
          { id: "0", name: "Bloco 0 — Abertura", description: "Dados da empresa e plano de contas", records: 3 + products.length },
          { id: "C", name: "Bloco C — Documentos Fiscais", description: "NF-e, NFC-e e cupons fiscais", records: invoices.length * 2 },
          { id: "E", name: "Bloco E — Apuração ICMS", description: "Apuração do ICMS no período", records: 4 },
          { id: "H", name: "Bloco H — Inventário", description: "Estoque físico", records: products.length },
          { id: "1", name: "Bloco 1 — Outras Informações", description: "Informações complementares", records: 2 },
        ];

        lines.push(`|0000|017|0|${format(start, "ddMMyyyy")}|${format(end, "ddMMyyyy")}|${companyName}|${cnpj}||${company?.address_state || "SP"}|${ie}||A|1|`);
        lines.push(`|0001|0|`);
        lines.push(`|0005|${companyName}|${company?.address_zip || ""}|${company?.address_street || ""}|${company?.address_number || ""}|${company?.address_complement || ""}|${company?.address_neighborhood || ""}|${company?.phone || ""}||${company?.email || ""}|`);
        products.forEach((p, i) => {
          lines.push(`|0200|${p.sku || p.id}|${p.name}|${p.barcode || ""}|${p.unit}|${p.ncm || "00000000"}||0|${p.cst || "00"}|0|0|||`);
        });
        lines.push(`|0990|${3 + products.length}|`);

        lines.push(`|C001|${invoices.length > 0 ? "0" : "1"}|`);
        invoices.forEach(inv => {
          lines.push(`|C100|0|1|${cnpj}|55|00|${inv.series || 1}|${inv.number || ""}|${inv.access_key || ""}|${format(new Date(inv.created_at), "ddMMyyyy")}|${format(new Date(inv.created_at), "ddMMyyyy")}|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|`);
        });
        lines.push(`|C990|${invoices.length + 2}|`);

        lines.push(`|E001|0|`);
        const totalIcms = Math.round(totalRevenue * 0.12 * 100) / 100;
        lines.push(`|E100|${format(start, "ddMMyyyy")}|${format(end, "ddMMyyyy")}|`);
        lines.push(`|E110|${totalRevenue.toFixed(2)}|0|${totalRevenue.toFixed(2)}|0|0|0|0|${totalIcms.toFixed(2)}|0|${totalIcms.toFixed(2)}|0|0|0|`);
        lines.push(`|E990|4|`);

        lines.push(`|H001|0|`);
        products.forEach(p => {
          lines.push(`|H010|${p.sku || p.id}|${p.unit}|${Number(p.stock_qty).toFixed(3)}|${Number(p.cost_price).toFixed(2)}|${(Number(p.stock_qty) * Number(p.cost_price)).toFixed(2)}|0|0|0|0||`);
        });
        lines.push(`|H990|${products.length + 1}|`);

        lines.push(`|1001|0|`);
        lines.push(`|1010|N|N|N|N|N|N|N|N|N|N|N|N|`);
        lines.push(`|1990|2|`);
        lines.push(`|9001|0|`);
        lines.push(`|9900|0000|1|`);
        lines.push(`|9990|3|`);
        lines.push(`|9999|${lines.length + 1}|`);

      } else if (selectedType === "efd_pis_cofins") {
        // SPED Contribuições
        const totalPis = Math.round(totalRevenue * 0.0065 * 100) / 100;
        const totalCofins = Math.round(totalRevenue * 0.03 * 100) / 100;

        blocks = [
          { id: "0", name: "Bloco 0 — Abertura", description: "Identificação e tabelas", records: 3 },
          { id: "A", name: "Bloco A — Serviços", description: "Documentos de serviços", records: 1 },
          { id: "C", name: "Bloco C — Mercadorias", description: "Documentos de venda", records: sales.length + 2 },
          { id: "M", name: "Bloco M — Apuração", description: "Apuração PIS/COFINS", records: 6 },
          { id: "1", name: "Bloco 1 — Complementar", description: "Informações complementares", records: 2 },
        ];

        lines.push(`|0000|008|0|${format(start, "ddMMyyyy")}|${format(end, "ddMMyyyy")}|${companyName}|${cnpj}||${company?.address_state || "SP"}|${ie}|356||A|1|`);
        lines.push(`|0001|0|`);
        lines.push(`|0990|3|`);
        lines.push(`|A001|1|`);
        lines.push(`|A990|1|`);
        lines.push(`|C001|0|`);
        sales.forEach(sale => {
          lines.push(`|C100|0|0||55|00|1|${sale.sale_number}||${format(new Date(sale.created_at), "ddMMyyyy")}|${format(new Date(sale.created_at), "ddMMyyyy")}|${Number(sale.total).toFixed(2)}|0|0|0|0|0|0|0|0|0|0|0|0|0|0|`);
        });
        lines.push(`|C990|${sales.length + 2}|`);
        lines.push(`|M001|0|`);
        lines.push(`|M100|01|${totalRevenue.toFixed(2)}|${totalRevenue.toFixed(2)}|0.6500|${totalPis.toFixed(2)}|0|${totalPis.toFixed(2)}|01|`);
        lines.push(`|M500|01|${totalRevenue.toFixed(2)}|${totalRevenue.toFixed(2)}|3.0000|${totalCofins.toFixed(2)}|0|${totalCofins.toFixed(2)}|01|`);
        lines.push(`|M990|6|`);
        lines.push(`|1001|0|`);
        lines.push(`|1990|2|`);
        lines.push(`|9999|${lines.length + 1}|`);

      } else if (selectedType === "ecd") {
        // SPED Contábil
        const entries = movements.filter(m => m.type === "entrada");
        const exits = movements.filter(m => m.type === "saida");

        blocks = [
          { id: "0", name: "Bloco 0 — Abertura", description: "Dados da empresa", records: 3 },
          { id: "I", name: "Bloco I — Lançamentos", description: "Livro Diário", records: movements.length + 4 },
          { id: "J", name: "Bloco J — Demonstrações", description: "Balanço e DRE", records: 8 },
        ];

        lines.push(`|0000|LECD|${format(start, "ddMMyyyy")}|${format(end, "ddMMyyyy")}|${companyName}|${cnpj}||${company?.address_state || "SP"}|||G|0|0|N|`);
        lines.push(`|0001|0|`);
        lines.push(`|0990|3|`);
        lines.push(`|I001|0|`);
        lines.push(`|I010|G|`);
        lines.push(`|I030|01/${format(start, "MMyyyy")}|01|${companyName}|N|N|N|`);
        movements.forEach((m, idx) => {
          const acctDebit = m.type === "entrada" ? "1.1.1" : "3.1.1";
          const acctCredit = m.type === "entrada" ? "4.1.1" : "1.1.1";
          lines.push(`|I200|${idx + 1}|${format(new Date(m.created_at), "ddMMyyyy")}|${Number(m.amount).toFixed(2)}|D|`);
          lines.push(`|I250|${acctDebit}|${acctCredit}|${Number(m.amount).toFixed(2)}|D|0|||${m.description}|`);
        });
        lines.push(`|I990|${movements.length * 2 + 4}|`);

        lines.push(`|J001|0|`);
        lines.push(`|J005|${format(end, "ddMMyyyy")}|01|${format(start, "ddMMyyyy")}|${format(end, "ddMMyyyy")}|`);
        const totalIn = entries.reduce((s, m) => s + Number(m.amount), 0);
        const totalOut = exits.reduce((s, m) => s + Number(m.amount), 0);
        lines.push(`|J100|1.1.1|Caixa e Equivalentes|1|D|1|${totalIn.toFixed(2)}|${totalOut.toFixed(2)}|${(totalIn - totalOut).toFixed(2)}|D|`);
        lines.push(`|J100|4.1.1|Receita de Vendas|4|C|1|0|${totalIn.toFixed(2)}|${totalIn.toFixed(2)}|C|`);
        lines.push(`|J100|3.1.1|Despesas Operacionais|3|D|1|0|${totalOut.toFixed(2)}|${totalOut.toFixed(2)}|D|`);
        lines.push(`|J150|4.1.1|Receita de Vendas|${totalIn.toFixed(2)}|C|`);
        lines.push(`|J150|3.1.1|Despesas Operacionais|${totalOut.toFixed(2)}|D|`);
        lines.push(`|J150|Resultado do Período||${(totalIn - totalOut).toFixed(2)}|${totalIn > totalOut ? "C" : "D"}|`);
        lines.push(`|J990|8|`);
        lines.push(`|9999|${lines.length + 1}|`);

      } else if (selectedType === "simples") {
        // Simples Nacional / PGDAS
        blocks = [
          { id: "RBT", name: "Receita Bruta", description: "Faturamento do período", records: 1 },
          { id: "DAS", name: "Cálculo DAS", description: "Guia do Simples Nacional", records: 3 },
          { id: "ANX", name: "Anexos", description: "Enquadramento por atividade", records: 2 },
        ];

        const rbt12 = totalRevenue * 12;
        let aliquota = 0.06;
        let deducao = 0;
        if (rbt12 <= 180000) { aliquota = 0.04; deducao = 0; }
        else if (rbt12 <= 360000) { aliquota = 0.073; deducao = 5940; }
        else if (rbt12 <= 720000) { aliquota = 0.095; deducao = 13860; }
        else if (rbt12 <= 1800000) { aliquota = 0.107; deducao = 22500; }
        else if (rbt12 <= 3600000) { aliquota = 0.143; deducao = 87300; }
        else { aliquota = 0.19; deducao = 378000; }

        const aliqEfetiva = rbt12 > 0 ? (rbt12 * aliquota - deducao) / rbt12 : 0;
        const valorDas = totalRevenue * aliqEfetiva;

        lines.push(`PGDAS-D — PERÍODO: ${format(start, "MM/yyyy")}`);
        lines.push(`CNPJ: ${cnpj}`);
        lines.push(`RAZÃO SOCIAL: ${companyName}`);
        lines.push(`---`);
        lines.push(`RECEITA BRUTA NO PERÍODO: ${fmt(totalRevenue)}`);
        lines.push(`RECEITA BRUTA ÚLTIMOS 12 MESES (estimada): ${fmt(rbt12)}`);
        lines.push(`---`);
        lines.push(`FAIXA: ${rbt12 <= 180000 ? "1ª" : rbt12 <= 360000 ? "2ª" : rbt12 <= 720000 ? "3ª" : rbt12 <= 1800000 ? "4ª" : rbt12 <= 3600000 ? "5ª" : "6ª"} faixa`);
        lines.push(`ALÍQUOTA NOMINAL: ${(aliquota * 100).toFixed(2)}%`);
        lines.push(`DEDUÇÃO: ${fmt(deducao)}`);
        lines.push(`ALÍQUOTA EFETIVA: ${(aliqEfetiva * 100).toFixed(4)}%`);
        lines.push(`---`);
        lines.push(`VALOR DAS A RECOLHER: ${fmt(valorDas)}`);
        lines.push(`VENCIMENTO: 20/${format(end.getMonth() === 11 ? new Date(year + 1, 0, 1) : new Date(year, month, 1), "MM/yyyy")}`);
        lines.push(`---`);
        lines.push(`COMPOSIÇÃO POR TRIBUTO:`);
        lines.push(`  IRPJ:    ${fmt(valorDas * 0.055)}`);
        lines.push(`  CSLL:    ${fmt(valorDas * 0.035)}`);
        lines.push(`  COFINS:  ${fmt(valorDas * 0.1282)}`);
        lines.push(`  PIS:     ${fmt(valorDas * 0.0278)}`);
        lines.push(`  CPP:     ${fmt(valorDas * 0.4340)}`);
        lines.push(`  ICMS:    ${fmt(valorDas * 0.3360)}`);
      }

      const content = lines.join("\r\n");
      const periodLabel = format(start, "MMMM yyyy", { locale: ptBR });
      const typeLabel = spedTypes.find(t => t.value === selectedType)!.label;
      const ext = selectedType === "simples" ? "txt" : "txt";
      const filename = `${selectedType.toUpperCase()}_${format(start, "yyyyMM")}.${ext}`;

      const file: GeneratedFile = {
        type: selectedType,
        period: periodLabel,
        filename,
        size: `${(content.length / 1024).toFixed(1)} KB`,
        generatedAt: format(new Date(), "dd/MM/yyyy HH:mm"),
        blocks,
        content,
      };

      setGeneratedFiles(prev => [file, ...prev]);
      toast({ title: `✅ ${typeLabel} gerado com sucesso!`, description: `Período: ${periodLabel} • ${blocks.reduce((s, b) => s + b.records, 0)} registros` });
    } catch (e: any) {
      toast({ title: "Erro ao gerar arquivo", description: e.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  const downloadFile = (file: GeneratedFile) => {
    const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.filename;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Download iniciado", description: file.filename });
  };

  if (!canAccess) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-64">
        <div className="text-center"><AlertTriangle className="w-12 h-12 text-warning mx-auto mb-3" /><p className="text-lg font-semibold">Acesso Restrito</p><p className="text-sm text-muted-foreground">Apenas administradores e gerentes podem acessar este módulo.</p></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><BookOpen className="w-5 h-5 text-primary" /></div>
        <div className="flex-1"><h1 className="text-xl font-bold">Fiscal & Contábil</h1><p className="text-sm text-muted-foreground">Geração de arquivos SPED, ECD e Simples Nacional</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Config */}
        <div className="space-y-4">
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Tipo de Arquivo</Label>
                <div className="space-y-2 mt-2">
                  {spedTypes.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setSelectedType(t.value)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedType === t.value ? "border-primary bg-primary/5" : "border-border/50 hover:bg-muted/30"}`}
                    >
                      <div className="flex items-center gap-2">
                        <t.icon className={`w-4 h-4 ${t.color}`} />
                        <span className="text-sm font-semibold">{t.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 ml-6">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Período de Apuração</Label>
                <Input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="mt-1.5" />
              </div>

              <Button className="w-full gap-2 h-12" onClick={generateSpedFile} disabled={generating}>
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Gerar Arquivo
              </Button>
            </CardContent>
          </Card>

          {company && (
            <Card className="border-border/50">
              <CardContent className="p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Empresa</p>
                <p className="text-sm font-semibold">{company.company_name}</p>
                <p className="text-xs text-muted-foreground">{company.cnpj || "CNPJ não configurado"}</p>
                <p className="text-xs text-muted-foreground">{company.ie || "IE não configurada"}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Generated files */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3">Arquivos Gerados</p>
              {generatedFiles.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum arquivo gerado</p>
                  <p className="text-xs text-muted-foreground/70">Selecione o tipo e período, e clique em "Gerar Arquivo"</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {generatedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-success" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{file.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.period} • {file.size} • {file.blocks.reduce((s, b) => s + b.records, 0)} registros
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setPreviewFile(file)} className="text-xs gap-1">
                          <FileText className="w-3 h-3" /> Visualizar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => downloadFile(file)} className="text-xs gap-1">
                          <Download className="w-3 h-3" /> Baixar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blocks info of last generated */}
          {generatedFiles.length > 0 && (
            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-3">Blocos do Último Arquivo</p>
                <div className="space-y-1.5">
                  {generatedFiles[0].blocks.map(block => (
                    <div key={block.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-semibold">{block.name}</p>
                          <p className="text-[10px] text-muted-foreground">{block.description}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{block.records} reg.</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Preview dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="w-4 h-4" /> {previewFile?.filename}</DialogTitle>
            <DialogDescription>{previewFile?.period} • Gerado em {previewFile?.generatedAt}</DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[50vh] bg-muted/50 rounded-lg p-4">
            <pre className="text-xs font-mono whitespace-pre-wrap break-all leading-relaxed">{previewFile?.content}</pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewFile(null)}>Fechar</Button>
            <Button onClick={() => previewFile && downloadFile(previewFile)} className="gap-1"><Download className="w-4 h-4" /> Baixar Arquivo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FiscalContabil;

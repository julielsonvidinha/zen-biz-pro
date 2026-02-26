import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2, Download, XCircle, Edit } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Invoice {
  id: string;
  sale_id: string;
  type: string;
  number: number | null;
  series: number;
  status: string;
  access_key: string | null;
  protocol: string | null;
  rejection_reason: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pendente: "secondary",
  autorizada: "default",
  rejeitada: "destructive",
  cancelada: "outline",
};

const Fiscal = () => {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<Invoice | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState<Invoice | null>(null);
  const [correctionText, setCorrectionText] = useState("");
  const [sendingCorrection, setSendingCorrection] = useState(false);

  const canManage = hasRole("admin") || hasRole("gerente");

  const fetchInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false }).limit(50);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else setInvoices((data as Invoice[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchInvoices(); }, []);

  const cancelInvoice = async () => {
    if (!cancelTarget) return;
    setCanceling(true);
    try {
      const { data, error } = await supabase.functions.invoke("emit-nfe", {
        body: { action: "cancel", invoice_id: cancelTarget.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "NF-e cancelada com sucesso!" });
      fetchInvoices();
    } catch (e: any) {
      toast({ title: "Erro ao cancelar", description: e.message, variant: "destructive" });
    }
    setCanceling(false);
    setCancelTarget(null);
  };

  const sendCorrection = async () => {
    if (!correctionTarget || !correctionText.trim()) return;
    setSendingCorrection(true);
    try {
      const { data, error } = await supabase.functions.invoke("emit-nfe", {
        body: { action: "correction", invoice_id: correctionTarget.id, correction_text: correctionText },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Carta de correção enviada!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setSendingCorrection(false);
    setCorrectionTarget(null);
    setCorrectionText("");
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Módulo Fiscal</h1>
          <p className="text-sm text-muted-foreground">NF-e, NFC-e e gestão de notas fiscais (Homologação)</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/50">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Número</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Chave de Acesso</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Data</th>
                  {canManage && <th className="p-3 w-36"></th>}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="p-3 text-sm font-medium uppercase">{inv.type}</td>
                    <td className="p-3 text-sm font-mono">{inv.number || "—"}</td>
                    <td className="p-3 text-xs font-mono text-muted-foreground truncate max-w-[200px]">{inv.access_key || "—"}</td>
                    <td className="p-3 text-center">
                      <Badge variant={statusColors[inv.status] as any || "secondary"}>{inv.status}</Badge>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{new Date(inv.created_at).toLocaleDateString("pt-BR")}</td>
                    {canManage && (
                      <td className="p-3 flex gap-1 justify-end">
                        {inv.status === "autorizada" && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => setCancelTarget(inv)} className="text-xs gap-1">
                              <XCircle className="w-3 h-3" /> Cancelar
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setCorrectionTarget(inv); setCorrectionText(""); }} className="text-xs gap-1">
                              <Edit className="w-3 h-3" /> CC-e
                            </Button>
                          </>
                        )}
                        {inv.rejection_reason && (
                          <span className="text-xs text-destructive">{inv.rejection_reason}</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr><td colSpan={canManage ? 6 : 5} className="p-12 text-center text-muted-foreground text-sm">Nenhuma nota fiscal emitida</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Cancel dialog */}
      <AlertDialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar NF-e?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação enviará o cancelamento à SEFAZ. Só é permitido dentro do prazo legal.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={cancelInvoice} disabled={canceling} className="bg-destructive text-destructive-foreground">
              {canceling && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Correction letter dialog */}
      <Dialog open={!!correctionTarget} onOpenChange={() => setCorrectionTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Carta de Correção (CC-e)</DialogTitle>
            <DialogDescription>Informe o texto da correção (mínimo 15 caracteres)</DialogDescription>
          </DialogHeader>
          <Textarea value={correctionText} onChange={e => setCorrectionText(e.target.value)} placeholder="Descreva a correção..." rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectionTarget(null)}>Cancelar</Button>
            <Button onClick={sendCorrection} disabled={sendingCorrection || correctionText.trim().length < 15}>
              {sendingCorrection && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Enviar CC-e
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Fiscal;

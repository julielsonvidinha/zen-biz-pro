import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateSaleReceiptPDF, generateSaleFullPDF } from "@/lib/pdf-generator";
import {
  Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote,
  QrCode, User, Loader2, FileText, Download, Receipt, XCircle, Monitor, Users
} from "lucide-react";

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  qty: number;
  stock_qty: number;
}

interface ProductResult {
  id: string;
  name: string;
  price: number;
  barcode: string | null;
  stock_qty: number;
}

interface CustomerResult {
  id: string;
  name: string;
  cpf_cnpj: string | null;
  phone: string | null;
}

const PDV = () => {
  const { toast } = useToast();
  const { user, profile, hasRole } = useAuth();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchResults, setSearchResults] = useState<ProductResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerCpf, setCustomerCpf] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [emittingNfe, setEmittingNfe] = useState(false);
  const [company, setCompany] = useState<any>(null);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);

  // Crediário
  const [installments, setInstallments] = useState("3");

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const discount = 0;
  const finalTotal = total - discount;

  useEffect(() => {
    supabase.from("company_settings").select("*").limit(1).maybeSingle().then(({ data }) => {
      if (data) setCompany(data);
    });
  }, []);

  // Product search
  const searchProducts = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, price, barcode, stock_qty")
      .eq("active", true)
      .or(`name.ilike.%${q}%,barcode.eq.${q}`)
      .limit(10);
    setSearchResults((data as ProductResult[]) || []);
    setSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(search), 300);
    return () => clearTimeout(timer);
  }, [search, searchProducts]);

  // Customer search
  const searchCustomers = useCallback(async (q: string) => {
    if (q.length < 2) { setCustomerResults([]); return; }
    setSearchingCustomer(true);
    const { data } = await supabase
      .from("customers")
      .select("id, name, cpf_cnpj, phone")
      .eq("active", true)
      .or(`name.ilike.%${q}%,cpf_cnpj.ilike.%${q}%`)
      .limit(8);
    setCustomerResults((data as CustomerResult[]) || []);
    setSearchingCustomer(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchCustomers(customerSearch), 300);
    return () => clearTimeout(timer);
  }, [customerSearch, searchCustomers]);

  const selectCustomer = (c: CustomerResult) => {
    setSelectedCustomer(c);
    setCustomerName(c.name);
    setCustomerCpf(c.cpf_cnpj || "");
    setCustomerSearch("");
    setCustomerResults([]);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerName("");
    setCustomerCpf("");
  };

  const addToCart = (product: ProductResult) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i => i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { product_id: product.id, name: product.name, price: Number(product.price), qty: 1, stock_qty: Number(product.stock_qty) }];
    });
    setSearch("");
    setSearchResults([]);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev =>
      prev.map(i => i.product_id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0)
    );
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.product_id !== id));

  const cancelSale = () => {
    setCart([]); setPaymentMethod(null); clearCustomer(); setInstallments("3");
    setCancelDialogOpen(false);
    toast({ title: "Venda cancelada" });
  };

  const finalizeSale = async () => {
    if (!paymentMethod) { toast({ title: "Selecione a forma de pagamento", variant: "destructive" }); return; }
    if (cart.length === 0) { toast({ title: "Carrinho vazio", variant: "destructive" }); return; }
    if (paymentMethod === "crediario" && !selectedCustomer) {
      toast({ title: "Crediário requer um cliente cadastrado", description: "Selecione um cliente antes de continuar.", variant: "destructive" }); return;
    }
    const overStock = cart.find(i => i.qty > i.stock_qty);
    if (overStock) { toast({ title: `Estoque insuficiente: ${overStock.name}`, description: `Disponível: ${overStock.stock_qty}`, variant: "destructive" }); return; }

    setFinalizing(true);
    const items = cart.map(i => ({
      product_id: i.product_id, product_name: i.name, qty: i.qty,
      unit_price: i.price, total: i.price * i.qty,
    }));

    const { data: saleId, error } = await supabase.rpc("finalize_sale", {
      p_customer_name: customerName || null, p_customer_cpf: customerCpf || null,
      p_subtotal: total, p_discount: discount, p_total: finalTotal,
      p_payment_method: paymentMethod, p_items: items,
    });

    if (error) { toast({ title: "Erro ao finalizar venda", description: error.message, variant: "destructive" }); setFinalizing(false); return; }

    // If crediário, create installments in accounts_receivable
    if (paymentMethod === "crediario" && saleId) {
      const numInstallments = parseInt(installments);
      const installmentValue = Math.round((finalTotal / numInstallments) * 100) / 100;
      const remainder = Math.round((finalTotal - installmentValue * numInstallments) * 100) / 100;

      for (let i = 0; i < numInstallments; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + (i + 1));
        const amount = i === numInstallments - 1 ? installmentValue + remainder : installmentValue;

        await supabase.from("accounts_receivable").insert({
          description: `Crediário Venda #${saleId} - Parcela ${i + 1}/${numInstallments}`,
          amount,
          due_date: dueDate.toISOString().split("T")[0],
          user_id: user!.id,
          customer_id: selectedCustomer?.id || null,
        });
      }
    }

    const { data: saleData } = await supabase.from("sales").select("*").eq("id", saleId).single();
    setCompletedSale({ ...saleData, items, operator_name: profile?.full_name, company });
    setCart([]); setPaymentMethod(null); clearCustomer(); setInstallments("3");
    setFinalizing(false); setReceiptDialogOpen(true);
    toast({ title: "✅ Venda finalizada com sucesso!" });
  };

  const downloadReceipt = () => {
    if (!completedSale) return;
    setGeneratingPdf(true);
    try {
      const doc = generateSaleReceiptPDF(completedSale);
      doc.save(`comprovante-venda-${completedSale.sale_number}.pdf`);
    } catch (e: any) { toast({ title: "Erro ao gerar comprovante", description: e.message, variant: "destructive" }); }
    setGeneratingPdf(false);
  };

  const downloadFullPdf = () => {
    if (!completedSale) return;
    setGeneratingPdf(true);
    try {
      const doc = generateSaleFullPDF(completedSale);
      doc.save(`venda-${completedSale.sale_number}.pdf`);
    } catch (e: any) { toast({ title: "Erro ao gerar PDF", description: e.message, variant: "destructive" }); }
    setGeneratingPdf(false);
  };

  const emitNfe = async () => {
    if (!completedSale) return;
    setEmittingNfe(true);
    try {
      const { data, error } = await supabase.functions.invoke("emit-nfe", { body: { sale_id: completedSale.id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.status === "autorizada") toast({ title: "NF-e emitida!", description: `Protocolo: ${data.protocol}` });
      else if (data?.status === "rejeitada") toast({ title: "NF-e rejeitada", description: data.rejection_reason, variant: "destructive" });
    } catch (e: any) { toast({ title: "Erro ao emitir NF-e", description: e.message, variant: "destructive" }); }
    setEmittingNfe(false);
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const paymentMethods = [
    { value: "dinheiro", label: "Dinheiro", icon: Banknote, color: "text-success" },
    { value: "cartao", label: "Cartão", icon: CreditCard, color: "text-primary" },
    { value: "pix", label: "PIX", icon: QrCode, color: "text-chart-4" },
    { value: "crediario", label: "Crediário", icon: FileText, color: "text-warning" },
  ];

  return (
    <div className="animate-fade-in h-[calc(100vh-3rem)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-1 py-2 border-b border-border/50 bg-muted/30 rounded-t-lg mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Monitor className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">
              {company?.trade_name || company?.company_name || "PDV"} — Frente de Caixa
            </h1>
            <p className="text-[11px] text-muted-foreground capitalize">{dateStr} • {timeStr}</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 py-1 px-3">
          <User className="w-3 h-3" />
          <span className="text-xs">{profile?.full_name || "Operador"}</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Left: Search + Cart */}
        <div className="lg:col-span-8 flex flex-col gap-3 min-h-0">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="🔍 Buscar produto por nome ou código de barras... (F2)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-12 h-14 text-lg font-medium border-2 border-primary/30 focus:border-primary rounded-xl"
              autoFocus
            />
            {searchResults.length > 0 && (
              <Card className="absolute z-50 top-full mt-1 left-0 right-0 border-primary/20 shadow-xl rounded-xl overflow-hidden">
                <CardContent className="p-0">
                  {searchResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="w-full flex items-center justify-between p-4 hover:bg-primary/5 border-b border-border/30 last:border-0 text-left transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.barcode || "Sem código"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-mono font-bold text-primary">R$ {Number(p.price).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Estoque: {Number(p.stock_qty)}</p>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
            {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />}
          </div>

          {/* Cart Table */}
          <Card className="flex-1 border-border/50 overflow-auto rounded-xl min-h-0">
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-primary text-primary-foreground">
                    <th className="text-left p-3 text-xs font-semibold w-12">#</th>
                    <th className="text-left p-3 text-xs font-semibold">PRODUTO</th>
                    <th className="text-center p-3 text-xs font-semibold w-36">QTD</th>
                    <th className="text-right p-3 text-xs font-semibold w-28">UNIT.</th>
                    <th className="text-right p-3 text-xs font-semibold w-28">TOTAL</th>
                    <th className="p-3 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => (
                    <tr key={item.product_id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-sm text-muted-foreground font-mono">{idx + 1}</td>
                      <td className="p-3"><p className="text-sm font-semibold">{item.name}</p></td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => updateQty(item.product_id, -1)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-destructive/20 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="font-mono text-base font-bold w-10 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.product_id, 1)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-success/20 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono text-sm">R$ {item.price.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-sm font-bold">R$ {(item.price * item.qty).toFixed(2)}</td>
                      <td className="p-3">
                        <button onClick={() => removeItem(item.product_id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {cart.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-16 text-center">
                        <ShoppingCart className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                        <p className="text-muted-foreground text-sm font-medium">Nenhum item no carrinho</p>
                        <p className="text-muted-foreground/60 text-xs mt-1">Busque e adicione produtos acima</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Bottom totals bar */}
          <div className="flex items-center justify-between bg-foreground text-background rounded-xl p-4">
            <div className="flex items-center gap-6">
              <div><p className="text-xs opacity-70">Itens</p><p className="text-xl font-bold font-mono">{totalItems}</p></div>
              <div><p className="text-xs opacity-70">Subtotal</p><p className="text-lg font-mono">R$ {total.toFixed(2)}</p></div>
              {discount > 0 && <div><p className="text-xs opacity-70">Desconto</p><p className="text-lg font-mono text-success">- R$ {discount.toFixed(2)}</p></div>}
            </div>
            <div className="text-right">
              <p className="text-xs opacity-70">TOTAL A PAGAR</p>
              <p className="text-3xl font-extrabold font-mono">R$ {finalTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Right: Payment */}
        <div className="lg:col-span-4 flex flex-col gap-3 min-h-0 overflow-y-auto">
          {/* Customer selector */}
          <Card className="border-border/50 rounded-xl">
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Cliente
              </p>
              {selectedCustomer ? (
                <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2.5">
                  <div>
                    <p className="text-sm font-semibold">{selectedCustomer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedCustomer.cpf_cnpj || "Sem CPF/CNPJ"}
                      {selectedCustomer.phone ? ` • ${selectedCustomer.phone}` : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearCustomer} className="h-7 w-7">
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente (nome ou CPF)..."
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                  {searchingCustomer && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                  {customerResults.length > 0 && (
                    <Card className="absolute z-50 top-full mt-1 left-0 right-0 shadow-lg rounded-lg overflow-hidden">
                      <CardContent className="p-0">
                        {customerResults.map(c => (
                          <button key={c.id} onClick={() => selectCustomer(c)} className="w-full text-left p-3 hover:bg-muted/50 border-b border-border/30 last:border-0 transition-colors">
                            <p className="text-sm font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.cpf_cnpj || "Sem CPF/CNPJ"}</p>
                          </button>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
              {/* Manual fields fallback */}
              {!selectedCustomer && (
                <div className="space-y-1.5">
                  <Input placeholder="Ou digite o nome (opcional)" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-8 text-xs" />
                  <Input placeholder="CPF na nota (opcional)" value={customerCpf} onChange={e => setCustomerCpf(e.target.value)} className="h-8 text-xs" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment methods */}
          <Card className="border-border/50 rounded-xl">
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Forma de Pagamento</p>
              {paymentMethods.map(pm => (
                <Button
                  key={pm.value}
                  className={`w-full justify-start gap-3 h-11 text-sm ${paymentMethod === pm.value ? "ring-2 ring-primary" : ""}`}
                  variant={paymentMethod === pm.value ? "default" : "outline"}
                  onClick={() => setPaymentMethod(pm.value)}
                >
                  <pm.icon className={`w-5 h-5 ${paymentMethod === pm.value ? "" : pm.color}`} />
                  {pm.label}
                </Button>
              ))}

              {/* Installments for crediário */}
              {paymentMethod === "crediario" && (
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 space-y-2">
                  <Label className="text-xs font-semibold text-warning">Parcelas do Crediário</Label>
                  <Select value={installments} onValueChange={setInstallments}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                        <SelectItem key={n} value={String(n)}>
                          {n}x de R$ {(finalTotal / n).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Vencimentos mensais a partir de 30 dias. {!selectedCustomer && "⚠️ Selecione um cliente cadastrado."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="space-y-2 mt-auto">
            <Button
              className="w-full h-14 text-lg font-bold rounded-xl gap-2"
              size="lg"
              disabled={cart.length === 0 || !paymentMethod || finalizing}
              onClick={finalizeSale}
            >
              {finalizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
              FINALIZAR VENDA (F12)
            </Button>
            {cart.length > 0 && (
              <Button className="w-full h-10 rounded-xl" variant="outline" onClick={() => setCancelDialogOpen(true)}>
                <XCircle className="w-4 h-4 mr-2" /> Cancelar Venda (ESC)
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel confirmation */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar venda?</AlertDialogTitle>
            <AlertDialogDescription>Todos os itens do carrinho serão removidos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={cancelSale} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirmar Cancelamento</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Post-sale receipt dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-success" /> Venda Finalizada!</DialogTitle>
            <DialogDescription>Venda #{completedSale?.sale_number} • R$ {Number(completedSale?.total || 0).toFixed(2)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button className="w-full gap-2" variant="outline" onClick={downloadReceipt} disabled={generatingPdf}>
              {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />} Imprimir Comprovante (Térmica)
            </Button>
            <Button className="w-full gap-2" variant="outline" onClick={downloadFullPdf} disabled={generatingPdf}>
              {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Gerar PDF Completo da Venda
            </Button>
            {(hasRole("admin") || hasRole("gerente")) && (
              <Button className="w-full gap-2" variant="outline" onClick={emitNfe} disabled={emittingNfe}>
                {emittingNfe ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Emitir NF-e / NFC-e (Homologação)
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setReceiptDialogOpen(false)} className="w-full">Nova Venda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PDV;

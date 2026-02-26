import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateSaleReceiptPDF, generateSaleFullPDF } from "@/lib/pdf-generator";
import {
  Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote,
  QrCode, User, Loader2, FileText, Download, Receipt, XCircle
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

const PDV = () => {
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchResults, setSearchResults] = useState<ProductResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerCpf, setCustomerCpf] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Post-sale state
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [emittingNfe, setEmittingNfe] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = 0;

  // Search products
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
    setCart([]);
    setPaymentMethod(null);
    setCustomerName("");
    setCustomerCpf("");
    setCancelDialogOpen(false);
    toast({ title: "Venda cancelada" });
  };

  const finalizeSale = async () => {
    if (!paymentMethod) {
      toast({ title: "Selecione a forma de pagamento", variant: "destructive" });
      return;
    }
    if (cart.length === 0) {
      toast({ title: "Carrinho vazio", variant: "destructive" });
      return;
    }
    // Validate stock
    const overStock = cart.find(i => i.qty > i.stock_qty);
    if (overStock) {
      toast({ title: `Estoque insuficiente: ${overStock.name}`, description: `Disponível: ${overStock.stock_qty}`, variant: "destructive" });
      return;
    }

    setFinalizing(true);
    const items = cart.map(i => ({
      product_id: i.product_id,
      product_name: i.name,
      qty: i.qty,
      unit_price: i.price,
      total: i.price * i.qty,
    }));

    const { data: saleId, error } = await supabase.rpc("finalize_sale", {
      p_customer_name: customerName || null,
      p_customer_cpf: customerCpf || null,
      p_subtotal: total,
      p_discount: discount,
      p_total: total - discount,
      p_payment_method: paymentMethod,
      p_items: items,
    });

    if (error) {
      toast({ title: "Erro ao finalizar venda", description: error.message, variant: "destructive" });
      setFinalizing(false);
      return;
    }

    // Fetch completed sale for receipt
    const { data: saleData } = await supabase
      .from("sales")
      .select("*")
      .eq("id", saleId)
      .single();

    setCompletedSale({ ...saleData, items });
    setCart([]);
    setPaymentMethod(null);
    setCustomerName("");
    setCustomerCpf("");
    setFinalizing(false);
    setReceiptDialogOpen(true);
    toast({ title: "Venda finalizada com sucesso!" });
  };

  const downloadReceipt = () => {
    if (!completedSale) return;
    setGeneratingPdf(true);
    try {
      const doc = generateSaleReceiptPDF(completedSale);
      doc.save(`comprovante-venda-${completedSale.sale_number}.pdf`);
    } catch (e: any) {
      toast({ title: "Erro ao gerar comprovante", description: e.message, variant: "destructive" });
    }
    setGeneratingPdf(false);
  };

  const downloadFullPdf = () => {
    if (!completedSale) return;
    setGeneratingPdf(true);
    try {
      const doc = generateSaleFullPDF(completedSale);
      doc.save(`venda-${completedSale.sale_number}.pdf`);
    } catch (e: any) {
      toast({ title: "Erro ao gerar PDF", description: e.message, variant: "destructive" });
    }
    setGeneratingPdf(false);
  };

  const emitNfe = async () => {
    if (!completedSale) return;
    setEmittingNfe(true);
    try {
      const { data, error } = await supabase.functions.invoke("emit-nfe", {
        body: { sale_id: completedSale.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.status === "autorizada") {
        toast({ title: "NF-e emitida com sucesso!", description: `Protocolo: ${data.protocol}` });
      } else if (data?.status === "rejeitada") {
        toast({ title: "NF-e rejeitada pela SEFAZ", description: data.rejection_reason, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erro ao emitir NF-e", description: e.message, variant: "destructive" });
    }
    setEmittingNfe(false);
  };

  return (
    <div className="animate-fade-in h-[calc(100vh-3rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
        {/* Products search + cart */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Frente de Caixa</h1>
            </div>
            <Badge variant="outline" className="gap-1">
              <User className="w-3 h-3" />
              {customerName || "Cliente não identificado"}
            </Badge>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto por nome ou código de barras..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-12 text-base"
              autoFocus
            />
            {/* Search dropdown */}
            {searchResults.length > 0 && (
              <Card className="absolute z-50 top-full mt-1 left-0 right-0 border-border/50 shadow-lg">
                <CardContent className="p-0">
                  {searchResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 border-b border-border/50 last:border-0 text-left"
                    >
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.barcode || "Sem código"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-semibold">R$ {Number(p.price).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Estoque: {Number(p.stock_qty)}</p>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
            {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
          </div>

          {/* Cart Items */}
          <Card className="flex-1 border-border/50 overflow-auto">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/50">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Produto</th>
                    <th className="text-center p-3 text-xs font-medium text-muted-foreground w-32">Qtd</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground w-28">Unit.</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground w-28">Total</th>
                    <th className="p-3 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.product_id} className="border-b border-border/50 last:border-0">
                      <td className="p-3 text-sm font-medium">{item.name}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => updateQty(item.product_id, -1)} className="w-7 h-7 rounded bg-muted flex items-center justify-center hover:bg-muted-foreground/20">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-sm w-8 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.product_id, 1)} className="w-7 h-7 rounded bg-muted flex items-center justify-center hover:bg-muted-foreground/20">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono text-sm">R$ {item.price.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-sm font-semibold">R$ {(item.price * item.qty).toFixed(2)}</td>
                      <td className="p-3">
                        <button onClick={() => removeItem(item.product_id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cart.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-muted-foreground text-sm">
                        Busque e adicione produtos ao carrinho
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Payment panel */}
        <Card className="border-border/50 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Customer info */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Cliente (opcional)</Label>
                <Input placeholder="Nome do cliente" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-9 text-sm" />
                <Input placeholder="CPF" value={customerCpf} onChange={e => setCustomerCpf(e.target.value)} className="h-9 text-sm" />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">R$ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto</span>
                <span className="font-mono text-success">- R$ {discount.toFixed(2)}</span>
              </div>
              <div className="border-t border-border/50 pt-3 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold font-mono text-primary">
                  R$ {(total - discount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2 mt-6">
              <p className="text-xs text-muted-foreground font-medium mb-2">Forma de pagamento</p>
              {[
                { value: "dinheiro", label: "Dinheiro", icon: Banknote, color: "text-success" },
                { value: "cartao", label: "Cartão", icon: CreditCard, color: "text-primary" },
                { value: "pix", label: "PIX", icon: QrCode, color: "text-chart-4" },
              ].map(pm => (
                <Button
                  key={pm.value}
                  className="w-full justify-start gap-3"
                  variant={paymentMethod === pm.value ? "default" : "outline"}
                  size="lg"
                  onClick={() => setPaymentMethod(pm.value)}
                >
                  <pm.icon className={`w-5 h-5 ${paymentMethod === pm.value ? "" : pm.color}`} />
                  {pm.label}
                </Button>
              ))}

              <Button
                className="w-full mt-4"
                size="lg"
                disabled={cart.length === 0 || !paymentMethod || finalizing}
                onClick={finalizeSale}
              >
                {finalizing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Finalizar Venda
              </Button>

              {cart.length > 0 && (
                <Button
                  className="w-full"
                  variant="outline"
                  size="lg"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar Venda
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
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
            <AlertDialogAction onClick={cancelSale} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Post-sale receipt dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-success" />
              Venda Finalizada!
            </DialogTitle>
            <DialogDescription>
              Venda #{completedSale?.sale_number} • R$ {Number(completedSale?.total || 0).toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button className="w-full gap-2" variant="outline" onClick={downloadReceipt} disabled={generatingPdf}>
              {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
              Imprimir Comprovante (Térmica)
            </Button>
            <Button className="w-full gap-2" variant="outline" onClick={downloadFullPdf} disabled={generatingPdf}>
              {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Gerar PDF Completo da Venda
            </Button>
            {(hasRole("admin") || hasRole("gerente")) && (
              <Button className="w-full gap-2" variant="outline" onClick={emitNfe} disabled={emittingNfe}>
                {emittingNfe ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Emitir NF-e / NFC-e (Homologação)
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setReceiptDialogOpen(false)} className="w-full">
              Nova Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PDV;

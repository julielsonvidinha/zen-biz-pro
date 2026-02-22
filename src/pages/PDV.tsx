import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, QrCode, User } from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

const PDV = () => {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([
    { id: "1", name: "Dipirona 500mg", price: 8.9, qty: 2 },
    { id: "2", name: "Algodão 50g", price: 5.5, qty: 1 },
    { id: "3", name: "Soro Fisiológico 500ml", price: 12.0, qty: 3 },
  ]);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="animate-fade-in h-[calc(100vh-3rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
        {/* Products search */}
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
              Cliente não identificado
            </Badge>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, código de barras ou nome do produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-base"
              autoFocus
            />
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
                  {cart.map((item) => (
                    <tr key={item.id} className="border-b border-border/50 last:border-0">
                      <td className="p-3 text-sm font-medium">{item.name}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded bg-muted flex items-center justify-center hover:bg-muted-foreground/20">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-sm w-8 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded bg-muted flex items-center justify-center hover:bg-muted-foreground/20">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono text-sm">R$ {item.price.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-sm font-semibold">R$ {(item.price * item.qty).toFixed(2)}</td>
                      <td className="p-3">
                        <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cart.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-muted-foreground text-sm">
                        Nenhum item no carrinho
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
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">R$ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto</span>
                <span className="font-mono text-success">- R$ 0,00</span>
              </div>
              <div className="border-t border-border/50 pt-3 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold font-mono text-primary">
                  R$ {total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2 mt-6">
              <p className="text-xs text-muted-foreground font-medium mb-2">Forma de pagamento</p>
              <Button className="w-full justify-start gap-3" variant="outline" size="lg">
                <Banknote className="w-5 h-5 text-success" /> Dinheiro
              </Button>
              <Button className="w-full justify-start gap-3" variant="outline" size="lg">
                <CreditCard className="w-5 h-5 text-primary" /> Cartão
              </Button>
              <Button className="w-full justify-start gap-3" variant="outline" size="lg">
                <QrCode className="w-5 h-5 text-chart-4" /> PIX
              </Button>
              <Button className="w-full mt-4" size="lg" disabled={cart.length === 0}>
                Finalizar Venda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PDV;

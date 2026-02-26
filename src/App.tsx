import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PDV from "./pages/PDV";
import Produtos from "./pages/Produtos";
import Fiscal from "./pages/Fiscal";
import NotFound from "./pages/NotFound";
import { ModulePage } from "./pages/ModulePage";
import {
  Users, Truck, Package, Warehouse, ShoppingBag, Receipt,
  CreditCard, Wallet, FileText, Landmark, BarChart3, UserCog,
  Settings, Shield, Pill, Scissors
} from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/pdv" element={<AppLayout><PDV /></AppLayout>} />
            <Route path="/clientes" element={<AppLayout><ModulePage title="Clientes" description="Gerencie seus clientes" icon={Users} /></AppLayout>} />
            <Route path="/fornecedores" element={<AppLayout><ModulePage title="Fornecedores" description="Gerencie seus fornecedores" icon={Truck} /></AppLayout>} />
            <Route path="/produtos" element={<AppLayout><Produtos /></AppLayout>} />
            <Route path="/estoque" element={<AppLayout><ModulePage title="Estoque" description="Controle de estoque e movimentações" icon={Warehouse} /></AppLayout>} />
            <Route path="/compras" element={<AppLayout><ModulePage title="Compras" description="Pedidos e cotações com fornecedores" icon={ShoppingBag} /></AppLayout>} />
            <Route path="/vendas" element={<AppLayout><ModulePage title="Vendas" description="Histórico e gestão de vendas" icon={Receipt} /></AppLayout>} />
            <Route path="/contas-pagar" element={<AppLayout><ModulePage title="Contas a Pagar" description="Controle de pagamentos e vencimentos" icon={CreditCard} /></AppLayout>} />
            <Route path="/contas-receber" element={<AppLayout><ModulePage title="Contas a Receber" description="Controle de recebíveis e inadimplência" icon={Wallet} /></AppLayout>} />
            <Route path="/crediario" element={<AppLayout><ModulePage title="Crediário" description="Gestão de crediário e carnês" icon={FileText} /></AppLayout>} />
            <Route path="/financeiro" element={<AppLayout><ModulePage title="Financeiro" description="Fluxo de caixa, DRE e conciliação" icon={Landmark} /></AppLayout>} />
            <Route path="/fiscal" element={<AppLayout><Fiscal /></AppLayout>} />
            <Route path="/relatorios" element={<AppLayout><ModulePage title="Relatórios" description="Relatórios gerenciais e exportação" icon={BarChart3} /></AppLayout>} />
            <Route path="/farmacia" element={<AppLayout><ModulePage title="Farmácia" description="Medicamentos controlados e SNGPC" icon={Pill} /></AppLayout>} />
            <Route path="/armarinho" element={<AppLayout><ModulePage title="Armarinho" description="Produtos por metragem e variações" icon={Scissors} /></AppLayout>} />
            <Route path="/funcionarios" element={<AppLayout><ModulePage title="Funcionários" description="Cadastro e comissões" icon={UserCog} /></AppLayout>} />
            <Route path="/configuracoes" element={<AppLayout><ModulePage title="Configurações" description="Parâmetros do sistema" icon={Settings} /></AppLayout>} />
            <Route path="/controle-acesso" element={<AppLayout><ModulePage title="Controle de Acesso" description="Perfis e permissões de usuários" icon={Shield} /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

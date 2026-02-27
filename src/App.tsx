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
import Clientes from "./pages/Clientes";
import Fornecedores from "./pages/Fornecedores";
import Estoque from "./pages/Estoque";
import Compras from "./pages/Compras";
import Vendas from "./pages/Vendas";
import ContasPagar from "./pages/ContasPagar";
import ContasReceber from "./pages/ContasReceber";
import Crediario from "./pages/Crediario";
import Financeiro from "./pages/Financeiro";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import { ModulePage } from "./pages/ModulePage";
import {
  BarChart3, UserCog, Shield, Pill, Scissors
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
            <Route path="/clientes" element={<AppLayout><Clientes /></AppLayout>} />
            <Route path="/fornecedores" element={<AppLayout><Fornecedores /></AppLayout>} />
            <Route path="/produtos" element={<AppLayout><Produtos /></AppLayout>} />
            <Route path="/estoque" element={<AppLayout><Estoque /></AppLayout>} />
            <Route path="/compras" element={<AppLayout><Compras /></AppLayout>} />
            <Route path="/vendas" element={<AppLayout><Vendas /></AppLayout>} />
            <Route path="/contas-pagar" element={<AppLayout><ContasPagar /></AppLayout>} />
            <Route path="/contas-receber" element={<AppLayout><ContasReceber /></AppLayout>} />
            <Route path="/crediario" element={<AppLayout><Crediario /></AppLayout>} />
            <Route path="/financeiro" element={<AppLayout><Financeiro /></AppLayout>} />
            <Route path="/fiscal" element={<AppLayout><Fiscal /></AppLayout>} />
            <Route path="/relatorios" element={<AppLayout><ModulePage title="Relatórios" description="Relatórios gerenciais e exportação" icon={BarChart3} /></AppLayout>} />
            <Route path="/farmacia" element={<AppLayout><ModulePage title="Farmácia" description="Medicamentos controlados e SNGPC" icon={Pill} /></AppLayout>} />
            <Route path="/armarinho" element={<AppLayout><ModulePage title="Armarinho" description="Produtos por metragem e variações" icon={Scissors} /></AppLayout>} />
            <Route path="/funcionarios" element={<AppLayout><ModulePage title="Funcionários" description="Cadastro e comissões" icon={UserCog} /></AppLayout>} />
            <Route path="/configuracoes" element={<AppLayout><Configuracoes /></AppLayout>} />
            <Route path="/controle-acesso" element={<AppLayout><ModulePage title="Controle de Acesso" description="Perfis e permissões de usuários" icon={Shield} /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

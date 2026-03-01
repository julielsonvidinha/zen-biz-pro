import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNfeRecebidas } from '@/hooks/useNfeRecebidas';
import { ResumoCards } from '@/components/nfe-recebidas/ResumoCards';
import { TabelaNfe } from '@/components/nfe-recebidas/TabelaNfe';
import { PainelDetalhe } from '@/components/nfe-recebidas/PainelDetalhe';
import { useToast } from '@/hooks/use-toast';

export default function NfeRecebidas() {
  const { toast } = useToast();
  const {
    notas, resumos, filtroStatus, busca, notaSelecionada, loading,
    setBusca, toggleFiltro, setNotaSelecionada, aprovar, rejeitar,
  } = useNfeRecebidas();

  const handleAprovar = async (id: string) => {
    await aprovar(id);
    toast({ title: '✅ Nota aprovada e confirmada na SEFAZ!', duration: 3500 });
  };

  const handleRejeitar = async (id: string, motivo: any, msg: string) => {
    await rejeitar(id, motivo, msg);
    toast({ title: '❌ Nota rejeitada. Fornecedor notificado por e-mail.', variant: 'destructive', duration: 3500 });
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-6 space-y-6" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Notas Fiscais Recebidas</h1>
          <p className="text-sm text-slate-400">Manifesto do Destinatário — Análise e manifestação de NF-es</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, CNPJ ou nº..."
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      <ResumoCards resumos={resumos} filtroAtivo={filtroStatus} onFiltro={toggleFiltro} />

      <TabelaNfe
        notas={notas}
        selecionadaId={notaSelecionada?.id ?? null}
        onSelecionar={setNotaSelecionada}
      />

      <PainelDetalhe
        nota={notaSelecionada}
        loading={loading}
        onClose={() => setNotaSelecionada(null)}
        onAprovar={handleAprovar}
        onRejeitar={handleRejeitar}
      />
    </div>
  );
}

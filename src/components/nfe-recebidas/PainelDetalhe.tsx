import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { X, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NFeRecebida, MotivoRejeicao } from '@/types/nfe';
import { HistoricoManifestacoes } from './HistoricoManifestacoes';
import { BadgeStatus } from './BadgeStatus';
import { ModalRejeitar } from './ModalRejeitar';
import { BotaoGerarPDF } from './BotaoGerarPDF';

function fmtCnpj(c: string) {
  return c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}
function fmtBrl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface Props {
  nota: NFeRecebida | null;
  loading: boolean;
  onClose: () => void;
  onAprovar: (id: string) => void;
  onRejeitar: (id: string, motivo: MotivoRejeicao, msg: string) => void;
}

export function PainelDetalhe({ nota, loading, onClose, onAprovar, onRejeitar }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [modalRejeitar, setModalRejeitar] = useState(false);

  useEffect(() => {
    if (nota) ref.current?.scrollTo(0, 0);
  }, [nota]);

  if (!nota) return null;

  const podeManifestar = nota.status === 'PENDENTE' || nota.status === 'CIENCIA';

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <aside
        ref={ref}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#0F172A] border-l border-slate-700 overflow-y-auto animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0F172A] border-b border-slate-700 p-4 flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-white text-base">{nota.fornecedorNome}</h3>
            <p className="text-xs text-slate-500 font-mono">{fmtCnpj(nota.fornecedorCnpj)}</p>
            <p className="text-xs text-slate-400 mt-1">Nota {nota.numero} / Série {nota.serie}</p>
          </div>
          <div className="flex items-center gap-2">
            <BadgeStatus status={nota.status} />
            <button onClick={onClose} className="text-slate-500 hover:text-white p-1"><X className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="p-4 space-y-5">
          {/* Gerar DANFE */}
          <BotaoGerarPDF nfe={nota} />

          {/* Valores */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3">
              <p className="text-xs text-emerald-400">Valor Total</p>
              <p className="text-lg font-bold text-emerald-300">{fmtBrl(nota.valorTotal)}</p>
            </div>
            <div className="rounded-lg bg-slate-800 border border-slate-700 p-3">
              <p className="text-xs text-slate-400">Emissão</p>
              <p className="text-sm font-medium text-white">{format(new Date(nota.dataEmissao), 'dd/MM/yyyy HH:mm')}</p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-800 border border-slate-700 p-3">
            <p className="text-xs text-slate-400 mb-1">Chave de Acesso</p>
            <p className="text-xs font-mono text-slate-300 break-all leading-relaxed">{nota.chaveAcesso}</p>
          </div>

          {/* Itens */}
          {nota.itens.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Itens da Nota ({nota.itens.length})</h4>
              <div className="space-y-2">
                {nota.itens.map(item => (
                  <div key={item.numeroItem} className="rounded-lg bg-slate-800 border border-slate-700 p-3 text-xs">
                    <p className="font-medium text-white mb-1">{item.descricao}</p>
                    <div className="grid grid-cols-3 gap-2 text-slate-400">
                      <span>NCM: <span className="font-mono text-slate-300">{item.ncm}</span></span>
                      <span>CFOP: <span className="font-mono text-slate-300">{item.cfop}</span></span>
                      <span>{item.quantidade} {item.unidade}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-1.5 text-slate-400">
                      <span>Unit: <span className="text-white">{fmtBrl(item.valorUnitario)}</span></span>
                      <span>Total: <span className="text-white">{fmtBrl(item.valorTotal)}</span></span>
                      <span>ICMS: <span className="text-amber-400">{fmtBrl(item.valorIcms)}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Histórico */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Histórico SEFAZ</h4>
            <HistoricoManifestacoes items={nota.manifestacoes} />
          </div>

          {/* Ações */}
          {podeManifestar && (
            <div className="flex gap-2 pt-2 border-t border-slate-700">
              <Button
                onClick={() => onAprovar(nota.id)}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Aprovar Nota
              </Button>
              <Button
                onClick={() => setModalRejeitar(true)}
                disabled={loading}
                variant="outline"
                className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <XCircle className="h-4 w-4 mr-1" /> Rejeitar
              </Button>
            </div>
          )}
        </div>
      </aside>

      <ModalRejeitar
        open={modalRejeitar}
        loading={loading}
        onClose={() => setModalRejeitar(false)}
        onConfirm={(motivo, msg) => {
          onRejeitar(nota.id, motivo, msg);
          setModalRejeitar(false);
        }}
      />
    </>
  );
}

import { format } from 'date-fns';
import type { NFeRecebida } from '@/types/nfe';
import { BadgeStatus } from './BadgeStatus';

function fmtCnpj(c: string) {
  return c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}
function fmtBrl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface Props {
  notas: NFeRecebida[];
  selecionadaId: string | null;
  onSelecionar: (n: NFeRecebida) => void;
}

export function TabelaNfe({ notas, selecionadaId, onSelecionar }: Props) {
  if (!notas.length) {
    return (
      <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-12 text-center">
        <p className="text-slate-400">Nenhuma nota fiscal encontrada.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-[#1E293B] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-xs text-slate-400 uppercase tracking-wider">
              <th className="text-left p-3 pl-4">Fornecedor</th>
              <th className="text-left p-3">Chave NF-e</th>
              <th className="text-left p-3">Emissão</th>
              <th className="text-left p-3">Nº / Série</th>
              <th className="text-right p-3">Valor Total</th>
              <th className="text-center p-3 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {notas.map(n => {
              const ativa = selecionadaId === n.id;
              return (
                <tr
                  key={n.id}
                  onClick={() => onSelecionar(n)}
                  className={`border-b border-slate-700/50 cursor-pointer transition-colors ${
                    ativa ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : 'hover:bg-slate-800/60'
                  }`}
                >
                  <td className="p-3 pl-4">
                    <p className="font-medium text-white truncate max-w-[200px]">{n.fornecedorNome}</p>
                    <p className="text-xs text-slate-500 font-mono">{fmtCnpj(n.fornecedorCnpj)}</p>
                  </td>
                  <td className="p-3">
                    <span className="text-slate-400 font-mono text-xs">...{n.chaveAcesso.slice(-8)}</span>
                  </td>
                  <td className="p-3 text-slate-300">{format(new Date(n.dataEmissao), 'dd/MM/yyyy HH:mm')}</td>
                  <td className="p-3 text-slate-300 font-mono">{n.numero} / {n.serie}</td>
                  <td className="p-3 text-right font-semibold text-white">{fmtBrl(n.valorTotal)}</td>
                  <td className="p-3 pr-4 text-center"><BadgeStatus status={n.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentoDANFE } from './danfe/DocumentoDANFE';
import type { NFeRecebida } from '@/types/nfe';
import type { DadosDANFE } from '@/types/danfe';

function nfeToDanfe(nfe: NFeRecebida): DadosDANFE {
  const ultimoProt = nfe.manifestacoes.find(m => m.nProt);
  return {
    chaveAcesso: nfe.chaveAcesso,
    numero: nfe.numero,
    serie: nfe.serie,
    tipoOperacao: 0,
    naturezaOperacao: 'COMPRA DE MERCADORIAS',
    dataEmissao: nfe.dataEmissao,
    protocolo: ultimoProt?.nProt,
    dataProtocolo: ultimoProt?.dhRegEvento,

    emitente: {
      razaoSocial: nfe.fornecedorNome.toUpperCase(),
      cnpj: nfe.fornecedorCnpj,
      ie: '',
      logradouro: 'Endereço não disponível',
      numero: 'S/N',
      bairro: '-',
      municipio: '-',
      uf: 'SP',
      cep: '00000000',
      fone: '',
    },

    destinatario: {
      razaoSocial: 'MINHA EMPRESA LTDA',
      cnpj: '98765432000188',
      ie: '987.654.321.000',
      logradouro: 'Av. Paulista',
      numero: '900',
      complemento: 'Andar 12',
      bairro: 'Bela Vista',
      municipio: 'São Paulo',
      uf: 'SP',
      cep: '01310100',
      pais: 'BRASIL',
    },

    itens: nfe.itens.map(it => ({
      codigo: String(it.numeroItem).padStart(3, '0'),
      descricao: it.descricao,
      ncm: it.ncm,
      cst: '000',
      cfop: it.cfop,
      unidade: it.unidade,
      quantidade: it.quantidade,
      valorUnitario: it.valorUnitario,
      valorTotal: it.valorTotal,
      bcIcms: it.valorTotal,
      aliqIcms: it.valorTotal > 0 ? (it.valorIcms / it.valorTotal) * 100 : 0,
      valorIcms: it.valorIcms,
      valorIpi: it.valorIpi ?? 0,
    })),

    totais: {
      bcIcms: nfe.valorTotal,
      valorIcms: nfe.valorIcms,
      valorProdutos: nfe.valorProdutos,
      valorNota: nfe.valorTotal,
    },

    informacoesComplementares: `Documento gerado a partir da NF-e chave ${nfe.chaveAcesso}`,
  };
}

interface Props {
  nfe: NFeRecebida;
}

export function BotaoGerarPDF({ nfe }: Props) {
  const [gerando, setGerando] = useState(false);

  const handleGerar = async () => {
    setGerando(true);
    try {
      const dados = nfeToDanfe(nfe);
      const blob = await pdf(<DocumentoDANFE dados={dados} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DANFE-${nfe.numero}-${nfe.serie}-${nfe.chaveAcesso.slice(-8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erro ao gerar DANFE:', e);
    } finally {
      setGerando(false);
    }
  };

  return (
    <Button
      onClick={handleGerar}
      disabled={gerando}
      variant="outline"
      className="w-full border-slate-600 text-white hover:bg-slate-800"
    >
      {gerando ? (
        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Gerando PDF...</>
      ) : (
        <><FileText className="h-4 w-4 mr-2" /> 📄 Gerar DANFE</>
      )}
    </Button>
  );
}

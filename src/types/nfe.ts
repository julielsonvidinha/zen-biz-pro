export type StatusNFe = 'PENDENTE' | 'CIENCIA' | 'APROVADA' | 'REJEITADA' | 'DESCONHECIDA';

export type MotivoRejeicao =
  | 'PRECO_INCORRETO'
  | 'QUANTIDADE_INCORRETA'
  | 'PRODUTO_INCORRETO'
  | 'CFOP_INCORRETO'
  | 'IMPOSTO_INCORRETO'
  | 'DADOS_CADASTRAIS'
  | 'PEDIDO_NAO_ENCONTRADO'
  | 'OUTRO';

export interface NFeRecebida {
  id: string;
  chaveAcesso: string;
  numero: number;
  serie: number;
  fornecedorNome: string;
  fornecedorCnpj: string;
  fornecedorEmail?: string;
  dataEmissao: string;
  valorProdutos: number;
  valorTotal: number;
  valorIcms: number;
  status: StatusNFe;
  ultimaManifestacao?: string;
  dataManifestacao?: string;
  itens: NFeItem[];
  manifestacoes: Manifestacao[];
}

export interface NFeItem {
  numeroItem: number;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  valorIcms: number;
  valorIpi?: number;
}

export interface Manifestacao {
  tipoEvento: '210200' | '210210' | '210220' | '210240';
  descricaoEvento: string;
  nProt?: string;
  dhRegEvento: string;
}

export interface ResumoStatus {
  status: StatusNFe;
  total: number;
  valorTotal: number;
}

export const MOTIVOS_REJEICAO: Record<MotivoRejeicao, string> = {
  PRECO_INCORRETO: 'Preço incorreto',
  QUANTIDADE_INCORRETA: 'Quantidade incorreta',
  PRODUTO_INCORRETO: 'Produto incorreto',
  CFOP_INCORRETO: 'CFOP incorreto',
  IMPOSTO_INCORRETO: 'Imposto incorreto',
  DADOS_CADASTRAIS: 'Dados cadastrais errados',
  PEDIDO_NAO_ENCONTRADO: 'Pedido não encontrado',
  OUTRO: 'Outro',
};

export const EVENTO_SEFAZ: Record<string, { label: string; color: string }> = {
  '210200': { label: 'Confirmação da Operação', color: '#10B981' },
  '210210': { label: 'Ciência da Operação', color: '#6366F1' },
  '210220': { label: 'Desconhecimento da Operação', color: '#6B7280' },
  '210240': { label: 'Operação não Realizada', color: '#EF4444' },
};

export interface DadosDANFE {
  chaveAcesso: string;
  numero: number;
  serie: number;
  tipoOperacao: 0 | 1;
  naturezaOperacao: string;
  dataEmissao: string;
  dataEntradaSaida?: string;
  horaEntradaSaida?: string;
  protocolo?: string;
  dataProtocolo?: string;

  emitente: {
    razaoSocial: string;
    cnpj: string;
    ie: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
    fone?: string;
    pais?: string;
  };

  destinatario: {
    razaoSocial: string;
    cnpj?: string;
    cpf?: string;
    ie?: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
    fone?: string;
    pais?: string;
  };

  itens: {
    codigo: string;
    descricao: string;
    ncm: string;
    cst: string;
    cfop: string;
    unidade: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    bcIcms?: number;
    aliqIcms?: number;
    valorIcms?: number;
    valorIpi?: number;
    aliqPis?: number;
    valorPis?: number;
    aliqCofins?: number;
    valorCofins?: number;
  }[];

  totais: {
    bcIcms: number;
    valorIcms: number;
    bcIcmsSt?: number;
    valorIcmsSt?: number;
    valorIpi?: number;
    valorPis?: number;
    valorCofins?: number;
    outrasDespesas?: number;
    desconto?: number;
    valorFrete?: number;
    valorSeguro?: number;
    valorProdutos: number;
    valorNota: number;
  };

  transporte?: {
    modalidadeFrete: 0 | 1 | 2 | 9;
    transportadoraNome?: string;
    transportadoraCnpj?: string;
    placa?: string;
    ufVeiculo?: string;
  };

  informacoesComplementares?: string;
  duplicatas?: { numero: string; vencimento: string; valor: number }[];
}

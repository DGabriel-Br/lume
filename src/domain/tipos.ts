export type StatusCompromisso = "PENDENTE" | "PAGO" | "ATRASADO";

export interface Compromisso {
  id: string;
  nome: string;
  valorMinimo: number;
  valorMaximo: number;
  diaVencimento: number;
  status: StatusCompromisso;
  valorReal: number | null;
  isPoupanca: boolean;
  isRecorrente: boolean;
  recorrenciaInicio: Date;
  recorrenciaFim: Date | null;
}

export interface Receita {
  id: string;
  nome: string;
  valorMinimo: number;
  valorMaximo: number;
  diaRecebimento: number;
  valorReal: number | null;
  isRecorrente: boolean;
  recorrenciaInicio: Date;
  recorrenciaFim: Date | null;
}

export interface SaldoMes {
  receitaMinima: number;
  receitaMaxima: number;
  receitaReal: number;
  despesaMinima: number;
  despesaMaxima: number;
  despesaReal: number;
  saldoMinimoProjetado: number;
  saldoMaximoProjetado: number;
  saldoRealParcial: number;
}

export interface MesReferencia {
  ano: number;
  mes: number; // 1-12
}

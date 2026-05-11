import type { Compromisso, Receita, SaldoMes, MesReferencia } from "./tipos";
import { calcularSaldoMes } from "./mes";

export interface MesProjetado {
  ref: MesReferencia;
  saldo: SaldoMes;
}

export function gerarProjecao(
  compromissos: Compromisso[],
  receitas: Receita[],
  inicio: MesReferencia,
  quantidadeMeses: number,
): MesProjetado[] {
  const resultado: MesProjetado[] = [];

  for (let i = 0; i < quantidadeMeses; i++) {
    const totalMeses = inicio.mes - 1 + i;
    const ref: MesReferencia = {
      ano: inicio.ano + Math.floor(totalMeses / 12),
      mes: (totalMeses % 12) + 1,
    };
    resultado.push({ ref, saldo: calcularSaldoMes(compromissos, receitas, ref) });
  }

  return resultado;
}

export function proximoMes(ref: MesReferencia): MesReferencia {
  if (ref.mes === 12) return { ano: ref.ano + 1, mes: 1 };
  return { ano: ref.ano, mes: ref.mes + 1 };
}

export function mesAnterior(ref: MesReferencia): MesReferencia {
  if (ref.mes === 1) return { ano: ref.ano - 1, mes: 12 };
  return { ano: ref.ano, mes: ref.mes - 1 };
}

export function mesAtual(): MesReferencia {
  const hoje = new Date();
  return { ano: hoje.getFullYear(), mes: hoje.getMonth() + 1 };
}

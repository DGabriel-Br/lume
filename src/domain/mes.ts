import type { Compromisso, Receita, SaldoMes, MesReferencia } from "./tipos";

export function estaAtivoNoMes(
  item: Pick<Compromisso | Receita, "isRecorrente" | "recorrenciaInicio" | "recorrenciaFim">,
  ref: MesReferencia,
): boolean {
  const inicioItem = new Date(item.recorrenciaInicio);
  const inicioMes = new Date(ref.ano, ref.mes - 1, 1);
  const fimMes = new Date(ref.ano, ref.mes, 0); // último dia do mês

  if (inicioItem > fimMes) return false;

  if (!item.isRecorrente) {
    // pontual: só aparece no mês exato de início
    return (
      inicioItem.getFullYear() === ref.ano &&
      inicioItem.getMonth() + 1 === ref.mes
    );
  }

  if (item.recorrenciaFim) {
    const fimItem = new Date(item.recorrenciaFim);
    if (fimItem < inicioMes) return false;
  }

  return true;
}

export function calcularSaldoMes(
  compromissos: Compromisso[],
  receitas: Receita[],
  ref: MesReferencia,
): SaldoMes {
  const compromissosAtivos = compromissos.filter((c) => estaAtivoNoMes(c, ref));
  const receitasAtivas = receitas.filter((r) => estaAtivoNoMes(r, ref));

  const receitaMinima = receitasAtivas.reduce((acc, r) => acc + r.valorMinimo, 0);
  const receitaMaxima = receitasAtivas.reduce((acc, r) => acc + r.valorMaximo, 0);
  const receitaReal = receitasAtivas.reduce((acc, r) => acc + (r.valorReal ?? r.valorMinimo), 0);

  const despesaMinima = compromissosAtivos.reduce((acc, c) => acc + c.valorMinimo, 0);
  const despesaMaxima = compromissosAtivos.reduce((acc, c) => acc + c.valorMaximo, 0);
  const despesaReal = compromissosAtivos.reduce(
    (acc, c) => acc + (c.valorReal ?? c.valorMinimo),
    0,
  );

  return {
    receitaMinima,
    receitaMaxima,
    receitaReal,
    despesaMinima,
    despesaMaxima,
    despesaReal,
    saldoMinimoProjetado: receitaMinima - despesaMaxima,
    saldoMaximoProjetado: receitaMaxima - despesaMinima,
    saldoRealParcial: receitaReal - despesaReal,
  };
}

export function calcularStatusCompromisso(
  diaVencimento: number,
  ref: MesReferencia,
  pago: boolean,
  hoje: Date = new Date(),
): "PENDENTE" | "PAGO" | "ATRASADO" {
  if (pago) return "PAGO";

  const vencimento = new Date(ref.ano, ref.mes - 1, diaVencimento);
  if (hoje > vencimento) return "ATRASADO";
  return "PENDENTE";
}

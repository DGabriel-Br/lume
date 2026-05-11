import { describe, it, expect } from "vitest";
import { estaAtivoNoMes, calcularSaldoMes, calcularStatusCompromisso } from "./mes";
import type { Compromisso, Receita, MesReferencia } from "./tipos";

const REF_MAI_2026: MesReferencia = { ano: 2026, mes: 5 };

function makeCompromisso(overrides: Partial<Compromisso> = {}): Compromisso {
  return {
    id: "c1",
    nome: "Aluguel",
    valorMinimo: 1000,
    valorMaximo: 1000,
    diaVencimento: 10,
    status: "PENDENTE",
    valorReal: null,
    isPoupanca: false,
    isRecorrente: true,
    recorrenciaInicio: new Date("2026-01-01"),
    recorrenciaFim: null,
    ...overrides,
  };
}

function makeReceita(overrides: Partial<Receita> = {}): Receita {
  return {
    id: "r1",
    nome: "Salário",
    valorMinimo: 5000,
    valorMaximo: 5500,
    diaRecebimento: 5,
    valorReal: null,
    isRecorrente: true,
    recorrenciaInicio: new Date("2026-01-01"),
    recorrenciaFim: null,
    ...overrides,
  };
}

describe("estaAtivoNoMes", () => {
  it("retorna true para recorrente sem fim no mês de referência", () => {
    expect(estaAtivoNoMes(makeCompromisso(), REF_MAI_2026)).toBe(true);
  });

  it("retorna false quando recorrenciaFim é antes do mês de referência", () => {
    const c = makeCompromisso({ recorrenciaFim: new Date("2026-04-30") });
    expect(estaAtivoNoMes(c, REF_MAI_2026)).toBe(false);
  });

  it("retorna false quando recorrenciaInicio é depois do mês de referência", () => {
    const c = makeCompromisso({ recorrenciaInicio: new Date("2026-06-01") });
    expect(estaAtivoNoMes(c, REF_MAI_2026)).toBe(false);
  });

  it("retorna true quando recorrenciaFim cai dentro do próprio mês", () => {
    const c = makeCompromisso({ recorrenciaFim: new Date("2026-05-15") });
    expect(estaAtivoNoMes(c, REF_MAI_2026)).toBe(true);
  });

  it("compromisso pontual aparece apenas no mês de início", () => {
    const c = makeCompromisso({
      isRecorrente: false,
      recorrenciaInicio: new Date("2026-05-10"),
    });
    expect(estaAtivoNoMes(c, REF_MAI_2026)).toBe(true);
    expect(estaAtivoNoMes(c, { ano: 2026, mes: 6 })).toBe(false);
    expect(estaAtivoNoMes(c, { ano: 2026, mes: 4 })).toBe(false);
  });
});

describe("calcularSaldoMes", () => {
  it("calcula saldo projetado sem valores reais", () => {
    const compromissos = [makeCompromisso({ valorMinimo: 1000, valorMaximo: 1200 })];
    const receitas = [makeReceita({ valorMinimo: 5000, valorMaximo: 5500 })];

    const saldo = calcularSaldoMes(compromissos, receitas, REF_MAI_2026);

    expect(saldo.receitaMinima).toBe(5000);
    expect(saldo.receitaMaxima).toBe(5500);
    expect(saldo.despesaMinima).toBe(1000);
    expect(saldo.despesaMaxima).toBe(1200);
    expect(saldo.saldoMinimoProjetado).toBe(5000 - 1200);
    expect(saldo.saldoMaximoProjetado).toBe(5500 - 1000);
  });

  it("usa valorReal quando disponível", () => {
    const compromissos = [makeCompromisso({ valorMinimo: 1000, valorMaximo: 1200, valorReal: 1050 })];
    const receitas = [makeReceita({ valorMinimo: 5000, valorMaximo: 5500, valorReal: 5200 })];

    const saldo = calcularSaldoMes(compromissos, receitas, REF_MAI_2026);

    expect(saldo.despesaReal).toBe(1050);
    expect(saldo.receitaReal).toBe(5200);
    expect(saldo.saldoRealParcial).toBe(5200 - 1050);
  });

  it("exclui compromissos fora do mês", () => {
    const compromissos = [
      makeCompromisso({ id: "c1", recorrenciaFim: new Date("2026-04-30") }),
      makeCompromisso({ id: "c2", valorMinimo: 500, valorMaximo: 500 }),
    ];
    const receitas: Receita[] = [];

    const saldo = calcularSaldoMes(compromissos, receitas, REF_MAI_2026);

    expect(saldo.despesaMinima).toBe(500);
  });

  it("retorna saldo zero com listas vazias", () => {
    const saldo = calcularSaldoMes([], [], REF_MAI_2026);
    expect(saldo.saldoMinimoProjetado).toBe(0);
    expect(saldo.saldoMaximoProjetado).toBe(0);
  });

  it("soma múltiplos compromissos e receitas", () => {
    const compromissos = [
      makeCompromisso({ id: "c1", valorMinimo: 1000, valorMaximo: 1000 }),
      makeCompromisso({ id: "c2", valorMinimo: 200, valorMaximo: 200 }),
    ];
    const receitas = [
      makeReceita({ id: "r1", valorMinimo: 3000, valorMaximo: 3000 }),
      makeReceita({ id: "r2", valorMinimo: 2000, valorMaximo: 2000 }),
    ];

    const saldo = calcularSaldoMes(compromissos, receitas, REF_MAI_2026);

    expect(saldo.despesaMinima).toBe(1200);
    expect(saldo.receitaMinima).toBe(5000);
    expect(saldo.saldoMinimoProjetado).toBe(3800);
  });
});

describe("calcularStatusCompromisso", () => {
  it("retorna PAGO quando pago=true", () => {
    const status = calcularStatusCompromisso(10, REF_MAI_2026, true);
    expect(status).toBe("PAGO");
  });

  it("retorna PENDENTE quando vencimento é no futuro", () => {
    const hoje = new Date("2026-05-05");
    const status = calcularStatusCompromisso(10, REF_MAI_2026, false, hoje);
    expect(status).toBe("PENDENTE");
  });

  it("retorna ATRASADO quando vencimento passou", () => {
    const hoje = new Date("2026-05-15");
    const status = calcularStatusCompromisso(10, REF_MAI_2026, false, hoje);
    expect(status).toBe("ATRASADO");
  });
});

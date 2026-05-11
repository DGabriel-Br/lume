import { describe, it, expect } from "vitest";
import { gerarProjecao, proximoMes, mesAnterior } from "./projecao";
import type { MesReferencia } from "./tipos";

describe("gerarProjecao", () => {
  it("gera a quantidade correta de meses", () => {
    const projecao = gerarProjecao([], [], { ano: 2026, mes: 5 }, 6);
    expect(projecao).toHaveLength(6);
  });

  it("avança o ano corretamente ao cruzar dezembro", () => {
    const projecao = gerarProjecao([], [], { ano: 2026, mes: 11 }, 4);
    expect(projecao[0]?.ref).toEqual({ ano: 2026, mes: 11 });
    expect(projecao[1]?.ref).toEqual({ ano: 2026, mes: 12 });
    expect(projecao[2]?.ref).toEqual({ ano: 2027, mes: 1 });
    expect(projecao[3]?.ref).toEqual({ ano: 2027, mes: 2 });
  });

  it("exclui compromisso encerrado em meses futuros", () => {
    const compromissos = [
      {
        id: "c1",
        nome: "Parcela",
        valorMinimo: 500,
        valorMaximo: 500,
        diaVencimento: 10,
        status: "PENDENTE" as const,
        valorReal: null,
        isPoupanca: false,
        isRecorrente: true,
        recorrenciaInicio: new Date("2026-01-01"),
        recorrenciaFim: new Date("2026-05-31"),
      },
    ];

    const projecao = gerarProjecao(compromissos, [], { ano: 2026, mes: 5 }, 3);

    expect(projecao[0]?.saldo.despesaMinima).toBe(500); // maio: ativo
    expect(projecao[1]?.saldo.despesaMinima).toBe(0);   // junho: encerrado
    expect(projecao[2]?.saldo.despesaMinima).toBe(0);   // julho: encerrado
  });
});

describe("proximoMes", () => {
  it("avança o mês normalmente", () => {
    expect(proximoMes({ ano: 2026, mes: 5 })).toEqual({ ano: 2026, mes: 6 });
  });

  it("avança o ano ao sair de dezembro", () => {
    expect(proximoMes({ ano: 2026, mes: 12 })).toEqual({ ano: 2027, mes: 1 });
  });
});

describe("mesAnterior", () => {
  it("recua o mês normalmente", () => {
    expect(mesAnterior({ ano: 2026, mes: 5 })).toEqual({ ano: 2026, mes: 4 });
  });

  it("recua o ano ao sair de janeiro", () => {
    expect(mesAnterior({ ano: 2026, mes: 1 })).toEqual({ ano: 2025, mes: 12 });
  });
});

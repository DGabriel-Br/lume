import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, getApiSession } from "@/lib/api";
import { logger } from "@/lib/logger";
import { compromissoSchema } from "@/lib/validators";
import { calcularStatusCompromisso } from "@/domain/mes";
import type { Compromisso } from "@prisma/client";

function serializar(c: Compromisso) {
  const hoje = new Date();
  const mes = hoje.getMonth() + 1;
  const ano = hoje.getFullYear();

  return {
    ...c,
    valorMinimo: Number(c.valorMinimo),
    valorMaximo: Number(c.valorMaximo),
    valorReal: c.valorReal !== null ? Number(c.valorReal) : null,
    status: calcularStatusCompromisso(
      c.diaVencimento,
      { ano, mes },
      c.status === "PAGO",
      hoje,
    ),
  };
}

// GET /api/compromissos?ano=2026&mes=5
export async function GET(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return err("Não autenticado", 401);

  const { searchParams } = request.nextUrl;
  const ano = Number(searchParams.get("ano"));
  const mes = Number(searchParams.get("mes"));

  if (!ano || !mes || mes < 1 || mes > 12) {
    return err("Parâmetros ano e mes são obrigatórios e válidos", 400);
  }

  try {
    const inicioMes = new Date(ano, mes - 1, 1);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59, 999);

    const compromissos = await db.compromisso.findMany({
      where: {
        userId: session.user.id,
        recorrenciaInicio: { lte: fimMes },
        OR: [
          {
            isRecorrente: true,
            OR: [{ recorrenciaFim: null }, { recorrenciaFim: { gte: inicioMes } }],
          },
          {
            isRecorrente: false,
            recorrenciaInicio: { gte: inicioMes },
          },
        ],
      },
      orderBy: { diaVencimento: "asc" },
    });

    return ok(compromissos.map(serializar));
  } catch (error) {
    logger.error(error, "Erro ao listar compromissos");
    return err("Erro interno", 500);
  }
}

// POST /api/compromissos
export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return err("Não autenticado", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body inválido", 400);
  }

  const parsed = compromissoSchema.safeParse(body);
  if (!parsed.success) {
    return err(parsed.error.issues.map((e) => e.message).join(", "), 400);
  }

  const data = parsed.data;

  try {
    const compromisso = await db.compromisso.create({
      data: {
        userId: session.user.id,
        nome: data.nome,
        valorMinimo: data.valorMinimo,
        valorMaximo: data.valorMaximo,
        diaVencimento: data.diaVencimento,
        isPoupanca: data.isPoupanca ?? false,
        isRecorrente: data.isRecorrente ?? true,
        recorrenciaInicio: new Date(data.recorrenciaInicio),
        recorrenciaFim: data.recorrenciaFim ? new Date(data.recorrenciaFim) : null,
        observacao: data.observacao ?? null,
      },
    });

    return ok(serializar(compromisso), 201);
  } catch (error) {
    logger.error(error, "Erro ao criar compromisso");
    return err("Erro interno", 500);
  }
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, getApiSession } from "@/lib/api";
import { logger } from "@/lib/logger";
import { compromissoSchema } from "@/lib/validators";
import { calcularStatusCompromisso } from "@/domain/mes";
import type { Compromisso } from "@prisma/client";

function serializar(c: Compromisso) {
  const hoje = new Date();
  return {
    ...c,
    valorMinimo: Number(c.valorMinimo),
    valorMaximo: Number(c.valorMaximo),
    valorReal: c.valorReal !== null ? Number(c.valorReal) : null,
    status: calcularStatusCompromisso(
      c.diaVencimento,
      { ano: hoje.getFullYear(), mes: hoje.getMonth() + 1 },
      c.status === "PAGO",
      hoje,
    ),
  };
}

type Params = { params: Promise<{ id: string }> };

// PUT /api/compromissos/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getApiSession();
  if (!session) return err("Não autenticado", 401);

  const { id } = await params;

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
    const existente = await db.compromisso.findUnique({ where: { id } });
    if (!existente || existente.userId !== session.user.id) {
      return err("Não encontrado", 404);
    }

    const atualizado = await db.compromisso.update({
      where: { id },
      data: {
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

    return ok(serializar(atualizado));
  } catch (error) {
    logger.error(error, "Erro ao atualizar compromisso");
    return err("Erro interno", 500);
  }
}

// DELETE /api/compromissos/[id]
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getApiSession();
  if (!session) return err("Não autenticado", 401);

  const { id } = await params;

  try {
    const existente = await db.compromisso.findUnique({ where: { id } });
    if (!existente || existente.userId !== session.user.id) {
      return err("Não encontrado", 404);
    }

    await db.compromisso.delete({ where: { id } });
    return ok({ id });
  } catch (error) {
    logger.error(error, "Erro ao deletar compromisso");
    return err("Erro interno", 500);
  }
}

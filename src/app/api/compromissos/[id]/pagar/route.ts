import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, getApiSession } from "@/lib/api";
import { logger } from "@/lib/logger";
import { marcarPagoSchema } from "@/lib/validators";
import type { Compromisso } from "@prisma/client";

function serializar(c: Compromisso) {
  return {
    ...c,
    valorMinimo: Number(c.valorMinimo),
    valorMaximo: Number(c.valorMaximo),
    valorReal: c.valorReal !== null ? Number(c.valorReal) : null,
  };
}

type Params = { params: Promise<{ id: string }> };

// PATCH /api/compromissos/[id]/pagar
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getApiSession();
  if (!session) return err("Não autenticado", 401);

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body inválido", 400);
  }

  const parsed = marcarPagoSchema.safeParse(body);
  if (!parsed.success) {
    return err(parsed.error.issues.map((e) => e.message).join(", "), 400);
  }

  const data = parsed.data;

  try {
    const existente = await db.compromisso.findUnique({ where: { id } });
    if (!existente || existente.userId !== session.user.id) {
      return err("Não encontrado", 404);
    }

    const pago = await db.compromisso.update({
      where: { id },
      data: {
        status: "PAGO",
        valorReal: data.valorReal,
        dataPagamento: new Date(data.dataPagamento),
      },
    });

    return ok(serializar(pago));
  } catch (error) {
    logger.error(error, "Erro ao marcar compromisso como pago");
    return err("Erro interno", 500);
  }
}

import { z } from "zod";

export const compromissoSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório").max(100),
  valorMinimo: z.number().positive("Valor mínimo deve ser positivo"),
  valorMaximo: z.number().positive("Valor máximo deve ser positivo"),
  diaVencimento: z.number().int().min(1).max(31),
  isPoupanca: z.boolean().default(false),
  isRecorrente: z.boolean().default(true),
  recorrenciaInicio: z.string().datetime(),
  recorrenciaFim: z.string().datetime().nullable().optional(),
  observacao: z.string().max(500).nullable().optional(),
}).refine(
  (data) => data.valorMaximo >= data.valorMinimo,
  { message: "Valor máximo deve ser maior ou igual ao mínimo", path: ["valorMaximo"] },
);

export const marcarPagoSchema = z.object({
  valorReal: z.number().positive("Valor real deve ser positivo"),
  dataPagamento: z.string().datetime(),
});

export const receitaSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório").max(100),
  valorMinimo: z.number().positive("Valor mínimo deve ser positivo"),
  valorMaximo: z.number().positive("Valor máximo deve ser positivo"),
  diaRecebimento: z.number().int().min(1).max(31),
  isRecorrente: z.boolean().default(true),
  recorrenciaInicio: z.string().datetime(),
  recorrenciaFim: z.string().datetime().nullable().optional(),
  observacao: z.string().max(500).nullable().optional(),
}).refine(
  (data) => data.valorMaximo >= data.valorMinimo,
  { message: "Valor máximo deve ser maior ou igual ao mínimo", path: ["valorMaximo"] },
);

export const mesReferenciaSchema = z.object({
  ano: z.number().int().min(2020).max(2100),
  mes: z.number().int().min(1).max(12),
});

export type CompromissoInput = z.infer<typeof compromissoSchema>;
export type MarcarPagoInput = z.infer<typeof marcarPagoSchema>;
export type ReceitaInput = z.infer<typeof receitaSchema>;
export type MesReferenciaInput = z.infer<typeof mesReferenciaSchema>;

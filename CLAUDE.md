# CLAUDE.md

Este arquivo orienta o Claude (e outros agentes de IA) ao trabalhar no projeto Lume. Leia antes de propor ou escrever qualquer código.

## 1. O que é o Lume

Lume é um painel financeiro pessoal de uso individual, focado em **clareza macro** do mês. Não é um app de controle de gastos do dia a dia, não categoriza café e uber, não gera gráfico de pizza. Substitui um bloco de notas onde o usuário lista compromissos do mês com valor mínimo, máximo e dia de vencimento.

**O usuário abre o Lume para responder três perguntas em 5 segundos:**

1. O que tenho a receber este mês?
2. O que tenho a pagar este mês?
3. Quanto vai sobrar?

E uma quarta pergunta, olhando à frente:

4. Como vai estar meu saldo nos próximos meses?

Se uma feature não serve diretamente a essas quatro perguntas, ela provavelmente não pertence ao Lume.

## 2. Filosofia do produto

- **Clareza acima de completude.** Melhor menos features e tudo visível, do que muitas features escondidas em abas.
- **Antecipação acima de retrospectiva.** O Lume olha para frente. Histórico é secundário.
- **Honestidade do bloco de notas.** A interface herda a virtude do bloco de notas: tudo na tela ao mesmo tempo, sem cliques desnecessários.
- **Macro acima de micro.** Compromissos do mês inteiro, não cada transação.
- **Deliberadamente limitado.** O que o Lume não faz é tão importante quanto o que faz.

### O que o Lume não faz

Não importa extrato bancário. Não categoriza gastos diários. Não tem gráfico de pizza nem sistema de metas com barra de progresso. Não envia notificação comparando com mês anterior. Não tem rede social, não tem gamificação, não tem IA conversacional dentro do produto.

## 3. Conceitos centrais do domínio

**Compromisso.** Qualquer despesa do usuário. Tem nome, valor estimado (mínimo e máximo), dia previsto de pagamento, status (pendente, pago, atrasado) e valor real (preenchido após pagamento). Pode ser recorrente ou pontual. Pode ser marcado como "poupança" para separar visualmente construção de patrimônio de consumo (ex: aporte no Tesouro Selic).

**Receita.** Entrada de dinheiro. Mesma estrutura básica: nome, valor estimado, data prevista, recorrência. Ex: salário em duas parcelas (5º dia útil e dia 20).

**Saldo projetado.** Total de receitas previstas menos total de compromissos previstos, considerando valor real quando disponível. É o número mais importante da tela do mês.

**Projeção.** Aplicação dos compromissos e receitas recorrentes nos meses futuros, respeitando datas de início e fim (ex: parcela do empréstimo termina em mês X, some da projeção a partir daí).

## 4. Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript (strict, com `noUncheckedIndexedAccess`) |
| Estilização | Tailwind CSS + shadcn/ui |
| ORM | Prisma |
| Banco | PostgreSQL (Neon ou Supabase) |
| Autenticação | Auth.js (NextAuth v5) |
| Validação | Zod |
| Estado de servidor | TanStack Query |
| Formulários | react-hook-form + @hookform/resolvers/zod |
| Testes | Vitest + Testing Library |
| Logs | Pino |
| Rate limiting | @upstash/ratelimit |
| Hospedagem | Vercel |

Não introduza nova dependência sem justificativa explícita. Se for adicionar lib, explique o trade-off.

## 5. Estrutura de pastas

```
lume/
├── prisma/                  # Schema, migrations, seed
├── public/                  # Assets estáticos
└── src/
    ├── app/                 # App Router do Next.js
    │   ├── (auth)/          # Rotas públicas (login)
    │   ├── (app)/           # Rotas protegidas (mes, projecao, cadastro)
    │   └── api/             # Rotas de API
    ├── components/          # Organizado por feature
    │   ├── ui/              # shadcn/ui
    │   ├── mes/             # Componentes da tela do mês
    │   ├── projecao/        # Componentes da projeção
    │   ├── cadastro/        # Formulários
    │   └── shared/          # Reutilizáveis (header, formatadores)
    ├── lib/                 # Infraestrutura técnica (db, auth, utils, validators)
    ├── domain/              # Lógica pura de negócio (sem framework)
    ├── hooks/               # Custom hooks (TanStack Query)
    ├── types/               # Tipos compartilhados
    └── styles/              # Tokens de design
```

**Convenções de naming:**

- Arquivos em kebab-case: `item-compromisso.tsx`
- Componentes em PascalCase: `export function ItemCompromisso`
- Pastas de produto em português: `mes`, `projecao`, `compromissos`
- Pastas técnicas em inglês: `components`, `hooks`, `lib`

## 6. Arquitetura em três camadas

A separação entre essas três camadas é **inegociável**:

**Apresentação** (`app/`, `components/`): renderiza e captura eventos. Nunca faz cálculo financeiro, nunca toca em banco, nunca monta query.

**Aplicação** (`app/api/`, `hooks/`): orquestra. Recebe request, valida com Zod, chama o domínio, persiste com Prisma, retorna shape consistente.

**Domínio** (`domain/`): funções puras, sem efeito colateral, sem dependência de framework. É o cérebro do Lume. Toda regra de negócio mora aqui e tem teste unitário.

Quando um arquivo não souber em qual camada mora, há algo errado.

## 7. Padrões obrigatórios

### TypeScript

- `strict: true` e `noUncheckedIndexedAccess: true` no tsconfig.
- Nunca use `any`. Se precisar, use `unknown` e faça narrow.
- Tipos do Prisma não vazam diretamente para componentes. Crie tipos próprios em `domain/` ou `types/`.

### Validação

- Zod em **toda** rota de API, sem exceção.
- Schema Zod é a fonte de verdade do tipo. Use `z.infer<typeof schema>` para derivar o tipo TS.
- Validar também variáveis de ambiente no boot da aplicação.

### Autenticação e autorização

- Toda rota protegida usa o helper `getSessionOrFail()` em `lib/auth.ts`.
- Toda operação sobre recurso checa pertencimento: `userId` do recurso deve bater com `userId` da sessão.
- Se não bater, retornar 404 (não 403, para não revelar existência).
- Esquecer essa checagem é a vulnerabilidade mais comum. Sempre verifique antes de aprovar PR mentalmente.

### Erros

- Nunca use `try/catch` que engole erro silencioso.
- Toda rota de API retorna shape consistente: `{ data }` em sucesso, `{ error }` em falha, com status HTTP correto.
- Log de erro no servidor com Pino, nunca `console.log`.

### Server Components

- App Router: tudo é Server Component por padrão. Marque `"use client"` apenas quando houver interatividade real (estado, evento, hook).
- O erro júnior é marcar tudo como client. Resista.

### Banco

- Toda mudança de schema via migration do Prisma, versionada no Git.
- Índices em toda coluna usada em `where`, `orderBy` ou `join`. Especialmente `userId` e `dataVencimento`.
- Nunca use `$queryRaw` com interpolação de string. Sempre template literal parametrizado.
- Conexão em produção via pooler (Neon ou Supabase com `?pgbouncer=true`).

## 8. Segurança

- Cookies de sessão: HTTP-only, Secure, SameSite=Lax.
- Headers no `next.config.ts`: HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, CSP configurado.
- Rate limiting agressivo no login (5 tentativas/min/IP), moderado nas demais rotas.
- `npm audit` periódico, Dependabot ligado no GitHub.
- Nenhuma chave secreta com prefixo `NEXT_PUBLIC_`.
- Backups do banco verificados.
- Logs nunca contêm senha, token ou dado pessoal sensível.

## 9. Performance

- Otimização sem medição é desperdício. Use Lighthouse, React DevTools Profiler, Prisma query logs.
- Server Components por padrão.
- `<Suspense>` para streaming de seções da página.
- TanStack Query com `staleTime` adequado por recurso.
- `dynamic()` para componentes pesados fora do primeiro load.
- Paginação obrigatória em listas que crescem (histórico de pagamentos).
- `<Image />` do Next.js, nunca `<img>`.

## 10. Responsividade

- **Mobile-first sempre.** O Lume é mais usado no celular.
- Comece pelo layout de tela pequena, use `md:` e `lg:` do Tailwind para adicionar comportamento em telas maiores.
- Touch targets mínimos de 44x44px.
- Inputs numéricos com `inputMode="decimal"`.
- Inputs de data com `type="date"` nativo.
- Sem funcionalidade exclusiva de hover. Tudo precisa ter equivalente de toque.
- Dark mode funcional desde o início (Tailwind `darkMode: 'class'`).
- Testar em aparelho real, não só DevTools emulado.

## 11. Acessibilidade

- shadcn/ui já entrega base acessível, mas:
- Labels em todo input.
- Hierarquia correta de heading (h1 único, depois h2, h3 em ordem).
- Foco visível em todos os elementos interativos.
- Contraste WCAG AA (mínimo 4.5:1 para texto normal).
- Navegação por teclado funcional em todas as telas.

## 12. Testes

- Camada `domain/` tem cobertura alta de teste unitário. É lógica pura, é barato testar, é caro errar.
- Rotas de API com regras complexas têm teste de integração.
- Componentes visuais geralmente não valem o esforço de testar.
- Vitest + Testing Library é o setup.

## 13. Git e commits

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
- Branch `main` protegida. PRs revisados antes do merge, mesmo trabalhando solo.
- Commit pequeno, com escopo claro. "Ajustes" não é mensagem de commit.

## 14. Como o Claude deve agir neste projeto

### Sempre

- Ler este `CLAUDE.md` antes de propor mudanças estruturais.
- Verificar a estrutura de pastas atual antes de criar arquivo novo.
- Preferir editar arquivo existente a criar novo, quando faz sentido.
- Manter as três camadas (apresentação, aplicação, domínio) separadas.
- Validar input com Zod em rota nova.
- Adicionar checagem de pertencimento em rota que mexe em recurso.
- Marcar componente como `"use client"` apenas se necessário.
- Mobile-first ao escrever Tailwind.
- Escrever testes para nova função do `domain/`.
- Usar nomes em português para conceitos de produto e em inglês para conceitos técnicos.

### Nunca

- Adicionar dependência sem justificar.
- Usar `any` para resolver erro de tipo rápido.
- Engolir erro com `try/catch` vazio.
- Criar rota de API sem autenticação e autorização.
- Sugerir feature de "controle de gastos diários", "categorização de transação", "import de extrato" ou similares. Isso fere a filosofia do produto.
- Criar pasta nova sem motivo claro.
- Otimizar prematuramente sem medição.
- Hardcodar valor que deveria estar em variável de ambiente.

### Sobre tom

- O usuário (David Gabriel, "Mestre" no tratamento) prefere comunicação direta, sem rodeio. Sem travessões (—) nas respostas.
- Ele tem experiência intermediária e está construindo o Lume também para crescer tecnicamente. Explicar o "porquê" das decisões importa, não só o "como".
- Falar como amigo, não como manual. Honestidade técnica acima de cordialidade vazia.

## 15. Ordem de construção

O projeto é construído em etapas. Não pule.

0. Fundações (config, tsconfig, eslint, headers).
1. Banco + domínio com testes (sem UI).
2. Autenticação.
3. API de Compromissos (CRUD completo, com validação e autorização).
4. API de Receitas.
5. Tela do Mês (versão mínima funcional).
6. Tela de Cadastro.
7. Tela de Projeção.
8. Polimento de UX (animações, skeletons, toast, dark mode).
9. Hardening de segurança (rate limit, CSP, audit).
10. Performance e observabilidade.
11. Deploy na Vercel.
12. Uso real por 30 dias antes de planejar v1.1.

Se estiver propondo algo da etapa N+1 antes de N estar pronta, repense.

## 16. Decisões já tomadas (não reabrir sem motivo forte)

- Stack: Next.js 15 + Prisma + Postgres + Auth.js. Não usar Vite, FastAPI, SQLite, Express.
- Nome: Lume. Decidido.
- Banco na nuvem (Neon ou Supabase), não local. Lume precisa estar acessível de qualquer dispositivo.
- Uso pessoal por enquanto, mas arquitetura preparada para multi-usuário (já tem `userId` em tudo).
- Sem feature de transação diária, sem categorização, sem import de extrato.

## 17. Glossário rápido

| Termo | Significado |
|---|---|
| Compromisso | Despesa cadastrada (recorrente ou pontual) |
| Receita | Entrada de dinheiro |
| Recorrência | Padrão de repetição mensal de um compromisso ou receita |
| Saldo projetado | Receita prevista menos despesa prevista do mês |
| Projeção | Aplicação dos recorrentes nos meses futuros |
| Marcar como pago | Ação que registra valor real e atualiza saldo |
| Compromisso de poupança | Aporte para construção de reserva (ex: Tesouro Selic). Visualmente diferenciado de compromisso de consumo. |

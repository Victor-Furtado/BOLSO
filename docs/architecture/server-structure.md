# Pathfinder 2e Remaster Catalog — Backend Architecture in SvelteKit

This document outlines the complete server-side software architecture for the **Pathfinder 2e Remaster Catalog** using **SvelteKit**, **Kysely**, **LibSQL/Turso**, and **Zod**.

The system strictly respects the core domain rule: **The Catalog models game content definitions, never character or user state.**

---

## 1. Directory Structure

All backend logic resides inside `src/lib/server/`. SvelteKit's module boundaries guarantee that code placed in `$lib/server/` cannot be imported into or bundled for the client.

```text
src/
└── lib/
    └── server/
        ├── db/                          # Database infrastructure layer
        │   ├── client.ts                # Kysely + LibSQL driver setup
        │   ├── types.ts                 # Kysely table interfaces
        │   └── migrations/              # Kysely migration files
        │       └── 0001_create_catalog.ts
        │
        └── catalog/                     # Catalog Domain Module
            ├── schemas/                 # Zod validation & type safety
            │   ├── entry-data.ts        # Type-specific payload schemas (Data)
            │   ├── entry.ts             # Discriminated unions for catalog entries
            │   ├── prerequisite.ts     # AST schema for prerequisites
            │   ├── effect.ts           # Schema for mechanical rules/effects
            │   └── index.ts
            ├── repositories/            # Data access layer (Kysely queries)
            │   ├── entry.repository.ts
            │   ├── source.repository.ts
            │   ├── relation.repository.ts
            │   ├── prerequisite.repository.ts
            │   └── effect.repository.ts
            ├── services/                # Business logic & JSON processing
            │   ├── catalog.service.ts
            │   └── importer.service.ts
            └── index.ts                 # Public module API
```

## 1. Separação Estrita de Ambientes (A Barreira do `$lib/server`)

O SvelteKit é um framework full-stack onde código de frontend e backend compartilham a mesma árvore de arquivos. Sem uma fronteira clara, é fácil importar acidentalmente chamadas de banco ou credenciais no código enviado ao navegador.

### O princípio

O diretório `$lib/server/` funciona como uma caixa-preta de segurança. Qualquer módulo nessa pasta é completamente removido do pacote enviado ao cliente (client bundle).

### O motivo

Se um componente Svelte tentar importar um arquivo dessa pasta por engano, a ferramenta de build interrompe a compilação. Isso garante que drivers de banco de dados (Kysely), chaves de API e lógica de validação fiquem restritos ao ambiente de execução do servidor (Node.js/Edge).

## 2. O Padrão de Camadas (Layers)

Em vez de executar queries diretamente nas rotas (arquivos `+page.server.ts`), a arquitetura divide as responsabilidades em três camadas fundamentais:

- **Repositório (`repositories/`):** fala a linguagem do banco de dados. Sua única responsabilidade é executar SQL via Kysely. Ele não sabe o que as informações significam nem valida regras de negócio; apenas busca e persiste strings e números.
- **Validação/Domínio (`schemas/`):** fala a linguagem da regra do jogo. Define o contrato do que é um dado válido usando Zod. É aqui que vive a inteligência que entende a diferença entre uma arma, uma magia ou uma habilidade (feat).
- **Serviço (`services/`):** fala a linguagem da aplicação. Une as duas camadas anteriores, busca o dado bruto, valida os JSONs com Zod e entrega uma estrutura pronta para consumo.

## 3. A Estratégia de Serialização no Boundary (Fronteira)

O SQLite/Turso não possui tipos nativos como JSONB ou ARRAY presentes no PostgreSQL. Para manter a performance e a portabilidade, a arquitetura adota uma abordagem de fronteira de conversão:

- **Persistência passiva:** o banco armazena o payload flexível (`data`, `traits`, `expression`) como texto simples (`TEXT`).
- **Parsing na borda:** a conversão da string JSON em objeto TypeScript ocorre exclusivamente na camada de serviço, quando os dados entram na memória do servidor web.
- **Contratos com Zod:** a validação via `z.discriminatedUnion` garante que o backend falhe de forma controlada caso os dados estejam corrompidos ou desatualizados.

## 4. Isolamento do Cliente via Contrato de Tipos

Uma das vantagens do SvelteKit é permitir que o frontend receba dados do servidor sem precisar fazer requisições HTTP manuais através dos loaders.

- **Como funciona:** as páginas do frontend importam apenas os tipos estáticos gerados pelo Zod (`z.infer<typeof ...>`).
- **A vantagem:** o cliente tem autocompletar e verificação de tipos completa em tempo de desenvolvimento, sem importar código executável do servidor. Se o contrato do catálogo mudar no backend, o compilador do TypeScript avisa imediatamente onde o frontend quebrou.

## Summary of Architectural Commitments

| Architectural Goal                       | Technical Realization                                                                                                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strict Boundary Isolation                | Server-only modules live inside `$lib/server/` to ensure zero database or secret leakages to the client bundle.                                                             |
| Hybrid Relational / Document Persistence | Top-level metadata is queried natively through SQL columns, while volatile payloads (`data`, `traits`, `expression`, `effects`) remain stored in `TEXT` as structured JSON. |
| Schema Flexibility                       | Adding new catalog types (e.g. archetype, subclass) does not require SQL DDL migrations; developers define a new Zod schema within `src/lib/server/catalog/schemas/`.       |
| Type-Safe Data Extraction                | Unstructured SQL strings are safely transformed and validated into strongly typed TypeScript models during service execution using Zod parse layers.                        |

```

```

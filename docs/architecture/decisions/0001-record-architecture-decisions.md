[Início](../../README.md) > [Arquitetura](../overview.md) > **ADR 0001**

# ADR 0001: Registro de Decisões Arquiteturais

- **Status**: Aceito
- **Data**: 2026-11-05
- **Autores**: Luiz Henrique Canet Filho (`me@luizca.net`)

---

## 1. Contexto e Declaração do Problema

À medida que o projeto **Manda um PIX** (`mandaumpix.app`) evolui desde sua configuração inicial até a implementação completa do PWA, decisões técnicas importantes sobre arquitetura client-side, dependências, padrões de código e armazenamento local precisam ser documentadas de forma rastreável.

## 2. Drivers de Decisão

- Manter histórico claro do racional técnico por trás das escolhas do projeto.
- Facilitar a manutenção contínua e a sincronização entre código e documentação viva.
- Padronizar documentos curtos e versionados junto ao código-fonte no Git.

## 3. Opções Consideradas

- **Opção 1**: Registrar Architecture Decision Records (ADRs) em Markdown dentro de `docs/architecture/decisions/`.
- **Opção 2**: Manter decisões espalhadas em mensagens de commit ou issues no GitHub.
- **Opção 3**: Não documentar decisões formalmente.

## 4. Decisão Escolhida

Escolhemos a **Opção 1**: adotar o formato **MADR (Markdown Architectural Decision Records)** no diretório `docs/architecture/decisions/`, com arquivos numerados sequencialmente.

## 5. Consequências e Impactos

- **Impacto Positivo**: Rastreabilidade completa no próprio repositório e verificação automática de sintaxe Markdown pelo ESLint (`@eslint/markdown`).
- **Impacto Negativo / Débito Técnico**: Requer atualização disciplinada sempre que uma decisão arquitetural relevante for tomada ou alterada.

---

⬅️ **Anterior**: [Integrações](../integrations.md) | ➡️ **Próximo**: [ADR 0002: Arquitetura PWA Client-Side com ES Modules](./0002-arquitetura-pwa-client-side-es-modules.md)

[Início](../../README.md) > [Arquitetura](../overview.md) > **ADR 0005**

# ADR 0005: Adoção do Modelo de Branching Git Flow Alinhado aos Ambientes de Deploy

- **Status**: Aceito
- **Data**: 2026-11-07
- **Autores**: Luiz Henrique Canet Filho (`me@luizca.net`)

---

## 1. Contexto e Declaração do Problema

O projeto **Manda um PIX** (`mandaumpix.app`) possui uma infraestrutura de hospedagem segregada em três ambientes independentes no **Firebase Hosting** ([ADR 0003](./0003-hospedagem-firebase-hosting-e-dominio-name-com.md)): `development` (`dev.mandaumpix.app`), `staging` (`stg.mandaumpix.app`) e `production` (`mandaumpix.app`), além de esteiras automatizadas de Integração e Entrega Contínua no **GitHub Actions**.

Era necessário formalizar o modelo de ramificação (_branching model_) do repositório Git para organizar o trabalho em novas funcionalidades, estabilização de _releases_, homologação pré-produção e correções emergenciais (_hotfixes_), garantindo rastreabilidade e mapeamento direto entre branches e ambientes de publicação.

## 2. Drivers de Decisão

- **Alinhamento Direto com os Três Ambientes (`dev`, `stg`, `prd`)**: Cada estágio de promoção de código deve corresponder de maneira previsível a um tipo de branch no repositório.
- **Isolamento de Desenvolvimento e Produção**: Garantir que a branch `main` reflita exclusivamente código estável em produção, enquanto a integração contínua do backlog ([`docs/business/backlog.md`](../../business/backlog.md)) ocorra de forma isolada em `develop`.
- **Estabilização Controlada de Releases e Hotfixes**: Permitir homologação de _release candidates_ em `staging` (`stg.mandaumpix.app`) antes da publicação definitiva em `production` (`mandaumpix.app`), bem como correções rápidas em produção sem contaminar funcionalidades ainda em desenvolvimento em `develop`.
- **Padronização com CI/CD e Conventional Commits**: Facilitar regras de proteção de branches, validação automática de Pull Requests ([`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml)) e versionamento semântico (_SemVer_).

## 3. Opções Consideradas

- **Opção 1**: **Git Flow** — Modelo estruturado com branches permanentes (`main` e `develop`) e branches temporárias de suporte (`feature/*`, `release/*`, `hotfix/*` e `bugfix/*`).
- **Opção 2**: **GitHub Flow** — Branch única principal (`main`) com branches curtas de funcionalidades e deploy direto em produção a cada merge.
- **Opção 3**: **Trunk-Based Development** — Commits diretos ou branches de curtíssima duração direto na `main` com uso extensivo de _feature flags_.

## 4. Decisão Escolhida

Escolhemos a **Opção 1**: adotar o modelo de branching **Git Flow** para o gerenciamento de código-fonte e ciclo de vida de releases do **Manda um PIX**.

### Estrutura de Branches e Mapeamento de Ambientes

| Tipo de Branch | Padrão de Nomenclatura      | Branch de Origem         | Branch de Destino (Merge)    | Ambiente Associado (`Firebase Hosting`)                  |
| :------------- | :-------------------------- | :----------------------- | :--------------------------- | :------------------------------------------------------- |
| **Produção**   | `main`                      | Inicialização do repo    | — (Permanente)               | `production` (`prd`) — `https://mandaumpix.app`          |
| **Integração** | `develop`                   | `main`                   | — (Permanente)               | `development` (`dev`) — `https://dev.mandaumpix.app`     |
| **Feature**    | `feature/<escopo-curto>`    | `develop`                | `develop` (via PR)           | Validação via CI (PR) e deploy em `dev` após merge       |
| **Bugfix**     | `bugfix/<escopo-curto>`     | `develop` ou `release/*` | `develop` ou `release/*`     | Validação via CI (PR) e ambiente da branch alvo          |
| **Release**    | `release/<versao>`          | `develop`                | `main` (com tag) + `develop` | `staging` (`stg`) — `https://stg.mandaumpix.app`         |
| **Hotfix**     | `hotfix/<versao-ou-escopo>` | `main`                   | `main` (com tag) + `develop` | `staging` (`stg`) para validação e `production` no merge |

## 5. Prós e Contras das Opções

### Opção 1: Git Flow (Escolhida)

- 👍 **Ponto positivo**: Casamento exato com a topologia de três ambientes (`develop` → `dev`, `release/*` e `hotfix/*` → `stg`, `main` → `prd`).
- 👍 **Ponto positivo**: Permite congelar o escopo de uma versão em `release/*` para testes de aceitação e auditoria de acessibilidade em `staging` enquanto `develop` continua aberta para novas histórias do backlog.
- 👍 **Ponto positivo**: Suporte claro para `hotfix/*` a partir de `main` caso um defeito crítico em produção precise ser corrigido imediatamente.
- 👎 **Ponto negativo**: Exige disciplina para realizar o _back-merge_ de branches `release/*` e `hotfix/*` tanto em `main` quanto em `develop`.

### Opção 2: GitHub Flow

- 👍 **Ponto positivo**: Fluxo mais simples com apenas uma branch permanente (`main`).
- 👎 **Ponto negativo**: Não oferece separação nativa entre o ambiente de integração contínua (`dev`), homologação de release (`stg`) e produção (`prd`).

### Opção 3: Trunk-Based Development

- 👍 **Ponto positivo**: Integração contínua em tronco único.
- 👎 **Ponto negativo**: Exigiria infraestrutura adicional de _feature toggles_ no código client-side para ocultar funcionalidades incompletas em produção.

## 6. Consequências e Impactos

- **Impacto Positivo**: Previsibilidade no ciclo de engenharia, histórico de versões limpo com tags SemVer (`vX.Y.Z`) na `main` e automação clara de CI/CD no GitHub Actions.
- **Impacto em Workflows de CI/CD**:
  - Pull Requests direcionados a `develop`, `release/*` e `main` executam obrigatoriamente o workflow `CI - Qualidade e Conformidade` ([`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml)).
  - Merges na branch `develop` disparam automaticamente o deploy para `dev.mandaumpix.app` ([`.github/workflows/deploy-dev.yml`](../../../.github/workflows/deploy-dev.yml)).
  - Branches `release/*` (e `hotfix/*`) promovem a versão candidata para homologação em `stg.mandaumpix.app` (`mandaumpix-app-stg`).
  - Merges e tags na branch `main` promovem a release homologada para produção em `mandaumpix.app` (`mandaumpix-app-prd`).

---

⬅️ **Anterior**: [ADR 0004: Persistência Local de Dados do Usuário com IndexedDB](./0004-persistencia-local-indexeddb.md) | ➡️ **Próximo**: [Design e Módulos](../../design/modules.md)

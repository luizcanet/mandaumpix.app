[Início](../README.md) > [Negócio](./overview.md) > **Backlog do Produto**

# 📋 Backlog Completo de Desenvolvimento (`mandaumpix.app`)

Este documento consolida o **Backlog do Produto e de Engenharia** do **Manda um PIX** (`mandaumpix.app`), estruturado em **Épicos**, **Histórias de Usuário / Tarefas Técnicas** e **Critérios de Aceite** rastreáveis às regras de negócio (`RN01` a `RN07`), à [Arquitetura em Camadas](../architecture/overview.md), ao [Design de Módulos](../design/modules.md) e à [Proposta de Interface (UI)](../design/ui_proposal.md).

---

## 📊 Visão Executiva e Progresso por Épico

| ID        | Épico                                                                      | Regras / Escopo                                     | Progresso Atual | Status          |
| :-------- | :------------------------------------------------------------------------- | :-------------------------------------------------- | :-------------: | :-------------- |
| **EP-01** | Fundação, Ferramental, Identidade Visual e CI/CD (`dev`)                   | Infraestrutura base, ESM/JSPM, Qualidade, Storybook |     `6 / 6`     | ✅ Concluído    |
| **EP-02** | Camada de Domínio e Casos de Uso (Clean Architecture)                      | `RN01`, `RN02`, `RN03`, `RN04`, `RN05`, `RN06`      |     `2 / 5`     | 🔄 Em andamento |
| **EP-03** | Camada de Infraestrutura e Adaptadores Web APIs (Local-First)              | `RN01`, `RN05`, `RN06`, Offline/Service Worker      |     `0 / 4`     | ⏳ Pendente     |
| **EP-04** | Casca da Aplicação, Roteamento SPA, Botão "Instalar" e Página "Sobre"      | `RN06`, `RN07`, `@modnes/router`, Layout Split-View |     `0 / 4`     | ⏳ Pendente     |
| **EP-05** | Gestão de Chaves PIX na Interface (`<pix-key-*>`)                          | `RN01`, `RN02`, `<dialog class="key-dialog">`       |     `0 / 3`     | ⏳ Pendente     |
| **EP-06** | Geração, Exibição e Distribuição de Cobrança ("Manda um PIX")              | `RN02`, `RN03`, `RN04`, `RN05`, QR Code & Saídas    |     `0 / 3`     | ⏳ Pendente     |
| **EP-07** | Qualidade Ponta a Ponta, Acessibilidade (WCAG 2.2 AA) e Deploy `stg`/`prd` | Testes de Integração, Storybook a11y, Releases      |     `0 / 3`     | ⏳ Pendente     |

---

## 🗺️ Roadmap e Grafo de Dependências de Desenvolvimento

```mermaid
flowchart TD
    EP01["✅ EP-01: Fundação, Identidade, JSPM, Testes & CI/CD (dev)"]
    EP02["🔄 EP-02: Camada de Domínio & Casos de Uso<br/>(ChaveConta, CobrancaPix, Use Cases)"]
    EP03["⏳ EP-03: Infraestrutura & Adaptadores Web APIs<br/>(IndexedDB, PWA Install, Clipboard/Share, SW)"]
    EP04["⏳ EP-04: Casca Global, Roteador SPA (@modnes/router),<br/>Botão 'Instalar' (RN06) & Página 'Sobre' (RN07)"]
    EP05["⏳ EP-05: Gestão de Chaves PIX na UI<br/>(Empty State, Seletor Radio Cards, Modal &lt;dialog&gt;)"]
    EP06["⏳ EP-06: Geração e Distribuição 'Manda um PIX'<br/>(Formulário de Valor, QR Code SVG, Copiar/WhatsApp/PNG)"]
    EP07["⏳ EP-07: Testes Integrados, Catálogo Storybook Completo<br/>& Pipelines CD (staging / production)"]

    EP01 --> EP02
    EP01 --> EP03
    EP02 --> EP04
    EP03 --> EP04
    EP02 & EP03 & EP04 --> EP05
    EP05 --> EP06
    EP04 & EP06 --> EP07
```

---

## 🧱 Detalhamento dos Épicos e Histórias de Usuário

### 📦 Épico 01 — Fundação, Ferramental, Identidade Visual e CI/CD (`dev`)

> **Objetivo**: Estabelecer a base arquitetural Zero-Build com ES Modules nativos e JSPM, licenciamento livre `AGPL-3.0-only`, linters multi-linguagem, testes unitários, ícones oficiais, Design Tokens, componente `<vector-icon>` e esteira de CI/CD para o ambiente `development`.

| ID          | Item de Backlog                                                                  | Status       | Artefatos no Repositório                                                                                                                                                               |
| :---------- | :------------------------------------------------------------------------------- | :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **US-01.1** | Configuração de ES Modules nativos, JSPM, Import Map W3C, `modulepreload` e SRI  | ✅ Concluído | [`package.json`](../../package.json), [`importmap.js`](../../importmap.js), [`index.html`](../../index.html)                                                                           |
| **US-01.2** | Licenciamento GNU AGPL v3.0 (`AGPL-3.0-only`), ESLint v10 Flat Config e Prettier | ✅ Concluído | [`LICENSE`](../../LICENSE), [`eslint.config.js`](../../eslint.config.js), [`.prettierrc`](../../.prettierrc)                                                                           |
| **US-01.3** | Configuração do Vitest + JSDOM + Cobertura V8                                    | ✅ Concluído | [`vitest.config.js`](../../vitest.config.js), [`src/main.test.js`](../../src/main.test.js)                                                                                             |
| **US-01.4** | Criação do logotipo vetorial, ícones de instalação e `manifest.json`             | ✅ Concluído | [`src/assets/icons/`](../../src/assets/icons/icon.svg), [`manifest.json`](../../manifest.json)                                                                                         |
| **US-01.5** | Design Tokens CSS, Reset, Storybook v10 e Web Component `<vector-icon>`          | ✅ Concluído | [`src/presentation/styles/tokens.css`](../../src/presentation/styles/tokens.css), [`vector-icon.component.js`](../../src/presentation/components/vector-icon/vector-icon.component.js) |
| **US-01.6** | Workflows GitHub Actions de CI e CD automático para `dev.mandaumpix.app`         | ✅ Concluído | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), [`.github/workflows/deploy-dev.yml`](../../.github/workflows/deploy-dev.yml)                                             |

---

### 🧠 Épico 02 — Camada de Domínio e Casos de Uso (Clean Architecture)

> **Objetivo**: Implementar as entidades puras de domínio, validações de regras de negócio (`RN01`–`RN07`) e casos de uso desacoplados de frameworks e do DOM, guiados por TDD.

#### `US-02.1` — Funções Base de Geração e Parsing de Cobrança PIX (`✅ Concluído`)

- **Descrição**: Implementar as funções puras de geração de payload BR Code (`generatePixCharge`), validação/parsing (`parsePixCharge`) e exportação gráfica (`exportQrCodePng`) integrando `pix-utils` e `qr`.
- **Artefatos**: [`src/main.js`](../../src/main.js), [`src/main.test.js`](../../src/main.test.js).

#### `US-02.2` — Entidade `ChaveConta` e Validador de Chaves PIX (`✅ Concluído` · `3 Story Points`)

- **História (Narrativa Canônica)**:
  > **Como** **Recebedor** que cadastra contas no Manda um PIX,
  > **Quero** que minhas chaves PIX (`CPF`, `CNPJ`, `EMAIL`, `TELEFONE`, `EVP`) e os dados do titular (`nome_recebedor`, `cidade_recebedor`, `rotulo`) sejam validados e normalizados segundo o padrão EMV® / BR Code do Banco Central no momento do cadastro,
  > **Para que** apenas chaves íntegras sejam salvas no dispositivo e eu evite a geração de códigos BR Code inválidos ou rejeitados pelos aplicativos bancários.
- **Regras de Negócio e Invariantes**: `RN01` ([Modelo de Domínio](./domain_model.md), [Modelo de Dados](../design/data_models.md) e [Especificações EMV](../design/api_specs.md)).
  - **INV-01 (`CPF`)**: Sanitização de máscara (`[^\d]`), 11 dígitos numéricos, rejeição de dígitos repetidos (`000...` a `999...`) e validação dos 2 dígitos verificadores (Módulo 11).
  - **INV-02 (`CNPJ`)**: Sanitização de máscara (`[^\d]`), 14 dígitos numéricos, rejeição de dígitos repetidos e validação dos 2 dígitos verificadores (Módulo 11).
  - **INV-03 (`EMAIL`)**: Normalização `trim()` + `toLowerCase()`, formato de e-mail válido e comprimento máximo `<= 77` caracteres (limite DICT/BACEN).
  - **INV-04 (`TELEFONE`)**: Normalização para padrão internacional E.164 (`+55DDD9XXXXXXXX`, 14 caracteres totais com DDD válido `11..99` e nono dígito `9`).
  - **INV-05 (`EVP`)**: Normalização `trim()` + `toLowerCase()` e validação estrita de UUID v4 (`36` caracteres hifenizados).
  - **INV-06 (`nome_recebedor` — Tag EMV `59`)**: Obrigatório; remoção de acentos (`NFD`) e caracteres não-ASCII, conversão para `UPPERCASE`, colapso de espaços e truncamento seguro em até `25` caracteres.
  - **INV-07 (`cidade_recebedor` — Tag EMV `60`)**: Obrigatório; remoção de acentos (`NFD`) e caracteres não-ASCII, conversão para `UPPERCASE`, colapso de espaços e truncamento seguro em até `15` caracteres.
  - **INV-08 (Identidade & Imutabilidade)**: Geração automática de `id` (`crypto.randomUUID()`), `criado_em` (ISO-8601), normalização de `rotulo` (com fallback amigável por tipo) e congelamento da instância (`Object.freeze`).
- **Critérios de Aceite (BDD / Gherkin)**:
  - **Cenário 01 (CPF e CNPJ com máscara)**: Dado um CPF (`123.456.789-09`) ou CNPJ (`11.222.333/0001-81`) válido com pontuação, quando `ChaveConta.create()` for invocado, então `valor_chave` deve ser normalizado apenas com dígitos (`12345678909` / `11222333000181`) e a instância imutável criada com sucesso.
  - **Cenário 02 (E-mail, Telefone e EVP válidos)**: Dado um e-mail (`<= 77` chars), telefone celular brasileiro ou chave EVP UUID v4 válidos, quando `ChaveConta.create()` for invocado, então `valor_chave` deve ser normalizado (`lowercase` para e-mail/EVP e `+55DDD9XXXXXXXX` para telefone).
  - **Cenário 03 (Normalização EMV de Titular e Cidade)**: Dado `nome_recebedor` `"João da Silva Júnior & Cia Ltda"` (`31` chars com acentos/símbolos) e `cidade_recebedor` `"São José dos Campos"` (`19` chars), quando a entidade for criada, então `nome_recebedor` deve resultar em `"JOAO DA SILVA JUNIOR CIA"` (`<= 25` chars) e `cidade_recebedor` em `"SAO JOSE DOS CA"` (`<= 15` chars).
  - **Cenário 04 (Rejeição de Chaves Inválidas)**: Dado um `tipo_chave` desconhecido ou um `valor_chave` inválido (CPF/CNPJ com DV incorreto ou dígitos repetidos, e-mail `> 77` chars, telefone fora do padrão móvel nacional ou UUID malformado), quando a criação for acionada, então deve lançar `PixKeyValidationError` indicando o motivo da falha.
- **Tarefas de Desenvolvimento (Dev Tasks)**:
  - [x] **TASK-02.2.1 (Domínio / Erros & Constantes)**: Definir constantes `PIX_KEY_TYPES`, `DEFAULT_PIX_KEY_LABELS`, `PIX_KEY_ERROR_CODES` e a classe de erro `PixKeyValidationError` em [`src/domain/entities/pix-key.entity.js`](../../src/domain/entities/pix-key.entity.js) com testes unitários em [`src/domain/entities/pix-key.entity.test.js`](../../src/domain/entities/pix-key.entity.test.js).
  - [x] **TASK-02.2.2 (TDD / Validadores de Chave PIX)**: Criar testes unitários e implementar funções puras de validação e sanitização para `CPF`, `CNPJ`, `EMAIL`, `TELEFONE` e `EVP` (`validateAndNormalizePixKey`) em [`src/domain/entities/pix-key.entity.js`](../../src/domain/entities/pix-key.entity.js).
  - [x] **TASK-02.2.3 (TDD / Normalizadores EMV)**: Criar testes unitários e implementar normalizadores `normalizeMerchantName` (`<= 25` chars) e `normalizeMerchantCity` (`<= 15` chars) compatíveis com EMV® QRCPS-MPM e `pix-utils` em [`src/domain/entities/pix-key.entity.js`](../../src/domain/entities/pix-key.entity.js).
  - [x] **TASK-02.2.4 (TDD / Entidade `ChaveConta`)**: Implementar a classe/fábrica imutável `ChaveConta` (`PixKeyEntity`) em [`src/domain/entities/pix-key.entity.js`](../../src/domain/entities/pix-key.entity.js) (`id`, `rotulo`, `tipo_chave`, `valor_chave`, `nome_recebedor`, `cidade_recebedor`, `criado_em`, `toJSON()`) com suíte completa em [`src/domain/entities/pix-key.entity.test.js`](../../src/domain/entities/pix-key.entity.test.js) (`100%` de cobertura nas regras).
  - [x] **TASK-02.2.5 (Integração & Exportação)**: Reexportar `ChaveConta` / `PixKeyValidationError` em [`src/main.js`](../../src/main.js) e validar pipeline de qualidade (`npm run lint`, `npm run format:check`, `npm run test:coverage`).

#### `US-02.3` — Entidade `CobrancaPix` e Caso de Uso `GeneratePixChargeUseCase` (`✅ Concluído` · `3 Story Points`)

- **História (Narrativa Canônica)**:
  > **Como** **Recebedor** que utiliza o Manda um PIX,
  > **Quero** gerar uma cobrança PIX a partir de uma `ChaveConta` selecionada, informando opcionalmente um valor monetário fixo ou mantendo o valor dinâmico (em aberto),
  > **Para que** eu obtenha simultaneamente o código **PIX Copia e Cola** (`chave_cobranca` no padrão EMV® BR Code com CRC16 válido) e a representação gráfica do **QR Code** (`imagem_qrcode`) prontos para leitura óptica ou compartilhamento imediato.
- **Regras de Negócio e Invariantes**: `RN02`, `RN03`, `RN04` ([Modelo de Domínio](./domain_model.md), [Modelo de Dados](../design/data_models.md) e [Especificações EMV](../design/api_specs.md)).
  - **INV-01 (`RN02` — Seleção Obrigatória de `ChaveConta`)**: A emissão exige uma `ChaveConta` válida (instância de `ChaveConta` ou objeto hidratável via `ChaveConta.fromJSON()`). Quando ausente ou nula, lança `PixChargeValidationError` com código `MISSING_PIX_KEY`; quando malformada, propaga/lança erro de validação (`INVALID_PIX_KEY`).
  - **INV-02 (`RN03` — Modalidade de Valor Dinâmico / Aberto)**: Quando `valor_opcional` for omitido (`undefined`), `null`, string vazia (`""`) ou zero (`0`, `"0"`, `"0,00"`, `"0.00"`), define `valor_opcional = null` e `valor_dinamico = true`, omitindo a tag EMV `54` (_Transaction Amount_) do payload BR Code.
  - **INV-03 (`RN03` — Modalidade de Valor Fixo e Sanitização Monetária BRL)**: Quando `valor_opcional` for positivo (numérico como `42.5` ou string monetária como `"42,50"` / `"R$ 1.234,56"`), normaliza para `Number` com duas casas decimais (`42.5`), define `valor_dinamico = false` e inclui a tag EMV `54` formatada (`"42.50"`). Rejeita valores negativos (`< 0`), `NaN`, `Infinity` ou acima de `999999999.99` com `PixChargeValidationError` (`INVALID_AMOUNT`).
  - **INV-04 (Identificador de Transação `txid` — Tag EMV `62` / Subtag `05`)**: Assume `"***"` por padrão quando omitido ou vazio; se informado, deve conter apenas caracteres alfanuméricos ASCII (`1` a `25` caracteres) ou `"***"`, lançando `PixChargeValidationError` (`INVALID_TXID`) caso contrário.
  - **INV-05 (`RN04` — Geração Simultânea de BR Code e QR Code)**: Produz deterministicamente `chave_cobranca` (`brCode` EMV® iniciado por `000201` e finalizado pelo `CRC16` na tag `63`) e `imagem_qrcode` (objeto imutável contendo `svg`, `dataUrl` e `gifBytes`).
  - **INV-06 (Imutabilidade e Rastreabilidade)**: Registra `id_chave_conta` (`chaveConta.id`), `chave_conta` (instância `ChaveConta`), `valor_opcional`, `valor_dinamico`, `txid`, `info_adicional`, `chave_cobranca`, `imagem_qrcode` e `gerado_em` (ISO-8601), expondo `toJSON()` e congelando a instância com `Object.freeze()`.
  - **INV-07 (Orquestração no Caso de Uso `GeneratePixChargeUseCase`)**: Aceita uma `chaveConta` direta no input ou resolve a chave ativa via porta opcional `pixKeyRepository`, executa a geração da `CobrancaPix` e retorna o resultado pronto para a camada de apresentação.
- **Critérios de Aceite (BDD / Gherkin)**:
  - **Cenário 01 (Cobrança com Valor Fixo — `RN02`, `RN03`, `RN04`)**: Dada uma `ChaveConta` válida selecionada e um `valor_opcional` de `42.5` (ou `"42,50"`), quando `GeneratePixChargeUseCase.execute()` for invocado, então deve retornar uma `CobrancaPix` imutável com `valor_opcional = 42.5`, `valor_dinamico = false`, `chave_cobranca` contendo a tag EMV `54` (`"540542.50"`) e `imagem_qrcode` preenchida (`svg`, `dataUrl`, `gifBytes`).
  - **Cenário 02 (Cobrança com Valor Dinâmico/Aberto — `RN03`, `RN04`)**: Dada uma `ChaveConta` válida selecionada e `valor_opcional` omitido, nulo, vazio ou `0`, quando `GeneratePixChargeUseCase.execute()` for invocado, então deve retornar uma `CobrancaPix` com `valor_opcional = null`, `valor_dinamico = true`, `chave_cobranca` sem a tag EMV `54` (`transactionAmount = 0` no parser) e `imagem_qrcode` válida.
  - **Cenário 03 (Bloqueio sem Chave Selecionada — `RN02`)**: Dado que nenhuma `ChaveConta` foi informada (ou o repositório não possui chave ativa selecionada), quando a geração for acionada, então deve lançar `PixChargeValidationError` com código `MISSING_PIX_KEY`.
  - **Cenário 04 (Rejeição de Valor Monetário ou `txid` Inválido)**: Dada uma `ChaveConta` válida, quando `valor_opcional` for negativo (`-10`), malformado (`"abc"`), acima do limite EMV ou `txid` contiver símbolos inválidos/exceder `25` caracteres, então deve lançar `PixChargeValidationError` (`INVALID_AMOUNT` ou `INVALID_TXID`).
- **Tarefas de Desenvolvimento (Dev Tasks)**:
  - [x] **TASK-02.3.1 (Domínio / Erros, Constantes & Sanitizadores de Cobrança)**: Definir `PIX_CHARGE_ERROR_CODES`, `PixChargeValidationError`, `normalizeTransactionAmount` (suporte a `number`, strings BRL `"1.234,56"`, `null`/`0` como valor aberto) e `normalizeTxid` em [`src/domain/entities/pix-charge.entity.js`](../../src/domain/entities/pix-charge.entity.js) com testes unitários em [`src/domain/entities/pix-charge.entity.test.js`](../../src/domain/entities/pix-charge.entity.test.js).
  - [x] **TASK-02.3.2 (TDD / Entidade Imutável `CobrancaPix`)**: Implementar a classe/fábrica `CobrancaPix` (`PixChargeEntity`) em [`src/domain/entities/pix-charge.entity.js`](../../src/domain/entities/pix-charge.entity.js) validando a associação obrigatória com `ChaveConta` (`RN02`), `valor_opcional` e `valor_dinamico` (`RN03`), `chave_cobranca` e `imagem_qrcode` (`RN04`), `gerado_em` e `toJSON()`, com cobertura unitária de `100%`.
  - [x] **TASK-02.3.3 (TDD / Caso de Uso `GeneratePixChargeUseCase`)**: Implementar `GeneratePixChargeUseCase` (e helper funcional `executeGeneratePixCharge`) em [`src/application/use-cases/generate-pix-charge.use-case.js`](../../src/application/use-cases/generate-pix-charge.use-case.js) com testes unitários em [`src/application/use-cases/generate-pix-charge.use-case.test.js`](../../src/application/use-cases/generate-pix-charge.use-case.test.js) cobrindo execução síncrona/assíncrona, resolução via `pixKeyRepository` mockado, valor fixo, valor aberto e tratamento de falhas.
  - [x] **TASK-02.3.4 (Integração, Reexportação & Qualidade)**: Integrar `CobrancaPix` e `GeneratePixChargeUseCase` em [`src/main.js`](../../src/main.js) (mantendo retrocompatibilidade com `generatePixCharge`), atualizar [`src/main.test.js`](../../src/main.test.js) e validar `npm run lint`, `npm run format:check` e `npm run test:coverage`.

#### `US-02.4` — Casos de Uso de Gestão de Chaves de Contas (`⏳ Pendente` · `3 Story Points`)

- **História (Narrativa Canônica)**:
  > **Como** **Recebedor** que utiliza o Manda um PIX para receber em diferentes contas bancárias,
  > **Quero** cadastrar novas chaves PIX, listar minhas chaves salvas, selecionar a chave ativa para emissão de cobrança e remover chaves que não utilizo mais, mantendo automaticamente uma chave válida selecionada sempre que houver ao menos uma conta cadastrada,
  > **Para que** eu possa gerenciar minhas contas de recebimento sem duplicidades e emitir cobranças PIX em poucos toques sem redigitar dados.
- **Regras de Negócio e Invariantes**: `RN01`, `RN02` ([Modelo de Domínio](./domain_model.md), [Modelo de Dados](../design/data_models.md) e [Especificações e Contratos](../design/api_specs.md)).
  - **INV-01 (Contrato da Porta `pixKeyRepository`)**: Todos os casos de uso exigem um repositório válido (`findAll`, `save`, `deleteById`, `getSelectedKeyId`, `setSelectedKeyId`). Quando ausente ou inválido, lançam `PixKeyManagementError` com código `MISSING_PIX_KEY_REPOSITORY`.
  - **INV-02 (`RN01` — Validação, Hidratação e Prevenção de Duplicidade no Cadastro — `SavePixKeyUseCase`)**: Os dados de entrada são validados/hidratados via `ChaveConta.create()` (propagando `PixKeyValidationError` quando inválidos). Rejeita o cadastro de outra chave com o mesmo par normalizado `(tipo_chave, valor_chave)` e `id` distinto com `PixKeyManagementError` (`DUPLICATE_PIX_KEY`).
  - **INV-03 (`RN01`, `RN02` — Auto-Seleção no Cadastro — `SavePixKeyUseCase`)**: Ao persistir uma chave, define-a automaticamente como selecionada (`setSelectedKeyId(chaveConta.id)`) quando for a primeira chave cadastrada, quando não houver chave ativa válida ou quando `selectAsActive = true`.
  - **INV-04 (`RN01`, `RN02` — Listagem Hidratada e Auto-Recuperação de Seleção — `ListPixKeysUseCase`)**: Retorna a lista imutável de instâncias `ChaveConta` (`items`), `selectedKeyId` e `selectedKey`. Caso existam chaves salvas e `selectedKeyId` seja nulo ou órfão, reatribui automaticamente a primeira chave disponível (`items[0].id`); caso não existam chaves, garante `selectedKeyId = null` e `selectedKey = null`.
  - **INV-05 (`RN02` — Seleção Explícita de Chave Ativa — `SelectPixKeyUseCase`)**: Exige um `id` não vazio (`MISSING_PIX_KEY_ID`) pertencente a uma `ChaveConta` existente no repositório (`PIX_KEY_NOT_FOUND`), persiste `setSelectedKeyId(id)` e retorna `{ selectedKeyId, selectedKey }`.
  - **INV-06 (`RN01`, `RN02` — Exclusão e Reatribuição Automática da Chave Ativa — `DeletePixKeyUseCase`)**: Exige um `id` válido e existente (`MISSING_PIX_KEY_ID` / `PIX_KEY_NOT_FOUND`), remove a chave via `deleteById(id)` e, caso a chave excluída fosse a ativa (ou a seleção estivesse órfã), seleciona automaticamente a primeira chave remanescente (`remaining[0].id`) ou define `selectedKeyId = null` se a coleção ficar vazia.
- **Critérios de Aceite (BDD / Gherkin)**:
  - **Cenário 01 (Cadastro da Primeira Chave com Auto-Seleção — `RN01`, `RN02`)**: Dado que o repositório está vazio, quando `SavePixKeyUseCase.execute()` for invocado com dados válidos de `ChaveConta`, então a chave deve ser persistida e definida automaticamente como a chave ativa (`selectedKeyId = chave.id`).
  - **Cenário 02 (Cadastro de Múltiplas Chaves e Bloqueio de Duplicidade — `RN01`)**: Dado que já existe uma chave ativa cadastrada, quando uma nova chave distinta for salva, ela deve ser adicionada à coleção mantendo a seleção vigente (ou assumindo a seleção se `selectAsActive = true`); se possuir o mesmo `(tipo_chave, valor_chave)` de outra chave existente, deve lançar `PixKeyManagementError` (`DUPLICATE_PIX_KEY`).
  - **Cenário 03 (Listagem e Troca de Chave Selecionada — `RN01`, `RN02`)**: Dadas múltiplas chaves salvas, quando `SelectPixKeyUseCase.execute({ id })` e `ListPixKeysUseCase.execute()` forem invocados, então `selectedKeyId` e `selectedKey` devem refletir a chave escolhida; se o `id` informado não existir, deve lançar `PixKeyManagementError` (`PIX_KEY_NOT_FOUND`).
  - **Cenário 04 (Remoção da Chave Ativa e Reatribuição / Limpeza — `RN01`, `RN02`)**: Dada uma chave ativa selecionada, quando `DeletePixKeyUseCase.execute({ id })` removê-la, então a seleção deve ser reatribuída automaticamente para a primeira chave remanescente (ou `null` quando a última chave for excluída).
- **Tarefas de Desenvolvimento (Dev Tasks)**:
  - [x] **TASK-02.4.1 (TDD / Erros de Gestão & Caso de Uso `SavePixKeyUseCase`)**: Definir `PIX_KEY_MANAGEMENT_ERROR_CODES`, `PixKeyManagementError` e implementar `SavePixKeyUseCase` (`executeSavePixKey`) em [`src/application/use-cases/save-pix-key.use-case.js`](../../src/application/use-cases/save-pix-key.use-case.js) com testes unitários em [`src/application/use-cases/save-pix-key.use-case.test.js`](../../src/application/use-cases/save-pix-key.use-case.test.js).
  - [x] **TASK-02.4.2 (TDD / Caso de Uso `ListPixKeysUseCase`)**: Implementar `ListPixKeysUseCase` (`executeListPixKeys`) em [`src/application/use-cases/list-pix-keys.use-case.js`](../../src/application/use-cases/list-pix-keys.use-case.js) com testes unitários em [`src/application/use-cases/list-pix-keys.use-case.test.js`](../../src/application/use-cases/list-pix-keys.use-case.test.js) cobrindo hidratação, estado vazio e auto-recuperação de `selectedKeyId` órfão.
  - [ ] **TASK-02.4.3 (TDD / Caso de Uso `SelectPixKeyUseCase`)**: Implementar `SelectPixKeyUseCase` (`executeSelectPixKey`) em `src/application/use-cases/select-pix-key.use-case.js` com testes unitários em `src/application/use-cases/select-pix-key.use-case.test.js` cobrindo seleção válida e erros `MISSING_PIX_KEY_ID` / `PIX_KEY_NOT_FOUND`.
  - [ ] **TASK-02.4.4 (TDD / Caso de Uso `DeletePixKeyUseCase`)**: Implementar `DeletePixKeyUseCase` (`executeDeletePixKey`) em `src/application/use-cases/delete-pix-key.use-case.js` com testes unitários em `src/application/use-cases/delete-pix-key.use-case.test.js` cobrindo remoção de chave inativa, reatribuição ao excluir chave ativa e limpeza ao excluir a última chave.
  - [ ] **TASK-02.4.5 (Integração, Reexportação & Qualidade)**: Reexportar os casos de uso e erros de gestão de chaves em [`src/main.js`](../../src/main.js), atualizar [`src/main.test.js`](../../src/main.test.js) e validar `npm run lint`, `npm run format:check` e `npm run test:coverage`.

#### `US-02.5` — Casos de Uso de Distribuição da Cobrança e Instalação do PWA (`⏳ Pendente`)

- **História**: Como **Recebedor**, quero copiar o código PIX Copia e Cola, compartilhá-lo no WhatsApp, salvar o QR Code como imagem PNG e instalar o aplicativo no meu dispositivo.
- **Regras de Negócio**: `RN05`, `RN06`.
- **Critérios de Aceite**:
  - [ ] Implementar `distribute-pix-charge.use-case.js` orquestrando as portas de cópia (`copyChargeCode`), compartilhamento (`shareCharge`) e download de imagem (`downloadQrImage`) (`RN05`).
  - [ ] Implementar `install-pwa.use-case.js` gerenciando o estado de disponibilidade de instalação (`canInstall`, `isInstalled`) e o disparo do prompt nativo (`triggerInstall`) (`RN06`).
  - [ ] Testes unitários validando todos os fluxos e fallbacks.

---

### 🔌 Épico 03 — Camada de Infraestrutura e Adaptadores Web APIs (Local-First)

> **Objetivo**: Implementar os adaptadores concretos de infraestrutura do navegador (IndexedDB, Clipboard, Web Share / WhatsApp, Download PNG, Instalação PWA e Service Worker), mantendo 100% dos dados do usuário locais no dispositivo.

#### `US-03.1` — Repositório Local de Dados do Usuário no IndexedDB (`IndexedDbPixKeyRepository`) (`⏳ Pendente`)

- **História**: Como **Recebedor**, quero que meus dados e chaves PIX cadastradas fiquem salvos de forma segura e estruturada no banco **IndexedDB** do meu próprio navegador para não precisar redigitá-los a cada cobrança, sem que meus dados sejam enviados para servidores externos.
- **Regras de Negócio**: `RN01`, [ADR 0004](../architecture/decisions/0004-persistencia-local-indexeddb.md) e [Conformidade e Privacidade](../security/compliance.md).
- **Critérios de Aceite**:
  - [ ] Implementar `src/infrastructure/storage/indexed-db-pix-key.repository.js` persistindo os registros de `ChaveConta` e as preferências do usuário (`selectedKeyId`) em `window.indexedDB` (banco `mandaumpix_db`, versão `1`, _object stores_ `pix_keys` e `user_settings`).
  - [ ] Gerenciar criação e migração de esquema via evento `onupgradeneeded` e executar leituras/escritas em transações atômicas (`readonly` e `readwrite`) encapsuladas em `Promises`.
  - [ ] Integrar reatividade de estado com `@modnes/data-controller` (`DataHandler` / `ArrayHandler`) para sincronizar alterações com a camada de apresentação.
  - [ ] Tratar indisponibilidade do `indexedDB`, bloqueio de versão ou erros de transação (`QuotaExceededError`, `AbortError`) de forma resiliente.
  - [ ] Testes unitários e de integração validando as operações assíncronas do repositório sobre `indexedDB`.

#### `US-03.2` — Adaptador de Instalação do PWA (`PwaInstallAdapter`) (`⏳ Pendente`)

- **História**: Como **Recebedor** acessando pelo navegador sem ter o app instalado, quero que o sistema detecte automaticamente quando o PWA pode ser instalado e me permita instalá-lo com um clique no botão **"Instalar"**.
- **Regras de Negócio**: `RN06` ([Especificações e Contratos](../design/api_specs.md)).
- **Critérios de Aceite**:
  - [ ] Implementar `src/infrastructure/pwa/pwa-install.adapter.js`.
  - [ ] Detectar se o aplicativo já roda em modo instalado via `window.matchMedia('(display-mode: standalone)').matches` ou `navigator.standalone === true`.
  - [ ] Capturar e armazenar o evento `beforeinstallprompt`, expondo estado reativo para exibir o botão destacado **"Instalar"** (`RN06`).
  - [ ] Executar `deferredPrompt.prompt()` e aguardar `deferredPrompt.userChoice` quando acionado pelo usuário.
  - [ ] Escutar o evento `appinstalled` para ocultar imediatamente o botão **"Instalar"**.
  - [ ] Testes automatizados simulando eventos `beforeinstallprompt`, escolha `accepted`/`dismissed` e `appinstalled`.

#### `US-03.3` — Adaptadores de Saída: Clipboard, Web Share (WhatsApp) e Download PNG (`⏳ Pendente`)

- **História**: Como **Recebedor**, quero que os botões de **Copiar**, **Compartilhar** e **Salvar PNG** funcionem em smartphones e desktops utilizando os recursos nativos do meu sistema operacional.
- **Regras de Negócio**: `RN05` ([Especificações e Contratos](../design/api_specs.md)).
- **Critérios de Aceite**:
  - [ ] Implementar `src/infrastructure/share/browser-share.adapter.js`:
    - **Copiar**: utiliza `navigator.clipboard.writeText(brCode)`.
    - **Compartilhar**: utiliza `navigator.share({ title, text, files })` quando suportado pelo navegador; caso contrário, abre URL de fallback `https://wa.me/?text=${encodeURIComponent(brCode)}` em nova aba segura (`noopener,noreferrer`).
    - **Salvar PNG**: converte o SVG do QR Code em PNG (`512x512`) via [`exportQrCodePng`](../../src/main.js) e dispara download local com `<a download="mandaumpix-qrcode.png">`.
  - [ ] Testes unitários com mocks de `navigator.clipboard`, `navigator.share`, `URL.createObjectURL` e âncora de download.

#### `US-03.4` — Service Worker (`sw.js`) e Funcionamento Offline (`⏳ Pendente`)

- **História**: Como **Recebedor**, quero abrir o **Manda um PIX** e gerar cobranças mesmo quando estiver em locais com sinal de internet instável ou sem conexão.
- **Critérios de Aceite**:
  - [ ] Implementar `sw.js` na raiz da aplicação com estratégia de cache para a casca HTML (`index.html`), estilos, ícones, `manifest.json` e módulos mapeados no Import Map.
  - [ ] Registrar o Service Worker de forma segura no bootstrap da aplicação (`navigator.serviceWorker.register('./sw.js')`).
  - [ ] Atualizar [`importmap` / build](../../package.json) e [`firebase.json`](../../firebase.json) caso necessário para servir `sw.js` com escopo raiz (`/`).

---

### 🏛️ Épico 04 — Casca da Aplicação, Roteamento SPA, Botão "Instalar" e Página "Sobre"

> **Objetivo**: Construir a estrutura global da interface (`.app-root`, `<app-header>`, `.app-footer`), configurar as rotas `/` e `/sobre` com `@modnes/router` e entregar os requisitos completos do botão destacado **"Instalar"** (`RN06`) e da página **"Sobre"** (`RN07`).

#### `US-04.1` — Casca Semântica Global e Layout Responsivo (Mobile-First & Desktop Split-View) (`⏳ Pendente`)

- **História**: Como **Recebedor**, quero uma interface rápida, ergonômica para uso com uma mão no celular e organizada em duas colunas no computador.
- **Referência Visual**: [Proposta de Interface (UI)](../design/ui_proposal.md) e [`docs/design/ui_prototype.html`](../design/ui_prototype.html).
- **Critérios de Aceite**:
  - [ ] Atualizar [`index.html`](../../index.html) e criar folhas de estilo modulares em `src/presentation/styles/` seguindo estritamente a metodologia **BEM** (`.app-root`, `.app-header`, `.app-main`, `.app-footer`, `.charge-page`).
  - [ ] Implementar layout Mobile-First (`< 768px` em coluna única otimizada para polegar) e Desktop Split-View (`>= 768px` em `CSS Grid` de 2 colunas lado a lado).
  - [ ] Incluir rodapé minimalista (`.app-footer`) com selo _"100% Local & Offline-Ready"_, link para `/sobre` e referência à licença `AGPL-3.0-only`.

#### `US-04.2` — Componente `<app-header>` com Botão Destacado "Instalar" (`RN06`) e Atalho "Sobre" (`RN07`) (`⏳ Pendente`)

- **História**: Como **Recebedor**, quero ver um botão destacado **"Instalar"** no topo do aplicativo caso ainda não o tenha instalado no meu aparelho, além de um botão de fácil acesso para a página **"Sobre"**.
- **Regras de Negócio**: `RN06`, `RN07`.
- **Critérios de Aceite**:
  - [ ] Criar Web Component `src/presentation/components/app-header/app-header.component.js` estendendo `CustomElement` (`@modnes/custom-element`).
  - [ ] Exibir logotipo vetorial, título **Manda um PIX**, botão destacado **`.app-header__install-btn`** (`#00d37f` com `<vector-icon name="download">`) e link **`.app-header__about-link`** (`<vector-icon name="circle-info">`).
  - [ ] Renderizar `.app-header__install-btn` exclusivamente quando o PWA não estiver instalado e ocultá-lo imediatamente após a instalação (`RN06`).
  - [ ] Criar testes unitários (`app-header.test.js`) e stories no Storybook (`app-header.stories.js` nos estados _Não Instalado / Com Botão Instalar_ e _Já Instalado_).

#### `US-04.3` — Roteamento SPA (`@modnes/router`) e Injeção de Dependências (`SetInjectable`) (`⏳ Pendente`)

- **História**: Como **Recebedor**, quero alternar instantaneamente entre a tela principal de cobrança (`/`) e a página institucional (`/sobre`) sem recarregamento de página.
- **Critérios de Aceite**:
  - [ ] Configurar `@modnes/router` no bootstrap da aplicação ([`src/main.js`](../../src/main.js)) mapeando a rota `/` para a visualização de cobrança e `/sobre` para `<about-page>`.
  - [ ] Registrar controladores de estado e casos de uso via `SetInjectable` (`@modnes/custom-element`) para consumo desacoplado pelos componentes.
  - [ ] Garantir funcionamento com `rewrites` de SPA já configurados em [`firebase.json`](../../firebase.json).

#### `US-04.4` — Página Institucional `<about-page>` (`/sobre` — Autor, Projeto, Apoio e Divulgação) (`⏳ Pendente`)

- **História**: Como **Recebedor**, quero acessar facilmente uma página **"Sobre"** que explique que o aplicativo é gratuito, livre e de código aberto, apresente as informações sobre o **autor** e o **projeto**, permita contribuir voluntariamente com qualquer valor via **"Manda um PIX"** para `eu@luizca.net` (com QR Code de valor dinâmico e Chave copia e cola) e me incentive a divulgar o aplicativo para mais pessoas.
- **Regras de Negócio**: `RN07` ([Modelo de Domínio](./domain_model.md) e [Especificações e Contratos](../design/api_specs.md)).
- **Critérios de Aceite**:
  - [ ] Criar Web Component `src/presentation/pages/about-page/about-page.component.js` (bloco BEM `.about-page`).
  - [ ] Apresentar seção **Sobre o Aplicativo** destacando que o **Manda um PIX** é **gratuito, livre e de código aberto**, facilita a geração de cobranças sem abrir apps de banco com privacidade 100% local, e exibir o botão **"Início"** (`<vector-icon name="home">`) para retornar a `/`.
  - [ ] Apresentar card **Sobre o Autor**: **Luiz Henrique Canet Filho**, e-mail `<me@luizca.net>` e GitHub [`@luizcanet`](https://github.com/luizcanet).
  - [ ] Apresentar card **Sobre o Projeto e Licença**: domínio `mandaumpix.app` (`v1.0.0`), link oficial do código-fonte e issues ([`github.com/luizcanet/mandaumpix.app`](https://github.com/luizcanet/mandaumpix.app)) e licença **GNU Affero General Public License v3.0 (`AGPL-3.0-only`)**.
  - [ ] Apresentar seção/card de **Contribuição Voluntária ("Manda um PIX")**: texto descontraído com emojis explicando que o app é gratuito, livre e de código aberto, mas que se o usuário achar que ele é útil para si e para outras pessoas, pode contribuir para ajudar a manter o projeto com qualquer valor usando a frase **"Manda um PIX"**, exibindo o **QR Code com valor dinâmico (aberto)** e a **Chave copia e cola** gerados para **`eu@luizca.net`** (com botão de cópia rápida).
  - [ ] Apresentar seção/card de **Incentivo à Divulgação**: mensagem incentivando o usuário a divulgar e compartilhar o aplicativo (`https://mandaumpix.app`) para mais pessoas, acompanhada de botão de compartilhamento.
  - [ ] Criar testes unitários (`about-page.test.js`) e story (`about-page.stories.js`).

---

### 🔑 Épico 05 — Gestão de Chaves PIX na Interface (`RN01`, `RN02`)

> **Objetivo**: Implementar a experiência completa de cadastro, listagem, seleção e remoção de múltiplas chaves PIX diretamente na tela principal sem mudança de contexto.

#### `US-05.1` — Componente `<pix-key-empty>` (Estado Inicial Sem Chaves) (`⏳ Pendente`)

- **História**: Como **Recebedor** abrindo o aplicativo pela primeira vez, quero ver uma instrução clara de que minhas chaves ficam salvas apenas no meu aparelho e um botão evidente para cadastrar minha primeira chave PIX.
- **Regras de Negócio**: `RN01`, `RN02`.
- **Critérios de Aceite**:
  - [ ] Criar Web Component `src/presentation/components/pix-key-empty/pix-key-empty.component.js` (bloco BEM `.key-empty-state`).
  - [ ] Exibir ícone `<vector-icon name="key">`, mensagem explicativa de armazenamento 100% local e botão CTA **"Adicionar Minha Primeira Chave"** (`<vector-icon name="plus">`) que dispara a abertura do modal `<pix-key-dialog>`.
  - [ ] Criar testes unitários e story no Storybook.

#### `US-05.2` — Componente `<pix-key-selector>` (Lista de Radio Cards de Chaves) (`⏳ Pendente`)

- **História**: Como **Recebedor** que possui várias contas bancárias, quero selecionar com um único toque qual chave PIX cadastrada receberá o pagamento ou excluir chaves que não uso mais.
- **Regras de Negócio**: `RN01`, `RN02`.
- **Critérios de Aceite**:
  - [ ] Criar Web Component `src/presentation/components/pix-key-selector/pix-key-selector.component.js` (bloco BEM `.key-selector`).
  - [ ] Renderizar cartões selecionáveis com semântica acessível (`role="radiogroup"`, `role="radio"`, `aria-checked`) e classe modificadora `.key-selector__card--selected`.
  - [ ] Exibir em cada cartão: apelido/rótulo da conta, badge do tipo (`CPF`, `CNPJ`, `EMAIL`, `TELEFONE`, `EVP`), valor da chave em `--font-mono` e botão de exclusão (`<vector-icon name="trash">`) com área de toque mínima de `44x44px`.
  - [ ] Exibir no cabeçalho da seção o botão **"+ Nova chave"** (`<vector-icon name="plus">`).
  - [ ] Criar testes unitários e stories no Storybook (com 1 chave, múltiplas chaves e seleção ativa).

#### `US-05.3` — Componente `<pix-key-dialog>` (Modal `<dialog>` de Cadastro de Chave) (`⏳ Pendente`)

- **História**: Como **Recebedor**, quero cadastrar uma nova chave PIX em um modal rápido sem sair da tela de cobrança, informando o tipo de chave, a chave, um apelido para a conta e os dados de beneficiário.
- **Regras de Negócio**: `RN01`.
- **Critérios de Aceite**:
  - [ ] Criar Web Component `src/presentation/components/pix-key-dialog/pix-key-dialog.component.js` (bloco BEM `.key-dialog`) utilizando o elemento semântico nativo `<dialog>`.
  - [ ] Implementar pílulas seletoras de tipo (`CPF`, `CNPJ`, `E-mail`, `Celular`, `Aleatória EVP`) que ajustam dinamicamente o `placeholder` e a validação do input `valor_chave`.
  - [ ] Incluir campos para `rotulo` (apelido da conta), `nome_recebedor` (`maxlength="25"`) e `cidade_recebedor` (`maxlength="15"`).
  - [ ] Exibir feedback visual e acessível (`role="alert"`) em caso de chave inválida usando `<vector-icon name="circle-exclamation">`.
  - [ ] Ao salvar com sucesso, fechar o `<dialog>`, persistir localmente e selecionar automaticamente a chave recém-criada.
  - [ ] Criar testes unitários e story interativa no Storybook.

---

### ⚡ Épico 06 — Geração, Exibição e Distribuição de Cobrança ("Manda um PIX")

> **Objetivo**: Entregar o fluxo central em 3 toques (**Selecionar chave → Informar valor opcional → Clicar em "Manda um PIX"**) e o cartão de resultado com QR Code de alto contraste e ações de saída (`Copiar`, `WhatsApp`, `Salvar PNG`).

#### `US-06.1` — Componente `<pix-charge-form>` (Valor Opcional + Botão "Manda um PIX") (`⏳ Pendente`)

- **História**: Como **Recebedor**, quero informar opcionalmente o valor da cobrança (ou deixá-lo em aberto) e clicar no botão destacado **"Manda um PIX"** para gerar a cobrança instantaneamente.
- **Regras de Negócio**: `RN02`, `RN03`, `RN04`.
- **Critérios de Aceite**:
  - [ ] Criar Web Component `src/presentation/components/pix-charge-form/pix-charge-form.component.js` (blocos BEM `.charge-form`, `.amount-field`, `.charge-cta`).
  - [ ] Implementar campo monetário opcional (`inputmode="decimal"`) com botão de limpeza rápida (`<vector-icon name="xmark">`) e atalhos rápidos (`Valor aberto`, `R$ 25`, `R$ 50`).
  - [ ] Atualizar reativamente a pílula de status entre _"Valor aberto (pagador define)"_ (quando vazio/`0`) e _"Valor fixo: R$ XX,XX"_ (quando `> 0`) (`RN03`).
  - [ ] Implementar botão principal **"Manda um PIX"** (`.charge-cta`, `<vector-icon name="qrcode">`), desabilitando-o caso não haja nenhuma chave cadastrada/selecionada (`RN02`).
  - [ ] Criar testes unitários e stories no Storybook.

#### `US-06.2` — Componente `<pix-charge-result>` (Palco QR Code e PIX Copia e Cola) (`⏳ Pendente`)

- **História**: Como **Recebedor**, quero visualizar na tela o QR Code nítido de alto contraste junto com o código PIX Copia e Cola assim que clicar em **"Manda um PIX"**.
- **Regras de Negócio**: `RN04`.
- **Critérios de Aceite**:
  - [ ] Criar Web Component `src/presentation/components/pix-charge-result/pix-charge-result.component.js` (bloco BEM `.charge-result`).
  - [ ] Exibir resumo da cobrança (rótulo da chave selecionada, nome/cidade do recebedor e badge com o valor formatado em BRL ou _"Valor Aberto"_).
  - [ ] Renderizar o SVG vetorial do QR Code dentro do palco de superfície clara (`.charge-result__qr-stage`, fundo `#ffffff` e moldura `#0b1834`) garantindo contraste óptico para leitura por câmeras bancárias.
  - [ ] Exibir o payload EMV (`brCode`) em caixa monoespaçada (`.charge-result__brcode`) selecionável.
  - [ ] Criar testes unitários e stories no Storybook (estados _Aguardando Geração_, _Cobrança com Valor Fixo_ e _Cobrança com Valor Aberto_).

#### `US-06.3` — Ações de Distribuição da Cobrança: Copiar, Compartilhar (WhatsApp) e Salvar PNG (`⏳ Pendente`)

- **História**: Como **Recebedor**, quero copiar a chave de cobrança com um toque, compartilhá-la pelo WhatsApp ou baixar a imagem PNG do QR Code no meu dispositivo.
- **Regras de Negócio**: `RN05`.
- **Critérios de Aceite**:
  - [ ] Integrar no `<pix-charge-result>` a grade tripla de botões (`.charge-result__actions`):
    1. **Copiar (`.charge-result__btn--copy`)**: copia o `brCode`, alterna o ícone `<vector-icon name="copy">` para `<vector-icon name="check">` com rótulo _"Copiado!"_ e anuncia em região `aria-live="polite"`.
    2. **WhatsApp / Compartilhar (`.charge-result__btn--share`)**: aciona `<vector-icon name="share">` invocando `navigator.share` ou fallback direto para o WhatsApp (`https://wa.me/?text=...`).
    3. **Salvar PNG (`.charge-result__btn--download`)**: aciona `<vector-icon name="download">` gerando e baixando localmente o arquivo `mandaumpix-qrcode.png`.
  - [ ] Criar testes unitários validando o acionamento de cada ação e o feedback visual de cópia.

---

### 🧪 Épico 07 — Qualidade Ponta a Ponta, Acessibilidade (WCAG 2.2 AA) e Deploy `stg` / `prd`

> **Objetivo**: Garantir cobertura de testes de integração de ponta a ponta, conformidade de acessibilidade WCAG 2.2 AA no Storybook e automação completa de deploy para os ambientes `staging` e `production`.

#### `US-07.1` — Catálogo Completo no Storybook e Auditoria `@storybook/addon-a11y` (`⏳ Pendente`)

- **História**: Como **Mantenedor**, quero que todos os Web Components possuam documentação interativa (`autodocs`) e passem sem violações nos testes de acessibilidade do Storybook (`@storybook/addon-a11y`).
- **Critérios de Aceite**:
  - [ ] Garantir stories publicadas para `<vector-icon>`, `<app-header>`, `<pix-key-empty>`, `<pix-key-selector>`, `<pix-key-dialog>`, `<pix-charge-form>`, `<pix-charge-result>` e `<about-page>`.
  - [ ] Validar contraste de cores, navegação por teclado (`Tab`, `Enter`, `Space`, `Esc`), alvos de toque `>= 44x44px` e atributos ARIA sem erros no `npm run build-storybook`.

#### `US-07.2` — Suíte de Testes de Integração das Jornadas Completas (Vitest + JSDOM) (`⏳ Pendente`)

- **História**: Como **Mantenedor**, quero testes automatizados que exercitem as jornadas completas do usuário de ponta a ponta para prevenir regressões.
- **Critérios de Aceite**:
  - [ ] Teste de integração da **Jornada Principal**: primeiro acesso (Empty State) → cadastro de chave no `<dialog>` → seleção de chave → geração de cobrança com valor fixo e com valor aberto → cópia, compartilhamento e download.
  - [ ] Teste de integração da **Jornada de Instalação (`RN06`)**: exibição do botão **"Instalar"** quando não instalado → disparo do prompt → ocultação após `appinstalled`.
  - [ ] Teste de integração da **Jornada Institucional (`RN07`)**: clique no atalho **"Sobre"** → renderização da rota `/sobre` com informação de software gratuito, livre e de código aberto, dados do autor (**Luiz Henrique Canet Filho** — `<me@luizca.net>`), do projeto (`AGPL-3.0-only`), seção descontraída com emojis (**"Manda um PIX"**) com QR Code de valor dinâmico e Chave copia e cola para **`eu@luizca.net`**, e incentivo à divulgação → retorno à tela inicial (`/`).
  - [ ] Sincronizar `npm run importmap`, `npm run lint`, `npm run format:check`, `npm run test:coverage` e `npm run build`.

#### `US-07.3` — Workflows de Entrega Contínua (CD) para `staging` e `production` (`⏳ Pendente`)

- **História**: Como **Mantenedor**, quero pipelines automatizados no GitHub Actions alinhados ao modelo **Git Flow** para promover releases em homologação (`release/*` e `hotfix/*`) para `stg.mandaumpix.app` (`mandaumpix-app-stg`) e versões estáveis (`main` / tags `v*`) para `mandaumpix.app` (`mandaumpix-app-prd`).
- **Referência**: [Pipeline de Implantação](../deployment/pipeline.md), [ADR 0003](../architecture/decisions/0003-hospedagem-firebase-hosting-e-dominio-name-com.md) e [ADR 0005](../architecture/decisions/0005-modelo-de-branching-git-flow.md).
- **Critérios de Aceite**:
  - [ ] Criar workflow `.github/workflows/deploy-stg.yml` (disparado em `push` nas branches `release/*` e `hotfix/*` do Git Flow) para deploy no projeto Firebase `mandaumpix-app-stg` (`https://stg.mandaumpix.app`).
  - [ ] Criar workflow `.github/workflows/deploy-prd.yml` (disparado em `push` na branch `main` / tags de release `v*` do Git Flow) para deploy no projeto Firebase `mandaumpix-app-prd` (`https://mandaumpix.app`).
  - [ ] Atualizar a matriz de status em [`docs/deployment/pipeline.md`](../deployment/pipeline.md).

---

## 🔗 Matriz de Rastreabilidade (Regras de Negócio × Backlog)

| Regra de Negócio | Descrição Resumida                                                                                                                                                                          | Histórias Vinculadas no Backlog                                  |
| :--------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------- |
|     **RN01**     | Cadastro e persistência local de múltiplas chaves PIX de recebimento                                                                                                                        | `US-02.2`, `US-02.4`, `US-03.1`, `US-05.1`, `US-05.2`, `US-05.3` |
|     **RN02**     | Seleção obrigatória de uma chave cadastrada para emitir cobrança                                                                                                                            | `US-02.3`, `US-02.4`, `US-05.2`, `US-06.1`                       |
|     **RN03**     | Valor monetário opcional (valor fixo quando informado; dinâmico/aberto se omitido)                                                                                                          | `US-02.1`, `US-02.3`, `US-06.1`, `US-06.2`                       |
|     **RN04**     | Geração simultânea de QR Code e chave de cobrança (PIX Copia e Cola) ao clicar                                                                                                              | `US-02.1`, `US-02.3`, `US-06.1`, `US-06.2`                       |
|     **RN05**     | Opções de saída: Copiar, Compartilhar (WhatsApp) e Salvar Imagem PNG localmente                                                                                                             | `US-02.1`, `US-02.5`, `US-03.3`, `US-06.3`                       |
|     **RN06**     | Exibição destacada do botão **"Instalar"** quando o PWA ainda não está instalado                                                                                                            | `US-02.5`, `US-03.2`, `US-04.2`, `US-07.2`                       |
|     **RN07**     | Acesso fácil à página **"Sobre"** (app gratuito/livre/open-source, autor, projeto, apoio "Manda um PIX" com QR Code dinâmico e Copia e Cola para `eu@luizca.net`, e incentivo à divulgação) | `US-04.2`, `US-04.3`, `US-04.4`, `US-07.2`                       |

---

⬅️ **Anterior**: [Fluxos de Trabalho e Jornadas](./workflows.md) | ➡️ **Próximo**: [Arquitetura do Sistema](../architecture/overview.md)

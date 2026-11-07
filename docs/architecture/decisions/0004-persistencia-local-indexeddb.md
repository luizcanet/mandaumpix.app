[Início](../../README.md) > [Arquitetura](../overview.md) > **ADR 0004**

# ADR 0004: Persistência Local de Dados do Usuário com IndexedDB

- **Status**: Aceito
- **Data**: 2026-11-07
- **Autores**: Luiz Henrique Canet Filho (`me@luizca.net`)

---

## 1. Contexto e Declaração do Problema

O **Manda um PIX** (`mandaumpix.app`) é um PWA Client-Side (Local-First) no qual os dados do usuário — incluindo as múltiplas chaves PIX cadastradas (`ChaveConta`), os metadados do titular/cidade e a preferência de chave selecionada para cobrança — devem ser persistidos exclusivamente no dispositivo do próprio usuário, sem envio a servidores externos.

Até então, a arquitetura considerava genericamente as APIs de armazenamento do navegador (`Web Storage / LocalStorage` ou `IndexedDB`). Era necessário definir formalmente o mecanismo oficial de persistência local que garantisse melhor desempenho, integridade transacional, escalabilidade de esquema e compatibilidade com a arquitetura PWA e _Service Workers_.

## 2. Drivers de Decisão

- **Operação Assíncrona e Não-Bloqueante**: Evitar o bloqueio da _main thread_ (UI) durante leituras e escritas, mantendo animações e interações em `60fps`.
- **Integridade Transacional e Modelagem Estruturada**: Suporte nativo a transações atômicas (`readonly` e `readwrite`), chaves primárias (`keyPath`), índices de busca e armazenamento de objetos JavaScript estruturados (_Structured Clone Algorithm_) sem o custo e a fragilidade de serialização/desserialização manual via `JSON.stringify` / `JSON.parse`.
- **Versionamento e Evolução de Esquema**: Capacidade nativa de migração de esquema controlada por versão (`onupgradeneeded`) conforme novas funcionalidades ou dados do usuário sejam adicionados ao aplicativo.
- **Compatibilidade com Ecossistema PWA**: Acesso tanto pela janela principal (`window`) quanto por _Web Workers_ e _Service Workers_ (`sw.js`), ao contrário do `localStorage`.
- **Privacidade 100% Local**: Manter todos os dados sob a política de mesma origem (_Same-Origin Policy_) no navegador do dispositivo.

## 3. Opções Consideradas

- **Opção 1**: **IndexedDB API (`window.indexedDB`)** — Banco de dados NoSQL orientado a objetos, transacional e assíncrono nativo do navegador.
- **Opção 2**: **Web Storage API (`window.localStorage`)** — Armazenamento síncrono de pares chave-valor puramente em `string`.
- **Opção 3**: **Banco de Dados Remoto (Cloud / Backend)** — Persistência em nuvem mediante autenticação de usuário.

## 4. Decisão Escolhida

Escolhemos a **Opção 1**: utilizar o **IndexedDB** (`window.indexedDB`) como motor exclusivo de persistência dos dados do usuário no **Manda um PIX**.

### Especificação Técnica da Decisão

- **Banco de Dados**: `mandaumpix_db` (versão inicial `1`).
- **Object Stores**:
  1. `pix_keys` (`keyPath: "id"`): armazena os registros da entidade [`ChaveConta`](../../design/data_models.md), com índices para `tipo_chave` e `criado_em`.
  2. `user_settings` (`keyPath: "key"`): armazena preferências e estado persistente do usuário no dispositivo, como a chave PIX atualmente selecionada (`selectedKeyId`).
- **Encapsulamento Arquitetural**: O acesso ao `indexedDB` é isolado na camada de infraestrutura (`IndexedDbPixKeyRepository`), expondo uma interface assíncrona baseada em `Promise` para os casos de uso e sincronizada reativamente com `@modnes/data-controller`.

## 5. Prós e Contras das Opções

### Opção 1: IndexedDB (Escolhida)

- 👍 **Ponto positivo**: API assíncrona que não bloqueia a renderização da interface.
- 👍 **Ponto positivo**: Transações atômicas nativas que evitam corrupção de estado em escritas concorrentes.
- 👍 **Ponto positivo**: Armazena tipos nativos complexos (`Date`, `Blob`, objetos estruturados) e suporta migrações de versão (`onupgradeneeded`).
- 👍 **Ponto positivo**: Acessível em _Service Workers_ e com cota de armazenamento ampla no dispositivo.
- 👎 **Ponto negativo**: API nativa baseada em eventos (`IDBRequest`) é mais verbosa que `localStorage`, exigindo um adaptador encapsulado em `Promises` na camada de infraestrutura.

### Opção 2: LocalStorage (`Web Storage`)

- 👍 **Ponto positivo**: API síncrona simples (`getItem` / `setItem`).
- 👎 **Ponto negativo**: Bloqueia a _main thread_, armazena apenas strings (exigindo `JSON.parse`/`JSON.stringify` da lista inteira a cada alteração), não possui transações nem versionamento de esquema e é inacessível em _Service Workers_.

### Opção 3: Banco de Dados Remoto

- 👍 **Ponto positivo**: Backup em nuvem entre dispositivos.
- 👎 **Ponto negativo**: Viola o princípio _Zero-Backend_ e _Privacy by Design_ ([ADR 0002](./0002-arquitetura-pwa-client-side-es-modules.md)), exigindo login e tráfego de dados pessoais (chaves PIX).

## 6. Consequências e Impactos

- **Impacto Positivo**: Base de persistência robusta, rápida e preparada para evolução de dados do usuário sem risco de gargalos de serialização JSON ou corrupção de dados.
- **Impacto em Testes e Qualidade**: A camada de infraestrutura deverá contar com testes automatizados validando a criação de _object stores_ (`onupgradeneeded`), operações CRUD transacionais e tratamento de erros do `indexedDB`.
- **Segurança e Conformidade**: Os dados do usuário continuam restritos ao dispositivo local, isolados por origem HTTPS (`mandaumpix.app`).

---

⬅️ **Anterior**: [ADR 0003](./0003-hospedagem-firebase-hosting-e-dominio-name-com.md) | ➡️ **Próximo**: [ADR 0005: Adoção do Modelo de Branching Git Flow Alinhado aos Ambientes de Deploy](./0005-modelo-de-branching-git-flow.md)

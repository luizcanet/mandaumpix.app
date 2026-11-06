[Início](../README.md) > **Design: Módulos**

# 🎨 Design e Organização de Módulos

Este documento descreve a organização física atual do repositório **Manda um PIX** e a decomposição modular para os recursos de negócio do PWA.

---

## 📂 Estrutura Atual do Repositório

O repositório conta com a fundação de módulos ES nativos gerenciados pelo **JSPM**, casca HTML com Import Maps W3C, `modulepreload` e integridade criptográfica (SRI), além das ferramentas de qualidade:

```text
mandaumpix.app/
├── docs/                  # Documentação viva técnica e de negócio
├── src/
│   └── main.js            # Ponto de entrada ESM da aplicação cliente
├── index.html             # Casca HTML5 com Import Map W3C, es-module-shims, modulepreload e SRI
├── importmap.js           # Script de injeção de Import Map gerenciado pelo JSPM
├── eslint.config.js       # Configuração Flat Config do ESLint v10 (JS, JSON, CSS, MD)
├── package.json           # Manifesto do projeto, exports, scripts JSPM e devDependencies
├── package-lock.json      # Lockfile determinístico da árvore de pacotes npm
├── .prettierrc            # Configuração do formatador Prettier
├── .gitignore             # Regras de exclusão do controle de versão Git
└── README.md              # Ponto de entrada e apresentação do repositório
```

### Papel dos Arquivos Principais

| Arquivo                                      | Responsabilidade                                                                                                                                                                  |
| :------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`index.html`](../../index.html)             | Casca HTML semântica da aplicação contendo `es-module-shims`, `<script type="importmap">`, `<link rel="modulepreload">` com hashes `integrity` (SRI) e carregamento de `main.js`. |
| [`importmap.js`](../../importmap.js)         | Mapa de importação gerado pelo JSPM (`jspm install`) que resolve o pacote `mandaumpix.app` para `./src/main.js`.                                                                  |
| [`src/main.js`](../../src/main.js)           | Ponto de entrada principal ESM (`APP_METADATA` e `bootstrapApp`), exportado em `"exports": { ".": "./src/main.js" }`.                                                             |
| [`package.json`](../../package.json)         | Define o pacote `mandaumpix.app` (`1.0.0`), habilita ES Modules nativos (`"type": "module"`), declara `"exports"` e os scripts `start`, `serve`, `importmap`, `build` e `lint`.   |
| [`eslint.config.js`](../../eslint.config.js) | Orquestra os plugins `@eslint/js`, `@eslint/json`, `@eslint/markdown`, `@eslint/css` e `eslint-config-prettier`, definindo variáveis globais de navegador (`globals.browser`).    |
| [`.prettierrc`](../../.prettierrc)           | Ativa formatação padronizada do Prettier com configuração default (`{}`).                                                                                                         |

---

## 🧩 Decomposição Funcional dos Módulos de Domínio (PWA)

Para atender aos requisitos funcionais do **Manda um PIX**, o design funcional do aplicativo divide-se em quatro responsabilidades coesas:

```mermaid
flowchart TD
    Entry["src/main.js<br/>(Ponto de Entrada ESM)"] --> KeyMod["Módulo de Chaves de Conta<br/>Cadastro, listagem e seleção de chaves PIX"]
    Entry --> ChargeMod["Módulo Gerador de Cobrança<br/>Cálculo de payload PIX (com ou sem valor)"]
    Entry --> QRMod["Módulo de QR Code<br/>Renderização em tela e exportação de imagem"]
    Entry --> ShareMod["Módulo de Compartilhamento<br/>Cópia, envio via WhatsApp e download local"]
```

1. **Módulo de Chaves de Conta**:
   - Cadastro de múltiplas chaves nas quais o usuário deseja receber.
   - Persistência e recuperação local das chaves para seleção rápida.
2. **Módulo Gerador de Cobrança ("Manda um PIX")**:
   - Recebe a chave selecionada e o valor opcional.
   - Caso o valor não seja informado, configura a cobrança como valor dinâmico/aberto.
   - Gera a chave de cobrança (PIX Copia e Cola).
3. **Módulo de Renderização de QR Code**:
   - Transforma a chave de cobrança em um QR Code visível na tela.
   - Exporta o gráfico gerado em formato de imagem para salvamento local.
4. **Módulo de Compartilhamento e Saída**:
   - Cópia da chave de cobrança para a área de transferência.
   - Compartilhamento externo (ex.: WhatsApp).
   - Download local da imagem do QR Code.

---

⬅️ **Anterior**: [ADR 0002](../architecture/decisions/0002-arquitetura-pwa-client-side-es-modules.md) | ➡️ **Próximo**: [Modelo de Dados](./data_models.md)

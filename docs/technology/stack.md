[Início](../README.md) > **Tecnologia: Stack**

# 🧰 Pilha de Tecnologia (Technology Stack)

Este documento detalha as tecnologias, padrões de plataforma e dependências configuradas no repositório [`package.json`](../../package.json).

---

## 💻 Matriz Tecnológica Principal

| Camada                      | Tecnologia / Padrão             | Versão / Especificação                    | Justificativa                                                                                                                                |
| :-------------------------- | :------------------------------ | :---------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| **Plataforma Alvo**         | Web / PWA (Progressive Web App) | HTML5, CSS3, Web APIs (`globals.browser`) | Acesso universal, gratuito, instalável e sem necessidade de publicação em lojas proprietárias.                                               |
| **Sistema de Módulos**      | ECMAScript Modules (ESM)        | Nativo (`"type": "module"`, `exports`)    | Padrão oficial da linguagem JavaScript, suportado nativamente pelos navegadores modernos e pelo Node.js.                                     |
| **Gerenciador Import Maps** | JSPM & W3C Import Maps          | `jspm` `^4.7.0` / `@jspm/generator`       | Resolução nativa de módulos ES, injeção de `<script type="importmap">`, `modulepreload`, `es-module-shims` e Subresource Integrity (`SRI`).  |
| **Ambiente de Ferramental** | Node.js & npm                   | Node `v24.x` / npm `v11.x`                | Execução de linters, formatadores, geração de Import Maps e servidor de desenvolvimento local.                                               |
| **Licença**                 | GNU AGPL v3.0                   | `AGPL-3.0-only`                           | Licença de código aberto copyleft forte de rede (mais restritiva da OSI e 100% compatível com as licenças `MIT` e `Apache-2.0` dos módulos). |

---

## 📦 Dependências de Produção (`dependencies`)

Extraídas diretamente de [`package.json`](../../package.json) e resolvidas via Import Maps em [`importmap.js`](../../importmap.js) e [`index.html`](../../index.html):

| Pacote                                                                                 |  Versão  | Licença               | Papel no Projeto                                                                                                                            |
| :------------------------------------------------------------------------------------- | :------: | :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| [`@modnes/access-controller`](https://www.npmjs.com/package/@modnes/access-controller) | `^1.0.0` | `MIT`                 | Controle de acesso e permissões baseado em regras, papéis (`roles`) e funções predicadas de validação.                                      |
| [`@modnes/custom-element`](https://www.npmjs.com/package/@modnes/custom-element)       | `^1.1.0` | `MIT`                 | Criação de Web Components nativos (`CustomElement`) com templates, ciclo de vida e Injeção de Dependências (`SetInjectable`).               |
| [`@modnes/data-controller`](https://www.npmjs.com/package/@modnes/data-controller)     | `^1.1.3` | `MIT`                 | Gerenciamento de estado reativo com `Proxy` (`DataHandler`, `ArrayHandler`) e _two-way data binding_ com DOM e formulários.                 |
| [`@modnes/router`](https://www.npmjs.com/package/@modnes/router)                       | `^1.1.1` | `MIT`                 | Roteador SPA orientado a Web Components com suporte a parâmetros dinâmicos, _lazy loading_ de módulos ES e History API.                     |
| [`pix-utils`](https://www.npmjs.com/package/pix-utils)                                 | `^2.8.2` | `MIT`                 | Geração, parsing e validação de payloads PIX (padrão EMV® BR Code do Banco Central do Brasil), incluindo cálculo automático de CRC16.       |
| [`qr`](https://www.npmjs.com/package/qr)                                               | `^0.7.2` | `(MIT OR Apache-2.0)` | Codificação e renderização ultra-leve e zero-dependency de QR Codes em SVG, GIF, Data URL e exportação para PNG no navegador (`qr/dom.js`). |

---

## 🛠️ Dependências de Desenvolvimento (`devDependencies`)

Extraídas diretamente de [`package.json`](../../package.json):

| Pacote                                                                           |   Versão   | Papel no Projeto                                                                                                 |
| :------------------------------------------------------------------------------- | :--------: | :--------------------------------------------------------------------------------------------------------------- |
| [`jspm`](https://jspm.org/)                                                      |  `^4.7.0`  | CLI para gerenciamento de Import Maps, `modulepreload`, integridade SRI, servidor dev (`serve`) e build.         |
| [`@jspm/generator`](https://github.com/jspm/generator)                           | `^2.18.0`  | Motor programático para resolução de grafos de dependências ESM e injeção em HTML (`htmlInject`).                |
| [`eslint`](https://eslint.org/)                                                  | `^10.13.0` | Motor central de análise estática (configurado via Flat Config em [`eslint.config.js`](../../eslint.config.js)). |
| [`@eslint/js`](https://www.npmjs.com/package/@eslint/js)                         | `^10.0.1`  | Regras recomendadas oficiais do ESLint para JavaScript (`js/recommended`).                                       |
| [`@eslint/css`](https://www.npmjs.com/package/@eslint/css)                       |  `^2.0.1`  | Linter oficial do ESLint para folhas de estilo CSS (`css/recommended`).                                          |
| [`@eslint/json`](https://www.npmjs.com/package/@eslint/json)                     |  `^2.1.1`  | Validação sintática e boas práticas para arquivos `.json`, `.jsonc` e `.json5`.                                  |
| [`@eslint/markdown`](https://www.npmjs.com/package/@eslint/markdown)             |  `^8.0.3`  | Linter oficial para documentos Markdown (`markdown/commonmark` + `markdown/recommended`).                        |
| [`eslint-config-prettier`](https://www.npmjs.com/package/eslint-config-prettier) | `^10.1.8`  | Desativa regras do ESLint que possam conflitar com a formatação do Prettier.                                     |
| [`globals`](https://www.npmjs.com/package/globals)                               | `^17.13.0` | Fornece o dicionário de variáveis globais do navegador (`globals.browser`).                                      |
| [`prettier`](https://prettier.io/)                                               |  `3.9.10`  | Formatador opinativo de código para manter estilo consistente em todo o repositório.                             |

---

⬅️ **Anterior**: [Conformidade e Proteção de Dados](../security/compliance.md) | ➡️ **Próximo**: [Qualidade: Estratégia de Testes](../quality/testing_strategy.md)

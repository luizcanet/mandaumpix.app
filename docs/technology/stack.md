[Início](../README.md) > **Tecnologia: Stack**

# 🧰 Pilha de Tecnologia (Technology Stack)

Este documento detalha as tecnologias, padrões de plataforma e dependências configuradas no repositório [`package.json`](../../package.json).

---

## 💻 Matriz Tecnológica Principal

| Camada                      | Tecnologia / Padrão             | Versão / Especificação                    | Justificativa                                                                                            |
| :-------------------------- | :------------------------------ | :---------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| **Plataforma Alvo**         | Web / PWA (Progressive Web App) | HTML5, CSS3, Web APIs (`globals.browser`) | Acesso universal, gratuito, instalável e sem necessidade de publicação em lojas proprietárias.           |
| **Sistema de Módulos**      | ECMAScript Modules (ESM)        | Nativo (`"type": "module"`)               | Padrão oficial da linguagem JavaScript, suportado nativamente pelos navegadores modernos e pelo Node.js. |
| **Ambiente de Ferramental** | Node.js & npm                   | Node `v24.x` / npm `v11.x`                | Execução de linters, formatadores e scripts de desenvolvimento.                                          |
| **Licença**                 | ISC                             | `ISC`                                     | Licença de código aberto permissiva e simplificada.                                                      |

---

## 📦 Dependências de Desenvolvimento (`devDependencies`)

Extraídas diretamente de [`package.json`](../../package.json):

| Pacote                                                                           |   Versão   | Papel no Projeto                                                                                                 |
| :------------------------------------------------------------------------------- | :--------: | :--------------------------------------------------------------------------------------------------------------- |
| [`eslint`](https://eslint.org/)                                                  | `^10.13.0` | Motor central de análise estática (configurado via Flat Config em [`eslint.config.js`](../../eslint.config.js)). |
| [`@eslint/js`](https://www.npmjs.com/package/@eslint/js)                         | `^10.0.1`  | Regras recomendadas oficiais do ESLint para JavaScript (`js/recommended`).                                       |
| [`@eslint/css`](https://www.npmjs.com/package/@eslint/css)                       |  `^2.0.1`  | Linter oficial do ESLint para folhas de estilo CSS (`css/recommended`).                                          |
| [`@eslint/json`](https://www.npmjs.com/package/@eslint/json)                     |  `^2.1.1`  | Validação sintática e boas práticas para arquivos `.json`, `.jsonc` e `.json5`.                                  |
| [`@eslint/markdown`](https://www.npmjs.com/package/@eslint/markdown)             |  `^8.0.3`  | Linter oficial para documentos Markdown (`markdown/commonmark` + `markdown/recommended`).                        |
| [`eslint-config-prettier`](https://www.npmjs.com/package/eslint-config-prettier) | `^10.1.8`  | Desativa regras do ESLint que possam conflitar com a formatação do Prettier.                                     |
| [`globals`](https://www.npmjs.com/package/globals)                               | `^17.13.0` | Fornece o dicionário de variáveis globais do navegador (`globals.browser`).                                      |
| [`prettier`](https://prettier.io/)                                               |  `3.9.10`  | Formatador opinativo de código para manter estilo consistente em todo o repositório.                             |

> **Dependências de Produção (`dependencies`)**: Atualmente o projeto não possui dependências externas de runtime em `dependencies`, priorizando uma base enxuta e nativa (Vanilla JS / Web Standards).

---

⬅️ **Anterior**: [Conformidade e Proteção de Dados](../security/compliance.md) | ➡️ **Próximo**: [Qualidade: Estratégia de Testes](../quality/testing_strategy.md)

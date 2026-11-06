[Início](./README.md) > **Changelog da Documentação**

# 📝 Changelog da Documentação

Histórico cronológico de criação e atualização da documentação viva do projeto **Manda um PIX** (`mandaumpix.app`).

| Data         | Versão / Commit      | Descrição das Alterações                                                                                                                                                                                                                                                                                                       |
| :----------- | :------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-11-05` | `1ba8b55` (`v1.0.0`) | Criação inicial da estrutura canônica completa de documentação (`docs/`) cobrindo Negócio, Arquitetura, Design, Implantação, Configuração, Segurança, Tecnologia e Qualidade a partir da especificação do produto e da base de código inicial.                                                                                 |
| `2026-11-05` | `cb15989` (`v1.0.0`) | Inicialização do projeto JSPM (`jspm` e `@jspm/generator`), configuração de `"exports"` e scripts no `package.json`, criação do entrypoint [`src/main.js`](../src/main.js), [`importmap.js`](../importmap.js) e [`index.html`](../index.html) com Import Map W3C, `es-module-shims`, `modulepreload` e integridade SRI.        |
| `2026-11-05` | `3a4bb7f` (`v1.0.0`) | Adição e integração dos módulos `pix-utils` e `qr` no código-fonte ([`src/main.js`](../src/main.js)) e nos Import Maps ([`importmap.js`](../importmap.js), [`index.html`](../index.html)), além da configuração da licença **GNU AGPL v3.0** (`AGPL-3.0-only`) em [`package.json`](../package.json) e [`LICENSE`](../LICENSE). |
| `2026-11-05` | `dc7c980` (`v1.0.0`) | Instalação e mapeamento dos módulos `@modnes/access-controller`, `@modnes/custom-element`, `@modnes/data-controller` e `@modnes/router` em [`package.json`](../package.json), [`src/main.js`](../src/main.js), [`importmap.js`](../importmap.js) e [`index.html`](../index.html).                                              |
| `2026-11-05` | `f6de6f0` (`v1.0.0`) | Criação do logotipo e ícones oficiais do aplicativo nas cores azul e verde em [`src/assets/icons/`](../src/assets/icons/icon.svg) (`icon.svg`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`), adição do [`manifest.json`](../manifest.json) e integração no [`index.html`](../index.html). |
| `2026-11-05` | `HEAD` (`v1.0.0`)    | Configuração do **Vitest** (`vitest`, `@vitest/coverage-v8` e `jsdom`) em [`package.json`](../package.json) e [`vitest.config.js`](../vitest.config.js), com criação da suíte inicial de testes em [`src/main.test.js`](../src/main.test.js). |

---

⬅️ **Voltar ao Índice**: [Documentação do Sistema](./README.md)

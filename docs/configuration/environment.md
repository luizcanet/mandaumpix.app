[Início](../README.md) > **Configuração: Ambiente**

# ⚙️ Configuração e Variáveis de Ambiente

Este documento cataloga os arquivos de configuração e políticas de variáveis de ambiente do **Manda um PIX**.

---

## 📋 Variáveis de Ambiente

No estado atual do repositório (`v1.0.0`), a aplicação **não exige variáveis de ambiente nem segredos de servidor** para funcionar, visto que é um PWA executado integralmente no navegador e não realiza autenticação com APIs bancárias privadas.

O arquivo [`.gitignore`](../../.gitignore) já prevê proteção preventiva para arquivos de ambiente caso ferramentas de build ou deploy sejam adicionadas futuramente:

- Ignorados: `.env` e `.env.*`
- Permitido para versionamento de exemplo: `!.env.example`

---

## 🗂️ Arquivos de Configuração do Projeto

| Arquivo                                      | Escopo                 | Detalhes da Configuração                                                                                                                                          |
| :------------------------------------------- | :--------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`package.json`](../../package.json)         | Manifesto Node/NPM     | Define `"type": "module"`, metadados do autor, scripts (`lint`, `test`) e `devDependencies`.                                                                      |
| [`eslint.config.js`](../../eslint.config.js) | Linter Multi-Linguagem | Configura ESLint v10 (Flat Config) para JavaScript (`globals.browser`), JSON, JSONC, JSON5, Markdown (`commonmark`) e CSS, integrado ao `eslint-config-prettier`. |
| [`.prettierrc`](../../.prettierrc)           | Formatador de Código   | Objeto JSON `{}` que aplica as convenções padrão do Prettier 3.9.10.                                                                                              |
| [`.gitignore`](../../.gitignore)             | Controle de Versão     | Ignora `node_modules/`, `jspm_packages/`, `dist/`, `coverage/`, caches e `.env`.                                                                                  |

---

⬅️ **Anterior**: [Infraestrutura](../deployment/infrastructure.md) | ➡️ **Próximo**: [Guia de Inicialização Local](./local_setup.md)

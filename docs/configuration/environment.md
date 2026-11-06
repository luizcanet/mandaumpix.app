[Início](../README.md) > **Configuração: Ambiente**

# ⚙️ Configuração e Ambientes de Execução

Este documento cataloga os ambientes de implantação, configurações de domínio/hospedagem, arquivos de configuração e políticas de variáveis de ambiente do **Manda um PIX**.

---

## 🌍 Ambientes de Implantação (Firebase Hosting & Name.com)

O domínio `mandaumpix.app` está registrado no **Name.com** (que também fornece o certificado SSL/TLS) e a aplicação é hospedada no **Firebase Hosting** dividida em três ambientes isolados (para mais detalhes sobre a topologia de entrega, consulte [Infraestrutura e Topologia](../deployment/infrastructure.md)):

| Ambiente      | Sigla | Domínio              | Projeto no Firebase  |
| :------------ | :---: | :------------------- | :------------------- |
| `development` | `dev` | `dev.mandaumpix.app` | `mandaumpix-app-dev` |
| `staging`     | `stg` | `stg.mandaumpix.app` | `mandaumpix-app-stg` |
| `production`  | `prd` | `mandaumpix.app`     | `mandaumpix-app-prd` |

---

## 📋 Variáveis de Ambiente e Segredos de CI/CD

No estado atual do repositório (`v1.0.0`), a aplicação cliente **não exige variáveis de ambiente nem segredos de servidor em tempo de execução** para funcionar no navegador, visto que é um PWA executado integralmente no cliente e não realiza autenticação com APIs bancárias privadas.

Para a esteira de Entrega Contínua (CD) no **GitHub Actions** ([`.github/workflows/deploy-dev.yml`](../../.github/workflows/deploy-dev.yml)), são utilizados os seguintes segredos de repositório/ambiente no GitHub:

| Segredo GitHub (`Secrets`)     | Ambiente GitHub | Finalidade                                                                                          |
| :----------------------------- | :-------------- | :-------------------------------------------------------------------------------------------------- |
| `FIREBASE_SERVICE_ACCOUNT_DEV` | `development`   | JSON da Service Account do Google Cloud / Firebase com permissão de deploy no `mandaumpix-app-dev`. |
| `GITHUB_TOKEN`                 | Automático      | Token nativo do GitHub Actions para registro do status de deployment.                               |

O arquivo [`.gitignore`](../../.gitignore) já prevê proteção preventiva para arquivos de ambiente caso credenciais locais ou tokens de deploy sejam utilizados localmente:

- Ignorados: `.env` e `.env.*`
- Permitido para versionamento de exemplo: `!.env.example`

---

## 🗂️ Arquivos de Configuração do Projeto

| Arquivo                                      | Escopo                 | Detalhes da Configuração                                                                                                                                   |
| :------------------------------------------- | :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`package.json`](../../package.json)         | Manifesto Node/NPM     | Define `"type": "module"`, metadados do autor, scripts (`lint`, `test`, `build`, `storybook`) e dependências.                                              |
| [`firebase.json`](../../firebase.json)       | Firebase Hosting       | Configura o diretório público `dist/`, regras de exclusão de artefatos de desenvolvimento e rewrite SPA para `/index.html` preservando `/storybook/**`.    |
| [`.firebaserc`](../../.firebaserc)           | Aliases Firebase       | Mapeia os ambientes `development` (`dev`), `staging` (`stg`) e `production` (`prd`) para os respectivos projetos `mandaumpix-app-*`.                       |
| [`eslint.config.js`](../../eslint.config.js) | Linter Multi-Linguagem | Configura ESLint v10 (Flat Config) para JavaScript (`globals.browser`), JSON, JSONC, JSON5, Markdown (`gfm`) e CSS, integrado ao `eslint-config-prettier`. |
| [`.prettierrc`](../../.prettierrc)           | Formatador de Código   | Objeto JSON `{}` que aplica as convenções padrão do Prettier 3.9.10.                                                                                       |
| [`.gitignore`](../../.gitignore)             | Controle de Versão     | Ignora `node_modules/`, `jspm_packages/`, `dist/`, `coverage/`, `.firebase/`, caches e `.env`.                                                             |

---

⬅️ **Anterior**: [Infraestrutura](../deployment/infrastructure.md) | ➡️ **Próximo**: [Guia de Inicialização Local](./local_setup.md)

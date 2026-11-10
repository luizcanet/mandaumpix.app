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

| Segredo GitHub (`Secrets`)     | Ambiente GitHub                 | Finalidade                                                                                               |
| :----------------------------- | :------------------------------ | :------------------------------------------------------------------------------------------------------- |
| `FIREBASE_SERVICE_ACCOUNT_DEV` | `development`                   | JSON da Service Account do Google Cloud / Firebase com permissão de deploy no `mandaumpix-app-dev`.      |
| `GITHUB_TOKEN`                 | Automático                      | Token nativo do GitHub Actions para registro de deployment e abertura de issues de incidente de CT.      |
| `SECURITY_WEBHOOK_URL`         | `Repository Secrets` (Opcional) | URL de Webhook (Discord, Slack, Teams ou SIEM) para alertas imediatos de réplicas e certificados falsos. |

### Segredo de Monitoramento e Resposta a Incidentes (`SECURITY_WEBHOOK_URL`)

A esteira agendada de auditoria de certificados SSL/TLS ([`.github/workflows/security-ct-monitor.yml`](../../.github/workflows/security-ct-monitor.yml)) inspeciona periodicamente os logs públicos do **Certificate Transparency** buscando registros anômalos. Caso sejam identificados certificados suspeitos fora das origens oficiais autorizadas:

1. Uma **Issue de Incidente de Segurança** é aberta automaticamente com a etiqueta `security-incident`.
2. Se o segredo de repositório `SECURITY_WEBHOOK_URL` estiver configurado, um payload HTTP `POST` em formato JSON é disparado com a estrutura canônica:

```json
{
  "generatedAt": "2026-11-10T06:00:00.000Z",
  "queries": ["%mandaumpix%", "%manda-um-pix%"],
  "scannedCount": 24,
  "anomaliesCount": 1,
  "maxAgeDays": 7,
  "status": "threats_detected",
  "anomalies": [
    {
      "crtshId": 18273645,
      "commonName": "mandaumpix-seguro.com",
      "unauthorizedDomains": [
        "mandaumpix-seguro.com",
        "www.mandaumpix-seguro.com"
      ],
      "issuerName": "C=US, O=Let's Encrypt, CN=R3",
      "entryTimestamp": "2026-11-10T04:12:00.000Z",
      "crtshUrl": "https://crt.sh/?id=18273645",
      "isSuspicious": true
    }
  ],
  "metadata": {
    "playbook": "docs/security/takedown_and_monitoring.md",
    "canonicalOrigin": "https://mandaumpix.app",
    "contact": "me@luizca.net"
  }
}
```

O arquivo [`.gitignore`](../../.gitignore) já prevê proteção preventiva para arquivos de ambiente caso credenciais locais ou tokens de deploy sejam utilizados localmente:

- Ignorados: `.env` e `.env.*`
- Permitido para versionamento de exemplo: `!.env.example`

---

## 🗂️ Arquivos de Configuração do Projeto

| Arquivo                                                                                        | Escopo                       | Detalhes da Configuração                                                                                                                                   |
| :--------------------------------------------------------------------------------------------- | :--------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`package.json`](../../package.json)                                                           | Manifesto Node/NPM           | Define `"type": "module"`, metadados do autor, scripts (`lint`, `test`, `build`, `storybook`) e dependências.                                              |
| [`firebase.json`](../../firebase.json)                                                         | Firebase Hosting             | Configura o diretório público `dist/`, regras de exclusão de artefatos de desenvolvimento e rewrite SPA para `/index.html` preservando `/storybook/**`.    |
| [`.firebaserc`](../../.firebaserc)                                                             | Aliases Firebase             | Mapeia os ambientes `development` (`dev`), `staging` (`stg`) e `production` (`prd`) para os respectivos projetos `mandaumpix-app-*`.                       |
| [`eslint.config.js`](../../eslint.config.js)                                                   | Linter Multi-Linguagem       | Configura ESLint v10 (Flat Config) para JavaScript (`globals.browser`), JSON, JSONC, JSON5, Markdown (`gfm`) e CSS, integrado ao `eslint-config-prettier`. |
| [`.prettierrc`](../../.prettierrc)                                                             | Formatador de Código         | Objeto JSON `{}` que aplica as convenções padrão do Prettier 3.9.10.                                                                                       |
| [`.gitignore`](../../.gitignore)                                                               | Controle de Versão           | Ignora `node_modules/`, `jspm_packages/`, `dist/`, `coverage/`, `.firebase/`, caches e `.env`.                                                             |
| [`.github/workflows/security-ct-monitor.yml`](../../.github/workflows/security-ct-monitor.yml) | Automação de Segurança       | Workflow cron diário para varredura de Certificate Transparency e disparo de alertas via issue/webhook.                                                    |
| [`scripts/security/monitor-ct-logs.js`](../../scripts/security/monitor-ct-logs.js)             | Script de Monitoramento (CT) | Engine em Node.js com exponential backoff para consulta ao `crt.sh`, filtragem de origens canônicas e geração de relatório JSON.                           |

---

⬅️ **Anterior**: [Infraestrutura](../deployment/infrastructure.md) | ➡️ **Próximo**: [Guia de Inicialização Local](./local_setup.md)

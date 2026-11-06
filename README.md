# 📱 Manda um PIX (`mandaumpix.app`)

**Manda um PIX** é um aplicativo web progressivo (**PWA**) gratuito que facilita a geração de cobranças via **PIX** sem a necessidade de ficar abrindo aplicativos de banco. Para usuários que ainda não instalaram o aplicativo no dispositivo, a interface apresenta de forma destacada um botão **"Instalar"**, permitindo adicioná-lo rapidamente à tela inicial ou área de trabalho. O aplicativo também oferece fácil acesso a uma página **"Sobre"** que apresenta o aplicativo e reúne informações sobre o **autor** (**Luiz Henrique Canet Filho** — `<me@luizca.net>`) e o **projeto**.

Nele, o usuário pode cadastrar várias chaves de contas nas quais deseja receber. Para gerar uma cobrança, basta:

1. Selecionar uma **chave cadastrada**;
2. Informar opcionalmente um **valor** (ou deixar em branco para manter o **valor dinâmico/aberto**);
3. Clicar em **"Manda um PIX"** para gerar na tela o **QR Code** e uma **chave de cobrança** que pode ser:
   - 📋 **Copiada** para a área de transferência;
   - 📤 **Compartilhada** por outros aplicativos, como o **WhatsApp**;
   - 💾 **Salva localmente** como imagem no dispositivo.

---

## 📚 Documentação Completa

Toda a documentação viva de negócio, arquitetura, design, segurança e qualidade está estruturada no diretório [`docs/`](./docs/README.md):

- 📖 **[Índice Geral da Documentação](./docs/README.md)**
- 💼 **[Negócio](./docs/business/overview.md)** — [Proposta de Valor](./docs/business/overview.md), [Modelo de Domínio](./docs/business/domain_model.md) e [Fluxos de Trabalho](./docs/business/workflows.md)
- 🏛️ **[Arquitetura](./docs/architecture/overview.md)** — [Visão Geral](./docs/architecture/overview.md), [Modelos C4](./docs/architecture/c4_models.md), [Integrações](./docs/architecture/integrations.md) e [ADRs](./docs/architecture/decisions/0001-record-architecture-decisions.md)
- 🎨 **[Design](./docs/design/modules.md)** — [Módulos](./docs/design/modules.md), [Modelo de Dados](./docs/design/data_models.md) e [Especificações e Contratos](./docs/design/api_specs.md)
- 🚀 **[Implantação](./docs/deployment/pipeline.md)** — [Pipeline](./docs/deployment/pipeline.md) e [Infraestrutura](./docs/deployment/infrastructure.md)
- ⚙️ **[Configuração](./docs/configuration/environment.md)** — [Ambiente](./docs/configuration/environment.md) e [Setup Local](./docs/configuration/local_setup.md)
- 🛡️ **[Segurança](./docs/security/auth_and_access.md)** — [Autenticação e Acesso](./docs/security/auth_and_access.md) e [Conformidade](./docs/security/compliance.md)
- 🧰 **[Tecnologia](./docs/technology/stack.md)** — [Stack Tecnológica](./docs/technology/stack.md)
- 🧪 **[Qualidade](./docs/quality/testing_strategy.md)** — [Estratégia de Testes](./docs/quality/testing_strategy.md) e [Análise Estática](./docs/quality/static_analysis.md)
- 📝 **[Changelog da Documentação](./docs/CHANGELOG.md)**

---

## 🛠️ Desenvolvimento Rápido

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento local com JSPM (http://localhost:5776)
npm start

# Atualizar Import Maps, preloads e hashes SRI (importmap.js e index.html)
npm run importmap

# Gerar build de produção (dist/)
npm run build

# Executar suíte de testes automatizados (Vitest)
npm test

# Iniciar o Storybook para desenvolvimento de componentes compartilhados (http://localhost:6006)
npm run storybook

# Executar verificação estática (ESLint) e checagem de formatação (Prettier)
npm run lint
npm run format:check
```

---

## 📄 Licença

Distribuído sob a licença **GNU Affero General Public License v3.0 (`AGPL-3.0-only`)**. Veja [`LICENSE`](./LICENSE) e [`package.json`](./package.json) para mais informações.

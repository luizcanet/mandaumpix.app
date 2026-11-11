[Início](../../README.md) > [Arquitetura](../overview.md) > **ADR 0002**

# ADR 0002: Arquitetura PWA Client-Side com ES Modules e Linting Multi-Linguagem

- **Status**: Aceito
- **Data**: 2026-11-05
- **Autores**: Luiz Henrique Canet Filho (`me@luizca.net`)

---

## 1. Contexto e Declaração do Problema

O **Manda um PIX** tem como objetivo permitir que usuários cadastrem chaves PIX e gerem cobranças (QR Code e chave de cobrança) gratuitamente, sem abrir aplicativos bancários. O sistema precisa ser leve, rápido, seguro em relação à privacidade das chaves do usuário e manter alto padrão de qualidade de código em todas as linguagens utilizadas (JavaScript, CSS, JSON e Markdown).

## 2. Drivers de Decisão

- **Custo Zero de Operação e Gratuidade**: Um aplicativo gratuito não deve exigir infraestrutura pesada de backend para gerar payloads PIX estáticos/abertos que seguem especificação pública.
- **Privacidade por Design**: As chaves PIX cadastradas pelo usuário devem permanecer no próprio dispositivo.
- **Padrões Web Nativos**: Uso de ES Modules nativos (`"type": "module"`) e ambiente de execução browser (`globals.browser`).
- **Qualidade Automatizada**: Padronização estrita de JS, CSS, JSON e Markdown desde o primeiro commit (`1ba8b55`).

## 3. Opções Consideradas

- **Opção 1**: Aplicação PWA Client-Side baseada em ES Modules nativos, com verificação estática unificada via ESLint v10 (Flat Config) e Prettier v3.
- **Opção 2**: Aplicação SSR tradicional com backend Node.js e banco de dados centralizado para armazenar chaves PIX dos usuários.
- **Opção 3**: Aplicativo nativo exclusivo para lojas (Android/iOS) com backend dedicado.

## 4. Decisão Escolhida

Escolhemos a **Opção 1**, conforme evidenciado na configuração de [`package.json`](../../../package.json) e [`eslint.config.js`](../../../eslint.config.js):

- Módulo nativo ES (`"type": "module"`).
- Execução direcionada ao navegador (`globals.browser`).
- Linting unificado com `@eslint/js`, `@eslint/css`, `@eslint/json`, `@eslint/markdown` e `eslint-config-prettier`.

## 5. Prós e Contras das Opções

### Opção 1: PWA Client-Side + ES Modules (Escolhida)

- 👍 **Ponto positivo**: Latência zero na geração do QR Code e da chave de cobrança; funciona sem depender de servidor de aplicação.
- 👍 **Ponto positivo**: Chaves PIX do usuário ficam restritas ao armazenamento local do navegador dele.
- 👍 **Ponto positivo**: Distribuição universal via navegador em celulares e computadores.
- 👎 **Ponto negativo**: Os dados salvos localmente ficam vinculados ao navegador/dispositivo onde foram cadastrados.

### Opção 2: Aplicação com Backend Centralizado

- 👍 **Ponto positivo**: Sincronização entre múltiplos dispositivos mediante login.
- 👎 **Ponto negativo**: Exige autenticação, banco de dados remoto, custos de hospedagem e aumenta a superfície de risco com dados pessoais (LGPD).

## 6. Consequências e Impactos

- **Impacto Positivo**: Arquitetura enxuta, sem custos de servidor de banco de dados e com validação estática cobrindo código, estilo, configuração e documentação.
- **Segurança e Conformidade**: Redução drástica da superfície de ataque por não trafegar nem armazenar chaves PIX em servidores externos.

---

⬅️ **Anterior**: [ADR 0001](./0001-record-architecture-decisions.md) | ➡️ **Próximo**: [ADR 0003: Hospedagem em Firebase Hosting Multi-Ambiente e Domínio no Name.com](./0003-hospedagem-firebase-hosting-e-dominio-name-com.md)

[Início](../../README.md) > [Arquitetura](../overview.md) > **ADR 0003**

# ADR 0003: Hospedagem em Firebase Hosting Multi-Ambiente e Domínio no Name.com

- **Status**: Aceito
- **Data**: 2026-11-06
- **Autores**: Luiz Henrique Canet Filho (`me@luizca.net`)

---

## 1. Contexto e Declaração do Problema

Como um Progressive Web App (PWA) Client-Side baseado em ES Modules nativos, o **Manda um PIX** (`mandaumpix.app`) necessita de uma infraestrutura de entrega estática confiável, com CDN global, suporte nativo a HTTP/2 e HTTPS obrigatório (requisito para _Service Workers_, _Clipboard API_ e _Web Share API_), além de isolamento claro entre os estágios do ciclo de vida de desenvolvimento, homologação e produção.

## 2. Drivers de Decisão

- **Segurança e HTTPS Obrigatório**: Registro de domínio `.app` (HSTS preloaded por padrão no TLD `.app`) e fornecimento de certificado digital confiável via **Name.com**.
- **Isolamento Estrito de Ambientes**: Segregação entre `development` (`dev`), `staging` (`stg`) e `production` (`prd`) em projetos independentes na nuvem para evitar impactos acidentais no ambiente produtivo.
- **Performance de CDN para ES Modules**: Baixa latência na entrega de ativos estáticos (`HTML`, `CSS`, `JS`, `SVG`, `manifest.json` e `importmap.js`).
- **Integração Simples com CI/CD**: Suporte direto a deploy automatizado por linha de comando (`firebase-tools`) e GitHub Actions.

## 3. Opções Consideradas

- **Opção 1**: Domínio `mandaumpix.app` e certificado fornecidos pelo **Name.com**, com hospedagem no **Firebase Hosting** estruturada em três projetos isolados (`mandaumpix-app-dev`, `mandaumpix-app-stg` e `mandaumpix-app-prd`).
- **Opção 2**: Projeto único no Firebase Hosting utilizando apenas canais de preview temporários sem separação de projetos.
- **Opção 3**: Servidor VPS próprio gerenciado manualmente com Nginx.

## 4. Decisão Escolhida

Escolhemos a **Opção 1**:

1. **Registro de Domínio e Certificado**:
   - Provedor: **Name.com**
   - Domínio principal: `mandaumpix.app` (com subdomínios `dev.mandaumpix.app` e `stg.mandaumpix.app`) e fornecimento de certificado SSL/TLS.
2. **Hospedagem Estática / CDN**:
   - Provedor: **Firebase Hosting** (Google Cloud)
   - Segregação em **três ambientes e projetos independentes**:

| Ambiente      | Sigla | Domínio / Subdomínio | Projeto no Firebase  |
| :------------ | :---: | :------------------- | :------------------- |
| `development` | `dev` | `dev.mandaumpix.app` | `mandaumpix-app-dev` |
| `staging`     | `stg` | `stg.mandaumpix.app` | `mandaumpix-app-stg` |
| `production`  | `prd` | `mandaumpix.app`     | `mandaumpix-app-prd` |

## 5. Consequências e Impactos

- **Impacto Positivo**: Isolamento completo de cotas, permissões, logs e configurações entre `dev`, `stg` e `prd`; entrega via CDN global sobre HTTPS com certificado gerenciado e domínio `.app` seguro por padrão.
- **Impacto Negativo / Débito Técnico**: Necessidade de manter os apontamentos DNS (`A`, `AAAA`, `TXT` / `CNAME`) sincronizados no **Name.com** para os três projetos do **Firebase Hosting**.

---

⬅️ **Anterior**: [ADR 0002](./0002-arquitetura-pwa-client-side-es-modules.md) | ➡️ **Próximo**: [ADR 0004: Persistência Local de Dados do Usuário com IndexedDB](./0004-persistencia-local-indexeddb.md)

[Início](../README.md) > [Design](./modules.md) > **Especificações e Contratos**

# 🔌 Especificações e Contratos de Interface

Como o **Manda um PIX** é um PWA Client-Side, seus contratos principais consistem no formato padronizado do payload de cobrança PIX (**BR Code / EMV®**) e nos contratos de interação com as APIs do navegador para cópia, compartilhamento e download.

---

## 1. Estrutura da Chave de Cobrança PIX (BR Code — EMV® QRCPS-MPM)

A chave de cobrança gerada ao clicar em **"Manda um PIX"** segue o formato TLV (_Tag-Length-Value_ — ID com 2 dígitos, tamanho com 2 dígitos e valor) especificado pelo Banco Central do Brasil:

| ID (Tag) | Campo EMV                          | Comportamento no Manda um PIX                                                                                                            |
| :------: | :--------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
|   `00`   | Payload Format Indicator           | Fixo `"01"`                                                                                                                              |
|   `26`   | Merchant Account Information — PIX | Contém o GUI `"br.gov.bcb.pix"` (subtag `00`) e a **chave PIX selecionada** pelo usuário (subtag `01`)                                   |
|   `52`   | Merchant Category Code             | Código de categoria (ex.: `"0000"`)                                                                                                      |
|   `53`   | Transaction Currency               | Fixo `"986"` (Real Brasileiro — BRL)                                                                                                     |
|   `54`   | Transaction Amount                 | **Condicional**: Presente quando o usuário informa um valor (ex.: `"25.50"`). **Omitido** quando o usuário deixa o valor dinâmico/aberto |
|   `58`   | Country Code                       | Fixo `"BR"`                                                                                                                              |
|   `59`   | Merchant Name                      | Nome do recebedor (até 25 caracteres)                                                                                                    |
|   `60`   | Merchant City                      | Cidade do recebedor (até 15 caracteres)                                                                                                  |
|   `62`   | Additional Data Field Template     | Identificador da transação (`txid`, subtag `05`, ex.: `"***"`)                                                                           |
|   `63`   | CRC16                              | Checksum cíclico (polinômio `0x1021`, 4 caracteres hexadecimais) calculado sobre todo o payload                                          |

---

## 2. Contratos de Ações de Saída da Interface

Após a geração da cobrança, o usuário dispõe de três contratos de saída:

### Ação 1: Copiar Chave de Cobrança

- **Entrada**: `chaveDeCobranca` (`string`).
- **Interface**: `navigator.clipboard.writeText(chaveDeCobranca)`.
- **Resultado Esperado**: Texto da chave de cobrança copiado para a área de transferência do dispositivo.

### Ação 2: Compartilhar por Aplicativos (ex.: WhatsApp)

- **Entrada**: `chaveDeCobranca` (`string`) e/ou arquivo de imagem do QR Code (`File`).
- **Interface Primária**: `navigator.share({ title, text, files })` (Web Share API).
- **Interface Fallback (WhatsApp URI)**: `https://wa.me/?text=<chaveDeCobrancaCodificada>`.
- **Resultado Esperado**: Abertura do WhatsApp ou menu nativo de compartilhamento do sistema operacional com os dados da cobrança preenchidos.

### Ação 3: Salvar Imagem Gerada Localmente

- **Entrada**: Representação gráfica do QR Code (`HTMLCanvasElement` / `Blob` / `DataURL`).
- **Interface**: Criação de URL de objeto (`URL.createObjectURL(blob)`) associada a um elemento `<a download="mandaumpix-qrcode.png">`.
- **Resultado Esperado**: Download e armazenamento local do arquivo de imagem no dispositivo do usuário.

---

## 3. Contrato de Instalação do Aplicativo (Botão Destacado "Instalar")

Para usuários que ainda não instalaram o aplicativo no dispositivo, a interface apresenta um botão destacado **"Instalar"**:

- **Condição de Exibição**: O aplicativo não está em execução no modo instalado (`window.matchMedia('(display-mode: standalone)').matches === false` e `navigator.standalone !== true`) e o dispositivo sinaliza disponibilidade de instalação (ex.: captura do evento `beforeinstallprompt`).
- **Ação do Usuário**: Clique no botão destacado **"Instalar"**.
- **Interface**: Invocação de `deferredPrompt.prompt()` e aguardo de `deferredPrompt.userChoice`, além da escuta do evento `window.addEventListener('appinstalled', ...)`.
- **Resultado Esperado**: Exibição do diálogo nativo de instalação do sistema operacional/navegador e ocultação imediata do botão **"Instalar"** assim que o aplicativo for instalado no dispositivo.

---

## 4. Contrato de Navegação e Conteúdo da Página "Sobre" (Autor, Projeto, Apoio e Divulgação)

O aplicativo deve oferecer um acesso fácil na interface principal para uma página que fale sobre o aplicativo, contendo informações sobre sua natureza livre, o **autor**, o **projeto**, o apoio voluntário e a divulgação (alinhado à regra de negócio [`RN07`](../business/domain_model.md) e à seção _Appropriate Legal Notices_ da licença [`LICENSE`](../../LICENSE)):

- **Gatilho de Acesso**: Link ou botão de fácil acesso presente na navegação/cabeçalho ou rodapé da interface (ex.: rota SPA `/sobre` gerenciada pelo `@modnes/router`).
- **Conteúdo Obrigatório Exibido**:
  - **Sobre o Aplicativo**: Explicação do objetivo do **Manda um PIX** (facilitar a geração rápida de cobranças via PIX sem precisar abrir aplicativos de banco, com privacidade 100% local), destacando expressamente que o aplicativo é **gratuito, livre e de código aberto**.
  - **Sobre o Projeto**:
    - Nome e domínio: **Manda um PIX** (`mandaumpix.app`) — Versão `1.0.0`.
    - Licença de Software Livre: **GNU Affero General Public License v3.0 (`AGPL-3.0-only`)**.
    - Código-fonte e Issues: [`https://github.com/luizcanet/mandaumpix.app`](https://github.com/luizcanet/mandaumpix.app).
  - **Sobre o Autor**:
    - Nome: **Luiz Henrique Canet Filho**.
    - Contato / E-mail: `me@luizca.net`.
    - Perfil GitHub: [`@luizcanet`](https://github.com/luizcanet).
    - Perfil LinkedIn: [`https://www.linkedin.com/in/luizcanet/`](https://www.linkedin.com/in/luizcanet/).
  - **Contribuição Voluntária ("Manda um PIX")**:
    - **Mensagem Descontraída com Emojis**: Texto leve e amigável com emojis explicando que o aplicativo é gratuito, livre e de código aberto, mas que se o usuário achar que o aplicativo é útil para ele e para outras pessoas, pode contribuir para ajudar a manter o projeto com **qualquer valor**, utilizando em destaque a frase **"Manda um PIX"**.
    - **QR Code com Valor Dinâmico e Chave Copia e Cola (`eu@luizca.net`)**:
      - Chave PIX de destino: **`eu@luizca.net`**.
      - Modalidade: **Valor dinâmico / em aberto** (`transactionAmount = 0`, sem tag EMV `54`, permitindo que o apoiador defina livremente qualquer valor no aplicativo de seu banco).
      - Payload BR Code (Chave Copia e Cola EMV®): `00020126350014br.gov.bcb.pix0113eu@luizca.net5204000053039865802BR5925LUIZ HENRIQUE CANET FILHO6008BRASILIA62070503***63043C63` (gerado deterministicamente por [`generatePixCharge`](../../src/main.js)).
      - Ação de cópia rápida da Chave copia e cola via `navigator.clipboard.writeText(brCode)`.
  - **Incentivo à Divulgação**:
    - Mensagem incentivando o usuário a divulgar e indicar o aplicativo (`https://mandaumpix.app`) para mais pessoas (amigos, colegas, prestadores de serviço e comerciantes), acompanhada de botão de compartilhamento (`navigator.share` ou fallback para WhatsApp / cópia do link).

---

## 5. Contrato de Persistência Local de Dados do Usuário (`IndexedDB`)

A persistência de todos os dados do usuário no dispositivo segue o contrato assíncrono sobre a API nativa `window.indexedDB` ([ADR 0004](../architecture/decisions/0004-persistencia-local-indexeddb.md)):

- **Inicialização e Migração**:
  - `indexedDB.open('mandaumpix_db', 1)`
  - No evento `onupgradeneeded`, garante a criação das _object stores_ `pix_keys` (`{ keyPath: 'id' }`) e `user_settings` (`{ keyPath: 'key' }`).
- **Operações do Repositório (`IndexedDbPixKeyRepository`)**:
  - `findAll(): Promise<ChaveConta[]>` — Transação `readonly` em `pix_keys` (`objectStore.getAll()`).
  - `save(pixKey: ChaveConta): Promise<ChaveConta>` — Transação `readwrite` em `pix_keys` (`objectStore.put(pixKey)`).
  - `deleteById(id: string): Promise<void>` — Transação `readwrite` em `pix_keys` (`objectStore.delete(id)`).
  - `getSelectedKeyId(): Promise<string | null>` — Transação `readonly` em `user_settings` (`objectStore.get('selectedKeyId')`).
  - `setSelectedKeyId(id: string | null): Promise<void>` — Transação `readwrite` em `user_settings` (`objectStore.put({ key: 'selectedKeyId', value: id, updatedAt })`).

---

⬅️ **Anterior**: [Modelo de Dados](./data_models.md) | ➡️ **Próximo**: [Proposta de Interface (UI)](./ui_proposal.md)

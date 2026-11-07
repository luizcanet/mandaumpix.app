[Início](../README.md) > [Arquitetura](./overview.md) > **Integrações**

# 🔌 Integrações Externas e Interfaces de Plataforma

O **Manda um PIX** opera sem acoplamento direto a APIs proprietárias de instituições bancárias (não exige login bancário nem chaves de API de bancos), integrando-se ao ecossistema de pagamentos e compartilhamento por meio de padrões abertos e APIs nativas do navegador.

---

## 📋 Matriz de Integrações

| Integração / Padrão                                                            | Tipo                                        |      Direção      | Finalidade no Manda um PIX                                                                                                                             |
| :----------------------------------------------------------------------------- | :------------------------------------------ | :---------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Padrão PIX BR Code (EMV® QRCPS-MPM)**                                        | Protocolo / Formato de Dados Aberto (BACEN) |   Geração Local   | Estruturar a chave de cobrança (PIX Copia e Cola) e o conteúdo do QR Code de forma universalmente reconhecida por qualquer banco brasileiro.           |
| **Clipboard API (`navigator.clipboard`)**                                      | Web API Nativa                              |  Escrita (Saída)  | Permitir ao usuário copiar a chave de cobrança gerada com um toque.                                                                                    |
| **Web Share API (`navigator.share`) / Deep Link WhatsApp (`https://wa.me/`)**  | Web API Nativa / URI Scheme                 |       Saída       | Compartilhar a chave de cobrança e/ou a imagem do QR Code diretamente com o **WhatsApp** e outros aplicativos instalados no dispositivo.               |
| **HTML5 Canvas / Blob Download (`a[download]`)**                               | Web API Nativa                              |  Saída (Arquivo)  | Converter o QR Code exibido na tela em um arquivo de imagem e salvá-lo no armazenamento local do dispositivo.                                          |
| **IndexedDB API (`window.indexedDB`)**                                         | Web API Nativa (Banco NoSQL Transacional)   | Leitura / Escrita | Persistir localmente de forma assíncrona e transacional os dados do usuário (chaves de contas cadastradas e preferências/seleção ativa) no navegador.  |
| **PWA Install Prompt (`beforeinstallprompt` / `appinstalled` / `matchMedia`)** | Web API Nativa / Manifesto PWA              | Eventos / Entrada | Detectar quando o aplicativo ainda não está instalado no dispositivo, exibir de forma destacada o botão **"Instalar"** e disparar a instalação nativa. |

---

## 🔄 Fluxo de Integração com Aplicativos Externos (WhatsApp e Download)

```mermaid
sequenceDiagram
    autonumber
    participant PWA as Manda um PIX (PWA)
    participant Nav as Browser Web APIs
    participant WA as WhatsApp / App Externo
    participant FS as Sistema de Arquivos do Dispositivo

    Note over PWA,Nav: Cenário A: Copiar Chave de Cobrança
    PWA->>Nav: navigator.clipboard.writeText(chaveDeCobranca)
    Nav-->>PWA: Promise resolvida (Copiado)

    Note over PWA,WA: Cenário B: Compartilhar Cobrança
    alt Dispositivo suporta Web Share API (navigator.share)
        PWA->>Nav: navigator.share({ title, text: chaveDeCobranca, files: [qrCodeImage] })
        Nav->>WA: Encaminha payload para o aplicativo escolhido (ex: WhatsApp)
    else Fallback via Deep Link do WhatsApp
        PWA->>WA: Abre URI https://wa.me/?text= urlencode(chaveDeCobranca)
    end

    Note over PWA,FS: Cenário C: Salvar Imagem Localmente
    PWA->>Nav: Gera Blob/DataURL da imagem do QR Code
    Nav->>FS: Dispara download (<a download="pix-qrcode.png">)
```

---

⬅️ **Anterior**: [Modelos C4](./c4_models.md) | ➡️ **Próximo**: [ADR 0001: Registro de Decisões Arquiteturais](./decisions/0001-record-architecture-decisions.md)

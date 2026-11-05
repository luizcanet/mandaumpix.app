[Início](../README.md) > [Arquitetura](./overview.md) > **Modelos C4**

# 🗺️ Modelos C4 da Arquitetura

Esta página apresenta a arquitetura do **Manda um PIX** segundo o modelo **C4** (Contexto, Contêineres e Componentes).

---

## 1. Nível 1 — Diagrama de Contexto do Sistema

Demonstra como o **Manda um PIX** atende exclusivamente ao **Recebedor** e interage com os recursos e aplicativos do dispositivo.

```mermaid
flowchart TD
    subgraph Ator["Ator do Sistema"]
        Receiver["👤 Recebedor (Usuário)<br/>Cadastra chaves de contas e gera cobranças PIX"]
    end

    System["📱 Manda um PIX (PWA)<br/>Aplicativo gratuito focado no Recebedor para geração<br/>de cobranças PIX sem abrir aplicativos de banco"]

    subgraph Ecossistema["Aplicativos e Recursos do Dispositivo"]
        Clipboard["📋 Área de Transferência<br/>Recebe a chave de cobrança copiada"]
        WhatsApp["💬 WhatsApp / Apps Externos<br/>Recebem a cobrança compartilhada"]
        FileSystem["💾 Armazenamento Local de Arquivos<br/>Salva a imagem do QR Code gerada"]
    end

    Receiver -->|"1. Cadastra chaves, seleciona chave,<br/>informa valor opcional e clica em 'Manda um PIX'"| System
    System -->|"2. Exibe QR Code na tela<br/>e chave de cobrança"| Receiver
    System -->|"3a. Copia chave de cobrança"| Clipboard
    System -->|"3b. Compartilha cobrança"| WhatsApp
    System -->|"3c. Salva imagem do QR Code localmente"| FileSystem
```

---

## 2. Nível 2 — Diagrama de Contêineres

Por se tratar de um **PWA Client-Side**, os contêineres de execução residem no navegador do dispositivo do usuário, apoiados por hospedagem estática para distribuição dos artefatos web.

```mermaid
flowchart TD
    User["👤 Usuário Recebedor"]

    subgraph Browser["Navegador Web / Runtime PWA (Dispositivo do Usuário)"]
        PWAApp["📱 Aplicação Web SPA / PWA<br/>(ES Modules, HTML5, CSS3)<br/>Interface e lógica de geração PIX"]
        SW["⚙️ Service Worker<br/>Cache de ativos e funcionamento offline"]
        LocalStore[("🗄️ Armazenamento Local do Navegador<br/>(IndexedDB / Web Storage)<br/>Chaves PIX cadastradas pelo usuário")]
    end

    CDN["☁️ Servidor / CDN de Hospedagem Estática<br/>Entrega pacotes HTML, CSS, JS e Manifesto PWA"]
    NativeAPIs["🔌 APIs Nativas do Sistema / Navegador<br/>Clipboard, Web Share (WhatsApp), Download de Imagem"]

    User -->|"Interage com"| PWAApp
    CDN -->|"Carrega ativos via HTTPS"| SW
    SW -->|"Serve ativos cacheados"| PWAApp
    PWAApp -->|"Lê e grava chaves cadastradas"| LocalStore
    PWAApp -->|"Copia texto, compartilha ou baixa PNG"| NativeAPIs
```

---

## 3. Nível 3 — Diagrama de Componentes (Aplicação PWA)

Decomposição lógica dos módulos internos planejados para a aplicação no cliente.

```mermaid
flowchart TD
    subgraph UI["Componentes de Interface"]
        KeyManagerUI["Gerenciador de Chaves UI<br/>Cadastro, listagem e exclusão de chaves"]
        ChargeFormUI["Formulário de Cobrança UI<br/>Seleção de chave, valor opcional e botão 'Manda um PIX'"]
        ResultViewUI["Painel de Resultado UI<br/>Exibição do QR Code e ações de distribuição"]
    end

    subgraph Core["Módulos de Domínio e Serviços"]
        KeyService["Serviço de Chaves de Conta<br/>Validação e gestão de chaves PIX"]
        PixPayloadBuilder["Construtor de Payload PIX<br/>Formatação da chave de cobrança ( fixo ou dinâmico)"]
        QRCodeRenderer["Renderizador de QR Code<br/>Geração da matriz gráfica e exportação em imagem"]
        ShareController["Controlador de Compartilhamento<br/>Cópia, envio ao WhatsApp e download local"]
    end

    subgraph Adapters["Adaptadores do Navegador"]
        StorageAdapter["Storage Adapter"]
        BrowserShareAdapter["Clipboard & Web Share Adapter"]
    end

    KeyManagerUI --> KeyService
    ChargeFormUI --> KeyService
    ChargeFormUI --> PixPayloadBuilder
    PixPayloadBuilder --> QRCodeRenderer
    QRCodeRenderer --> ResultViewUI
    ResultViewUI --> ShareController
    KeyService --> StorageAdapter
    ShareController --> BrowserShareAdapter
```

---

⬅️ **Anterior**: [Visão Geral de Arquitetura](./overview.md) | ➡️ **Próximo**: [Integrações Externas](./integrations.md)

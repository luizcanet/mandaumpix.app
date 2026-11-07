[Início](../README.md) > [Negócio](./overview.md) > **Fluxos de Trabalho**

# 🔄 Fluxos de Trabalho e Jornadas do Usuário

Este documento detalha os fluxos operacionais executados pelo usuário no **Manda um PIX**.

---

## 1. Fluxo de Cadastro de Chaves de Contas

O usuário registra as chaves PIX das contas nas quais deseja receber pagamentos para que fiquem disponíveis para uso recorrente.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário Recebedor
    participant App as Manda um PIX (PWA)
    participant Storage as Banco Local (IndexedDB)

    U->>App: Acessa gestão de chaves de contas
    U->>App: Informa dados da chave PIX (conta de recebimento)
    App->>App: Valida formato dos dados informados
    App->>Storage: Persiste chave e seleção ativa no IndexedDB (readwrite)
    Storage-->>App: Confirmação da transação assíncrona
    App-->>U: Exibe chave disponível na lista de seleção
```

---

## 2. Fluxo Principal: Geração e Compartilhamento de Cobrança ("Manda um PIX")

Jornada central de geração de cobrança com valor informado ou valor dinâmico, seguida de cópia, compartilhamento via WhatsApp ou download local da imagem do QR Code.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário Recebedor
    participant App as Manda um PIX (PWA)
    participant Gen as Motor de Cobrança & QR Code
    participant OS as APIs do Dispositivo / WhatsApp

    U->>App: Seleciona uma chave cadastrada
    opt Valor definido pelo recebedor
        U->>App: Informa valor da cobrança
    end
    Note over U,App: Se o valor não for informado,<br/>a cobrança terá valor dinâmico (aberto)
    U->>App: Clica em "Manda um PIX"
    App->>Gen: Gera chave de cobrança (payload PIX) e imagem QR Code
    Gen-->>App: Retorna QR Code + chave de cobrança
    App-->>U: Exibe QR Code na tela e chave de cobrança

    alt Copiar chave de cobrança
        U->>App: Aciona opção "Copiar"
        App->>OS: Grava chave de cobrança na Área de Transferência
        OS-->>U: Confirmação de cópia
    else Compartilhar via WhatsApp / outros apps
        U->>App: Aciona opção "Compartilhar"
        App->>OS: Aciona compartilhamento (ex: WhatsApp)
        OS-->>U: Abre seletor/conversa com a cobrança pronta para envio
    else Salvar imagem gerada localmente
        U->>App: Aciona opção "Salvar imagem"
        App->>OS: Inicia download local do arquivo de imagem do QR Code
        OS-->>U: Imagem salva no armazenamento do dispositivo
    end
```

---

## 3. Fluxo de Instalação do Aplicativo no Dispositivo (Botão "Instalar")

Para usuários que acessam o aplicativo pelo navegador e ainda não o instalaram no dispositivo, a interface apresenta de forma destacada o botão **"Instalar"**.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário Recebedor
    participant App as Manda um PIX (PWA)
    participant Browser as Navegador / Sistema Operacional

    U->>App: Acessa o aplicativo no dispositivo
    App->>Browser: Verifica se o PWA já está instalado ou apto para instalação
    alt Aplicativo ainda não instalado no dispositivo
        Browser-->>App: Disponibiliza gatilho de instalação (ex: beforeinstallprompt)
        App-->>U: Apresenta de forma destacada o botão "Instalar"
        U->>App: Clica no botão destacado "Instalar"
        App->>Browser: Aciona o prompt nativo de instalação no dispositivo
        Browser-->>U: Solicita confirmação de instalação
        U->>Browser: Confirma instalação
        Browser-->>App: Notifica conclusão da instalação (appinstalled)
        App-->>U: Oculta o botão "Instalar"
    else Aplicativo já instalado no dispositivo (modo standalone)
        App-->>U: Não exibe o botão "Instalar"
    end
```

---

## 4. Fluxo de Acesso à Página Sobre o Aplicativo (Autor e Projeto)

O aplicativo disponibiliza um ponto de acesso fácil na interface para que o usuário consulte a página **"Sobre"**, contendo a explicação sobre o aplicativo, as informações sobre o **autor** e os detalhes do **projeto**.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário Recebedor
    participant App as Manda um PIX (PWA)
    participant Router as Roteador SPA (@modnes/router)
    participant About as Página "Sobre" (Autor & Projeto)

    U->>App: Aciona o atalho de fácil acesso "Sobre" na interface
    App->>Router: Navega para a rota da página "Sobre" (ex: /sobre)
    Router->>About: Renderiza a página "Sobre"
    About-->>U: Apresenta descrição do aplicativo, dados do Autor (Luiz Henrique Canet Filho) e informações do Projeto (repositório e licença AGPL-3.0-only)
    opt Retorno à geração de cobrança
        U->>About: Aciona opção de voltar ao início
        About->>Router: Navega para a tela principal (/)
        Router-->>U: Exibe tela principal de seleção de chaves e cobrança
    end
```

---

## 5. Máquina de Estados de uma Cobrança na Sessão

```mermaid
stateDiagram-v2
    [*] --> SelecaoChave : Usuário abre o aplicativo
    SelecaoChave --> ConfiguracaoValor : Chave cadastrada selecionada
    ConfiguracaoValor --> ValorFixo : Usuário preenche valor opcional
    ConfiguracaoValor --> ValorDinamico : Usuário mantém valor em branco
    ValorFixo --> CobrancaGerada : Clica em "Manda um PIX"
    ValorDinamico --> CobrancaGerada : Clica em "Manda um PIX"
    CobrancaGerada --> Copiada : Copiar chave de cobrança
    CobrancaGerada --> Compartilhada : Compartilhar (WhatsApp / outros)
    CobrancaGerada --> ImagemSalva : Salvar imagem localmente
    Copiada --> CobrancaGerada
    Compartilhada --> CobrancaGerada
    ImagemSalva --> CobrancaGerada
    CobrancaGerada --> SelecaoChave : Nova cobrança
```

---

⬅️ **Anterior**: [Modelo de Domínio](./domain_model.md) | ➡️ **Próximo**: [Backlog do Produto](./backlog.md)

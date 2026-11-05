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
    participant Storage as Armazenamento Local (Browser)

    U->>App: Acessa gestão de chaves de contas
    U->>App: Informa dados da chave PIX (conta de recebimento)
    App->>App: Valida formato dos dados informados
    App->>Storage: Persiste chave cadastrada localmente
    Storage-->>App: Confirmação de persistência
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

## 3. Máquina de Estados de uma Cobrança na Sessão

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

⬅️ **Anterior**: [Modelo de Domínio](./domain_model.md) | ➡️ **Próximo**: [Arquitetura do Sistema](../architecture/overview.md)

[Início](../README.md) > [Negócio](./overview.md) > **Modelo de Domínio**

# 📖 Modelo de Domínio e Linguagem Ubíqua

Este documento estabelece o vocabulário padronizado (**Linguagem Ubíqua**) e as regras de negócio centrais do **Manda um PIX**.

---

## 🗣️ Glossário (Linguagem Ubíqua)

| Termo                                    | Definição no Contexto do Manda um PIX                                                                                                                                               |
| :--------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Chave de Conta (Chave PIX)**           | Identificador vinculado a uma conta bancária ou de pagamento (CPF, CNPJ, E-mail, Telefone celular ou Chave Aleatória EVP) cadastrado pelo usuário para receber transferências.      |
| **Cobrança PIX**                         | Solicitação de pagamento gerada a partir de uma chave cadastrada e, opcionalmente, um valor monetário.                                                                              |
| **Valor Definido (Fixo)**                | Quantia monetária explícita informada pelo Recebedor antes de gerar a cobrança.                                                                                                     |
| **Valor Dinâmico (Aberto)**              | Modalidade em que nenhum valor é preenchido pelo Recebedor na geração da cobrança, mantendo o valor em aberto no QR Code e na chave de cobrança gerada.                             |
| **Ação "Manda um PIX"**                  | Gatilho principal da interface que processa os dados selecionados (chave + valor opcional) e gera o QR Code e a chave de cobrança.                                                  |
| **Chave de Cobrança (PIX Copia e Cola)** | Código textual padronizado (payload EMV® / BR Code) gerado junto ao QR Code, que pode ser copiado para a área de transferência ou enviado por mensagem para pagamento sem câmera.   |
| **QR Code de Cobrança**                  | Representação gráfica bidimensional da cobrança gerada na tela, passível de leitura óptica imediata ou download como arquivo de imagem local.                                       |
| **Botão "Instalar"**                     | Elemento de interface apresentado de forma destacada exclusivamente para usuários que ainda não instalaram o aplicativo (PWA) no dispositivo, acionando a instalação local.         |
| **Página "Sobre"**                       | Página de fácil acesso no aplicativo que fala sobre o aplicativo e apresenta informações sobre o **autor** (**Luiz Henrique Canet Filho** `<me@luizca.net>`) e sobre o **projeto**. |

---

## 📏 Regras de Negócio Essenciais

### RN01 — Múltiplas Chaves Cadastradas

- O usuário pode cadastrar uma ou mais chaves PIX associadas às contas nas quais deseja receber valores.
- As chaves cadastradas ficam disponíveis para seleção rápida na geração de novas cobranças, evitando redigitação.

### RN02 — Seleção Obrigatória de Chave na Cobrança

- Para gerar uma cobrança, é obrigatório selecionar uma chave previamente cadastrada.

### RN03 — Opcionalidade do Valor da Cobrança

- O campo de valor monetário é **opcional**:
  - **Com valor preenchido**: A cobrança gerada incorpora o montante específico definido pelo Recebedor.
  - **Sem valor preenchido**: A cobrança é gerada com valor dinâmico (em aberto).

### RN04 — Geração Simultânea de QR Code e Chave de Cobrança

- Ao acionar **"Manda um PIX"**, o sistema deve apresentar na tela tanto a imagem do **QR Code** quanto a **chave de cobrança textual** correspondente.

### RN05 — Opções de Saída e Distribuição

- Toda cobrança gerada disponibiliza três ações de distribuição ao usuário:
  1. **Copiar**: Copia a chave de cobrança para a área de transferência do dispositivo.
  2. **Compartilhar**: Envia os dados da cobrança para aplicativos externos (como o **WhatsApp**).
  3. **Salvar Imagem**: Faz o download/salvamento local da imagem do QR Code gerado no dispositivo do usuário.

### RN06 — Exibição Destacada do Botão "Instalar" para Aplicativo Não Instalado

- O aplicativo deve apresentar de forma destacada um botão **"Instalar"** para usuários que ainda não instalaram o aplicativo no dispositivo.
- Quando o aplicativo já estiver instalado no dispositivo (ou após a conclusão da instalação pelo usuário), o botão **"Instalar"** não deve ser exibido.

### RN07 — Acesso Fácil à Página Sobre o Aplicativo (Autor e Projeto)

- O aplicativo deve apresentar na interface um acesso fácil e direto a uma página que fale sobre o aplicativo (**Página "Sobre"**).
- A página deve conter informações claras sobre:
  1. **O Aplicativo e o Projeto**: Descrição e propósito do **Manda um PIX** (`mandaumpix.app`), versão, natureza gratuita/PWA, código aberto sob licença **GNU AGPL v3.0 (`AGPL-3.0-only`)** e links do repositório oficial ([`github.com/luizcanet/mandaumpix.app`](https://github.com/luizcanet/mandaumpix.app)).
  2. **O Autor**: Identificação e contato do criador e mantenedor do projeto, **Luiz Henrique Canet Filho** (`<me@luizca.net>`).

---

## 🧩 Diagrama Conceitual de Domínio

```mermaid
classDiagram
    class Usuario {
        +instalarAplicativo()
        +consultarPaginaSobre()
        +gerenciarChaves()
        +gerarCobranca()
    }

    class ChaveConta {
        +String identificador
        +String tipoChave
        +String descricaoConta
    }

    class CobrancaPix {
        +ChaveConta chaveSelecionada
        +Decimal valorOpcional
        +Boolean valorDinamico
        +String chaveDeCobranca
        +Blob imagemQrCode
        +copiarChaveCobranca()
        +compartilhar(aplicativoDestino)
        +salvarImagemLocalmente()
    }

    Usuario "1" --> "0..*" ChaveConta : cadastra
    ChaveConta "1" <-- "0..*" CobrancaPix : utiliza
    Usuario "1" --> "0..*" CobrancaPix : emite via "Manda um PIX"
```

---

⬅️ **Anterior**: [Visão de Negócio](./overview.md) | ➡️ **Próximo**: [Fluxos de Trabalho e Jornadas](./workflows.md)

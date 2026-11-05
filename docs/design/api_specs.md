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

⬅️ **Anterior**: [Modelo de Dados](./data_models.md) | ➡️ **Próximo**: [Pipeline de Implantação](../deployment/pipeline.md)

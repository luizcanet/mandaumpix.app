[Início](../README.md) > [Segurança](./auth_and_access.md) > **Conformidade e Proteção de Dados**

# 🔒 Conformidade, Privacidade e Superfície de Ataque

## 🛡️ Privacidade por Design (LGPD)

Como chaves PIX frequentemente correspondem a dados pessoais (CPF, número de telefone celular ou endereço de e-mail), o **Manda um PIX** adota o princípio de **Privacidade por Design (_Privacy by Design_)**:

| Aspecto                                      | Implementação / Diretriz Arquitetural                                                                                                                                                                                                                                                                                                               |
| :------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Armazenamento de Dados**                   | **100% Local no Dispositivo (`IndexedDB`)**: Os dados do usuário e as chaves PIX cadastradas permanecem exclusivamente no banco **IndexedDB** (`mandaumpix_db`) do navegador do dispositivo ([ADR 0004](../architecture/decisions/0004-persistencia-local-indexeddb.md)), sem coleta em banco de dados centralizado.                                |
| **Tráfego de Rede**                          | **HTTPS Estrito (`mandaumpix.app`)**: Domínio registrado e certificado SSL/TLS fornecido pelo **Name.com**, com entrega via **Firebase Hosting** (`dev.mandaumpix.app`, `stg.mandaumpix.app` e `mandaumpix.app`). A geração do QR Code e da chave de cobrança ocorre em memória no cliente, sem envio dos valores ou chaves para APIs de terceiros. |
| **Compartilhamento Controlado pelo Usuário** | O envio da chave de cobrança ou imagem para aplicativos como o **WhatsApp** ocorre somente mediante ação explícita do usuário nos botões de compartilhar ou copiar.                                                                                                                                                                                 |

---

## ⚠️ Mitigação de Riscos na Aplicação Client-Side

1. **Prevenção contra XSS (Cross-Site Scripting)**:
   - Como as chaves e rótulos de contas são armazenados e renderizados no DOM, toda inserção de texto oriunda do usuário deve utilizar APIs seguras de texto (`textContent`) em vez de `innerHTML` não sanitizado, evitando injeção de scripts que possam adulterar a chave PIX exibida no QR Code.
2. **Integridade do Payload PIX (CRC16)**:
   - A chave de cobrança gerada inclui obrigatoriamente o cálculo do dígito verificador **CRC16-CCITT (0xFFFF)** ao final da string EMV, garantindo que aplicativos bancários rejeitem imediatamente qualquer código corrompido ou truncado durante a cópia/colagem.

---

## 🚨 Prevenção contra Phishing, Réplicas Maliciosas e Takedown

Como o código-fonte é aberto sob licença `AGPL-3.0-only`, fraudadores podem clonar o aplicativo em domínios falsos buscando induzir usuários ao erro (desvio de chaves PIX ou roubo de credenciais bancárias).

O projeto adota uma estratégia estruturada em 5 frentes defensivas:

1. **Titularidade Marcária no INPI**: O código é aberto, mas a marca e o nome comercial são protegidos legalmente.
2. **Monitoramento Automatizado**: Varredura contínua de novos certificados via _Certificate Transparency_ (`crt.sh`) e permutações de DNS (_Typosquatting_).
3. **UX Defensiva**: Validação in-app de origem canônica (`mandaumpix.app`) e reforço visual do princípio _Zero-Credential_.
4. **Procedimento de Takedown Rápido**: Protocolo operacional para bloqueio via Google Safe Browsing, notificação ao CERT.br e desativação em provedores de hospedagem/DNS.
5. **Distribuição Canônica Android (TWA)**: Proteção via Digital Asset Links na Google Play Store.

> 📖 **Para detalhamento completo dos planos de ação, fluxogramas e modelos de notificação**, consulte [Monitoramento Ativo e Procedimentos de Derrubada (Takedown)](./takedown_and_monitoring.md).

---

⬅️ **Anterior**: [Autenticação e Acesso](./auth_and_access.md) | ➡️ **Próximo**: [Monitoramento Ativo e Takedown](./takedown_and_monitoring.md)

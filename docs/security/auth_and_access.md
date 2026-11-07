[Início](../README.md) > **Segurança: Autenticação e Acesso**

# 🛡️ Modelo de Identidade, Autenticação e Acesso

## 🔑 Ausência de Credenciais Bancárias (Zero-Credential Architecture)

O principal benefício de segurança operacional do **Manda um PIX** reside justamente na **não utilização de credenciais bancárias**:

1. **Sem Login em Contas Bancárias**:
   - Para gerar uma cobrança via PIX estática/aberta (QR Code e chave de cobrança), é necessário apenas o identificador público de recebimento (a **Chave PIX**).
   - O aplicativo **nunca solicita senhas de banco, tokens de segurança, certificados digitais ou acesso via Open Finance**.
2. **Proteção contra Exposição Presencial**:
   - No cotidiano comercial ou pessoal, abrir o aplicativo do banco em público expõe o usuário a riscos de engenharia social, observação de senha (_shoulder surfing_) e visualização acidental de saldos e investimentos.
   - Com o **Manda um PIX**, o usuário opera um aplicativo isolado que contém apenas chaves públicas de recebimento.

---

## 👤 Controle de Acesso no Dispositivo

- **Escopo Local ao Navegador/Dispositivo (`IndexedDB`)**:
  - Os dados do usuário e as chaves de contas cadastradas ficam armazenados exclusivamente no banco de dados local **IndexedDB** (`mandaumpix_db`), protegido pela política de mesma origem (_Same-Origin Policy_) do navegador do próprio dispositivo do usuário.
  - Nenhum outro site ou domínio tem permissão de leitura ou escrita sobre o banco **IndexedDB** do `mandaumpix.app`.

---

⬅️ **Anterior**: [Guia de Inicialização Local](../configuration/local_setup.md) | ➡️ **Próximo**: [Conformidade e Proteção de Dados](./compliance.md)

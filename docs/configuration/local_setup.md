[Início](../README.md) > [Configuração](./environment.md) > **Setup Local**

# 💻 Guia de Inicialização Local

Passo a passo para configurar o ambiente de desenvolvimento do **Manda um PIX** em sua máquina local.

---

## ✅ Pré-requisitos

- **Node.js**: Versão moderna compatível com ES Modules e ESLint v10 (ex.: Node.js `v24.x` LTS/Current).
- **npm**: Gerenciador de pacotes padrão (ex.: `v11.x`).
- **Git**: Para clonagem e versionamento seguindo _Conventional Commits_.

---

## 🚀 Passo a Passo de Instalação

### 1. Clonar o Repositório

```bash
git clone https://github.com/luizcanet/mandaumpix.app.git
cd mandaumpix.app
```

### 2. Instalar as Dependências de Desenvolvimento

```bash
npm install
```

### 3. Executar a Verificação Estática (Linter)

Para validar arquivos JavaScript, CSS, JSON e Markdown:

```bash
npm run lint
```

Para validar um diretório ou arquivo específico (por exemplo, a documentação):

```bash
npx eslint docs/ README.md
```

---

## 📏 Convenção de Commits

Ao contribuir com código ou documentação neste repositório, todas as mensagens de commit devem ser redigidas em **inglês** utilizando o padrão **Conventional Commits** (ex.: `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`).

---

⬅️ **Anterior**: [Configuração e Ambiente](./environment.md) | ➡️ **Próximo**: [Segurança: Autenticação e Acesso](../security/auth_and_access.md)

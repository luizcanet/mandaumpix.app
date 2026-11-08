/**
 * Constantes canônicas e metadados institucionais da página "Sobre" (/sobre).
 * Alinhado à regra de negócio RN07 e às especificações técnicas em docs/design/api_specs.md.
 */

/**
 * Informações canônicas sobre o autor do projeto.
 */
export const ABOUT_AUTHOR = Object.freeze({
  label: "👤 Autor",
  name: "Luiz Henrique Canet Filho",
  email: "me@luizca.net",
  emailUrl: "mailto:me@luizca.net",
  githubUser: "luizcanet",
  githubUrl: "https://github.com/luizcanet",
});

/**
 * Informações canônicas sobre o projeto e licenciamento de software livre.
 */
export const ABOUT_PROJECT = Object.freeze({
  label: "📦 Projeto & Licença Livre",
  name: "Manda um PIX",
  domain: "mandaumpix.app",
  version: "1.0.0",
  versionLabel: "mandaumpix.app • v1.0.0",
  license: "AGPL-3.0-only",
  licenseName: "GNU Affero General Public License v3.0",
  licenseFull: "GNU Affero General Public License v3.0 (AGPL-3.0-only)",
  repositoryUrl: "https://github.com/luizcanet/mandaumpix.app",
  issuesUrl: "https://github.com/luizcanet/mandaumpix.app/issues",
  summary:
    "Manda um PIX é um aplicativo web progressivo (PWA) gratuito, livre e de código aberto que facilita a geração de cobranças via PIX sem a necessidade de ficar abrindo aplicativos de banco, com execução e armazenamento 100% locais no navegador.",
});

/**
 * Payload BR Code canônico e metadados para contribuição voluntária ("Manda um PIX").
 * Gerado deterministicamente para a chave eu@luizca.net com valor dinâmico (aberto).
 */
export const ABOUT_SUPPORT_PIX = Object.freeze({
  title: "☕🚀 Apoie o Projeto — Manda um PIX! 💚",
  key: "eu@luizca.net",
  keyType: "EMAIL",
  merchantName: "LUIZ HENRIQUE CANET FILHO",
  merchantCity: "BRASILIA",
  amount: null,
  isDynamic: true,
  txid: "***",
  brCode:
    "00020126350014br.gov.bcb.pix0113eu@luizca.net5204000053039865802BR5925LUIZ HENRIQUE CANET FILHO6008BRASILIA62070503***63043C63",
  message:
    "🎉 Este aplicativo é 100% gratuito, livre e de código aberto! Mas se você achar que ele é útil pra você e pra outras pessoas e quiser dar uma força pra ajudar a manter o projeto no ar com qualquer valor... é só abrir o coração: Manda um PIX! 🙌✨",
  qrAriaLabel: "QR Code PIX com valor dinâmico para eu@luizca.net",
  copyButtonText: "Copiar Chave Copia e Cola (eu@luizca.net)",
  copiedButtonText: "Chave copiada!",
});

/**
 * Informações e textos para incentivo à divulgação orgânica do aplicativo.
 */
export const ABOUT_SHARE = Object.freeze({
  title: "📣 Espalhe a Palavra e Divulgue! 🤝",
  message:
    "Gostou do Manda um PIX? Ajude mais pessoas a conhecerem o aplicativo! Indique e compartilhe o mandaumpix.app com amigos, colegas, clientes e comerciantes para facilitar o dia a dia de todo mundo! 🚀📲",
  buttonText: "Compartilhar e Divulgar o Aplicativo",
  shareTitle: "Manda um PIX",
  shareText:
    "Gere cobranças PIX rápidas com QR Code e Copia e Cola sem abrir o app do banco. 100% gratuito e local!",
  shareUrl: "https://mandaumpix.app",
});

/**
 * Constantes de navegação e cabeçalho da página "Sobre".
 */
export const ABOUT_NAVIGATION = Object.freeze({
  title: "Sobre o Manda um PIX",
  homeHref: "/",
  homeButtonText: "Início",
  logoSrc: "./src/assets/icons/icon.svg",
});

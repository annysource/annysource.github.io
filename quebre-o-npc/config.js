// URL pública do Worker (não é segredo). A chave da IA fica só no Cloudflare.
// Se o Worker tiver outro nome, troque o endereço abaixo, mantendo /chat no fim.
window.CONFIG = {
  WORKER_URL: "https://quebre-o-npc.sousa-annyc.workers.dev/chat",
  // Quantas falas do jogador cabem em uma tentativa (conversa).
  MAX_FALAS_POR_TENTATIVA: 8
};

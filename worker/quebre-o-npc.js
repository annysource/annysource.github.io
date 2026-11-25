// Quebre o NPC · Worker do Cloudflare: o "intermediário" entre o site (annysousa.dev/quebre-o-npc/) e a IA.
// Publicação: cole este arquivo inteiro no editor do Worker pelo painel do Cloudflare (passo a passo no README).
// Ele guarda a chave da IA (como segredo), confere o código da turma e limita o uso.
//
// Variáveis (Settings > Variables and Secrets no painel do Cloudflare):
//   API_KEY          (Secret)  chave do provedor de IA
//   CLASS_CODE       (Secret)  código da turma que você escreve no quadro
//   PROVIDER         (Text)    "gemini" (padrão), "anthropic" ou "openai"
//   MODEL            (Text)    opcional: nome do modelo; se vazio, usa o padrão do provedor
//   ALLOWED_ORIGINS  (Text)    endereço(s) do site, separados por vírgula. Ex.: https://annysousa.dev
//   TEMPERATURE      (Text)    opcional, padrão 0.9
//   MAX_TOKENS       (Text)    opcional, padrão 1024

const PADROES = {
  gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    modelo: "gemini-3.6-flash"
  },
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    modelo: "gpt-5.6-luna"
  },
  anthropic: {
    url: "https://api.anthropic.com/v1/messages",
    modelo: "claude-haiku-5-5"
  }
};

const LIMITES = {
  promptMax: 6000,        // caracteres do prompt de sistema
  falaMax: 600,           // caracteres por mensagem
  mensagensMax: 24,       // mensagens no histórico (jogador + NPC)
  porMinutoPorIp: 20,     // pedidos por minuto por computador
  timeoutMs: 30000
};

// Contador simples por IP. Fica na memória de cada instância do Worker:
// não é perfeito, mas segura um script ou um aluno apertando Enviar sem parar.
const contador = new Map();

function limitar(ip) {
  const agora = Date.now();
  const janela = (contador.get(ip) || []).filter((t) => agora - t < 60000);
  if (janela.length >= LIMITES.porMinutoPorIp) return false;
  janela.push(agora);
  contador.set(ip, janela);
  if (contador.size > 5000) contador.clear();
  return true;
}

function cabecalhosCors(origem, env) {
  const permitidas = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const ok = permitidas.length === 0 || permitidas.includes(origem);
  return {
    ok,
    headers: {
      "Access-Control-Allow-Origin": ok && origem ? origem : (permitidas[0] || "*"),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    }
  };
}

function resposta(status, corpo, headers) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" }
  });
}

function validar(corpo) {
  if (!corpo || typeof corpo !== "object") return "Pedido inválido.";
  if (typeof corpo.system !== "string" || !corpo.system.trim()) return "Falta o prompt do NPC.";
  if (corpo.system.length > LIMITES.promptMax) return "O prompt passou de " + LIMITES.promptMax + " caracteres.";
  const msgs = corpo.messages;
  if (!Array.isArray(msgs) || msgs.length === 0) return "A conversa está vazia.";
  if (msgs.length > LIMITES.mensagensMax) return "A conversa ficou longa demais. Abram uma nova tentativa.";
  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") return "Mensagem inválida.";
    if (!m.content.trim()) return "Mensagem vazia.";
    if (m.content.length > LIMITES.falaMax) return "Uma das falas passou de " + LIMITES.falaMax + " caracteres.";
    const esperado = i % 2 === 0 ? "user" : "assistant";
    if (m.role !== esperado) return "A conversa precisa alternar jogador e NPC.";
  }
  if (msgs[msgs.length - 1].role !== "user") return "A última mensagem precisa ser do jogador.";
  return null;
}

async function chamarProvedor(env, system, messages, signal) {
  const provedor = (env.PROVIDER || "gemini").toLowerCase();
  const base = PADROES[provedor];
  if (!base) throw new Error("PROVIDER inválido no Worker: use gemini, anthropic ou openai.");
  const modelo = env.MODEL || base.modelo;
  const temperatura = Number(env.TEMPERATURE || 0.9);
  const maxTokens = Number(env.MAX_TOKENS || 1024);

  if (provedor === "anthropic") {
    const r = await fetch(base.url, {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": env.API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({ model: modelo, max_tokens: maxTokens, temperature: temperatura, system, messages })
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw erroDoProvedor(r.status, d);
    const texto = (d.content || []).filter((c) => c.type === "text").map((c) => c.text).join("").trim();
    return { texto, modelo };
  }

  // Gemini (endpoint compatível com OpenAI) e OpenAI usam o mesmo formato.
  const corpo = {
    model: modelo,
    temperature: temperatura,
    max_tokens: maxTokens,
    messages: [{ role: "system", content: system }].concat(messages)
  };
  if (provedor === "gemini") corpo.reasoning_effort = env.REASONING_EFFORT || "low";
  const r = await fetch(base.url, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + env.API_KEY },
    body: JSON.stringify(corpo)
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw erroDoProvedor(r.status, d);
  const texto = (((d.choices || [])[0] || {}).message || {}).content;
  return { texto: (typeof texto === "string" ? texto : "").trim(), modelo };
}

function erroDoProvedor(status, dados) {
  const e = new Error(
    status === 429
      ? "Muita gente falando com a IA ao mesmo tempo. Esperem uns segundos e tentem de novo."
      : status === 401 || status === 403
        ? "A chave da IA no Worker foi recusada. Avise a professora."
        : "A IA respondeu com erro " + status + "."
  );
  e.status = status === 429 ? 429 : 502;
  e.detalhe = dados && (dados.error || dados);
  return e;
}

export default {
  async fetch(request, env) {
    const origem = request.headers.get("Origin") || "";
    const cors = cabecalhosCors(origem, env);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors.headers });

    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") {
      return resposta(200, { ok: true, servico: "Quebre o NPC", provedor: env.PROVIDER || "gemini" }, cors.headers);
    }
    if (request.method !== "POST" || url.pathname !== "/chat") return resposta(404, { error: "Rota não encontrada." }, cors.headers);
    if (!cors.ok) return resposta(403, { error: "Este site não está autorizado a usar o Worker (ALLOWED_ORIGINS)." }, cors.headers);
    if (!env.API_KEY) return resposta(500, { error: "O Worker está sem API_KEY configurada." }, cors.headers);

    let corpo;
    try { corpo = await request.json(); } catch (e) { return resposta(400, { error: "Pedido inválido." }, cors.headers); }

    if (env.CLASS_CODE && String(corpo.code || "").trim() !== String(env.CLASS_CODE).trim()) {
      return resposta(401, { error: "Código da turma incorreto. Confiram o código no quadro." }, cors.headers);
    }

    const problema = validar(corpo);
    if (problema) return resposta(400, { error: problema }, cors.headers);

    const ip = request.headers.get("CF-Connecting-IP") || "sem-ip";
    if (!limitar(ip)) return resposta(429, { error: "Calma! Muitos pedidos deste computador em 1 minuto. Esperem um pouco." }, cors.headers);

    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), LIMITES.timeoutMs);
    const inicio = Date.now();
    try {
      const { texto, modelo } = await chamarProvedor(env, corpo.system, corpo.messages, controle.signal);
      if (!texto) return resposta(502, { error: "A IA devolveu uma resposta vazia. Tentem Regenerar." }, cors.headers);
      return resposta(200, { text: texto, model: modelo, ms: Date.now() - inicio }, cors.headers);
    } catch (e) {
      if (e.name === "AbortError") return resposta(504, { error: "A IA demorou demais para responder. Tentem de novo." }, cors.headers);
      console.log("erro do provedor", e.status, JSON.stringify(e.detalhe || e.message));
      return resposta(e.status || 502, { error: e.message || "Erro ao falar com a IA." }, cors.headers);
    } finally {
      clearTimeout(relogio);
    }
  }
};

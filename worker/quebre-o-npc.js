// Quebre o NPC · Worker do Cloudflare: o "intermediário" entre o site (annysousa.dev/quebre-o-npc/) e a IA.
// Publicação: cole este arquivo inteiro no editor do Worker pelo painel do Cloudflare (passo a passo no README).
// Ele guarda a chave da IA (como segredo), confere o código da turma e limita o uso.
//
// Variáveis (Settings > Variables and Secrets no painel do Cloudflare):
//   API_KEY          (Secret)  chave da IA principal (a do PROVIDER)
//   CLASS_CODE       (Secret)  código da turma que você escreve no quadro
//   PROVIDER         (Text)    IA principal: "gemini" (padrão), "anthropic" (Claude) ou "openai" (GPT)
//   MODEL            (Text)    opcional: modelo da IA principal; se vazio, usa o padrão do provedor
//
// Para oferecer mais de uma IA ao mesmo tempo (o site mostra um seletor), adicione as chaves extras:
//   GEMINI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY        (Secret)
//   GEMINI_MODEL,   ANTHROPIC_MODEL,   OPENAI_MODEL           (Text, opcionais)
//   GEMINI_MODELS,  ANTHROPIC_MODELS,  OPENAI_MODELS          (Text, opcionais) modelos que o seletor do site
//                    pode usar, separados por vírgula; o primeiro é o padrão. Ex.: claude-haiku-5-5,claude-sonnet-5-5
//                    Sem essa lista, vale só o *_MODEL (ou o padrão do provedor; para o Claude: Haiku, Sonnet e Opus 5.5).
//   OPENAI_REASONING_EFFORT  (Text, opcional) nível de raciocínio do GPT: "low" (padrão, = "Leve"), "medium"…
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
    modelo: "gpt-6.2-sol"
  },
  anthropic: {
    url: "https://api.anthropic.com/v1/messages",
    modelo: "claude-haiku-5-5",
    // Liberados por padrão no seletor do site (o primeiro é o padrão).
    modelos: ["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5"]
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

// Quais IAs estão configuradas: { gemini: {chave, modelo, modelos}, ... }, com a principal primeiro.
// "modelos" é a lista que o site pode escolher; "modelo" é o padrão (o primeiro da lista).
function provedoresDisponiveis(env) {
  const principal = (env.PROVIDER || "gemini").toLowerCase();
  const prefixo = { gemini: "GEMINI", anthropic: "ANTHROPIC", openai: "OPENAI" };
  const chaves = {};
  if (env.API_KEY && PADROES[principal]) chaves[principal] = env.API_KEY;
  Object.keys(prefixo).forEach((p) => { if (env[prefixo[p] + "_API_KEY"]) chaves[p] = env[prefixo[p] + "_API_KEY"]; });

  const lista = {};
  Object.keys(chaves).forEach((p) => {
    const listaEnv = String(env[prefixo[p] + "_MODELS"] || "").split(",").map((m) => m.trim()).filter(Boolean);
    const unico = env[prefixo[p] + "_MODEL"] || (p === principal ? env.MODEL : "");
    let modelos = listaEnv.length ? listaEnv : unico ? [unico] : (PADROES[p].modelos || [PADROES[p].modelo]);
    modelos = modelos.filter((m, i) => modelos.indexOf(m) === i);
    lista[p] = { chave: chaves[p], modelo: modelos[0], modelos };
  });
  return lista;
}

async function chamarProvedor(provedor, config, env, system, messages, signal) {
  const base = PADROES[provedor];
  const modelo = config.modelo;
  const temperatura = Number(env.TEMPERATURE || 0.9);
  const maxTokens = Number(env.MAX_TOKENS || 1024);

  if (provedor === "anthropic") {
    const r = await fetch(base.url, {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": config.chave,
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
    messages: [{ role: "system", content: system }].concat(messages)
  };
  if (provedor === "gemini") {
    corpo.temperature = temperatura;
    corpo.max_tokens = maxTokens;
    corpo.reasoning_effort = env.REASONING_EFFORT || "low";
  } else {
    // Modelos de raciocínio da OpenAI (como o GPT-6.2 Sol) usam max_completion_tokens,
    // não aceitam temperature e têm nível de raciocínio: "low" equivale ao "Leve" do ChatGPT.
    corpo.max_completion_tokens = maxTokens;
    corpo.reasoning_effort = env.OPENAI_REASONING_EFFORT || "low";
  }
  const r = await fetch(base.url, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + config.chave },
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
      const disp = provedoresDisponiveis(env);
      return resposta(200, {
        ok: true,
        servico: "Quebre o NPC",
        provedor: Object.keys(disp)[0] || null,
        provedores: Object.keys(disp).map((p) => ({ id: p, modelo: disp[p].modelo, modelos: disp[p].modelos }))
      }, cors.headers);
    }
    if (request.method !== "POST" || url.pathname !== "/chat") return resposta(404, { error: "Rota não encontrada." }, cors.headers);
    if (!cors.ok) return resposta(403, { error: "Este site não está autorizado a usar o Worker (ALLOWED_ORIGINS)." }, cors.headers);
    const disponiveis = provedoresDisponiveis(env);
    if (!Object.keys(disponiveis).length) return resposta(500, { error: "O Worker está sem nenhuma chave de IA configurada." }, cors.headers);

    let corpo;
    try { corpo = await request.json(); } catch (e) { return resposta(400, { error: "Pedido inválido." }, cors.headers); }

    if (env.CLASS_CODE && String(corpo.code || "").trim() !== String(env.CLASS_CODE).trim()) {
      return resposta(401, { error: "Código da turma incorreto. Confiram o código no quadro." }, cors.headers);
    }

    const provedor = corpo.provider ? String(corpo.provider).toLowerCase() : Object.keys(disponiveis)[0];
    if (!disponiveis[provedor]) return resposta(400, { error: "Essa IA não está configurada no Worker." }, cors.headers);
    const modeloPedido = corpo.model ? String(corpo.model).trim() : disponiveis[provedor].modelo;
    if (!disponiveis[provedor].modelos.includes(modeloPedido)) {
      return resposta(400, { error: "Esse modelo não está liberado no Worker." }, cors.headers);
    }

    const problema = validar(corpo);
    if (problema) return resposta(400, { error: problema }, cors.headers);

    const ip = request.headers.get("CF-Connecting-IP") || "sem-ip";
    if (!limitar(ip)) return resposta(429, { error: "Calma! Muitos pedidos deste computador em 1 minuto. Esperem um pouco." }, cors.headers);

    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), LIMITES.timeoutMs);
    const inicio = Date.now();
    try {
      const { texto, modelo } = await chamarProvedor(provedor, { chave: disponiveis[provedor].chave, modelo: modeloPedido }, env, corpo.system, corpo.messages, controle.signal);
      if (!texto) return resposta(502, { error: "A IA devolveu uma resposta vazia. Tentem Regenerar." }, cors.headers);
      return resposta(200, { text: texto, provider: provedor, model: modelo, ms: Date.now() - inicio }, cors.headers);
    } catch (e) {
      if (e.name === "AbortError") return resposta(504, { error: "A IA demorou demais para responder. Tentem de novo." }, cors.headers);
      console.log("erro do provedor", e.status, JSON.stringify(e.detalhe || e.message));
      return resposta(e.status || 502, { error: e.message || "Erro ao falar com a IA." }, cors.headers);
    } finally {
      clearTimeout(relogio);
    }
  }
};

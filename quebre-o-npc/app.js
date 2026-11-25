// Quebre o NPC — laboratório de QA para NPCs com IA.
// Sem frameworks: roda em computador simples. A chave da IA NÃO fica aqui:
// o site conversa com um Worker do Cloudflare (worker/quebre-o-npc.js), que guarda a chave.

(function () {
  "use strict";

  var CFG = window.CONFIG || {};
  var MAX_FALAS = CFG.MAX_FALAS_POR_TENTATIVA || 8;
  var NPCS = window.NPCS;
  var MISSOES = window.MISSOES;

  var $ = function (id) { return document.getElementById(id); };
  var NOMES_IA = { gemini: "Gemini", anthropic: "Claude", openai: "GPT" };

  var estado = {
    npcId: "barto",
    missaoId: 1,
    prompts: {},          // prompt atual de cada NPC (pode estar editado)
    tentativa: 1,
    historico: [],        // [{role: "user"|"assistant", content}]
    enviando: false,
    provedores: [],       // IAs configuradas no Worker: [{id, modelo}]
    provedor: null,       // IA escolhida (null = a principal do Worker)
    modelo: null,         // modelo escolhido no seletor (null = o padrão do Worker)
    ultimoModelo: ""      // modelo que respondeu por último
  };

  // ---------- armazenamento (pode falhar em alguns navegadores: tudo em try/catch) ----------
  function lerFicha() {
    try { return JSON.parse(localStorage.getItem("qnpc_ficha") || "[]"); } catch (e) { return memoriaFicha; }
  }
  var memoriaFicha = [];
  function gravarFicha(lista) {
    memoriaFicha = lista;
    try { localStorage.setItem("qnpc_ficha", JSON.stringify(lista)); } catch (e) { /* fica só na memória */ }
  }
  function lerCodigo() {
    try { return sessionStorage.getItem("qnpc_codigo") || ""; } catch (e) { return ""; }
  }
  function gravarCodigo(v) {
    try { sessionStorage.setItem("qnpc_codigo", v); } catch (e) { /* ignora */ }
  }

  // ---------- helpers ----------
  function npc() { return NPCS[estado.npcId]; }
  function missao() {
    for (var i = 0; i < MISSOES.length; i++) if (MISSOES[i].id === estado.missaoId) return MISSOES[i];
    return MISSOES[0];
  }
  function promptAtual() { return estado.prompts[estado.npcId]; }
  function promptEditado() { return promptAtual() !== npc().prompt; }
  function nomeIA() {
    var id = estado.provedor || (estado.provedores[0] && estado.provedores[0].id);
    return id ? (NOMES_IA[id] || id) : "IA";
  }
  function falasDoJogador() {
    var n = 0;
    estado.historico.forEach(function (m) { if (m.role === "user") n++; });
    return n;
  }
  function segundos(ms) { return (ms / 1000).toFixed(1).replace(".", ",") + " s"; }
  function setStatus(t) { $("status").textContent = t || ""; }

  // ---------- render ----------
  function renderNpcs() {
    var box = $("lista-npcs");
    box.innerHTML = "";
    Object.keys(NPCS).forEach(function (id) {
      var n = NPCS[id];
      var b = document.createElement("button");
      b.type = "button";
      b.className = "npc-op";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(id === estado.npcId));
      var nome = document.createElement("b"); nome.textContent = n.nome;
      var papel = document.createElement("span"); papel.textContent = n.papel;
      b.appendChild(nome); b.appendChild(papel);
      b.addEventListener("click", function () { trocarNpc(id); });
      box.appendChild(b);
    });
  }

  function renderMissoes() {
    var sel = $("missao");
    sel.innerHTML = "";
    MISSOES.forEach(function (m) {
      var o = document.createElement("option");
      o.value = String(m.id);
      o.textContent = m.id + " · " + m.nome + " (" + m.tipo + ")";
      sel.appendChild(o);
    });
    sel.value = String(estado.missaoId);
  }

  function renderMissaoCard() {
    var m = missao();
    var card = $("missao-card");
    card.innerHTML = "";
    var linhas = [
      ["tipo", m.tipo],
      ["", "Objetivo: " + m.objetivo.replace("{segredo}", npc().segredo)],
      ["", "Para começar: " + m.dica],
      ["", "Nota 1 (aguentou) quando: " + m.aguentou]
    ];
    linhas.forEach(function (l) {
      var p = document.createElement("p");
      if (l[0]) p.className = l[0];
      p.textContent = l[1];
      card.appendChild(p);
    });
  }

  function renderCabecalho() {
    var n = npc();
    $("nome-npc").textContent = n.nome;
    $("avatar").textContent = n.inicial;
    $("avatar").style.background = n.cor;
    $("meta-tentativa").textContent =
      "Tentativa " + estado.tentativa + " · " + falasDoJogador() + " de " + MAX_FALAS + " falas" +
      (estado.modelo ? " · " + nomeIA() + " (" + estado.modelo + ")" : "") +
      (promptEditado() ? " · prompt editado" : "");
    $("tag-editado").hidden = !promptEditado();
  }

  function addMsg(classe, quem, texto, extra) {
    var div = document.createElement("div");
    div.className = "msg " + classe;
    var q = document.createElement("span"); q.className = "quem"; q.textContent = quem;
    div.appendChild(q);
    div.appendChild(document.createTextNode(texto));
    if (extra) {
      var t = document.createElement("span"); t.className = "tempo"; t.textContent = extra;
      div.appendChild(t);
    }
    $("conversa").appendChild(div);
    $("conversa").scrollTop = $("conversa").scrollHeight;
    return div;
  }

  function renderConversa() {
    $("conversa").innerHTML = "";
    addMsg("npc abertura", npc().nome, npc().abertura, "fala de abertura (não vai para a IA)");
    estado.historico.forEach(function (m) {
      if (m.role === "user") addMsg("jogador", "Vocês", m.content);
      else addMsg("npc", npc().nome, m.content, m.tempo ? "respondeu em " + segundos(m.tempo) : "");
    });
  }

  function renderControles() {
    var cheio = falasDoJogador() >= MAX_FALAS;
    $("enviar").disabled = estado.enviando || cheio;
    $("entrada").disabled = estado.enviando || cheio;
    var ultima = estado.historico[estado.historico.length - 1];
    $("regenerar").disabled = estado.enviando || !ultima || ultima.role !== "assistant";
    $("nova").disabled = estado.enviando;
    if (cheio && !estado.enviando) setStatus("Limite de falas desta tentativa. Deem a nota e abram uma nova.");
  }

  function renderTudo() {
    renderNpcs();
    renderMissaoCard();
    renderCabecalho();
    renderConversa();
    renderControles();
  }

  // ---------- ações ----------
  function novaTentativa() {
    if (estado.enviando) return;
    estado.tentativa++;
    estado.historico = [];
    setStatus("");
    renderTudo();
    $("entrada").focus();
  }

  function trocarNpc(id) {
    if (estado.enviando || id === estado.npcId) return;
    estado.npcId = id;
    $("prompt").value = promptAtual();
    estado.historico = [];
    estado.tentativa++;
    setStatus("");
    renderTudo();
  }

  function chamarIA() {
    var codigo = $("codigo-turma").value.trim();
    var inicio = Date.now();
    return fetch(CFG.WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: codigo,
        provider: estado.provedor || undefined,
        model: estado.modelo || undefined,
        system: promptAtual(),
        messages: estado.historico.map(function (m) { return { role: m.role, content: m.content }; })
      })
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (dados) {
        if (!res.ok || !dados.text) {
          throw new Error(dados.error || ("O servidor respondeu com erro " + res.status + "."));
        }
        if (dados.model) estado.ultimoModelo = dados.model;
        return { texto: dados.text, tempo: Date.now() - inicio };
      });
    });
  }

  function responder() {
    estado.enviando = true;
    renderControles();
    setStatus("");
    var pensando = addMsg("npc pensando", npc().nome, "pensando…");
    var npcDaVez = estado.npcId;
    return chamarIA().then(function (r) {
      if (npcDaVez !== estado.npcId) return;
      estado.historico.push({ role: "assistant", content: r.texto, tempo: r.tempo });
    }).catch(function (e) {
      // A fala do jogador fica no histórico só se houve resposta; senão, devolve para o campo.
      var ultima = estado.historico[estado.historico.length - 1];
      if (ultima && ultima.role === "user") {
        estado.historico.pop();
        if (!$("entrada").value) $("entrada").value = ultima.content;
      }
      renderConversa();
      addMsg("erro", "Erro", (e && e.message) ? e.message : "Não foi possível falar com a IA.");
      pensando = null;
    }).then(function () {
      estado.enviando = false;
      if (pensando) renderConversa();
      renderCabecalho();
      renderControles();
    });
  }

  function enviar(texto) {
    texto = (texto || "").trim();
    if (!texto || estado.enviando) return;
    if (!$("codigo-turma").value.trim()) {
      setStatus("Digitem o código da turma lá em cima antes de começar.");
      $("codigo-turma").focus();
      return;
    }
    if (falasDoJogador() >= MAX_FALAS) return;
    estado.historico.push({ role: "user", content: texto });
    $("entrada").value = "";
    renderConversa();
    renderCabecalho();
    responder();
  }

  function regenerar() {
    if (estado.enviando) return;
    var ultima = estado.historico[estado.historico.length - 1];
    if (!ultima || ultima.role !== "assistant") return;
    estado.historico.pop();
    renderConversa();
    responder();
  }

  function textoDaConversa() {
    var linhas = [
      "NPC: " + npc().nome + " · IA: " + nomeIA() + (estado.ultimoModelo ? " (" + estado.ultimoModelo + ")" : "") + " · Missão " + missao().id + " (" + missao().nome + ") · Tentativa " + estado.tentativa +
      " · Prompt " + (promptEditado() ? "editado" : "original")
    ];
    estado.historico.forEach(function (m) {
      linhas.push((m.role === "user" ? "[Jogador]: " : "[" + npc().nome + "]: ") + m.content);
    });
    return linhas.join("\n");
  }

  function copiar(texto, msgOk) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = texto; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); setStatus(msgOk); } catch (e) { setStatus("Não deu para copiar: selecione e copie à mão."); }
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(function () { setStatus(msgOk); }, fallback);
    } else fallback();
  }

  // ---------- ficha ----------
  function salvarNota() {
    var marcada = document.querySelector('input[name="nota"]:checked');
    if (!marcada) { setStatus("Escolham a nota (1, 0,5 ou 0) antes de salvar."); return; }
    if (falasDoJogador() === 0) { setStatus("Conversem com o NPC antes de dar a nota."); return; }
    var ficha = lerFicha();
    ficha.push({
      n: ficha.length + 1,
      npc: npc().nome,
      ia: nomeIA() + (estado.ultimoModelo ? " (" + estado.ultimoModelo + ")" : ""),
      missao: missao().id + " · " + missao().nome,
      nota: Number(marcada.value),
      frase: $("frase").value.trim(),
      prompt: promptEditado() ? "editado" : "original",
      falas: falasDoJogador(),
      conversa: textoDaConversa(),
      hora: new Date().toLocaleTimeString("pt-BR")
    });
    gravarFicha(ficha);
    marcada.checked = false;
    $("frase").value = "";
    renderFicha();
    novaTentativa();
    setStatus("Nota salva. Nova tentativa aberta.");
  }

  function notaTexto(v) { return v === 1 ? "1" : v === 0.5 ? "0,5" : "0"; }

  function renderFicha() {
    var ficha = lerFicha();
    var corpo = $("tabela").querySelector("tbody");
    corpo.innerHTML = "";
    ficha.forEach(function (r) {
      var tr = document.createElement("tr");
      [r.n, r.npc, r.ia || "—", r.missao, notaTexto(r.nota), r.frase || "—", r.prompt].forEach(function (v) {
        var td = document.createElement("td"); td.textContent = String(v); tr.appendChild(td);
      });
      corpo.appendChild(tr);
    });

    // Resumo: por NPC + missão, quantas tentativas e quantas quebraram (nota 0).
    var grupos = {};
    ficha.forEach(function (r) {
      var k = r.npc + (r.ia ? " · " + r.ia.split(" (")[0] : "") + " · missão " + r.missao;
      if (!grupos[k]) grupos[k] = { total: 0, quebrou: 0, vacilou: 0 };
      grupos[k].total++;
      if (r.nota === 0) grupos[k].quebrou++;
      if (r.nota === 0.5) grupos[k].vacilou++;
    });
    var box = $("resumo");
    box.innerHTML = "";
    var chaves = Object.keys(grupos);
    if (!chaves.length) {
      var vazio = document.createElement("p"); vazio.className = "ajuda";
      vazio.textContent = "Nenhuma tentativa avaliada ainda.";
      box.appendChild(vazio);
      return;
    }
    chaves.forEach(function (k) {
      var g = grupos[k];
      var d = document.createElement("div");
      d.textContent = k + ": quebrou em " + g.quebrou + " de " + g.total + " tentativas" +
        (g.vacilou ? " (vacilou em " + g.vacilou + ")" : "");
      box.appendChild(d);
    });
  }

  function fichaComoTexto() {
    var ficha = lerFicha();
    var linhas = ["Ficha — Quebre o NPC"];
    $("resumo").querySelectorAll("div").forEach(function (d) { linhas.push(d.textContent); });
    linhas.push("");
    ficha.forEach(function (r) {
      linhas.push("#" + r.n + " · " + r.npc + (r.ia ? " · " + r.ia : "") + " · " + r.missao + " · nota " + notaTexto(r.nota) +
        " · prompt " + r.prompt + (r.frase ? " · frase: " + r.frase : ""));
    });
    return linhas.join("\n");
  }

  function baixarCsv() {
    var ficha = lerFicha();
    var esc = function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; };
    var linhas = [["n", "hora", "npc", "ia", "missao", "nota", "frase", "prompt", "falas", "conversa"].join(";")];
    ficha.forEach(function (r) {
      linhas.push([r.n, r.hora, r.npc, r.ia, r.missao, notaTexto(r.nota), r.frase, r.prompt, r.falas, r.conversa].map(esc).join(";"));
    });
    var blob = new Blob(["﻿" + linhas.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ficha-quebre-o-npc.csv";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 0);
  }

  // Pergunta ao Worker quais IAs e modelos estão liberados e monta o seletor "IA e modelo".
  function carregarProvedores() {
    var base = String(CFG.WORKER_URL || "").replace(/\/chat\/?$/, "/");
    if (!base || base.indexOf("SEU-WORKER") !== -1) return;
    fetch(base).then(function (r) { return r.json(); }).then(function (d) {
      var lista = (d && d.provedores) || [];
      var aviso = "";
      // Worker em versão antiga: só informa a IA principal ("provedor"), sem a lista de modelos.
      // O seletor aparece mesmo assim, com essa única IA, e avisa por que não há outras opções.
      if (!lista.length && d && d.provedor) {
        lista = [{ id: d.provedor, modelo: null, modelos: [] }];
        aviso = "O Worker ainda não informa outras IAs: só a IA principal está disponível.";
      }
      estado.provedores = lista;
      if (!lista.length) return;
      var sel = $("ia");
      sel.innerHTML = "";
      lista.forEach(function (p) {
        var grupo = document.createElement("optgroup");
        grupo.label = NOMES_IA[p.id] || p.id;
        (p.modelos && p.modelos.length ? p.modelos : [p.modelo || ""]).forEach(function (m) {
          var o = document.createElement("option");
          o.value = p.id + "|" + m;
          o.textContent = (NOMES_IA[p.id] || p.id) + " · " + (m || "modelo padrão do Worker");
          grupo.appendChild(o);
        });
        sel.appendChild(grupo);
      });
      estado.provedor = lista[0].id;
      estado.modelo = lista[0].modelo || null;
      sel.value = estado.provedor + "|" + (estado.modelo || "");
      $("bloco-ia").hidden = false;
      $("aviso-ia").textContent = aviso;
      $("aviso-ia").hidden = !aviso;
      renderCabecalho();
    }).catch(function () {
      $("bloco-ia").hidden = false;
      $("ia").innerHTML = "<option>Sem conexão com o Worker</option>";
      $("ia").disabled = true;
      $("aviso-ia").textContent = "Não consegui perguntar ao Worker quais IAs estão liberadas. Confira o endereço em config.js e a internet.";
      $("aviso-ia").hidden = false;
    });
  }

  // ---------- início ----------
  function init() {
    Object.keys(NPCS).forEach(function (id) { estado.prompts[id] = NPCS[id].prompt; });
    $("codigo-turma").value = lerCodigo();
    $("codigo-turma").addEventListener("input", function () { gravarCodigo($("codigo-turma").value.trim()); });

    renderMissoes();
    $("prompt").value = promptAtual();

    $("ia").addEventListener("change", function () {
      if (estado.enviando) { $("ia").value = estado.provedor + "|" + (estado.modelo || ""); return; }
      var partes = $("ia").value.split("|");
      estado.provedor = partes[0];
      estado.modelo = partes.slice(1).join("|") || null;
      estado.ultimoModelo = "";
      if (estado.historico.length) novaTentativa(); else renderCabecalho();
    });
    $("missao").addEventListener("change", function () {
      estado.missaoId = Number($("missao").value);
      renderMissaoCard();
    });
    $("prompt").addEventListener("input", function () {
      estado.prompts[estado.npcId] = $("prompt").value;
      renderCabecalho();
    });
    $("restaurar").addEventListener("click", function () {
      estado.prompts[estado.npcId] = npc().prompt;
      $("prompt").value = npc().prompt;
      renderCabecalho();
      setStatus("Prompt original restaurado.");
    });

    $("form").addEventListener("submit", function (e) { e.preventDefault(); enviar($("entrada").value); });
    $("entrada").addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar($("entrada").value); }
    });
    $("nova").addEventListener("click", novaTentativa);
    $("regenerar").addEventListener("click", regenerar);
    $("copiar-conversa").addEventListener("click", function () { copiar(textoDaConversa(), "Conversa copiada."); });

    $("salvar").addEventListener("click", salvarNota);
    $("copiar-ficha").addEventListener("click", function () { copiar(fichaComoTexto(), "Ficha copiada."); });
    $("baixar-csv").addEventListener("click", baixarCsv);
    $("limpar-ficha").addEventListener("click", function () {
      if (confirm("Apagar todas as notas desta ficha? Isso não pode ser desfeito.")) { gravarFicha([]); renderFicha(); }
    });

    if (!CFG.WORKER_URL || CFG.WORKER_URL.indexOf("SEU-WORKER") !== -1) {
      setStatus("Atenção: configure o endereço do Worker em config.js.");
    }

    renderTudo();
    renderFicha();
    carregarProvedores();
  }

  init();
})();

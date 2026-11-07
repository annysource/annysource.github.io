/*
 * QA Game HUB — caça aos bugs.
 * Cena 3D (Three.js) com a joaninha, bug reports, insígnias e "saúde da build".
 * Todo o conteúdo da página continua em HTML; o jogo é uma camada extra.
 * Sem JavaScript, sem WebGL ou com "modo clássico", a página mostra a joaninha estática.
 */
(() => {
  const root = document.querySelector('[data-qa-hunt]');
  if (!root) return;

  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const STORAGE_KEY = 'qahub-quest-v1';
  const WHATSAPP_BASE = (root.dataset.whatsapp || 'https://wa.me/5521988503103').split('?')[0];

  const SEVERITY_COLOR = { Baixa: '#B3C88C', Média: '#E9C46A', Alta: '#E8956B', Crítica: '#D9534F' };

  // Bugs fictícios inspirados em casos de conformidade (loja x build, Steam, ECA Digital).
  const BUGS = [
    {
      id: 'cloud', title: 'Save perdido em conflito de Steam Cloud', area: 'Loja x build', severity: 'Alta',
      criterion: 'A página da loja anuncia Steam Cloud.',
      steps: ['Jogue até a fase 3 no PC A e feche o jogo.', 'Desligue a internet do PC B e jogue a fase 1.', 'Reconecte o PC B e escolha manter o save da nuvem.'],
      expected: 'O jogo carrega o progresso da fase 3.',
      actual: 'O jogo carrega a fase 1 e o save da fase 3 é sobrescrito.',
      evidence: 'Vídeo dos dois PCs, conta de teste e versão da build.'
    },
    {
      id: 'conquista', title: 'Conquista desbloqueada sem cumprir o objetivo', area: 'Conquistas', severity: 'Média',
      criterion: 'A conquista deve refletir o estado real do jogo.',
      steps: ['Comece uma cidade nova.', 'Construa o primeiro parque.', 'Desfaça a construção antes do fim do turno.'],
      expected: 'A conquista "Cidade verde" continua bloqueada.',
      actual: 'A conquista é desbloqueada e não pode ser revertida.',
      evidence: 'Captura da notificação da Steam e do estado da cidade.'
    },
    {
      id: 'idioma', title: 'Tutorial sem tradução em idioma anunciado', area: 'Localização', severity: 'Média',
      criterion: 'A loja anuncia oito idiomas com interface completa.',
      steps: ['Selecione Português (Brasil) no menu.', 'Inicie o tutorial.', 'Avance até a terceira dica.'],
      expected: 'Todas as dicas aparecem em português.',
      actual: 'Da terceira dica em diante, o texto aparece em inglês.',
      evidence: 'Capturas de cada dica, com idioma e versão da build.'
    },
    {
      id: 'lootbox', title: 'Loot box acessível com perfil de menor de idade', area: 'ECA Digital', severity: 'Crítica',
      criterion: 'ECA Digital, art. 20, e Decreto 12.880/2026, art. 23.',
      steps: ['Crie um perfil informando 15 anos.', 'Abra a loja do jogo.', 'Acesse o atalho "Baús" pela tela de recompensas.'],
      expected: 'A funcionalidade fica indisponível para o perfil.',
      actual: 'A loja bloqueia os baús, mas o atalho da tela de recompensas abre a compra.',
      evidence: 'Vídeo do fluxo, configuração do perfil e registro da requisição.'
    },
    {
      id: 'chat', title: 'Chat online liberado por padrão com idade desconhecida', area: 'Interação online', severity: 'Alta',
      criterion: 'ECA Digital, art. 21: interação limitada por padrão.',
      steps: ['Instale o jogo e pule a etapa de idade.', 'Entre em uma partida online.', 'Abra o chat de voz e de texto.'],
      expected: 'O chat começa desativado até a autorização.',
      actual: 'O chat de voz e o de texto já começam ativos.',
      evidence: 'Captura das configurações padrão e do tráfego da sessão.'
    }
  ];

  const QUEST_SECTIONS = [...document.querySelectorAll('[data-quest]')].map(el => el.dataset.quest);

  // ---------- estado ----------
  const state = { bugs: [], visited: [], classic: false };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved) Object.assign(state, { bugs: saved.bugs || [], visited: saved.visited || [], classic: !!saved.classic });
  } catch { /* armazenamento indisponível: o jogo segue sem salvar */ }
  const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignora */ } };

  const health = () => Math.round(((state.bugs.length + state.visited.length) / (BUGS.length + QUEST_SECTIONS.length)) * 100);
  const badges = () => {
    const has = id => state.visited.includes(id);
    return [
      { id: 'primeira', title: 'Primeira captura', hint: 'Capture um bug na cena do topo.', ok: state.bugs.length >= 1 },
      { id: 'caca', title: 'Caça completa', hint: `Capture os ${BUGS.length} bugs.`, ok: state.bugs.length >= BUGS.length },
      { id: 'estrategia', title: 'Estratégia', hint: 'Conheça as formas de trabalho.', ok: has('servicos') },
      { id: 'hall', title: 'Hall de cases', hint: 'Visite os jogos testados.', ok: has('cases') },
      { id: 'fluxo', title: 'Fluxo de validação', hint: 'Encontre o material gratuito.', ok: has('ebook') },
      { id: 'lancamento', title: 'Pronto para o lançamento', hint: 'Deixe a build com 100% de saúde.', ok: health() >= 100 }
    ];
  };

  const el = (tag, attrs = {}, html = '') => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    if (html) node.innerHTML = html;
    return node;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- anúncios (aria-live + aviso visual) ----------
  const live = el('div', { class: 'qa-sr-only', role: 'status', 'aria-live': 'polite' });
  const toast = el('div', { class: 'qa-quest-toast', 'aria-hidden': 'true', hidden: '' });
  document.body.append(live, toast);
  let toastTimer;
  const announce = text => {
    live.textContent = text;
    toast.textContent = '🏅 ' + text;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; live.textContent = ''; }, 4500);
  };
  let unlockedBefore = badges().filter(b => b.ok).map(b => b.id);

  // ---------- bug report (dialog nativo: foco preso e Esc fecha) ----------
  const dialog = el('dialog', { class: 'qa-bug-dialog', 'aria-labelledby': 'qa-bug-title' });
  document.body.append(dialog);
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

  function openReport(id) {
    const bug = BUGS.find(b => b.id === id);
    if (!bug) return;
    const remaining = BUGS.length - state.bugs.length;
    const wa = WHATSAPP_BASE + '?text=' + encodeURIComponent(`Olá! Capturei o bug "${bug.title}" no site do QA Game HUB e quero relatórios assim para o meu jogo.`);
    dialog.innerHTML = `
      <article>
        <header>
          <p class="eyebrow">Bug report · ${esc(bug.area)}</p>
          <button type="button" class="qa-bug-close" data-close aria-label="Fechar bug report">×</button>
        </header>
        <h2 id="qa-bug-title">${esc(bug.title)}</h2>
        <p class="qa-bug-severity"><i style="background:${SEVERITY_COLOR[bug.severity]}" aria-hidden="true"></i> Severidade: <strong>${esc(bug.severity)}</strong></p>
        <p class="qa-bug-criterion"><strong>Critério:</strong> ${esc(bug.criterion)}</p>
        <h3>Passos para reproduzir</h3>
        <ol>${bug.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
        <dl>
          <div><dt>Resultado esperado</dt><dd>${esc(bug.expected)}</dd></div>
          <div><dt>Resultado obtido</dt><dd>${esc(bug.actual)}</dd></div>
        </dl>
        <p class="qa-bug-evidence"><strong>Evidência:</strong> ${esc(bug.evidence)}</p>
        <p class="qa-bug-note">Regra, comportamento e evidência: é assim que cada defeito do seu jogo chega para a equipe, pronto para priorizar.</p>
        <div class="qa-bug-actions">
          <a class="button" href="${wa}" target="_blank" rel="noopener noreferrer">Quero isso no meu jogo ↗<span class="qa-sr-only"> (abre o WhatsApp em nova aba)</span></a>
          <button type="button" class="qa-link-button" data-close>${remaining > 0 ? `Continuar caçando (${remaining} restantes)` : 'Voltar ao site'}</button>
        </div>
      </article>`;
    dialog.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => dialog.close()));
    if (!dialog.open) dialog.showModal();
  }

  // ---------- HUD: saúde da build + insígnias ----------
  const hud = el('aside', { class: 'qa-quest-hud', 'aria-label': 'Progresso da exploração' });
  document.body.append(hud);
  let hudOpen = false;

  function renderHud() {
    if (state.classic) {
      hud.innerHTML = `<button type="button" class="qa-quest-summary qa-quest-mode" data-mode="game">🎮 Ativar modo jogo</button>`;
      return;
    }
    const h = health();
    const list = badges();
    const done = list.filter(b => b.ok).length;
    hud.innerHTML = `
      ${hudOpen ? `
      <div class="qa-quest-panel" id="qa-quest-panel">
        <div class="qa-quest-head">
          <p><strong>Insígnias</strong><span>Explore a página e capture bugs para estabilizar a build.</span></p>
          <button type="button" data-toggle aria-label="Fechar insígnias">×</button>
        </div>
        <ul>${list.map(b => `<li class="${b.ok ? 'is-unlocked' : ''}"><span aria-hidden="true">${b.ok ? '🏅' : '🔒'}</span><span><strong>${esc(b.title)}</strong><small>${b.ok ? 'Desbloqueada' : esc(b.hint)}</small></span></li>`).join('')}</ul>
        ${h >= 100 ? `<a class="button" href="${esc(root.dataset.whatsapp || WHATSAPP_BASE)}" target="_blank" rel="noopener noreferrer">Build estável! Agora, o seu jogo ↗</a>` : ''}
        <div class="qa-quest-foot">
          <button type="button" data-mode="classic">Modo clássico (sem jogo)</button>
          <button type="button" data-reset>↺ Recomeçar</button>
        </div>
      </div>` : ''}
      <button type="button" class="qa-quest-summary" data-toggle aria-expanded="${hudOpen}" aria-controls="qa-quest-panel">
        <span class="qa-quest-label">Saúde da build</span>
        <span class="qa-quest-bar" role="progressbar" aria-label="Saúde da build" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${h}"><span style="width:${h}%"></span></span>
        <strong>${h}%</strong>
        <span class="qa-quest-count">🏅 ${done}/${list.length}</span>
      </button>`;
  }

  hud.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.hasAttribute('data-toggle')) { hudOpen = !hudOpen; renderHud(); hud.querySelector('[data-toggle]')?.focus(); }
    if (t.dataset.mode === 'classic') { state.classic = true; hudOpen = false; save(); applyMode(); }
    if (t.dataset.mode === 'game') { state.classic = false; save(); applyMode(); }
    if (t.hasAttribute('data-reset')) { state.bugs = []; state.visited = []; unlockedBefore = []; save(); scene?.setCaptured([]); update(); }
  });

  // ---------- painel da caça (botões acessíveis) ----------
  const panel = root.querySelector('.qa-hunt-panel');
  const title = root.querySelector('.qa-hunt-title');
  const help = root.querySelector('.qa-hunt-help');
  const buttons = [...root.querySelectorAll('[data-bug]')];
  buttons.forEach((btn, i) => btn.addEventListener('click', () => capture(btn.dataset.bug)));

  function renderPanel() {
    const found = state.bugs.length;
    title.textContent = found === BUGS.length ? 'Todos os bugs capturados!' : `Caça aos bugs · ${found}/${BUGS.length}`;
    buttons.forEach((btn, i) => {
      const bug = BUGS.find(b => b.id === btn.dataset.bug);
      const done = state.bugs.includes(btn.dataset.bug);
      btn.classList.toggle('is-done', done);
      btn.textContent = done ? '✓' : `#${i + 1}`;
      btn.setAttribute('aria-label', done ? `Ver bug report: ${bug.title}` : `Capturar bug escondido ${i + 1}`);
    });
  }

  function capture(id) {
    if (!state.bugs.includes(id)) { state.bugs.push(id); save(); scene?.setCaptured(state.bugs); update(); }
    openReport(id);
  }

  function update() {
    renderPanel();
    renderHud();
    const now = badges().filter(b => b.ok).map(b => b.id);
    const fresh = badges().find(b => b.ok && !unlockedBefore.includes(b.id));
    unlockedBefore = now;
    if (fresh && !state.classic) announce(`Insígnia desbloqueada: ${fresh.title}`);
  }

  // ---------- seções exploradas ----------
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const id = entry.target.dataset.quest;
        if (entry.isIntersecting && !state.visited.includes(id)) { state.visited.push(id); save(); update(); }
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('[data-quest]').forEach(s => io.observe(s));
  }

  // ---------- cena 3D ----------
  let scene = null;
  const canvas = root.querySelector('canvas');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsWebGL = (() => {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
  })();
  const lowEnd = (navigator.deviceMemory || 8) < 4;
  let threePromise = null;
  const loadThree = () => threePromise || (threePromise = new Promise((resolve, reject) => {
    if (window.THREE) return resolve(window.THREE);
    const s = el('script', { src: THREE_URL, async: '' });
    s.onload = () => resolve(window.THREE);
    s.onerror = reject;
    document.head.append(s);
  }));

  function applyMode() {
    const game = !state.classic;
    root.classList.toggle('is-game', game);
    panel.hidden = !game;
    const use3D = game && supportsWebGL && !lowEnd;
    help.textContent = use3D ? 'Toque ou clique nos bugs da cena, ou use os botões abaixo.' : 'Use os botões para capturar os bugs desta build.';
    if (use3D && !scene) {
      loadThree().then(THREE => {
        if (state.classic || scene) return;
        scene = createScene(THREE, canvas);
        root.classList.add('is-3d');
      }).catch(() => root.classList.remove('is-3d'));
    } else if (!use3D && scene) {
      scene.dispose(); scene = null; root.classList.remove('is-3d');
    }
    update();
  }

  function createScene(THREE, canvas) {
    const INK = 0x141414, CREAM = 0xfbf7ef, LILAC = 0xb79be0, SAGE = 0xb3c88c, HALF = 3;
    const mat = c => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.85 });
    const outlined = mesh => { mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 30), new THREE.LineBasicMaterial({ color: INK }))); return mesh; };

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scn = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 100);
    camera.position.set(9, 9, 9);
    camera.lookAt(0, 0.3, 0);
    scn.add(new THREE.HemisphereLight(0xfffaf0, 0xc9b5e4, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 0.4);
    sun.position.set(4, 10, 6);
    scn.add(sun);

    // fase
    const tile = new THREE.BoxGeometry(1, 0.3, 1);
    for (let x = -HALF; x < HALF; x++) for (let z = -HALF; z < HALF; z++) {
      const m = outlined(new THREE.Mesh(tile, mat((x + z) % 2 === 0 ? CREAM : 0xefe6d6)));
      m.position.set(x + 0.5, -0.15, z + 0.5);
      scn.add(m);
    }
    [[-2.4, 0.4, -2.4, 0.8, LILAC], [-2.4, 1.0, -2.4, 0.45, SAGE], [2.3, 0.3, -2.5, 0.6, SAGE], [2.5, 0.25, 2.3, 0.5, LILAC]].forEach(([x, y, z, s, c]) => {
      const m = outlined(new THREE.Mesh(new THREE.BoxGeometry(s, s, s), mat(c)));
      m.position.set(x, y, z);
      scn.add(m);
    });
    const screen = outlined(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.08), mat(INK)));
    screen.position.set(-0.6, 1.1, -2.9);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), new THREE.MeshBasicMaterial({ color: LILAC }));
    glow.position.z = 0.045;
    screen.add(glow);
    scn.add(screen);

    // joaninha
    const lady = new THREE.Group();
    const body = outlined(new THREE.Mesh(new THREE.SphereGeometry(0.62, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(CREAM)));
    body.scale.set(1, 0.85, 1.12);
    lady.add(body);
    const belly = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.06, 14), mat(INK));
    belly.scale.z = 1.12;
    lady.add(belly);
    const spot = (theta, phi, r, c) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), mat(c));
      s.position.setFromSphericalCoords(0.6, phi, theta);
      s.position.y *= 0.85; s.position.z *= 1.12; s.scale.y = 0.35;
      s.lookAt(0, 0, 0);
      lady.add(s);
    };
    spot(0.6, 0.7, 0.13, SAGE); spot(2.4, 0.8, 0.12, INK); spot(-0.7, 0.9, 0.1, INK); spot(-2.3, 0.6, 0.09, INK); spot(3.0, 1.15, 0.08, INK);
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 1.3), mat(INK));
    seam.position.y = 0.53;
    lady.add(seam);
    const head = new THREE.Group();
    head.position.set(0, 0.18, 0.72);
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), mat(INK)));
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 6, 16, Math.PI), mat(LILAC));
    band.rotation.y = Math.PI / 2;
    head.add(band);
    [-1, 1].forEach(side => {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12), mat(side < 0 ? SAGE : LILAC));
      cup.rotation.z = Math.PI / 2; cup.position.x = side * 0.33; head.add(cup);
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 5), mat(INK));
      ant.position.set(side * 0.14, 0.38, 0.1); ant.rotation.z = -side * 0.5; head.add(ant);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(INK));
      tip.position.set(side * 0.26, 0.58, 0.1); head.add(tip);
    });
    lady.add(head);
    lady.scale.setScalar(1.35);
    lady.position.set(0, 0, 0.5);
    scn.add(lady);

    // bugs
    const randomPoint = () => new THREE.Vector3((Math.random() * 2 - 1) * (HALF - 0.6), 0, (Math.random() * 2 - 1) * (HALF - 0.6));
    const hits = [];
    const bugs = BUGS.map((b, i) => {
      const color = SEVERITY_COLOR[b.severity];
      const g = new THREE.Group();
      const bodyB = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), mat(INK));
      bodyB.scale.set(1, 0.7, 1.3); bodyB.position.y = 0.16; g.add(bodyB);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshBasicMaterial({ color }));
      eye.position.set(0, 0.22, 0.18); g.add(eye);
      for (let k = 0; k < 3; k++) [-1, 1].forEach(side => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.025, 0.025), mat(INK));
        leg.position.set(side * 0.17, 0.08, (k - 1) * 0.11); leg.rotation.z = side * -0.4; g.add(leg);
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.36, 20), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; g.add(ring);
      const hit = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 4), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = 0.2; hit.userData.bugId = b.id; g.add(hit); hits.push(hit);
      const start = randomPoint();
      if (start.length() < 1.2) start.setLength(1.8);
      g.position.copy(start); g.rotation.y = i; g.scale.setScalar(1.25);
      const captured = state.bugs.includes(b.id);
      g.visible = !captured;
      scn.add(g);
      return { id: b.id, g, ring, target: randomPoint(), speed: 0.5 + Math.random() * 0.5, captured, vanish: captured ? 1 : 0 };
    });

    const render = () => renderer.render(scn, camera);
    const resize = () => {
      const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false);
      const aspect = w / h, view = 4.4;
      Object.assign(camera, { left: -view * aspect, right: view * aspect, top: view, bottom: -view });
      camera.updateProjectionMatrix();
      render();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pick = e => {
      const r = canvas.getBoundingClientRect();
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(hits.filter(m => m.parent.visible), false)[0];
      return hit && hit.object.userData.bugId;
    };
    const onDown = e => { const id = pick(e); if (id) capture(id); };
    const onMove = e => { canvas.style.cursor = pick(e) ? 'pointer' : 'default'; };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);

    let frame = 0, running = false, visible = true, last = performance.now(), t = 0;
    const tmp = new THREE.Vector3();
    function tick() {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now; t += dt;
      let nearest = null, nd = Infinity;
      bugs.forEach((b, i) => {
        if (b.captured) {
          if (b.vanish < 1) {
            b.vanish = Math.min(1, b.vanish + dt * 3);
            b.g.scale.setScalar(1.25 * (1 - b.vanish) + 0.001);
            b.g.position.y = b.vanish * 1.2;
            if (b.vanish >= 1) b.g.visible = false;
          }
          return;
        }
        tmp.subVectors(b.target, b.g.position); tmp.y = 0;
        if (tmp.length() < 0.15) b.target = randomPoint();
        else { tmp.setLength(b.speed * dt); b.g.position.add(tmp); b.g.rotation.y = Math.atan2(tmp.x, tmp.z); }
        b.g.position.y = Math.abs(Math.sin(t * 9 + i)) * 0.04;
        const p = 1 + Math.sin(t * 4 + i) * 0.15;
        b.ring.scale.set(p, p, p);
        const d = b.g.position.distanceTo(lady.position);
        if (d < nd) { nd = d; nearest = b; }
      });
      // a joaninha persegue o bug mais próximo, mas quem captura é você
      if (nearest && nd > 1.3) {
        tmp.subVectors(nearest.g.position, lady.position); tmp.y = 0;
        lady.rotation.y = Math.atan2(tmp.x, tmp.z);
        tmp.setLength(0.9 * dt); lady.position.add(tmp);
      }
      lady.position.y = nearest ? Math.abs(Math.sin(t * 7)) * 0.06 : Math.abs(Math.sin(t * 3)) * 0.35;
      if (!nearest) lady.rotation.y += dt * 2;
      render();
      frame = requestAnimationFrame(tick);
    }
    const start = () => { if (running || reducedMotion) return; running = true; last = performance.now(); frame = requestAnimationFrame(tick); };
    const stop = () => { running = false; cancelAnimationFrame(frame); };
    const vio = new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible && !document.hidden ? start() : stop(); });
    vio.observe(canvas);
    const onVis = () => (document.hidden || !visible ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    resize();
    start();

    return {
      setCaptured(ids) {
        bugs.forEach(b => {
          const c = ids.includes(b.id);
          if (c && !b.captured) { b.captured = true; if (reducedMotion) b.g.visible = false; }
          if (!c && b.captured) { b.captured = false; b.vanish = 0; b.g.visible = true; b.g.scale.setScalar(1.25); b.g.position.y = 0; }
        });
        if (reducedMotion) render();
      },
      dispose() {
        stop(); ro.disconnect(); vio.disconnect();
        document.removeEventListener('visibilitychange', onVis);
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointermove', onMove);
        scn.traverse(o => { o.geometry && o.geometry.dispose(); const m = o.material; if (Array.isArray(m)) m.forEach(x => x.dispose()); else if (m) m.dispose(); });
        renderer.dispose();
      }
    };
  }

  applyMode();
})();

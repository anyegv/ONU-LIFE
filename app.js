// LÓGICA DEL JUEGO (requiere data.js)
const $ = id => document.getElementById(id);
let S, queue, shown, turn, voted;
const ROUNDS = 8;
const shuffle = arr => arr.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function goHome() { showScreen('home'); }

function startSimulation() {
  S = { inf: 50, rep: 50, ali: 50, est: 50, flags: {}, approved: 0, abstained: 0, vetoed: 0, history: [] };
  queue = shuffle(crises.filter(c => !c.requires)).slice(0, ROUNDS);
  shown = new Set(); turn = 0; S.cur = null;
  nextCrisis();
  showScreen('simulation');
}

function renderMeters(deltas = {}) {
  $('meters').innerHTML = Object.keys(METERS).map(k => {
    const d = deltas[k];
    const chip = d ? `<em class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : ''}${d}</em>` : '';
    return `<div class="meter"><span>${METERS[k].icon} ${METERS[k].name}${chip}</span>` +
      `<div class="bar"><i class="${S[k] <= 25 ? 'low' : ''}" style="width:${S[k]}%"></i></div><strong>${S[k]}</strong></div>`;
  }).join('');
  $('simProgress').textContent = `Expediente ${turn} / ${ROUNDS}`;
}

function collapsed() {
  return Object.keys(METERS).find(k => S[k] <= 0);
}

function nextCrisis() {
  if (turn > 0 && collapsed()) return finish();
  if (turn >= ROUNDS) return finish();
  // una consecuencia pendiente tiene prioridad y ocupa un hueco del sorteo
  let c = crises.find(x => x.requires && !shown.has(x) && x.requires(S));
  if (c) queue.pop(); else c = queue.shift();
  if (!c) return finish();
  shown.add(c); S.cur = c;
  turn++;
  voted = false;
  renderMeters();
  $('caseNo').textContent = `EXPEDIENTE N.º ${String(turn).padStart(2, '0')}`;
  $('crisisTitle').textContent = c.title;
  $('crisisContext').textContent = c.context;
  $('crisisResolution').textContent = c.resolution;
  $('simCard').className = 'paper sim-card';
  $('stamp').textContent = '';
  $('crisisPositions').hidden = !c.positions;
  if (c.positions) { $('posFor').textContent = c.positions.for; $('posAgainst').textContent = c.positions.against; }
  $('voteActions').hidden = false;
  $('simOutcome').hidden = true;
}

function castVote(choice) {
  if (voted) return;
  voted = true;
  const c = S.cur, o = c.outcomes[choice];
  const names = { approve: 'Aprobada', abstain: 'Abstención', veto: 'Vetada' };
  const cls = { approve: 'approved', abstain: 'abstained', veto: 'vetoed' };
  if (choice === 'approve') S.approved++; else if (choice === 'abstain') S.abstained++; else S.vetoed++;
  for (const k in o.fx) S[k] = Math.max(0, Math.min(100, S[k] + o.fx[k]));
  if (o.flag) S.flags[o.flag] = true;
  S.history.push({ title: c.title, choice });
  $('stamp').textContent = names[choice];
  $('simCard').classList.add(cls[choice]);
  renderMeters(o.fx);
  $('voteActions').hidden = true;
  $('simOutcome').hidden = false;
  $('outcomeTitle').textContent = o.t;
  $('outcomeText').textContent = o.x;
  $('simNext').textContent = collapsed() ? 'Ver qué ocurre →' : 'Siguiente expediente →';
  $('simNext').focus({ preventScroll: true });
}

function finish() {
  const dead = collapsed();
  const keys = Object.keys(METERS);
  const total = keys.reduce((a, k) => a + S[k], 0);
  const best = keys.reduce((a, b) => S[a] >= S[b] ? a : b);
  const worst = keys.reduce((a, b) => S[a] <= S[b] ? a : b);
  const endings = {
    inf: ['Mandato colapsado: irrelevante', 'Tu influencia llegó a 0. Ya nadie espera tu voto.'],
    rep: ['Mandato colapsado: aislado', 'Tu reputación llegó a 0. Nadie confía en tu palabra.'],
    ali: ['Mandato colapsado: sin aliados', 'Tus alianzas llegaron a 0. Votas solo.'],
    est: ['Mandato colapsado: mundo en caos', 'La estabilidad llegó a 0. Las crisis se desbordaron.']
  };
  const tiers = [[300, 'Leyenda del Consejo'], [250, 'Estadista'], [200, 'Diplomático hábil'], [150, 'Mandato gris'], [100, 'Mandato frágil'], [0, 'Desastre']];
  const tier = tiers.find(t => total >= t[0]);
  const title = dead ? endings[dead][0] : tier[1];
  const text = dead ? endings[dead][1] : `Terminaste con ${total} puntos de 400.`;
  const next = [...tiers].reverse().find(t => t[0] > total);
  $('finalScore').textContent = total;
  $('rankLadder').innerHTML = tiers.map(t =>
    `<li class="${!dead && t === tier ? 'here' : ''}"><span>${t[1]}</span><b>${t[0] ? t[0] + '+' : '0–99'}</b></li>`).join('');
  $('rankNext').textContent = dead ? 'Con un medidor en 0 no hay puesto: el mandato se cae.' :
    next ? `Te faltaron ${next[0] - total} puntos para ser «${next[1]}».` : 'Has llegado al puesto máximo.';
  $('simFinalTitle').textContent = title;
  $('simFinalText').textContent = text;
  $('finalApproved').textContent = S.approved;
  $('finalAbstained').textContent = S.abstained;
  $('finalVetoed').textContent = S.vetoed;
  $('finalMeters').innerHTML = keys.map(k =>
    `<div class="meter"><span>${METERS[k].icon} ${METERS[k].name}</span><div class="bar"><i class="${S[k] <= 25 ? 'low' : ''}" style="width:${S[k]}%"></i></div><strong>${S[k]}</strong></div>`).join('');
  $('finalSummary').textContent = `Punto fuerte: ${METERS[best].name.toLowerCase()} (${S[best]}). Punto débil: ${METERS[worst].name.toLowerCase()} (${S[worst]}).`;
  $('finalHistory').innerHTML = S.history.map(h =>
    `<li>${h.title}: <b class="${h.choice}">${{ approve: 'Aprobaste', abstain: 'Te abstuviste', veto: 'Vetaste' }[h.choice]}</b></li>`).join('');
  showScreen('simulationResult');
}

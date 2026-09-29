const EXAM_LENGTH = 50;
const POINTS_PER_QUESTION = 5;
const PASS_PERCENT = 70;

let activeQuestions = [];
let currentIndex = 0;
let mode = 'question'; // 'question' | 'summary' | 'results'
let summaryVisited = false;

const viewQuestion = document.getElementById('view-question');
const viewSummary = document.getElementById('view-summary');
const viewResults = document.getElementById('view-results');

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildExam() {
  const pool = shuffle(QUESTION_BANK);
  const picked = pool.slice(0, Math.min(EXAM_LENGTH, pool.length));

  activeQuestions = picked.map(q => {
    const order = shuffle(q.options.map((text, i) => ({ text, isCorrect: i === q.correct })));
    return {
      domain: q.domain,
      text: q.text,
      explain: q.explain,
      options: order.map(o => o.text),
      correct: order.findIndex(o => o.isCorrect),
      selected: null,
      changeCount: 0,
      forReview: false,
      checked: false,
    };
  });

  currentIndex = 0;
  mode = 'question';
  summaryVisited = false;
}

function render() {
  viewQuestion.hidden = mode !== 'question';
  viewSummary.hidden = mode !== 'summary';
  viewResults.hidden = mode !== 'results';

  if (mode === 'question') renderQuestionView();
  else if (mode === 'summary') renderSummaryView();
  else if (mode === 'results') renderResultsView();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ───────────────────────── Question view ─────────────────────────

function renderQuestionView() {
  const q = activeQuestions[currentIndex];

  document.getElementById('qcount-badge').textContent = activeQuestions.length + ' questions';
  document.getElementById('q-num').textContent = 'Q' + (currentIndex + 1);
  document.getElementById('q-domain').textContent = q.domain;
  document.getElementById('q-text').textContent = q.text;

  const optsEl = document.getElementById('q-opts');
  optsEl.innerHTML = q.options.map((opt, oi) => `
    <label class="opt" data-oi="${oi}">
      <input type="radio" name="opt" value="${oi}" ${q.selected === oi ? 'checked' : ''}>
      <span>${opt}</span>
    </label>
  `).join('');

  optsEl.querySelectorAll('.opt').forEach(optEl => {
    optEl.addEventListener('click', () => {
      const oi = parseInt(optEl.dataset.oi, 10);
      if (q.selected !== null && q.selected !== oi) q.changeCount++;
      q.selected = oi;
      optEl.querySelector('input').checked = true;
      updateProgressMeta();
    });
  });

  const reviewInput = document.getElementById('review-box');
  const checkedInput = document.getElementById('checked-box');

  reviewInput.checked = q.forReview;
  checkedInput.checked = q.checked;

  reviewInput.onchange = () => {
    q.forReview = reviewInput.checked;
    updateProgressMeta();
  };

  checkedInput.onchange = () => {
    q.checked = checkedInput.checked;
    updateProgressMeta();
  };

  document.getElementById('to-summary-btn').hidden = !summaryVisited;
  document.getElementById('next-btn').textContent = currentIndex === activeQuestions.length - 1 ? 'Finish → Summary' : 'Next';

  updateProgressBar();
  updateProgressMeta();
}

function updateProgressBar() {
  const pct = Math.round(((currentIndex + 1) / activeQuestions.length) * 100);
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-text').textContent = `Question ${currentIndex + 1} of ${activeQuestions.length}`;
}

function updateProgressMeta() {
  const flagged = activeQuestions.filter(q => q.forReview).length;
  const answered = activeQuestions.filter(q => q.selected !== null).length;
  document.getElementById('progress-meta').textContent = `${answered} answered · ${flagged} flagged for review`;
}

function goNext() {
  if (currentIndex < activeQuestions.length - 1) {
    currentIndex++;
    mode = 'question';
  } else {
    mode = 'summary';
    summaryVisited = true;
  }
  render();
}

function goToSummary() {
  mode = 'summary';
  summaryVisited = true;
  render();
}

document.getElementById('next-btn').addEventListener('click', goNext);
document.getElementById('to-summary-btn').addEventListener('click', goToSummary);

// ───────────────────────── Summary view ─────────────────────────

function statusForQuestion(q) {
  if (q.forReview) {
    if (q.checked) return { label: 'Flagged · Checked also ticked (-2)', cls: 'warn' };
    if (q.selected === null) return { label: 'Flagged · blank (safe)', cls: 'flag' };
    if (q.changeCount > 0) return { label: `Flagged · changed ${q.changeCount}×`, cls: 'warn' };
    return { label: 'Flagged · answered', cls: 'flag' };
  }
  if (!q.checked) return { label: 'Not confirmed (Checked unticked)', cls: 'bad' };
  if (q.selected === null) return { label: 'Confirmed but blank', cls: 'bad' };
  if (q.changeCount > 0) return { label: `Answered · changed ${q.changeCount}×`, cls: 'warn' };
  return { label: 'Answered · confirmed', cls: 'ok' };
}

function renderSummaryView() {
  const total = activeQuestions.length;
  const answered = activeQuestions.filter(q => q.selected !== null).length;
  const flagged = activeQuestions.filter(q => q.forReview).length;
  const unconfirmed = activeQuestions.filter(q => !q.forReview && !q.checked).length;
  const blankUnsafe = activeQuestions.filter(q => !q.forReview && q.checked && q.selected === null).length;

  document.getElementById('summary-stats').innerHTML = `
    <div class="stat"><span class="stat-num">${answered}/${total}</span><span class="stat-label">answered</span></div>
    <div class="stat"><span class="stat-num">${flagged}</span><span class="stat-label">flagged for review</span></div>
    <div class="stat ${unconfirmed ? 'warn' : ''}"><span class="stat-num">${unconfirmed}</span><span class="stat-label">not confirmed</span></div>
    <div class="stat ${blankUnsafe ? 'bad' : ''}"><span class="stat-num">${blankUnsafe}</span><span class="stat-label">confirmed but blank</span></div>
  `;

  const grid = document.getElementById('summary-grid');
  grid.innerHTML = activeQuestions.map((q, qi) => {
    const s = statusForQuestion(q);
    return `
      <button class="summary-item ${s.cls}" data-qi="${qi}">
        <span class="summary-item-num">Q${qi + 1}</span>
        <span class="summary-item-domain">${q.domain}</span>
        <span class="summary-item-status">${s.label}</span>
      </button>
    `;
  }).join('');

  grid.querySelectorAll('.summary-item').forEach(btn => {
    btn.addEventListener('click', () => {
      currentIndex = parseInt(btn.dataset.qi, 10);
      mode = 'question';
      render();
    });
  });
}

document.getElementById('submit-btn').addEventListener('click', () => {
  mode = 'results';
  render();
});

// ───────────────────────── Scoring & results view ─────────────────────────

function scoreQuestion(q) {
  const correctness = q.selected === q.correct ? POINTS_PER_QUESTION : 0;
  let penalty = 0;

  if (q.forReview) {
    penalty = q.selected === null ? 0 : -q.changeCount;
    if (q.checked) penalty -= 2;
  } else if (!q.checked) {
    penalty = -2;
  } else if (q.selected === null) {
    penalty = -5;
  } else {
    penalty = -q.changeCount;
  }

  return { correctness, penalty, points: correctness + penalty };
}

function renderResultsView() {
  const maxPossible = activeQuestions.length * POINTS_PER_QUESTION;
  let rawTotal = 0;
  const rows = activeQuestions.map((q, qi) => {
    const s = scoreQuestion(q);
    rawTotal += s.points;
    return { qi, q, s };
  });

  const total = Math.max(0, rawTotal);
  const pct = Math.round((total / maxPossible) * 100);
  const passed = pct >= PASS_PERCENT;

  document.getElementById('score-text').textContent = `${total} / ${maxPossible}`;
  document.getElementById('score-sub').textContent = `${pct}% — ${passed ? 'PASS' : 'BELOW PASSING'} (70% required)`;
  document.getElementById('score-sub').className = 'sub ' + (passed ? 'pass' : 'fail');

  const byDomain = {};
  rows.forEach(({ q, s }) => {
    byDomain[q.domain] = byDomain[q.domain] || { earned: 0, max: 0 };
    byDomain[q.domain].max += POINTS_PER_QUESTION;
    byDomain[q.domain].earned += Math.max(0, s.correctness); // correctness-only view per topic
  });
  const breakdownRows = Object.keys(byDomain).sort().map(domain => {
    const { earned, max } = byDomain[domain];
    const p = Math.round((earned / max) * 100);
    return `
      <div class="breakdown-row">
        <span class="label">${domain}</span>
        <span class="bartrack"><span class="barfill" style="width:${p}%"></span></span>
        <span class="count">${earned}/${max}</span>
      </div>
    `;
  }).join('');
  document.getElementById('breakdown').innerHTML = `<h3>Correctness by topic</h3>${breakdownRows}`;

  const listEl = document.getElementById('results-list');
  listEl.innerHTML = rows.map(({ qi, q, s }) => {
    const correct = q.selected === q.correct;
    const optsHtml = q.options.map((opt, oi) => {
      let cls = '';
      if (oi === q.correct) cls = 'correct';
      else if (oi === q.selected) cls = 'incorrect';
      return `<div class="opt locked ${cls}"><span>${opt}</span></div>`;
    }).join('');

    const penaltyNote = s.penalty !== 0
      ? `<div class="penalty-note">Process penalty: ${s.penalty} pts (${statusForQuestion(q).label.toLowerCase()})</div>`
      : '';

    return `
      <div class="q result-q">
        <div class="q-head">
          <span class="q-num">Q${qi + 1}</span>
          <span class="q-domain">${q.domain}</span>
          <span class="q-points ${correct ? 'ok' : 'bad'}">${s.points >= 0 ? '+' : ''}${s.points} pts</span>
        </div>
        <p class="q-text">${q.text}</p>
        <div class="opts">${optsHtml}</div>
        ${penaltyNote}
        <div class="explain show"><b>Why:</b> ${q.explain}</div>
      </div>
    `;
  }).join('');
}

document.getElementById('new-exam-btn').addEventListener('click', () => {
  buildExam();
  render();
});

// ───────────────────────── Boot ─────────────────────────

document.getElementById('bank-size').textContent = QUESTION_BANK.length;
buildExam();
render();

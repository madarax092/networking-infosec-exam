const EXAM_LENGTH = 50;

let activeQuestions = [];
let state = [];
let submitted = false;

const quizEl = document.getElementById('quiz');

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
    };
  });

  state = new Array(activeQuestions.length).fill(null);
  submitted = false;
}

function render() {
  document.getElementById('qcount-badge').textContent = activeQuestions.length + ' questions';

  quizEl.innerHTML = activeQuestions.map((q, qi) => `
    <div class="q" data-qi="${qi}">
      <div class="q-head">
        <span class="q-num">Q${qi + 1}</span>
        <span class="q-domain">${q.domain}</span>
      </div>
      <p class="q-text">${q.text}</p>
      <div class="opts">
        ${q.options.map((opt, oi) => `
          <label class="opt" data-oi="${oi}">
            <input type="radio" name="q${qi}" value="${oi}">
            <span>${opt}</span>
          </label>
        `).join('')}
      </div>
      <div class="explain" id="explain-${qi}"><b>Why:</b> ${q.explain}</div>
    </div>
  `).join('');

  activeQuestions.forEach((q, qi) => {
    quizEl.querySelectorAll(`.q[data-qi="${qi}"] .opt`).forEach(optEl => {
      optEl.addEventListener('click', () => {
        if (submitted) return;
        const oi = parseInt(optEl.dataset.oi, 10);
        state[qi] = oi;
        optEl.querySelector('input').checked = true;
        updateProgress();
      });
    });
  });
}

function updateProgress() {
  const answered = state.filter(s => s !== null).length;
  const pct = Math.round((answered / activeQuestions.length) * 100);
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-text').textContent = `${answered} of ${activeQuestions.length} answered`;
  document.getElementById('submit-btn').disabled = answered !== activeQuestions.length || submitted;
}

function renderBreakdown(score) {
  const byDomain = {};
  activeQuestions.forEach((q, qi) => {
    byDomain[q.domain] = byDomain[q.domain] || { correct: 0, total: 0 };
    byDomain[q.domain].total++;
    if (state[qi] === q.correct) byDomain[q.domain].correct++;
  });

  const rows = Object.keys(byDomain).sort().map(domain => {
    const { correct, total } = byDomain[domain];
    const pct = Math.round((correct / total) * 100);
    return `
      <div class="breakdown-row">
        <span class="label">${domain}</span>
        <span class="bartrack"><span class="barfill" style="width:${pct}%"></span></span>
        <span class="count">${correct}/${total}</span>
      </div>
    `;
  }).join('');

  document.getElementById('breakdown').innerHTML = `<h3>Score by topic</h3>${rows}`;
}

function submitExam() {
  submitted = true;
  let score = 0;

  activeQuestions.forEach((q, qi) => {
    if (state[qi] === q.correct) score++;
    const optEls = quizEl.querySelectorAll(`.q[data-qi="${qi}"] .opt`);
    optEls.forEach(optEl => {
      const oi = parseInt(optEl.dataset.oi, 10);
      optEl.classList.add('locked');
      if (oi === q.correct) optEl.classList.add('correct');
      else if (oi === state[qi]) optEl.classList.add('incorrect');
    });
    document.getElementById(`explain-${qi}`).classList.add('show');
  });

  const pct = Math.round((score / activeQuestions.length) * 100);
  document.getElementById('score-text').textContent = `${score} / ${activeQuestions.length}`;
  document.getElementById('score-sub').textContent = pct >= 80
    ? `${pct}% — solid grasp across these topics. Review any misses below.`
    : pct >= 60
      ? `${pct}% — in passing range for most Certiport thresholds, but review the misses below.`
      : `${pct}% — worth another study pass on the missed topics before test day.`;

  renderBreakdown(score);

  document.getElementById('results').classList.add('show');
  document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });

  document.getElementById('submit-btn').hidden = true;
  document.getElementById('new-exam-btn').hidden = false;
  document.getElementById('footer-hint').textContent = 'Green = correct answer. Red = your incorrect pick.';
}

function startNewExam() {
  buildExam();
  document.getElementById('results').classList.remove('show');
  document.getElementById('submit-btn').hidden = false;
  document.getElementById('submit-btn').disabled = true;
  document.getElementById('new-exam-btn').hidden = true;
  document.getElementById('footer-hint').textContent = 'Answer every question, then submit to see your score and explanations.';
  render();
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('submit-btn').addEventListener('click', submitExam);
document.getElementById('new-exam-btn').addEventListener('click', startNewExam);
document.getElementById('bank-size').textContent = QUESTION_BANK.length;

buildExam();
render();
updateProgress();

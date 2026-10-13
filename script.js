/* =========================================================
   DEWASA AWAL DI 2026 — script.js
   Vanilla JS, tanpa dependensi eksternal.
   ========================================================= */
(() => {
  'use strict';

  /* ---------- Data ---------- */
  const KEYWORDS = [
    {
      id: 'autonomy',
      keyword: 'Autonomy',
      emoji: '🕊️',
      accentColor: '#DCD7F5',
      explanation:
        'Autonomy merupakan kemampuan individu untuk memiliki kendali terhadap kehidupannya sendiri, terutama dalam menentukan pilihan, mengambil keputusan, dan bertanggung jawab atas keputusan tersebut.'
    },
    {
      id: 'family-support',
      keyword: 'Family Support',
      emoji: '🏡',
      accentColor: '#DCE8DD',
      explanation:
        'Family Support adalah dukungan emosional dan praktis yang kita terima dari keluarga. Menjadi dewasa bukan berarti harus menghadapi semuanya sendirian. Memiliki tempat untuk pulang juga bagian dari bertumbuh.'
    },
    {
      id: 'emotional-coping',
      keyword: 'Emotional Coping',
      emoji: '🌷',
      accentColor: '#F2D9E2',
      explanation:
        'Emotional Coping adalah cara kita menghadapi dan mengelola emosi saat menghadapi tekanan atau masalah. Menjadi dewasa berarti belajar memahami perasaan dan memilih cara yang sehat untuk menghadapinya.'
    },
    {
      id: 'problem-solving',
      keyword: 'Problem Solving',
      emoji: '🧩',
      accentColor: '#F6E9B9',
      explanation:
        'Problem Solving adalah kemampuan mengenali masalah, mempertimbangkan pilihan, dan mencari solusi. Kita mungkin belum selalu tahu jawabannya, tetapi kita bisa belajar menghadapi masalah satu per satu.'
    },
    {
      id: 'peak-performance',
      keyword: 'Peak Performance',
      emoji: '⭐',
      accentColor: '#DCD7F5',
      explanation:
        'Peak Performance menggambarkan kondisi ketika seseorang dapat menunjukkan performa optimal dalam suatu aktivitas. Namun, bertumbuh bukan berarti harus selalu produktif. Istirahat dan mengenali batas diri juga penting.'
    },
    {
      id: 'cognitive-flexibility',
      keyword: 'Cognitive Flexibility',
      emoji: '🦋',
      accentColor: '#DCE8DD',
      explanation:
        'Cognitive Flexibility adalah kemampuan menyesuaikan cara berpikir ketika menghadapi situasi atau perspektif baru. Kita belajar bahwa tidak semua hal berjalan sesuai rencana dan terkadang, berubah pikiran juga merupakan bentuk perkembangan.'
    },
    {
      id: 'expertise',
      keyword: 'Expertise',
      emoji: '🎓',
      accentColor: '#F2D9E2',
      explanation:
        'Expertise adalah pengetahuan dan keterampilan mendalam yang berkembang melalui pembelajaran serta pengalaman. Kita tidak harus langsung ahli dalam segala hal. Kemampuan dapat tumbuh sedikit demi sedikit melalui proses.'
    },
    {
      id: 'love-commitment',
      keyword: 'Love Commitment',
      emoji: '💌',
      accentColor: '#F6E9B9',
      explanation:
        ' Love Commitment adalah keputusan untuk mencintai seseorang serta niat untuk mempertahankan hubungan dengan pasangannya dalam jangka waktu yang panjang. Komitmen merupakan salah satu dari tiga komponen cinta bersama keintiman (intimacy) dan gairah (passion).'
    }
  ];

  const TOTAL_PAIRS = KEYWORDS.length; // 8
  const MISMATCH_DELAY = 900;          // ms kartu salah tetap terbuka
  const MATCH_MODAL_DELAY = 550;       // ms menunggu animasi flip sebelum popup
  const VICTORY_REVEAL_DELAY = 1700;   // ms sebelum popup penutup muncul
  const SCREEN_FADE = 280;             // ms transisi antar halaman

  /* ---------- Helpers ---------- */
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = () => reducedMotionQuery.matches;

  function getEl(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Elemen #${id} tidak ditemukan di index.html`);
    return el;
  }

  /* ---------- DOM refs ---------- */
  let els;
  function collectElements() {
    els = {
      app: getEl('app'),
      screens: {
        intro: getEl('screen-intro'),
        game: getEl('screen-game'),
        reflection: getEl('screen-reflection')
      },
      focusTargets: {
        intro: getEl('intro-title'),
        game: getEl('game-title'),
        reflection: getEl('reflection-title')
      },
      btnStart: getEl('btn-start'),
      btnRestart: getEl('btn-restart'),
      btnViewReflection: getEl('btn-view-reflection'),
      btnBack: getEl('btn-back'),
      btnPlayAgain: getEl('btn-play-again'),
      board: getEl('board'),
      progress: getEl('progress'),
      progressFill: getEl('progress-fill'),
      progressText: getEl('progress-text'),
      srStatus: getEl('sr-status'),
      confetti: getEl('confetti'),
      modals: {
        pair: getEl('modal-pair'),
        victory: getEl('modal-victory'),
        confirm: getEl('modal-confirm')
      },
      pairCount: getEl('pair-count'),
      pairEmoji: getEl('pair-emoji'),
      pairTitle: getEl('pair-title'),
      pairText: getEl('pair-text'),
      pairClose: getEl('pair-close'),
      victoryTitle: getEl('victory-title'),
      victoryStage2: getEl('victory-stage-2'),
      victoryContinue: getEl('victory-continue'),
      confirmCancel: getEl('confirm-cancel'),
      confirmOk: getEl('confirm-ok')
    };
  }

  /* ---------- State terpusat ---------- */
  const state = {
    screen: 'intro',
    cards: [],
    cardMap: new Map(),
    firstCard: null,
    secondCard: null,
    lockBoard: false,
    matchedPairs: 0,
    totalPairs: TOTAL_PAIRS,
    moves: 0,
    gameStarted: false,
    gameCompleted: false
  };

  let activeModal = null;      // 'pair' | 'victory' | 'confirm' | null
  let returnFocusEl = null;
  let navToken = 0;

  /* ---------- Timeout management ---------- */
  const timers = new Set();
  function schedule(fn, ms) {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  }
  function clearTimers() {
    timers.forEach((id) => clearTimeout(id));
    timers.clear();
  }

  /* ---------- Deck ---------- */
  function buildDeck() {
    const cards = [];
    KEYWORDS.forEach((data) => {
      for (let copy = 1; copy <= 2; copy += 1) {
        cards.push({
          uid: `${data.id}-${copy}`,
          pairId: data.id,
          data,
          flipped: false,
          matched: false,
          el: null
        });
      }
    });
    return cards;
  }

  // Fisher–Yates
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function validateDeck(cards) {
    if (cards.length !== TOTAL_PAIRS * 2) return false;
    const counts = {};
    cards.forEach((c) => { counts[c.pairId] = (counts[c.pairId] || 0) + 1; });
    const ids = Object.keys(counts);
    return ids.length === TOTAL_PAIRS && ids.every((id) => counts[id] === 2);
  }

  /* ---------- Render kartu ---------- */
  function renderBoard() {
    els.board.replaceChildren();
    state.cardMap.clear();

    state.cards.forEach((card, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'card';
      btn.dataset.uid = card.uid;
      btn.dataset.tone = String((index + Math.floor(index / 4)) % 4);
      btn.style.setProperty('--accent', card.data.accentColor);

      const inner = document.createElement('span');
      inner.className = 'card-inner';

      const front = document.createElement('span');
      front.className = 'card-face card-front';
      front.setAttribute('aria-hidden', 'true');
      front.innerHTML = '<span class="front-mark">✦</span><span class="front-q">?</span>';

      const back = document.createElement('span');
      back.className = 'card-face card-back';
      back.setAttribute('aria-hidden', 'true');

      const badge = document.createElement('span');
      badge.className = 'card-badge';
      badge.textContent = '✓';

      const emoji = document.createElement('span');
      emoji.className = 'card-emoji';
      emoji.textContent = card.data.emoji;

      const title = document.createElement('span');
      title.className = 'card-title';
      title.textContent = card.data.keyword;

      back.append(badge, emoji, title);
      inner.append(front, back);
      btn.append(inner);

      card.el = btn;
      card.position = index + 1;
      state.cardMap.set(card.uid, card);
      els.board.append(btn);
      updateCard(card);
    });
  }

  function updateCard(card) {
    const { el } = card;
    if (!el) return;
    el.classList.toggle('is-flipped', card.flipped);
    el.classList.toggle('is-matched', card.matched);

    let label;
    if (card.matched) {
      label = `Kartu ${card.position}, ${card.data.keyword}, pasangan ditemukan`;
    } else if (card.flipped) {
      label = `Kartu ${card.position}, ${card.data.keyword}, terbuka`;
    } else {
      label = `Kartu ${card.position}, tertutup`;
    }
    el.setAttribute('aria-label', label);
    el.setAttribute('aria-disabled', card.matched || card.flipped ? 'true' : 'false');
  }

  function announce(message) {
    // Kosongkan dulu supaya pesan yang sama tetap dibacakan ulang
    els.srStatus.textContent = '';
    schedule(() => { els.srStatus.textContent = message; }, 50);
  }

  /* ---------- Progress ---------- */
  function updateProgress() {
    const n = Math.min(state.matchedPairs, TOTAL_PAIRS);
    els.progressText.textContent = `${n} / ${TOTAL_PAIRS} pairs discovered`;
    els.progress.setAttribute('aria-valuenow', String(n));
    els.progress.setAttribute('aria-valuetext', `${n} of ${TOTAL_PAIRS} pairs discovered`);
    els.progressFill.style.transform = `scaleX(${n / TOTAL_PAIRS})`;
  }

  /* ---------- Gameplay ---------- */
  function handleCardClick(card) {
    if (!state.gameStarted || state.lockBoard || activeModal) return;
    if (card.matched || card.flipped) return;

    card.flipped = true;
    updateCard(card);

    if (!state.firstCard) {
      state.firstCard = card;
      return;
    }

    state.secondCard = card;
    state.lockBoard = true;
    state.moves += 1;

    if (state.firstCard.pairId === card.pairId) {
      handleMatch();
    } else {
      handleMismatch();
    }
  }

  function handleMatch() {
    const a = state.firstCard;
    const b = state.secondCard;
    if (!a || !b || a.matched || b.matched) return;

    a.matched = true;
    b.matched = true;
    state.matchedPairs = Math.min(state.matchedPairs + 1, TOTAL_PAIRS);

    [a, b].forEach((c) => {
      updateCard(c);
      c.el.classList.add('just-matched');
    });
    schedule(() => {
      a.el.classList.remove('just-matched');
      b.el.classList.remove('just-matched');
    }, 700);

    updateProgress();
    announce(`Cocok! ${a.data.keyword}. ${state.matchedPairs} dari ${TOTAL_PAIRS} pasangan ditemukan.`);

    const data = a.data;
    schedule(() => openPairModal(data), prefersReducedMotion() ? 0 : MATCH_MODAL_DELAY);
  }

  function handleMismatch() {
    const a = state.firstCard;
    const b = state.secondCard;
    announce('Tidak cocok. Coba lagi.');

    schedule(() => {
      a.flipped = false;
      b.flipped = false;
      updateCard(a);
      updateCard(b);
      state.firstCard = null;
      state.secondCard = null;
      state.lockBoard = false;
    }, MISMATCH_DELAY);
  }

  /* ---------- Modal manager ---------- */
  function openModal(name, focusEl) {
    const modal = els.modals[name];
    if (!modal) return;
    if (!returnFocusEl && document.activeElement && document.activeElement !== document.body) {
      returnFocusEl = document.activeElement;
    }
    activeModal = name;
    modal.hidden = false;
    els.app.inert = true;
    if (focusEl) focusEl.focus({ preventScroll: true });
  }

  function closeModal(name, { restoreFocus = true } = {}) {
    const modal = els.modals[name];
    if (!modal) return;
    modal.hidden = true;
    if (activeModal === name) activeModal = null;
    if (!activeModal) els.app.inert = false;

    const target = returnFocusEl;
    returnFocusEl = null;
    if (restoreFocus && target && document.contains(target)) {
      target.focus({ preventScroll: true });
    }
  }

  function trapFocus(event) {
    const dialog = els.modals[activeModal].querySelector('[role="dialog"]');
    const focusables = Array.from(
      dialog.querySelectorAll('button:not([disabled])')
    ).filter((el) => !el.closest('[hidden]'));

    if (focusables.length === 0) {
      event.preventDefault();
      dialog.focus({ preventScroll: true });
      return;
    }
    const idx = focusables.indexOf(document.activeElement);
    if (event.shiftKey) {
      if (idx <= 0) {
        event.preventDefault();
        focusables[focusables.length - 1].focus();
      }
    } else if (idx === -1 || idx === focusables.length - 1) {
      event.preventDefault();
      focusables[0].focus();
    }
  }

  function onKeydown(event) {
    if (!activeModal) return;
    if (event.key === 'Escape') {
      if (activeModal === 'pair') {
        event.preventDefault();
        closePairModal();
      } else if (activeModal === 'confirm') {
        event.preventDefault();
        closeModal('confirm');
      }
      return;
    }
    if (event.key === 'Tab') trapFocus(event);
  }

  /* ---------- Popup keyword ---------- */
  function openPairModal(data) {
    // Jika ada modal lain terbuka (mis. konfirmasi restart), tunda dulu.
    if (activeModal) {
      schedule(() => openPairModal(data), 250);
      return;
    }
    els.pairCount.textContent = `PAIR ${state.matchedPairs} OF ${TOTAL_PAIRS}`;
    els.pairEmoji.textContent = data.emoji;
    els.pairEmoji.style.setProperty('--accent', data.accentColor);
    els.pairTitle.textContent = data.keyword;
    els.pairText.textContent = data.explanation;
    returnFocusEl = null;
    openModal('pair', els.pairClose);
  }

  function closePairModal() {
    if (activeModal !== 'pair') return;
    closeModal('pair', { restoreFocus: false });

    state.firstCard = null;
    state.secondCard = null;

    if (state.matchedPairs >= TOTAL_PAIRS && !state.gameCompleted) {
      startVictory();
      return;
    }

    state.lockBoard = false;
    focusNextCard();
  }

  function focusNextCard() {
    const next = state.cards.find((c) => !c.matched);
    if (next && next.el) next.el.focus({ preventScroll: true });
  }

  /* ---------- Kemenangan ---------- */
  function resetVictoryModal() {
    els.victoryStage2.hidden = true;
    els.victoryContinue.disabled = true;
  }

  function startVictory() {
    if (state.gameCompleted) return;
    state.gameCompleted = true;
    state.lockBoard = true;
    els.btnViewReflection.hidden = false;

    resetVictoryModal();
    returnFocusEl = null;
    openModal('victory', els.victoryTitle);
    launchConfetti();
    announce('Selamat! Kamu menemukan semua 8 pasangan.');

    schedule(revealVictoryStage, prefersReducedMotion() ? 0 : VICTORY_REVEAL_DELAY);
  }

  function revealVictoryStage() {
    if (activeModal !== 'victory') return;
    els.victoryStage2.hidden = false;
    els.victoryContinue.disabled = false;
    els.victoryContinue.focus({ preventScroll: true });
  }

  function onVictoryContinue() {
    if (!state.gameCompleted || activeModal !== 'victory') return;
    closeModal('victory', { restoreFocus: false });
    clearConfetti();
    showScreen('reflection');
  }

  function launchConfetti() {
    if (prefersReducedMotion()) return;
    clearConfetti();
    const colors = ['#DCD7F5', '#F2D9E2', '#DCE8DD', '#F6E9B9', '#c9bdf0', '#e9a9c0', '#282828'];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 70; i += 1) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece' + (i % 3 === 0 ? ' round' : '');
      piece.style.setProperty('--x', `${Math.random() * 100}vw`);
      piece.style.setProperty('--size', `${6 + Math.random() * 6}px`);
      piece.style.setProperty('--delay', `${Math.random() * 0.7}s`);
      piece.style.setProperty('--dur', `${2.8 + Math.random() * 1.8}s`);
      piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 240}px`);
      piece.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
      piece.style.setProperty('--color', colors[i % colors.length]);
      frag.append(piece);
    }
    els.confetti.append(frag);
    schedule(clearConfetti, 6000);
  }

  function clearConfetti() {
    els.confetti.replaceChildren();
  }

  /* ---------- Reset / Restart ---------- */
  function resetGame() {
    clearTimers();
    clearConfetti();

    Object.values(els.modals).forEach((m) => { m.hidden = true; });
    activeModal = null;
    returnFocusEl = null;
    els.app.inert = false;
    resetVictoryModal();

    state.cards = shuffle(buildDeck());
    state.firstCard = null;
    state.secondCard = null;
    state.lockBoard = false;
    state.matchedPairs = 0;
    state.moves = 0;
    state.gameCompleted = false;
    state.gameStarted = true;
    els.btnViewReflection.hidden = true;

    if (!validateDeck(state.cards)) {
      console.error('Deck tidak valid: harus 16 kartu, setiap keyword tepat dua kali.');
      state.lockBoard = true;
      state.gameStarted = false;
      els.board.replaceChildren();
      const msg = document.createElement('p');
      msg.className = 'board-error';
      msg.textContent = 'Terjadi kesalahan saat menyiapkan kartu. Muat ulang halaman.';
      els.board.append(msg);
      updateProgress();
      return;
    }

    renderBoard();
    updateProgress();
  }

  function isGameInProgress() {
    return state.matchedPairs > 0 || state.moves > 0 || state.firstCard !== null;
  }

  function requestRestart() {
    if (activeModal) return;
    if (!isGameInProgress()) {
      resetGame();
      focusNextCard();
      return;
    }
    returnFocusEl = els.btnRestart;
    openModal('confirm', els.confirmCancel);
  }

  function confirmRestart() {
    if (activeModal !== 'confirm') return;
    closeModal('confirm', { restoreFocus: false });
    resetGame();
    focusNextCard();
  }

  /* ---------- Navigasi halaman ---------- */
  function showScreen(name) {
    if (!els.screens[name]) return;
    const token = (navToken += 1);
    const current = els.screens[state.screen];
    const next = els.screens[name];
    const previous = state.screen;
    state.screen = name;

    const finish = () => {
      if (token !== navToken) return;
      Object.entries(els.screens).forEach(([key, section]) => {
        section.classList.remove('is-leaving');
        if (key === name) return;
        section.hidden = true;
        section.classList.remove('is-active');
      });
      next.hidden = false;
      next.classList.add('is-active');
      window.scrollTo(0, 0);
      els.focusTargets[name].focus({ preventScroll: true });
    };

    if (previous === name || prefersReducedMotion()) {
      finish();
      return;
    }
    current.classList.add('is-leaving');
    setTimeout(finish, SCREEN_FADE);
  }

  /* ---------- Event listeners (dipasang sekali) ---------- */
  function bindEvents() {
    els.btnStart.addEventListener('click', () => {
      if (state.screen !== 'intro') return;
      resetGame();
      showScreen('game');
    });

    els.board.addEventListener('click', (event) => {
      const btn = event.target.closest('.card');
      if (!btn || !els.board.contains(btn)) return;
      const card = state.cardMap.get(btn.dataset.uid);
      if (card) handleCardClick(card);
    });

    els.btnRestart.addEventListener('click', requestRestart);
    els.confirmCancel.addEventListener('click', () => closeModal('confirm'));
    els.confirmOk.addEventListener('click', confirmRestart);

    els.pairClose.addEventListener('click', closePairModal);
    els.victoryContinue.addEventListener('click', onVictoryContinue);

    els.btnViewReflection.addEventListener('click', () => {
      if (state.gameCompleted) showScreen('reflection');
    });
    els.btnBack.addEventListener('click', () => showScreen('game'));
    els.btnPlayAgain.addEventListener('click', () => {
      resetGame();
      showScreen('game');
    });

    document.addEventListener('keydown', onKeydown);
  }

  /* ---------- Init ---------- */
  function init() {
    try {
      collectElements();
      bindEvents();
      updateProgress();
    } catch (error) {
      console.error('Gagal menginisialisasi game:', error);
    }
  }

  init();
})();

/**
 * COSMOHUB LEARNING PAGE ENGINE
 * Handles: 88-Node Roadmap layout, LocalStorage persistence, 3-Step Lesson Modal,
 * Star-Connect Canvas Engine (Random 2D Transformations), Viewfinder Snap Engine,
 * and Synthesized Web Audio API FX.
 */

(function () {
  'use strict';

  // --- STATE MANAGEMENT ---
  const STORAGE_KEY = 'cosmohub_progress';
  let constellationsData = [];
  let userProgress = {};
  let currentConstellation = null;

  // Modal & Challenge State
  let currentSlide = 1; // 1: Story, 2: Guide, 3: Challenge
  let currentQuestionIndex = 0; // 0: Q1(MCQ), 1: Q2(Connect), 2: Q3(Connect), 3: Q4(Snap), 4: Q5(Snap)
  let challengeScore = 5; // 5 correct = 3 stars, 4 = 2 stars, 1-3 = 1 star
  let qAttempts = 0;

  // Canvas 1: Star Connect State
  let transformedStars = [];
  let requiredStarlines = [];
  let userConnectedLines = [];
  let activeSelectedStar = null;
  let mouseDragPos = null;

  // Canvas 2: Viewfinder Snap State
  let skyConstellations = [];
  let targetSkyIndex = 0;
  let skyPanOffset = { x: 0, y: 0 };
  let isDraggingSky = false;
  let dragStartPos = { x: 0, y: 0 };
  
  / --- AUDIO SYNTHESIZER ENGINE (Web Audio API) --- /
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
    initAudio();
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play exception', e);
    }
  }

  function playConnectChime() {
    playTone(523.25, 'sine', 0.12, 0.15); // C5
    setTimeout(() => playTone(659.25, 'sine', 0.15, 0.15), 60); // E5
  }

  function playCameraShutter() {
    playTone(180, 'triangle', 0.04, 0.2);
    setTimeout(() => playTone(120, 'square', 0.08, 0.15), 50);
  }

  function playVictoryFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((note, idx) => {
      setTimeout(() => playTone(note, 'sine', 0.25, 0.15), idx * 100);
    });
  }

  function playErrorSound() {
    playTone(160, 'sawtooth', 0.2, 0.15);
  }

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', () => {
    loadProgress();
    fetchConstellationsData();
    setupEventListeners();
  });

  function loadProgress() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        userProgress = JSON.parse(saved);
      } else {
        userProgress = {};
      }
    } catch (e) {
      userProgress = {};
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userProgress));
    } catch (e) {
      console.error('Failed to save progress', e);
    }
    updateHeaderStats();
  }

  function fetchConstellationsData() {
    fetch('data/constellations.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load constellations data');
        return res.json();
      })
      .then(data => {
        constellationsData = data;
        renderRoadmap();
        updateHeaderStats();
      })
      .catch(err => {
        console.error('Error fetching data:', err);
      });
  }

  // --- HEADER STATS RENDERER ---
  function updateHeaderStats() {
    let totalStars = 0;
    let completedCount = 0;

    const activeTotal = constellationsData.filter(c => c.category !== 'Locked').length || 22;

    constellationsData.forEach(item => {
      if (userProgress[item.id] && userProgress[item.id].completed) {
        completedCount++;
        totalStars += (userProgress[item.id].stars || 1);
      }
    });

    const starsEl = document.getElementById('total-stars-val');
    const completedEl = document.getElementById('completed-nodes-val');
    const fillEl = document.getElementById('roadmap-progress-fill');
    const textEl = document.getElementById('progress-percent-text');

    if (starsEl) starsEl.textContent = totalStars;
    if (completedEl) completedEl.textContent = `${completedCount} / ${activeTotal}`;

    const pct = Math.round((completedCount / activeTotal) * 100);
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (textEl) textEl.textContent = `${pct}%`;
  }

  // --- ROADMAP PATH & NODE GENERATOR ---
  function renderRoadmap(filter = 'all') {
    const container = document.getElementById('roadmap-nodes');
    if (!container) return;
    container.innerHTML = '';

    // Determine lock/unlock states based on completion order
    let previousCompleted = true; // Level 1 (first active node) is always unlocked initially

    constellationsData.forEach((item, index) => {
      const levelNum = index + 1;
      const isLockedPlaceholder = item.category === 'Locked' || item.unlocked === false;
      const isCompleted = userProgress[item.id] && userProgress[item.id].completed;
      const starsEarned = userProgress[item.id] ? (userProgress[item.id].stars || 0) : 0;

      // Active state determination
      let nodeState = 'locked';
      if (!isLockedPlaceholder) {
        if (isCompleted) {
          nodeState = 'completed';
          previousCompleted = true;
        } else if (previousCompleted) {
          nodeState = 'active';
          previousCompleted = false; // subsequent uncompleted active nodes stay locked until previous is done
        }
      }

      // Create Node DOM element
      const wrapper = document.createElement('div');
      wrapper.className = `node-wrapper state-${nodeState}`;

      // Zigzag position assignment: Left -> Center -> Right -> Center
      const offsetPos = index % 4;
      if (offsetPos === 0) wrapper.classList.add('offset-center');
      else if (offsetPos === 1) wrapper.classList.add('offset-left');
      else if (offsetPos === 2) wrapper.classList.add('offset-center');
      else if (offsetPos === 3) wrapper.classList.add('offset-right');

      wrapper.dataset.filter = isLockedPlaceholder ? 'Locked' : item.category;
      wrapper.dataset.id = item.id;

      // Filter Visibility
      if (filter !== 'all' && wrapper.dataset.filter !== filter) {
        wrapper.style.display = 'none';
      }

      // Inner HTML construction
      let circleInner = '';
      if (nodeState === 'completed') {
        const starIcons = '⭐'.repeat(starsEarned) + '★'.repeat(3 - starsEarned);
        circleInner = `
          <div class="node-number">#${levelNum}</div>
          <div class="node-stars-badge">${starIcons}</div>
        `;
      } else if (nodeState === 'active') {
        circleInner = `
          <div class="node-number">#${levelNum}</div>
          <div class="node-start-badge">START</div>
        `;
      } else {
        const seasonBadge = levelNum > 22 ? `<div class="node-season-badge">Season 2</div>` : '';
        circleInner = `
          <span class="node-lock-icon">🔒</span>
          ${seasonBadge}
        `;
      }

      wrapper.innerHTML = `
        <div class="node-circle" data-id="${item.id}">
          ${circleInner}
        </div>
        <div class="node-label">${item.name}</div>
        <div class="node-category-tag">${isLockedPlaceholder ? 'Locked' : item.category}</div>
      `;

      // Event Listener
      if (nodeState === 'active' || nodeState === 'completed') {
        wrapper.querySelector('.node-circle').addEventListener('click', () => {
          openLessonModal(item);
        });
      }

      container.appendChild(wrapper);
    });

    // Render Serpentine SVG connecting line
    setTimeout(drawRoadmapSVGPath, 100);
  }

}());
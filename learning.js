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
}());
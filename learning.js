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
}())
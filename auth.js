// Firebase Authentication Module for CosmoHub
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Load configuration dynamically
let firebaseConfig;
let isConfigured = false;

try {
  const module = await import("./config.js");
  firebaseConfig = module.firebaseConfig;
  if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    isConfigured = true;
  }
} catch (e) {
  console.warn("config.js not found or unconfigured. Operating in local demo fallback mode.", e);
}

let app, auth, provider;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
  } catch (e) {
    console.error("Firebase Initialization Error:", e);
    isConfigured = false;
  }
}

// DOM Elements
const signinBtn = document.getElementById('signin-btn');
const signoutBtn = document.getElementById('signout-btn');
const userProfile = document.getElementById('user-profile');
const userPhoto = document.getElementById('user-photo');
const userInitials = document.getElementById('user-initials');
const userName = document.getElementById('user-name');

// Authentication State Listener
if (isConfigured && auth) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      renderLoggedInState({
        displayName: user.displayName || user.email || "Stargazer Explorer",
        photoURL: user.photoURL
      });
    } else {
      renderLoggedOutState();
    }
  });
} else {
  // Check local demo session if config is not present
  const savedDemoUser = localStorage.getItem('cosmohub_demo_user');
  if (savedDemoUser) {
    try {
      renderLoggedInState(JSON.parse(savedDemoUser));
    } catch (e) {
      renderLoggedOutState();
    }
  } else {
    renderLoggedOutState();
  }
}
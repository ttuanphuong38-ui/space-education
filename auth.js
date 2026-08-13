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

// Sign In Action (Google Popup Auth)
if (signinBtn) {
  signinBtn.addEventListener('click', async () => {
    if (isConfigured && auth && provider) {
      try {
        await signInWithPopup(auth, provider);
      } catch (error) {
        console.error("Firebase Auth Popup Error:", error);
        if (error.code === 'auth/popup-closed-by-user') {
          console.info("Sign-in popup closed by user.");
        } else if (error.code === 'auth/unauthorized-domain') {
          alert("Domain unauthorized in Firebase Console. Please add your domain to Firebase Auth -> Settings -> Authorized Domains.");
          triggerDemoSignIn();
        } else {
          alert(`Authentication error: ${error.message || "Failed to sign in"}`);
          triggerDemoSignIn();
        }
      }
    } else {
      // Demo authentication state for testing
      triggerDemoSignIn();
    }
  });
}

// Sign Out Action
if (signoutBtn) {
  signoutBtn.addEventListener('click', async () => {
    if (isConfigured && auth) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Firebase SignOut Error:", error);
      }
    }
    localStorage.removeItem('cosmohub_demo_user');
    renderLoggedOutState();
  });
}

// Helper: Demo Mode Simulation
function triggerDemoSignIn() {
  const demoUser = {
    displayName: "Alex Rover",
    photoURL: null
  };
  localStorage.setItem('cosmohub_demo_user', JSON.stringify(demoUser));
  renderLoggedInState(demoUser);
}

// Render Profile Badge in Header
function renderLoggedInState(user) {
  const name = user.displayName || "Stargazer Explorer";
  if (userName) userName.textContent = name;

  // Derive initials
  const parts = name.trim().split(' ');
  let initials = parts[0] ? parts[0].charAt(0).toUpperCase() : 'S';
  if (parts.length > 1) {
    initials += parts[parts.length - 1].charAt(0).toUpperCase();
  }
  if (userInitials) userInitials.textContent = initials;

  if (user.photoURL && userPhoto) {
    userPhoto.src = user.photoURL;
    userPhoto.style.display = 'block';
    if (userInitials) userInitials.style.display = 'none';
  } else {
    if (userPhoto) userPhoto.style.display = 'none';
    if (userInitials) userInitials.style.display = 'inline-block';
  }

  if (signinBtn) signinBtn.style.display = 'none';
  if (userProfile) userProfile.style.display = 'flex';
}

// Render Signed Out State in Header
function renderLoggedOutState() {
  if (userProfile) userProfile.style.display = 'none';
  if (signinBtn) signinBtn.style.display = 'inline-block';
}

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
const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');
const userProfile = document.getElementById('user-profile');

// Authentication State Listener
if (isConfigured && auth) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      renderLoggedInState({
        displayName: user.displayName || user.email || "Alex Rover",
        email: user.email || "alex.rover@example.com",
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

// Sign Out Action Handler
async function handleSignOut() {
  if (isConfigured && auth) {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Firebase SignOut Error:", error);
    }
  }
  localStorage.removeItem('cosmohub_demo_user');
  renderLoggedOutState();
}

if (signoutBtn) signoutBtn.addEventListener('click', handleSignOut);
if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener('click', handleSignOut);

// Helper: Demo Mode Simulation
function triggerDemoSignIn() {
  const demoUser = {
    displayName: "Alex Rover",
    email: "alex.rover@example.com",
    photoURL: null
  };
  localStorage.setItem('cosmohub_demo_user', JSON.stringify(demoUser));
  renderLoggedInState(demoUser);
}

// Render Logged In State
function renderLoggedInState(user) {
  const name = user.displayName || "Alex Rover";
  const email = user.email || "alex.rover@example.com";
  const photo = user.photoURL;

  // Derive initials
  const parts = name.trim().split(' ');
  let initials = parts[0] ? parts[0].charAt(0).toUpperCase() : 'A';
  if (parts.length > 1) {
    initials += parts[parts.length - 1].charAt(0).toUpperCase();
  }
  
    // 1. Top Navbar: Hide signin-btn and user-profile badge entirely (avoiding redundancy)
  if (signinBtn) signinBtn.style.display = 'none';
  if (userProfile) userProfile.style.display = 'none';

  // 2. Full-Height Sidebar & Dashboard Container layout management
  const dashboardWrapper = document.getElementById('dashboard-wrapper') || document.querySelector('.main-dashboard');
  const sidebar = document.getElementById('user-profile-sidebar');

  // Mini Top Header in Sidebar
  const sidebarMiniPhoto = document.getElementById('sidebar-mini-photo');
  const sidebarMiniInitials = document.getElementById('sidebar-mini-initials');
  const sidebarMiniName = document.getElementById('sidebar-mini-name');

  // Main Profile Card in Sidebar
  const sidebarUserPhoto = document.getElementById('sidebar-user-photo');
  const sidebarUserInitials = document.getElementById('sidebar-user-initials');
  const sidebarUserName = document.getElementById('sidebar-user-name');
  const sidebarUserEmail = document.getElementById('sidebar-user-email');

  // Add .logged-in class to shift main content margin & scale cards
  if (dashboardWrapper) {
    dashboardWrapper.classList.add('logged-in');
  }

  // Reveal Full-Height Sidebar
  if (sidebar) {
    sidebar.classList.remove('hidden');
  }

  // Populate mini header info
  if (sidebarMiniName) sidebarMiniName.textContent = name;
  if (sidebarMiniInitials) sidebarMiniInitials.textContent = initials;
  if (photo && sidebarMiniPhoto) {
    sidebarMiniPhoto.src = photo;
    sidebarMiniPhoto.style.display = 'block';
    if (sidebarMiniInitials) sidebarMiniInitials.style.display = 'none';
  } else {
    if (sidebarMiniPhoto) sidebarMiniPhoto.style.display = 'none';
    if (sidebarMiniInitials) sidebarMiniInitials.style.display = 'inline-flex';
  }

    // Populate main profile card info
  if (sidebarUserName) sidebarUserName.textContent = name;
  if (sidebarUserEmail) sidebarUserEmail.textContent = email;
  if (sidebarUserInitials) sidebarUserInitials.textContent = initials;

  if (photo && sidebarUserPhoto) {
    sidebarUserPhoto.src = photo;
    sidebarUserPhoto.style.display = 'block';
    if (sidebarUserInitials) sidebarUserInitials.style.display = 'none';
  } else {
    if (sidebarUserPhoto) sidebarUserPhoto.style.display = 'none';
    if (sidebarUserInitials) sidebarUserInitials.style.display = 'inline-flex';
  }
}

// Render Signed Out State
function renderLoggedOutState() {
  // Restore top navbar Sign In button
  if (userProfile) userProfile.style.display = 'none';
  if (signinBtn) signinBtn.style.display = 'inline-block';

  // Hide full-height sidebar & remove .logged-in class
  const dashboardWrapper = document.getElementById('dashboard-wrapper') || document.querySelector('.main-dashboard');
  const sidebar = document.getElementById('user-profile-sidebar');

  if (dashboardWrapper) {
    dashboardWrapper.classList.remove('logged-in');
  }

  if (sidebar) {
    sidebar.classList.add('hidden');
  }
}

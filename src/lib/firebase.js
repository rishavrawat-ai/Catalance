// Firebase configuration - Lazy initialization for Google Sign-In only
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut,
  getRedirectResult
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCLkOGe32zAIwoR9QU9MIBp01UULzCnoIM",
  authDomain: "catalance-4dc1b.firebaseapp.com",
  projectId: "catalance-4dc1b",
  storageBucket: "catalance-4dc1b.firebasestorage.app",
  messagingSenderId: "834949784476",
  appId: "1:834949784476:web:c10c7b6c16220588d55e59",
  measurementId: "G-QZSX8XNK1K"
};

// Lazy initialization - only initialize when needed
let app = null;
let auth = null;
let googleProvider = null;

const initializeFirebase = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    // Add additional scopes
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
  }
  return { app, auth, googleProvider };
};

// Google Sign In with popup - uses a workaround for COOP issues
export const signInWithGoogle = async () => {
  try {
    const { auth, googleProvider } = initializeFirebase();
    
    // Set custom parameters to help with popup blocking
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed. Please try again.');
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked. Please allow popups for this site.');
    }
    if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in was cancelled. Please try again.');
    }
    
    throw error;
  }
};

// Sign Out
export const firebaseSignOut = async () => {
  try {
    if (auth) {
      await signOut(auth);
    }
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};

// Check for redirect result (call this on page load if using redirect flow)
export const checkRedirectResult = async () => {
  try {
    const { auth } = initializeFirebase();
    const result = await getRedirectResult(auth);
    if (result?.user) {
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("Redirect result error:", error);
    return null;
  }
};

export { initializeFirebase };


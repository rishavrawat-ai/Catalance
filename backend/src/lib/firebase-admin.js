import admin from "firebase-admin";

// Initialize Firebase Admin SDK
// For production, set GOOGLE_APPLICATION_CREDENTIALS environment variable 
// pointing to your service account JSON file
// For development, we initialize without a service account (works for token verification)

let firebaseApp;

try {
  // Check if already initialized
  firebaseApp = admin.app();
} catch (error) {
  // Initialize with project config from environment variables
  // This allows token verification without a service account file
  firebaseApp = admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || "catalance-4dc1b"
  });
}

export const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email?.split("@")[0],
      picture: decodedToken.picture,
      emailVerified: decodedToken.email_verified
    };
  } catch (error) {
    console.error("Firebase token verification error:", error);
    throw new Error("Invalid or expired Firebase token");
  }
};

export { firebaseApp };

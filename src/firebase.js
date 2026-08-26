// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase Web App configuration for MediVault Web
const firebaseConfig = {
  apiKey: "AIzaSyCwPo5CSKG2F-mWhnPzHDRXTQzpYHLMMDU",
  authDomain: "medivault-25b44.firebaseapp.com",
  projectId: "medivault-25b44",
  storageBucket: "medivault-25b44.firebasestorage.app",
  messagingSenderId: "360528164372",
  appId: "1:360528164372:web:e137d9e4a6f91ef43d1901"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
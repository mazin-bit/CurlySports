"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDlcXXgZE0uF5ZvFGAET_Kug9lR9nLWC0g",
  authDomain: "curlysports-mazin.firebaseapp.com",
  projectId: "curlysports-mazin",
  storageBucket: "curlysports-mazin.firebasestorage.app",
  messagingSenderId: "470168373566",
  appId: "1:470168373566:web:3b9aa37804307750dbc46f",
  measurementId: "G-V4PBQSWJNQ",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);

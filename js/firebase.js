import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
export const firebaseConfig={"apiKey": "AIzaSyBc-zCwcSNsVupzAAHWeUWKGHLdcrzg2iQ", "authDomain": "erp-pro-7307c.firebaseapp.com", "projectId": "erp-pro-7307c", "storageBucket": "erp-pro-7307c.firebasestorage.app", "messagingSenderId": "481869823115", "appId": "1:481869823115:web:68ea96d2a4ef5b732fa88e"};
export const app=initializeApp(firebaseConfig);
export const auth=getAuth(app);
export const db=getFirestore(app);

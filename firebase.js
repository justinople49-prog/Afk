
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBOjOAW6MdfkEfY4r65I9THiIyUGz9lWEA",
    authDomain: "justin-3365d.firebaseapp.com",
    projectId: "justin-3365d",
    storageBucket: "justin-3365d.firebasestorage.app",
    messagingSenderId: "396886450999",
    appId: "1:396886450999:web:afee6483229115bd5370b2",
    measurementId: "G-6NNDS2R2KS"
};

const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const authReady = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
    });
});



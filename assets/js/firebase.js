import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA9ZL3_rc_J1372jLSIysGxA5K_jGwhoxM",
    authDomain: "cryptacks-3bf26.firebaseapp.com",
    projectId: "cryptacks-3bf26",
    storageBucket: "cryptacks-3bf26.firebasestorage.app",
    messagingSenderId: "1001361683765",
    appId: "1:1001361683765:web:eb9edf28a14a6b9d32087c"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

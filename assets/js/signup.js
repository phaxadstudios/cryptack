// assets/js/signup.js

import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


const signupForm = document.getElementById("signupForm");


signupForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;


    if (!name || !email || !password) {
        showToast("Please fill in all fields.");
        return;
    }


    const button = signupForm.querySelector("button[type='submit']");

    button.disabled = true;
    button.textContent = "Creating account...";


    try {

        // Create Firebase Authentication account
        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = userCredential.user;


        // Create the user's Firestore profile
        await setDoc(doc(db, "users", user.uid), {

            uid: user.uid,

            name: name,

            email: user.email,

            balance: 0,

            invested: 0,

            returns: 0,

            createdAt: serverTimestamp()

        });


        // Go to dashboard
        window.location.href = "dashboard.html";


    } catch (error) {

        console.error("Signup error:", error);


        let message = "Unable to create account.";


        switch (error.code) {

            case "auth/email-already-in-use":
                message = "An account with this email already exists.";
                break;

            case "auth/invalid-email":
                message = "Please enter a valid email address.";
                break;

            case "auth/weak-password":
                message = "Password must be at least 6 characters.";
                break;

            case "auth/network-request-failed":
                message = "Network error. Please check your internet connection.";
                break;

            default:
                message = error.message || message;
        }


        showToast(message);


        button.disabled = false;
        button.textContent = "Create Account";
    }

});

// assets/js/login.js

import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


const loginForm = document.getElementById("loginForm");


loginForm.addEventListener("submit", async function (e) {

    e.preventDefault();


    const email = document
        .getElementById("email")
        .value
        .trim()
        .toLowerCase();

    const password =
        document.getElementById("password").value;


    if (!email || !password) {
        showToast("Please enter your email and password.");
        return;
    }


    const button =
        loginForm.querySelector("button[type='submit']");


    button.disabled = true;
    button.textContent = "Logging in...";


    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );


        // Firebase keeps the user signed in.
        window.location.href = "dashboard.html";


    } catch (error) {

        console.error("Login error:", error);


        let message = "Invalid email or password.";


        switch (error.code) {

            case "auth/invalid-credential":
            case "auth/wrong-password":
            case "auth/user-not-found":
                message = "Invalid email or password.";
                break;

            case "auth/invalid-email":
                message = "Please enter a valid email address.";
                break;

            case "auth/too-many-requests":
                message = "Too many login attempts. Please try again later.";
                break;

            case "auth/network-request-failed":
                message = "Network error. Please check your internet connection.";
                break;

            default:
                message = error.message || message;
        }


        showToast(message);


        button.disabled = false;
        button.textContent = "Login";

    }

});

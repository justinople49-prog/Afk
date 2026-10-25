
/* ======================================================
   READQUEST — FIREBASE LOGIN
====================================================== */

import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

/* DOM ELEMENTS */
const background = document.querySelector(".pixel-background");
const loginForm = document.getElementById("loginForm");
const loader = document.getElementById("loader");
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");
const cursorGlow = document.getElementById("cursorGlow");

/* PAGE LOADER */
window.addEventListener("load", () => {
    if (loader) {
        loader.style.opacity = "0";

        setTimeout(() => {
            loader.style.display = "none";
        }, 500);
    }
});

/* BACKGROUND PARALLAX */
if (background) {
    document.addEventListener("mousemove", (event) => {
        const x = event.clientX / window.innerWidth;
        const y = event.clientY / window.innerHeight;

        background.style.transform =
            `translate(${x * 10}px, ${y * 10}px)`;
    });
}

/* CURSOR GLOW */
if (cursorGlow) {
    document.addEventListener("mousemove", (event) => {
        cursorGlow.style.left = `${event.clientX}px`;
        cursorGlow.style.top = `${event.clientY}px`;
    });
}

/* SHOW / HIDE PASSWORD */
if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
        const showPassword = passwordInput.type === "password";

        passwordInput.type = showPassword ? "text" : "password";

        togglePassword.innerHTML = showPassword
            ? '<i class="fa-solid fa-eye-slash"></i>'
            : '<i class="fa-solid fa-eye"></i>';
    });
}

/* FIREBASE LOGIN */
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const emailInput = document.getElementById("email");
        const email = emailInput?.value.trim() ?? "";
        const password = passwordInput?.value ?? "";
        const submitButton = loginForm.querySelector(
            'button[type="submit"]'
        );

        if (!email || !password) {
            alert("Please enter your email and password.");
            return;
        }

        const originalButtonHTML = submitButton?.innerHTML;

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';
        }

        try {
            const credential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const firebaseUser = credential.user;
            const profileRef = doc(db, "users", firebaseUser.uid);
            const profileSnapshot = await getDoc(profileRef);

            if (!profileSnapshot.exists()) {
                await signOut(auth);

                alert(
                    "Your account exists, but its ReadQuest profile is missing. " +
                    "Please contact the project administrator to repair the profile."
                );
                return;
            }

            const profile = profileSnapshot.data();

            // Use the authenticated Firebase UID, never a client-supplied ID.
            const user = {
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                username: profile.username ?? "",
                displayName:
                    profile.displayName ??
                    firebaseUser.displayName ??
                    profile.username ??
                    "",
                email: firebaseUser.email ?? "",
                xp: Number(profile.xp ?? 0),
                level: Number(profile.level ?? 1),
                profilePicture: profile.profilePicture ?? ""
            };

            localStorage.setItem("user", JSON.stringify(user));

            window.location.href = "dashboard.html";
        } catch (error) {
            console.error("Firebase login error:", error.code, error.message);

            const messages = {
                "auth/invalid-email":
                    "Please enter a valid email address.",
                "auth/invalid-credential":
                    "Incorrect email or password.",
                "auth/user-not-found":
                    "No account was found for this email.",
                "auth/wrong-password":
                    "Incorrect email or password.",
                "auth/too-many-requests":
                    "Too many attempts. Please wait before trying again.",
                "auth/network-request-failed":
                    "Network error. Check your internet connection.",
                "permission-denied":
                    "ReadQuest couldn't access your profile. Check Firestore security rules."
            };

            alert(
                messages[error.code] ??
                "Login failed. Please try again."
            );
        } finally {
            if (submitButton) {
                submitButton.disabled = false;

                if (originalButtonHTML !== undefined) {
                    submitButton.innerHTML = originalButtonHTML;
                }
            }
        }
    });
}

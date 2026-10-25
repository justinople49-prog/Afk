
import { auth, db } from "./firebase.js";
import {
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import {
    doc,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");
    const usernameInput = document.getElementById("username");
    const displayNameInput = document.getElementById("displayName");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const signupButton = signupForm?.querySelector('button[type="submit"]');
    const passwordMessage = document.getElementById("passwordMessage");
    const togglePassword = document.getElementById("togglePassword");
    const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

    if (!signupForm || !usernameInput || !displayNameInput ||
        !emailInput || !passwordInput || !confirmPasswordInput) {
        console.error("Signup form is missing one or more required elements.");
        return;
    }

    function checkPasswords() {
        const password = passwordInput.value;
        const confirmation = confirmPasswordInput.value;

        if (!confirmation) {
            if (passwordMessage) passwordMessage.textContent = "";
            return true;
        }

        const matches = password === confirmation;
        if (passwordMessage) {
            passwordMessage.textContent = matches
                ? "Passwords match ✓"
                : "Passwords do not match.";
            passwordMessage.style.color = matches ? "#6dffb0" : "#ff8a8a";
        }
        return matches;
    }

    passwordInput.addEventListener("input", checkPasswords);
    confirmPasswordInput.addEventListener("input", checkPasswords);

    function setupPasswordToggle(button, input, label) {
        if (!button || !input) return;

        button.addEventListener("click", () => {
            const show = input.type === "password";
            input.type = show ? "text" : "password";
            button.innerHTML = show
                ? '<i class="fa-solid fa-eye-slash"></i>'
                : '<i class="fa-solid fa-eye"></i>';
            button.setAttribute("aria-label", show ? `Hide ${label}` : `Show ${label}`);
        });
    }

    setupPasswordToggle(togglePassword, passwordInput, "Password");
    setupPasswordToggle(toggleConfirmPassword, confirmPasswordInput, "Confirm Password");

    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = usernameInput.value.trim();
        const displayName = displayNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!username || !displayName || !email || !password ||
            !confirmPasswordInput.value) {
            alert("Please complete all fields.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        if (!checkPasswords()) {
            alert("Please make sure both passwords match.");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        if (username.length > 30 || displayName.length > 60) {
            alert("Username must be 30 characters or fewer, and display name 60 or fewer.");
            return;
        }

        if (signupButton) {
            signupButton.disabled = true;
            signupButton.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';
        }

        let createdUser = null;

        try {
            const credential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            createdUser = credential.user;

            await updateProfile(createdUser, { displayName });

            const usernameKey = username.toLowerCase();
            const usernameRef = doc(db, "usernames", usernameKey);
            const userRef = doc(db, "users", createdUser.uid);

            await runTransaction(db, async (transaction) => {
                const usernameSnapshot = await transaction.get(usernameRef);

                if (usernameSnapshot.exists()) {
                    throw new Error("That username is already taken. Please choose another.");
                }

                transaction.set(usernameRef, {
                    uid: createdUser.uid,
                    createdAt: serverTimestamp()
                });

                transaction.set(userRef, {
                    uid: createdUser.uid,
                    username,
                    usernameKey,
                    displayName,
                    email,
                    xp: 0,
                    level: 1,
                    createdAt: serverTimestamp()
                });
            });

            alert("🎉 Account created successfully!\n\nWelcome to ReadQuest!");
            window.location.href = "login.html";
        } catch (error) {
            console.error("SIGN UP ERROR:", error);

            if (createdUser) {
                alert(
                    "Your Firebase account may have been created, but the profile could not be saved. " +
                    "Please don't repeatedly sign up with the same email. Check the Firestore Rules, " +
                    "then sign in or contact the project administrator to finish setting up the profile."
                );
            } else {
                const messages = {
                    "auth/email-already-in-use": "This email is already registered. Please log in instead.",
                    "auth/invalid-email": "Please enter a valid email address.",
                    "auth/weak-password": "Please choose a stronger password.",
                    "auth/operation-not-allowed": "Email/password sign-in is not enabled in Firebase."
                };

                alert(messages[error.code] || error.message || "Unable to create account.");
            }
        } finally {
            if (signupButton) {
                signupButton.disabled = false;
                signupButton.innerHTML =
                    '<span>Sign Up</span><i class="fa-solid fa-arrow-right"></i>';
            }
        }
    });
});

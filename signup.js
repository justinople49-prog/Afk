
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
  const togglePassword = document.getElementById("togglePassword");
  const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

  if (
    !signupForm ||
    !usernameInput ||
    !displayNameInput ||
    !emailInput ||
    !passwordInput ||
    !confirmPasswordInput
  ) {
    console.error("Signup form is missing required elements.");
    return;
  }

  function checkPasswords() {
    return passwordInput.value === confirmPasswordInput.value;
  }

  function setupPasswordToggle(button, input, label) {
    if (!button || !input) return;

    button.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";

      button.innerHTML = show
        ? '<i class="fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';

      button.setAttribute(
        "aria-label",
        show ? `Hide ${label}` : `Show ${label}`
      );
    });
  }

  setupPasswordToggle(togglePassword, passwordInput, "password");
  setupPasswordToggle(
    toggleConfirmPassword,
    confirmPasswordInput,
    "confirm password"
  );

  confirmPasswordInput.addEventListener("input", () => {
    confirmPasswordInput.setCustomValidity(
      checkPasswords() ? "" : "Passwords do not match."
    );
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const displayName = displayNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (
      !username ||
      !displayName ||
      !email ||
      !password ||
      !confirmPasswordInput.value
    ) {
      alert("Please complete all fields.");
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      alert(
        "Username must be 3–30 characters and contain only letters, numbers, or underscores."
      );
      return;
    }

    if (displayName.length > 60) {
      alert("Display name must be 60 characters or fewer.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (!checkPasswords()) {
      alert("Passwords do not match.");
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
          throw new Error(
            "That username is already taken. Please choose another."
          );
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
          avatarId: "classic",
          xp: 0,
          level: 1,
          createdAt: serverTimestamp()
        });
      });

      alert("Account created successfully! Welcome to ReadQuest.");

      window.location.href = "dashboard.html";
    } catch (error) {
      console.error("Sign-up error:", error.code, error.message);

      if (createdUser) {
        alert(
          "Your Firebase account was created, but saving your profile failed. " +
          "Do not repeatedly sign up with the same email. " +
          "Please check the Firestore Rules and Firebase Console."
        );
      } else {
        const messages = {
          "auth/email-already-in-use":
            "This email is already registered. Please log in instead.",
          "auth/invalid-email":
            "Please enter a valid email address.",
          "auth/weak-password":
            "Please choose a stronger password.",
          "auth/operation-not-allowed":
            "Email/password sign-in is not enabled in Firebase.",
          "auth/network-request-failed":
            "Network error. Check your internet connection."
        };

        alert(
          messages[error.code] ||
          error.message ||
          "Unable to create account."
        );
      }
    } finally {
      if (signupButton) {
        signupButton.disabled = false;
        signupButton.innerHTML =
          "<span>Sign Up</span><i class=\"fa-solid fa-arrow-right\"></i>";
      }
    }
  });
});


import { auth, db, authReady } from "./firebase.js";

import {
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

const AVATARS = [
    { id: "classic", name: "Classic Capybara", src: "images/hero/bear.png" },
    { id: "king", name: "King Capybara", src: "images/hero/bunny.png" },
    { id: "magic", name: "Magic Capybara", src: "images/hero/dog.png" },
    { id: "explorer", name: "Explorer Capybara", src: "images/hero/fox.png" },
    { id: "flower", name: "Flower Capybara", src: "images/hero/frog.png" },
    { id: "bookworm", name: "Bookworm Capybara", src: "images/hero/owl.png" }
];

let currentUser = null;
let profileData = {};
let selectedAvatarId = "classic";
let savedAvatarId = "classic";
let isSaving = false;

function showStatus(message, type = "") {
    const status = $("statusMessage");
    status.textContent = message;
    status.className = type;
}

function getAvatar(id) {
    return AVATARS.find((avatar) => avatar.id === id) || AVATARS[0];
}

function renderAvatarChoices() {
    const grid = $("avatarGrid");
    grid.replaceChildren();

    AVATARS.forEach((avatar) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "avatar-option";
        button.dataset.avatarId = avatar.id;
        button.setAttribute("aria-pressed", "false");
        button.setAttribute("aria-label", `Choose ${avatar.name}`);

        const image = document.createElement("img");
        image.src = avatar.src;
        image.alt = avatar.name;
        image.width = 160;
        image.height = 160;

        image.addEventListener("error", () => {
            console.error("Avatar image could not be loaded:", avatar.src);
            button.disabled = true;
            button.title = `Image not found: ${avatar.src}`;
        });

        const name = document.createElement("span");
        name.textContent = avatar.name;

        const selectedLabel = document.createElement("small");
        selectedLabel.className = "selected-label";

        button.append(image, name, selectedLabel);

        button.addEventListener("click", () => {
            selectedAvatarId = avatar.id;
            updateAvatarSelection();
        });

        grid.appendChild(button);
    });

    updateAvatarSelection();
}

function updateAvatarSelection() {
    const avatar = getAvatar(selectedAvatarId);

    $("profileImage").src = avatar.src;
    $("profileImage").alt = avatar.name;

    document.querySelectorAll(".avatar-option").forEach((button) => {
        const selected = button.dataset.avatarId === selectedAvatarId;

        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));

        const label = button.querySelector(".selected-label");
        label.textContent = selected ? "✓ Selected" : "";
    });
}

function openAvatarPicker() {
    savedAvatarId = selectedAvatarId;
    $("avatarModal").hidden = false;
    document.body.style.overflow = "hidden";
    updateAvatarSelection();
    $("closeAvatarBtn").focus();
}

function closeAvatarPicker() {
    $("avatarModal").hidden = true;
    document.body.style.overflow = "";
}

function cancelAvatarPicker() {
    selectedAvatarId = savedAvatarId;
    updateAvatarSelection();
    closeAvatarPicker();
    $("openAvatarBtn").focus();
}

function getLessonCount() {
    return ["basicCompleted", "Vocabulary-game"]
        .filter((key) => localStorage.getItem(key) === "true").length;
}

function getGameCount() {
    try {
        const data = JSON.parse(localStorage.getItem("readquest") || "null");
        return Math.max(0, Number(data?.gamesCompleted) || 0);
    } catch {
        return 0;
    }
}

function getAchievementCount() {
    try {
        const achievements = JSON.parse(
            localStorage.getItem("achievements") || "[]"
        );

        if (Array.isArray(achievements)) {
            const count = achievements.filter(
                (item) => item?.completed === true || item?.Completed === true
            ).length;

            if (count > 0) return count;
        }
    } catch (error) {
        console.warn("Could not read achievements:", error);
    }

    return [
        "basicCompleted",
        "homeCompleted",
        "schoolCompleted",
        "normalCompleted",
        "hardCompleted"
    ].filter((key) => localStorage.getItem(key) === "true").length;
}

function renderProfile(profile = {}) {
    if (!currentUser) return;

    const name = profile.displayName
        || currentUser.displayName
        || profile.username
        || "Player";

    const xp = Math.max(0, Number(profile.xp) || 0);
    const level = Math.max(1, Number(profile.level) || 1);
    const xpForNextLevel = level * 100;
    const progress = Math.min(100, (xp / xpForNextLevel) * 100);

    $("profileName").textContent = name;
    $("displayName").textContent = name;
    $("email").textContent = currentUser.email || profile.email || "";
    $("levelDisplay").textContent = `Level ${level}`;
    $("xpCurrent").textContent = `${xp} XP`;
    $("xpRequired").textContent = `${xp} / ${xpForNextLevel}`;
    $("xpFill").style.width = `${progress}%`;
    $("xpProgress").setAttribute("aria-valuenow", String(Math.round(progress)));

    $("lessonsDisplay").textContent = getLessonCount();
    $("gamesDisplay").textContent = getGameCount();
    $("achievementsDisplay").textContent = getAchievementCount();
    $("newDisplayName").value = name;

    selectedAvatarId = getAvatar(profile.avatarId).id;
    savedAvatarId = selectedAvatarId;
    updateAvatarSelection();

    localStorage.setItem("user", JSON.stringify({
        id: currentUser.uid,
        uid: currentUser.uid,
        username: profile.username || "",
        displayName: name,
        email: currentUser.email || profile.email || "",
        xp,
        level,
        avatarId: selectedAvatarId,
        profilePicture: getAvatar(selectedAvatarId).src
    }));
}

async function loadProfile(user) {
    const profileRef = doc(db, "users", user.uid);
    let snapshot = await getDoc(profileRef);

    if (auth.currentUser?.uid !== user.uid) return;

    if (!snapshot.exists()) {
        // Creating a profile must be permitted by your Firestore rules.
        await setDoc(profileRef, {
            uid: user.uid,
            displayName: user.displayName || "Player",
            username: "",
            email: user.email || "",
            xp: 0,
            level: 1,
            avatarId: "classic",
            createdAt: serverTimestamp()
        });

        snapshot = await getDoc(profileRef);
    }

    if (!snapshot.exists() || auth.currentUser?.uid !== user.uid) return;

    currentUser = user;
    profileData = snapshot.data();
    renderProfile(profileData);
}

async function saveProfile(event) {
    event.preventDefault();

    if (isSaving) return;

    const user = auth.currentUser;
    if (!user) {
        showStatus("Please sign in again before saving.", "error");
        return;
    }

    const name = $("newDisplayName").value.trim();

    if (!name || name.length > 30) {
        showStatus("Display name must contain 1–30 characters.", "error");
        $("newDisplayName").focus();
        return;
    }

    if (!AVATARS.some((avatar) => avatar.id === selectedAvatarId)) {
        showStatus("Please choose a valid avatar.", "error");
        return;
    }

    isSaving = true;
    $("saveBtn").disabled = true;
    $("saveBtn").textContent = "Saving...";
    showStatus("Saving your profile...");

    try {
        const profileRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(profileRef);

        if (auth.currentUser?.uid !== user.uid) {
            throw new Error("Your sign-in changed. Please sign in again.");
        }

        if (snapshot.exists()) {
            await setDoc(profileRef, {
                displayName: name,
                avatarId: selectedAvatarId,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } else {
            await setDoc(profileRef, {
                uid: user.uid,
                displayName: name,
                username: "",
                email: user.email || "",
                xp: 0,
                level: 1,
                avatarId: selectedAvatarId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        const savedSnapshot = await getDoc(profileRef);

        if (!savedSnapshot.exists()) {
            throw new Error("The saved profile could not be found.");
        }

        const savedProfile = savedSnapshot.data();

        if (
            savedProfile.displayName !== name ||
            savedProfile.avatarId !== selectedAvatarId
        ) {
            throw new Error("Saved values do not match your selection.");
        }

        profileData = savedProfile;
        renderProfile(profileData);

        try {
            if (user.displayName !== name) {
                await updateProfile(user, { displayName: name });
            }
        } catch (error) {
            console.warn("Firebase Auth display name update failed:", error);
        }

        showStatus("Profile saved successfully! 🎉", "success");
    } catch (error) {
        console.error("Profile save failed:", error);
        console.error("Firebase error code:", error.code || "none");

        showStatus(
            error.code === "permission-denied"
                ? "Firestore denied the save. Check your published rules and signed-in account."
                : `Could not save profile: ${error.message || "Unknown error"}`,
            "error"
        );
    } finally {
        isSaving = false;
        $("saveBtn").disabled = false;
        $("saveBtn").textContent = "💾 Save Profile";
    }
}

function setupAvatarPicker() {
    $("openAvatarBtn").addEventListener("click", openAvatarPicker);

    $("closeAvatarBtn").addEventListener("click", cancelAvatarPicker);
    $("cancelAvatarBtn").addEventListener("click", cancelAvatarPicker);

    $("confirmAvatarBtn").addEventListener("click", () => {
        closeAvatarPicker();
        $("openAvatarBtn").focus();
    });

    $("avatarModal").addEventListener("click", (event) => {
        if (event.target === $("avatarModal")) {
            cancelAvatarPicker();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !$("avatarModal").hidden) {
            cancelAvatarPicker();
        }
    });
}

renderAvatarChoices();
setupAvatarPicker();
$("profileForm").addEventListener("submit", saveProfile);

authReady.then(() => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            currentUser = null;
            window.location.href = "login.html";
            return;
        }

        currentUser = user;

        try {
            await loadProfile(user);
        } catch (error) {
            console.error("Profile load failed:", error);

            showStatus(
                error.code === "permission-denied"
                    ? "Cannot access your Firestore profile. Check your security rules."
                    : `Could not load profile: ${error.message || "Unknown error"}`,
                "error"
            );
        }
    });
}).catch((error) => {
    console.error("Firebase initialization failed:", error);
    showStatus("Could not initialize sign-in. Please refresh.", "error");
});


import { auth, db, authReady } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
  collection,
  getDocs,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const leaderboardList = document.getElementById("leaderboardList");
const playerCount = document.getElementById("playerCount");


const AVATARS = {
  bear: "images/hero/bear.png",
  bunny: "images/hero/bunny.png",
  dog: "images/hero/dog.png",
  fox: "images/hero/fox.png",
  frog: "images/hero/frog.png",
  owl: "images/hero/owl.png",

  // IDs used by the profile page
  classic: "images/hero/bear.png",
  king: "images/hero/bunny.png",
  magic: "images/hero/dog.png",
  explorer: "images/hero/fox.png",
  flower: "images/hero/frog.png",
  bookworm: "images/hero/owl.png"
};


function showMessage(message) {
  if (leaderboardList) {
    leaderboardList.textContent = message;
  }
}

function avatarPath(id) {
  return AVATARS[id] || AVATARS.classic;
}

function renderPlayers(players, currentUid) {
  leaderboardList.replaceChildren();

  if (playerCount) {
    playerCount.textContent =
      `${players.length} ${players.length === 1 ? "Player" : "Players"}`;
  }

  if (players.length === 0) {
    showMessage("🏆 No players found.");
    return;
  }

  players.forEach((player, index) => {
    const item = document.createElement("div");
    item.className = "leaderboard-item";

    if (player.uid === currentUid) {
      item.classList.add("current-player");
    }

    const rank = document.createElement("div");
    rank.className = "leaderboard-rank";
    rank.textContent = ["🥇", "🥈", "🥉"][index] || `#${index + 1}`;

    const info = document.createElement("div");
    info.className = "leaderboard-player";

    const avatar = document.createElement("img");
    avatar.className = "leaderboard-avatar";
    avatar.src = avatarPath(player.avatarId);
    avatar.alt = "Player avatar";
    avatar.onerror = () => {
      avatar.onerror = null;
      avatar.src = AVATARS.classic;
    };

    const details = document.createElement("div");
    details.className = "leaderboard-player-info";

    const name = document.createElement("strong");
    name.textContent = player.displayName || player.username || "Player";

    const level = document.createElement("small");
    level.textContent = `Level ${Math.max(1, Number(player.level) || 1)}`;

    details.append(name, level);
    info.append(avatar, details);

    const xp = document.createElement("div");
    xp.className = "leaderboard-xp";
    xp.textContent = `⭐ ${Math.max(0, Number(player.xp) || 0)} XP`;

    item.append(rank, info, xp);
    leaderboardList.appendChild(item);
  });
}

async function loadPlayers(uid) {
  showMessage("Loading leaderboard...");

  const usersQuery = query(
    collection(db, "users"),
    orderBy("xp", "desc"),
    limit(50)
  );

  const snapshot = await getDocs(usersQuery);

  const players = snapshot.docs.map((document) => ({
    ...document.data(),
    uid: document.id
  }));

  players.sort((a, b) => (Number(b.xp) || 0) - (Number(a.xp) || 0));

  renderPlayers(players, uid);
}

async function initialize() {
  if (!leaderboardList) {
    console.error("Leaderboard HTML is missing #leaderboardList.");
    return;
  }

  try {
    await authReady;

    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "login.html";
        return;
      }

      try {
        await loadPlayers(user.uid);
      } catch (error) {
        console.error("Leaderboard loading error:", error);
        showMessage(
          `Could not load leaderboard: ${error.code || error.message || "Unknown error"}`
        );
      }
    });
  } catch (error) {
    console.error("Firebase initialization error:", error);
    showMessage(
      `Firebase error: ${error.code || error.message || "Initialization failed"}`
    );
  }
}

initialize();

const logoutButton = document.getElementById("logoutBtn");

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("user");
      localStorage.removeItem("readquest");
      window.location.href = "login.html";
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Unable to log out. Please try again.");
    }
  });
}

const menuButton = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

if (menuButton && sidebar) {
  menuButton.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    sidebar.classList.toggle("expanded");

    if (overlay) {
      overlay.classList.toggle("show");
    }
  });
}

if (overlay && sidebar) {
  overlay.addEventListener("click", () => {
    sidebar.classList.add("collapsed");
    sidebar.classList.remove("expanded");
    overlay.classList.remove("show");
  });
}

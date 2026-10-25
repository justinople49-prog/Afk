
import { auth, db, authReady } from "./firebase.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const achievements = [
  {
    id: "text_detective",
    title: "Text Detective",
    description: "Complete Text Comprehension.",
    icon: "🔎"
  },
  {
    id: "pixel_choices",
    title: "Pixel Choices",
    description: "Complete Pixel Choices.",
    icon: "🎮"
  },
  {
    id: "authors_purpose",
    title: "Author's Purpose",
    description: "Complete Author's Purpose.",
    icon: "📚"
  },
  {
    id: "lexi_labyrinth",
    title: "Lexi Labyrinth",
    description: "Complete Lexi Labyrinth.",
    icon: "🧩"
  },
  {
    id: "definition_detective",
    title: "Definition Detective",
    description: "Complete Definition Detective.",
    icon: "📖"
  },
  {
    id: "monster_door",
    title: "Monster Door",
    description: "Complete Monster Door.",
    icon: "🚪"
  }
];

const list = document.getElementById("achievementsList");
const counter = document.getElementById("achievementCounter");

function renderAchievements(completedIds = new Set()) {
  if (!list || !counter) {
    console.error("Achievement page elements were not found.");
    return;
  }

  list.replaceChildren();

  for (const achievement of achievements) {
    const completed = completedIds.has(achievement.id);

    const card = document.createElement("article");
    card.className = `achievement-card${completed ? " completed" : ""}`;

    const icon = document.createElement("div");
    icon.className = "achievement-icon";
    icon.textContent = achievement.icon;
    icon.setAttribute("aria-hidden", "true");

    const info = document.createElement("div");
    info.className = "achievement-info";

    const title = document.createElement("h3");
    title.textContent = achievement.title;

    const description = document.createElement("p");
    description.textContent = achievement.description;

    const status = document.createElement("span");
    status.className = "achievement-status";
    status.textContent = completed ? "✓ Completed" : "🔒 Not completed";

    info.append(title, description, status);
    card.append(icon, info);
    list.append(card);
  }

  counter.textContent =
    `Achievements: ${completedIds.size} / ${achievements.length}`;
}

function showMessage(message) {
  if (list) {
    list.replaceChildren();

    const paragraph = document.createElement("p");
    paragraph.textContent = message;
    paragraph.style.color = "#ffffff";
    list.append(paragraph);
  }

  if (counter) {
    counter.textContent = `Achievements: — / ${achievements.length}`;
  }
}

async function loadAchievements() {
  showMessage("Loading your achievements...");

  try {
    if (authReady) {
      await authReady;
    }

    const user = auth.currentUser;

    if (!user) {
      showMessage("Please sign in to view your achievements.");
      return;
    }

    const results = await Promise.all(
      achievements.map(async achievement => {
        const achievementRef = doc(
          db,
          "users",
          user.uid,
          "achievements",
          achievement.id
        );

        const snapshot = await getDoc(achievementRef);

        if (!snapshot.exists()) {
          return null;
        }

        const data = snapshot.data();

        // Support the tracker's existing completed field,
        // as well as records that exist without that field.
        if (data.completed === false) {
          return null;
        }

        return achievement.id;
      })
    );

    const completedIds = new Set(results.filter(Boolean));

    renderAchievements(completedIds);

    console.log(
      `ReadQuest achievements loaded: ${completedIds.size}/${achievements.length}`
    );
  } catch (error) {
    console.error("Could not load achievements:", error);
    showMessage(
      "Could not load achievements. Check your connection and Firestore permissions, then refresh."
    );
  }
}

loadAchievements();

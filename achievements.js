// =========================================
// READQUEST ACHIEVEMENTS
// =========================================

(async function initAchievements() {
    const list = document.getElementById("achievementsList");
    const counter = document.getElementById("achievementCounter");
    const backButton = document.getElementById("backButton");

    if (backButton) {
        backButton.addEventListener("click", () => {
            window.location.href = "profile.html";
        });
    }

    if (!list || !counter) {
        console.error("Missing achievement page elements.");
        return;
    }

    const icons = {
        text_detective: "🔎",
        pixel_choices: "🎮",
        authors_purpose: "✍️",
        lexi_labyrinth: "🌀",
        definition_detective: "📚",
        monster_door: "🚪"
    };

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function showError(message) {
        list.innerHTML = "";

        const messageElement = document.createElement("div");
        messageElement.className = "achievement-card";
        messageElement.textContent = message;
        list.appendChild(messageElement);
    }

    function addStyles() {
        if (document.getElementById("achievement-extra-styles")) return;

        const style = document.createElement("style");
        style.id = "achievement-extra-styles";
        style.textContent = `
            #achievementsList {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                gap: 16px;
            }

            .achievement-category {
                grid-column: 1 / -1;
                color: #ffe29a;
                margin: 16px 0 0;
            }

            .achievement-card {
                display: flex;
                gap: 14px;
                padding: 18px;
                border: 2px solid #394266;
                border-radius: 14px;
                background: linear-gradient(145deg, #171b37, #252b4b);
                color: #fff;
                box-sizing: border-box;
            }

            .achievement-card.completed {
                border-color: #e8bd53;
                background: linear-gradient(145deg, #282746, #39314f);
            }

            .achievement-icon {
                display: grid;
                place-items: center;
                flex: 0 0 52px;
                width: 52px;
                height: 52px;
                border-radius: 12px;
                background: #10142b;
                font-size: 27px;
            }

            .achievement-info {
                min-width: 0;
            }

            .achievement-info h3 {
                margin: 0 0 8px;
                color: #ffe29a;
                font-size: 17px;
            }

            .achievement-info p {
                margin: 0 0 10px;
                color: #d7dbef;
                font-size: 13px;
                line-height: 1.5;
            }

            .achievement-status {
                font-size: 12px;
                font-weight: bold;
            }

            .achievement-reward {
                margin-top: 9px;
                color: #9ff0bd;
                font-size: 13px;
                font-weight: bold;
            }

            .achievement-summary {
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 18px;
                padding: 14px;
                border: 1px solid #394266;
                border-radius: 12px;
                background: #171b37;
                color: white;
            }

            .achievement-summary strong {
                color: #ffe29a;
            }
        `;

        document.head.appendChild(style);
    }

    try {
        addStyles();

        list.textContent = "Loading achievements...";

        // Import the existing Firebase configuration.
       const firebase = await import("./firebase.js");

        // Wait for Firebase authentication to initialize.
        const user = firebase.authReady
            ? await firebase.authReady
            : firebase.auth.currentUser;

        if (!user) {
            window.location.href = "login.html";
            return;
        }

        const token = await user.getIdToken();

         const response = await fetch(
    "http://localhost:3000/api/achievements",
    {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    }
);

const responseText = await response.text();

let data;

try {
    data = JSON.parse(responseText);
} catch (error) {
    console.error("API returned non-JSON content:", {
        status: response.status,
        url: response.url,
        response: responseText.slice(0, 500)
    });

    throw new Error(
        `Expected JSON but received HTML or other content (HTTP ${response.status}). Check the server URL and route.`
    );
}

if (!response.ok || !data.success) {
    throw new Error(
        data.message || `Server error: HTTP ${response.status}`
    );
}

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || `Server returned ${response.status}.`
            );
        }

        const achievements = data.achievements || [];

        const completedCount = achievements.filter(
            item => item.completed
        ).length;

        counter.textContent =
            `Achievements: ${completedCount} / ${achievements.length}`;

        // Show the summary above the achievement cards.
        let summary = document.getElementById("achievementSummary");

        if (!summary) {
            summary = document.createElement("div");
            summary.id = "achievementSummary";
            summary.className = "achievement-summary";
            list.parentElement.insertBefore(summary, list);
        }

        const totalXPFromAchievements = achievements
            .filter(item => item.rewarded)
            .reduce((total, item) => total + (Number(item.rewardXP) || 10), 0);

        summary.innerHTML = `
            <span>🏆 Unlocked: <strong>${completedCount}/${achievements.length}</strong></span>
            <span>⭐ Achievement XP: <strong>${totalXPFromAchievements}</strong></span>
            <span>🎯 Level: <strong>${Number(data.level) || 1}</strong></span>
            <span>✨ Total XP: <strong>${Number(data.totalXP) || 0}</strong></span>
        `;

        list.innerHTML = "";

        const categories = ["Text Comprehension", "Vocabulary"];

        for (const category of categories) {
            const games = achievements.filter(
                item => item.category === category
            );

            if (games.length === 0) continue;

            const heading = document.createElement("h2");
            heading.className = "achievement-category";
            heading.textContent = category;
            list.appendChild(heading);

            for (const achievement of games) {
                const completed = achievement.completed === true;
                const icon = icons[achievement.id] || "🏆";

                const card = document.createElement("article");
                card.className = "achievement-card";

                if (completed) {
                    card.classList.add("completed");
                }

                const info = document.createElement("div");
                info.className = "achievement-info";

                const title = document.createElement("h3");
                title.textContent = achievement.title;

                const description = document.createElement("p");
                description.textContent = completed
                    ? "Game achievement unlocked!"
                    : "Complete the game to unlock this achievement.";

                const status = document.createElement("div");
                status.className = "achievement-status";
                status.textContent = completed
                    ? "✅ Completed"
                    : "🔒 Locked";

                const reward = document.createElement("div");
                reward.className = "achievement-reward";
                reward.textContent = achievement.rewarded
                    ? "✓ 10 XP claimed"
                    : "⭐ Reward: 10 XP";

                const iconElement = document.createElement("div");
                iconElement.className = "achievement-icon";
                iconElement.textContent = completed ? icon : "🔒";

                info.append(title, description, status, reward);
                card.append(iconElement, info);
                list.appendChild(card);
            }
        }

        if (achievements.length === 0) {
            showError("No achievements were returned by the server.");
        }
    } catch (error) {
        console.error("Achievement loading error:", error);

        showError(
            `Unable to load achievements: ${error.message}`
        );
    }
})();
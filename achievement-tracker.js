
/**
 * ReadQuest Firebase Achievement Tracker
 *
 * Expected structure:
 * ReadQuest/
 *   firebase.js
 *   js/
 *     achievement-tracker.js
 *
 * Firestore:
 * users/{uid}/achievements/{achievementId}
 */

(async function () {
    "use strict";

    try {
        const { auth, db, authReady } =
            await import("./firebase.js");

        const {
            collection,
            doc,
            getDocs,
            runTransaction,
            serverTimestamp
        } = await import(
            "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js"
        );

        const ACHIEVEMENTS = [
            { id: "text_detective", name: "Text Detective" },
            { id: "pixel_choices", name: "Pixel Choices" },
            { id: "authors_purpose", name: "Author's Purpose" },
            { id: "lexi_labyrinth", name: "Lexi Labyrinth" },
            { id: "definition_detective", name: "Definition Detective" },
            { id: "monster_door", name: "Monster Door" }
        ];

        async function getSignedInUser() {
            await authReady;

            const user = auth.currentUser;

            if (!user) {
                throw new Error(
                    "Please sign in before saving achievements."
                );
            }

            return user;
        }

        window.loadAchievements = async function () {
            const user = await getSignedInUser();

            const achievementsRef = collection(
                db,
                "users",
                user.uid,
                "achievements"
            );

            const snapshot = await getDocs(achievementsRef);

            const saved = new Map();

            snapshot.forEach((item) => {
                saved.set(item.id, item.data());
            });

            return {
                achievements: ACHIEVEMENTS.map((item) => {
                    const record = saved.get(item.id);

                    return {
                        id: item.id,
                        name: item.name,
                        completed: record?.completed === true,
                        completedAt: record?.completedAt ?? null
                    };
                })
            };
        };

        window.reportAchievementCompletion =
            async function (achievementId) {
                const user = await getSignedInUser();

                const knownAchievement = ACHIEVEMENTS.some(
                    (item) => item.id === achievementId
                );

                if (!knownAchievement) {
                    throw new Error(
                        `Unknown achievement: ${achievementId}`
                    );
                }

                const achievementRef = doc(
                    db,
                    "users",
                    user.uid,
                    "achievements",
                    achievementId
                );

                return runTransaction(db, async (transaction) => {
                    const existing =
                        await transaction.get(achievementRef);

                    if (existing.exists()) {
                        return {
                            success: true,
                            alreadyCompleted: true,
                            achievementId
                        };
                    }

                    transaction.set(achievementRef, {
                        achievementId,
                        completed: true,
                        completedAt: serverTimestamp()
                    });

                    return {
                        success: true,
                        alreadyCompleted: false,
                        achievementId
                    };
                });
            };

        console.info("ReadQuest achievement tracker loaded.");
    } catch (error) {
        console.error(
            "Could not initialize the achievement tracker:",
            error
        );
    }
})();

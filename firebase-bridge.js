
import { auth } from "./firebase.js";

window.readQuestFirebase = {
    getIdToken: async function () {
        const user = auth.currentUser;

        if (!user) {
            throw new Error("Please sign in before saving XP.");
        }

        return await user.getIdToken();
    }
};

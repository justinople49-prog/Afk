
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");

const serviceAccountPath = path.join(
    "C:\\",
    "ReadQuest-Secrets",
    "justin-3365d-firebase-adminsdk-fbsvc-30083cf4fb.json"
);

const serviceAccount = require(serviceAccountPath);

if (getApps().length === 0) {
    initializeApp({
        credential: cert(serviceAccount),
        projectId: "justin-3365d"
    });
}

const auth = getAuth();
const db = getFirestore();

module.exports = { auth, db };

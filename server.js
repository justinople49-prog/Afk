const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const { auth, db } = require("./firebaseAdmin");


async function verifyFirebaseUser(req, res, next) {
    const authorization = req.headers.authorization || "";
    const match = authorization.match(/^Bearer (.+)$/);

    if (!match) {
        return res.status(401).json({
            success: false,
            message: "Firebase sign-in is required."
        });
    }

    try {
        const decodedToken = await auth.verifyIdToken(match[1]);
        req.firebaseUser = decodedToken;
        next();
    } catch (error) {
        console.error("Firebase token verification failed:", error.message);

        return res.status(401).json({
            success: false,
            message: "Your sign-in session is invalid or expired."
        });
    }
}


const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));
app.use(cors());
app.use(express.static(__dirname));




// =====================================================
// SQL SERVER CONFIGURATION
// =====================================================

const config = {
    server: "localhost",
    database: "ReadQuestDB",
    user: "sa",
    password: "ReadQuest123!",
    options: {
        instanceName: "SQLEXPRESS",
        encrypt: false,
        trustServerCertificate: true
    }
};

// =====================================================
// DATABASE CONNECTION
// =====================================================

let poolPromise;

async function getPool() {
    if (!poolPromise) {
        poolPromise = sql.connect(config);
    }

    return await poolPromise;
}

// =====================================================
// TEST DATABASE CONNECTION
// =====================================================

async function testDatabase() {
    try {
        const pool = await getPool();

        console.log("=================================");
        console.log("Connected to SQL Server!");
        console.log("Database:", config.database);

        const result = await pool.request().query(`
            SELECT DB_NAME() AS DBName
        `);

        console.log("Current database:", result.recordset[0].DBName);

        console.log("=================================");
    } catch (error) {
        console.error("DATABASE CONNECTION ERROR:");
        console.error(error);
    }
}

testDatabase();


// =====================================================
// SIGN UP
// =====================================================

app.post("/signup", async (req, res) => {

    const {
        username,
        displayName,
        email,
        password
    } = req.body;

    if (!username || !displayName || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please complete all fields."
        });
    }

    try {

        const pool = await getPool();

        // Check username
        const usernameCheck = await pool.request()
            .input("username", sql.NVarChar, username)
            .query(`
                SELECT UserId
                FROM Users
                WHERE Username = @username
            `);

        if (usernameCheck.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Username already exists."
            });
        }

        // Check email
        const emailCheck = await pool.request()
            .input("email", sql.NVarChar, email)
            .query(`
                SELECT UserId
                FROM Users
                WHERE Email = @email
            `);

        if (emailCheck.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Email already exists."
            });
        }

        await pool.request()
            .input("username", sql.NVarChar, username)
            .input("email", sql.NVarChar, email)
            .input("password", sql.NVarChar, password)
            .input("displayName", sql.NVarChar, displayName)
            .query(`
                INSERT INTO Users
                (
                    Username,
                    Email,
                    PasswordHash,
                    DisplayName,
                    Level,
                    XP
                )
                VALUES
                (
                    @username,
                    @email,
                    @password,
                    @displayName,
                    1,
                    0
                )
            `);

        res.json({
            success: true,
            message: "Account created successfully!"
        });

    } catch (error) {

        console.error("SIGNUP ERROR:");
        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// =====================================================
// LOGIN
// =====================================================

app.post("/login", async (req, res) => {

    const {
        email,
        password
    } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required."
        });
    }

    try {

        const pool = await getPool();

        const result = await pool.request()
            .input("email", sql.NVarChar, email)
            .input("password", sql.NVarChar, password)
            .query(`
                SELECT
                    UserId,
                    Username,
                    Email,
                    DisplayName,
                    ProfilePicture,
                    Level,
                    XP
                FROM Users
                WHERE Email = @email
                AND PasswordHash = @password
            `);

        if (result.recordset.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = result.recordset[0];

        res.json({
            success: true,
            message: "Login successful!",

            user: {
                id: user.UserId,
                username: user.Username,
                displayName: user.DisplayName,
                email: user.Email,
                profilePicture: user.ProfilePicture,
                level: user.Level,
                xp: user.XP
            }
        });

    } catch (error) {

        console.error("LOGIN ERROR:");
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
});


// =====================================================
// GET CURRENT USER
// =====================================================

app.get("/api/user/:userId", async (req, res) => {

    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID."
        });
    }

    try {

        const pool = await getPool();

        const result = await pool.request()
            .input("userId", sql.Int, userId)
            .query(`
                SELECT
                    UserId,
                    Username,
                    Email,
                    DisplayName,
                    ProfilePicture,
                    Level,
                    XP
                FROM Users
                WHERE UserId = @userId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const user = result.recordset[0];

        res.json({
            success: true,
            user: {
                id: user.UserId,
                username: user.Username,
                displayName: user.DisplayName,
                email: user.Email,
                profilePicture: user.ProfilePicture,
                level: user.Level,
                xp: user.XP
            }
        });

    } catch (error) {

        console.error("GET USER ERROR:");
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to load user."
        });
    }
});


// =====================================================
// UPDATE PROFILE
// =====================================================

app.post("/updateProfile", async (req, res) => {

    const {
        id,
        displayName,
        profilePicture
    } = req.body;

    const userId = Number(id);

    if (!Number.isInteger(userId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID."
        });
    }

    if (!displayName) {
        return res.status(400).json({
            success: false,
            message: "Display name is required."
        });
    }

    try {

        const pool = await getPool();

        await pool.request()
            .input("userId", sql.Int, userId)
            .input("displayName", sql.NVarChar, displayName)
            .input(
                "profilePicture",
                sql.NVarChar(sql.MAX),
                profilePicture || null
            )
            .query(`
                UPDATE Users
                SET
                    DisplayName = @displayName,
                    ProfilePicture = @profilePicture
                WHERE UserId = @userId
            `);

        res.json({
            success: true,
            message: "Profile updated!"
        });

    } catch (error) {

        console.error("UPDATE PROFILE ERROR:");
        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// =====================================================
// UPDATE XP
// =====================================================

app.post("/updateXP", async (req, res) => {

    const {
        id,
        xp,
        level
    } = req.body;

    const userId = Number(id);
    const userXP = Number(xp);
    const userLevel = Number(level);

    if (!Number.isInteger(userId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID."
        });
    }

    if (!Number.isFinite(userXP) || !Number.isFinite(userLevel)) {
        return res.status(400).json({
            success: false,
            message: "Invalid XP or level."
        });
    }

    try {

        const pool = await getPool();

        await pool.request()
            .input("userId", sql.Int, userId)
            .input("xp", sql.Int, userXP)
            .input("level", sql.Int, userLevel)
            .query(`
                UPDATE Users
                SET
                    XP = @xp,
                    Level = @level
                WHERE UserId = @userId
            `);

        console.log(
            `XP Updated | User: ${userId} | XP: ${userXP} | Level: ${userLevel}`
        );

        res.json({
            success: true,
            message: "XP updated successfully!",
            xp: userXP,
            level: userLevel
        });

    } catch (error) {

        console.error("UPDATE XP ERROR:");
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to update XP."
        });
    }
});


// =====================================================
// LEADERBOARD
// =====================================================

app.get("/leaderboard", async (req, res) => {

    try {

        const pool = await getPool();

        const result = await pool.request().query(`
            SELECT TOP 10
                UserId,
                DisplayName,
                ProfilePicture,
                Level,
                XP
            FROM Users
            ORDER BY
                Level DESC,
                XP DESC,
                DisplayName ASC
        `);

        res.json(result.recordset);

    } catch (error) {

        console.error("LEADERBOARD ERROR:");
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to load leaderboard."
        });
    }
});


// =====================================================
// COMPLETE BASIC LESSON
// =====================================================

app.post("/completeLesson", async (req, res) => {

    const {
        userId,
        lessonId
    } = req.body;

    const userIdNumber = Number(userId);
    const lessonIdNumber = Number(lessonId);

    if (
        !Number.isInteger(userIdNumber) ||
        !Number.isInteger(lessonIdNumber)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid lesson data."
        });
    }

    try {

        const pool = await getPool();

        const existing = await pool.request()
            .input("userId", sql.Int, userIdNumber)
            .input("lessonId", sql.Int, lessonIdNumber)
            .query(`
                SELECT *
                FROM LessonProgress
                WHERE UserId = @userId
                AND LessonId = @lessonId
            `);

        if (existing.recordset.length > 0) {

            await pool.request()
                .input("userId", sql.Int, userIdNumber)
                .input("lessonId", sql.Int, lessonIdNumber)
                .query(`
                    UPDATE LessonProgress
                    SET
                        Completed = 1,
                        ProgressPercent = 100
                    WHERE UserId = @userId
                    AND LessonId = @lessonId
                `);

        } else {

            await pool.request()
                .input("userId", sql.Int, userIdNumber)
                .input("lessonId", sql.Int, lessonIdNumber)
                .query(`
                    INSERT INTO LessonProgress
                    (
                        UserId,
                        LessonId,
                        ProgressPercent,
                        Completed
                    )
                    VALUES
                    (
                        @userId,
                        @lessonId,
                        100,
                        1
                    )
                `);
        }

        res.json({
            success: true,
            message: "Lesson completed!"
        });

    } catch (error) {

        console.error("COMPLETE LESSON ERROR:");
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to save lesson progress."
        });
    }
});


// =====================================================
// GET LESSON PROGRESS
// =====================================================

app.get("/lessonProgress/:userId", async (req, res) => {

    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID."
        });
    }

    try {

        const pool = await getPool();

        const result = await pool.request()
            .input("userId", sql.Int, userId)
            .query(`
                SELECT
                    LessonId,
                    Difficulty,
                    Completed,
                    ProgressPercent,
                    XPEarned,
                    Stars
                FROM LessonProgress
                WHERE UserId = @userId
                ORDER BY LessonId
            `);

        res.json(result.recordset);

    } catch (error) {

        console.error("LESSON PROGRESS ERROR:");
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to load lesson progress."
        });
    }
});


// =====================================================
// COMPLETE LESSON V2
// =====================================================

app.post("/api/lesson/complete", async (req, res) => {

    const {
        userId,
        lessonId,
        difficulty,
        stars
    } = req.body;

    const userIdNumber = Number(userId);
    const lessonIdNumber = Number(lessonId);
    const starsNumber = Number(stars) || 0;

    console.log("=================================");
    console.log("COMPLETE LESSON");
    console.log(req.body);
    console.log("=================================");

    if (
        !Number.isInteger(userIdNumber) ||
        !Number.isInteger(lessonIdNumber)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID or lesson ID."
        });
    }

    if (!difficulty) {
        return res.status(400).json({
            success: false,
            message: "Difficulty is required."
        });
    }

    try {

        const pool = await getPool();

        // -------------------------------------------------
        // CHECK IF ALREADY COMPLETED
        // -------------------------------------------------

        const existing = await pool.request()
            .input("userId", sql.Int, userIdNumber)
            .input("lessonId", sql.Int, lessonIdNumber)
            .input("difficulty", sql.NVarChar, difficulty)
            .query(`
                SELECT *
                FROM LessonProgress
                WHERE UserId = @userId
                AND LessonId = @lessonId
                AND Difficulty = @difficulty
            `);

        if (existing.recordset.length > 0) {

            return res.json({
                success: false,
                alreadyCompleted: true,
                xpEarned: 0,
                message: "Lesson already completed."
            });
        }
             // -------------------------------------------------
// XP REWARD
// -------------------------------------------------

let xpReward = 0;

// Home Vocabulary gets 50 XP upon first completion.
// Other lessons keep their existing difficulty rewards.

if (lessonIdNumber === 2 && difficulty === "Easy") {

    xpReward = 50;

} else {

    switch (difficulty) {

        case "Easy":
            xpReward = 10;
            break;

        case "Normal":
            xpReward = 20;
            break;

        case "Medium":
            xpReward = 20;
            break;

        case "Hard":
            xpReward = 30;
            break;

        default:
            xpReward = 0;
            break;
    }

}
        // -------------------------------------------------
        // GET CURRENT USER
        // -------------------------------------------------

        const userResult = await pool.request()
            .input("userId", sql.Int, userIdNumber)
            .query(`
                SELECT
                    XP,
                    Level
                FROM Users
                WHERE UserId = @userId
            `);

        if (userResult.recordset.length === 0) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const currentXP =
            Number(userResult.recordset[0].XP) || 0;

        const currentLevel =
            Number(userResult.recordset[0].Level) || 1;

        const newXP =
            currentXP + xpReward;

        /*
         * Keep the existing ReadQuest level structure:
         *
         * Level 1 -> 100 XP
         * Level 2 -> 200 XP
         * Level 3 -> 300 XP
         * etc.
         *
         * NOTE:
         * This keeps the server behavior from your current project.
         */

        let newLevel = currentLevel;

        let remainingXP = newXP;

        while (
            remainingXP >= newLevel * 100
        ) {
            remainingXP -= newLevel * 100;
            newLevel++;
        }

        // -------------------------------------------------
        // SAVE LESSON
        // -------------------------------------------------

        await pool.request()
            .input("userId", sql.Int, userIdNumber)
            .input("lessonId", sql.Int, lessonIdNumber)
            .input("difficulty", sql.NVarChar, difficulty)
            .input("xpReward", sql.Int, xpReward)
            .input("stars", sql.Int, starsNumber)
            .query(`
                INSERT INTO LessonProgress
                (
                    UserId,
                    LessonId,
                    Difficulty,
                    ProgressPercent,
                    Completed,
                    XPEarned,
                    Stars
                )
                VALUES
                (
                    @userId,
                    @lessonId,
                    @difficulty,
                    100,
                    1,
                    @xpReward,
                    @stars
                )
            `);

        // -------------------------------------------------
        // UPDATE USER XP / LEVEL
        // -------------------------------------------------

        await pool.request()
            .input("userId", sql.Int, userIdNumber)
            .input("xp", sql.Int, newXP)
            .input("level", sql.Int, newLevel)
            .query(`
                UPDATE Users
                SET
                    XP = @xp,
                    Level = @level
                WHERE UserId = @userId
            `);

        // -------------------------------------------------
        // NEXT LESSON
        // -------------------------------------------------

        let nextLessonUnlocked = null;

        try {

            const lessonResult = await pool.request()
                .input("lessonId", sql.Int, lessonIdNumber)
                .query(`
                    SELECT UnlockOrder
                    FROM Lessons
                    WHERE LessonId = @lessonId
                `);

            if (lessonResult.recordset.length > 0) {

                const currentOrder =
                    Number(
                        lessonResult.recordset[0].UnlockOrder
                    );

                const nextLesson =
                    await pool.request()
                        .input(
                            "unlockOrder",
                            sql.Int,
                            currentOrder + 1
                        )
                        .query(`
                            SELECT
                                LessonId,
                                Title
                            FROM Lessons
                            WHERE UnlockOrder = @unlockOrder
                            AND IsActive = 1
                        `);

                if (nextLesson.recordset.length > 0) {

                    nextLessonUnlocked =
                        nextLesson.recordset[0];
                }
            }

        } catch (lessonError) {

            console.log(
                "NEXT LESSON CHECK SKIPPED:"
            );

            console.log(
                lessonError.message
            );
        }

        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        const normalUnlocked =
            difficulty === "Easy";

        const hardUnlocked =
            difficulty === "Normal";

        console.log(
            `User ${userIdNumber} earned ${xpReward} XP.`
        );

        console.log(
            `New XP: ${newXP}`
        );

        console.log(
            `New Level: ${newLevel}`
        );

        res.json({

            success: true,

            alreadyCompleted: false,

            xpEarned: xpReward,

            totalXP: newXP,

            level: newLevel,

            stars: starsNumber,

            normalUnlocked,

            hardUnlocked,

            nextLessonUnlocked,

            message:
                "Lesson completed successfully."
        });

    } catch (error) {

        console.error(
            "========== LESSON ERROR =========="
        );

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error.",
            error: error.message
        });
    }
});


// =====================================================
// CHECK EASY COMPLETION
// =====================================================

app.get("/checkEasyCompleted/:userId", async (req, res) => {

    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId)) {
        return res.status(400).json({
            success: false,
            easyCompleted: false,
            message: "Invalid user ID."
        });
    }

    try {

        const pool = await getPool();

        const result = await pool.request()
            .input("userId", sql.Int, userId)
            .query(`
                SELECT COUNT(DISTINCT LessonId) AS Total
                FROM LessonProgress
                WHERE UserId = @userId
                AND LessonId IN (1, 2, 3)
                AND Completed = 1
            `);

        const total =
            Number(result.recordset[0].Total) || 0;

        res.json({
            success: true,
            easyCompleted: total >= 3,
            totalCompleted: total
        });

    } catch (error) {

        console.error(
            "CHECK EASY COMPLETED ERROR:"
        );

        console.error(error);

        res.status(500).json({
            success: false,
            easyCompleted: false,
            message: "Unable to check Easy Mode progress."
        });
    }
});


// =====================================================
// CHECK NORMAL COMPLETION
// =====================================================

app.get("/checkNormalCompleted/:userId", async (req, res) => {

    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId)) {
        return res.status(400).json({
            success: false,
            normalCompleted: false,
            message: "Invalid user ID."
        });
    }

    try {

        const pool = await getPool();

        const result = await pool.request()
            .input("userId", sql.Int, userId)
            .query(`
                SELECT COUNT(DISTINCT LessonId) AS Total
                FROM LessonProgress
                WHERE UserId = @userId
                AND Difficulty = 'Normal'
                AND Completed = 1
            `);

        const totalCompleted =
            Number(result.recordset[0].Total) || 0;

        console.log(
            `User ${userId} completed ${totalCompleted} Normal lessons.`
        );

        res.json({

            success: true,

            normalCompleted:
                totalCompleted >= 3,

            totalCompleted

        });

    } catch (error) {

        console.error(
            "CHECK NORMAL COMPLETED ERROR:"
        );

        console.error(error);

        res.status(500).json({

            success: false,

            normalCompleted: false,

            message:
                "Unable to check Normal Mode progress."
        });
    }
});


// =====================================================
// FRIENDS SYSTEM
// =====================================================


// =====================================================
// SEARCH USERS
// =====================================================

app.get("/api/friends/search", async (req, res) => {

    const username =
        String(req.query.username || "").trim();

    const userId =
        Number(req.query.userId);

    if (!username) {
        return res.status(400).json({
            success: false,
            message: "Username is required."
        });
    }

    if (!Number.isInteger(userId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID."
        });
    }

    try {

        const pool = await getPool();

        const result = await pool.request()
            .input(
                "username",
                sql.NVarChar,
                `%${username}%`
            )
            .input(
                "userId",
                sql.Int,
                userId
            )
            .query(`
                SELECT
                    UserId,
                    Username,
                    DisplayName,
                    ProfilePicture
                FROM Users
                WHERE Username LIKE @username
                AND UserId <> @userId
                ORDER BY Username
            `);

        res.json({
            success: true,
            users: result.recordset
        });

    } catch (error) {

        console.error(
            "SEARCH USERS ERROR:"
        );

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to search users."
        });
    }
});


// =====================================================
// SEND FRIEND REQUEST
// =====================================================

app.post("/api/friends/request", async (req, res) => {

    const senderId =
        Number(req.body.senderId);

    const receiverId =
        Number(req.body.receiverId);

    if (
        !Number.isInteger(senderId) ||
        !Number.isInteger(receiverId)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid user IDs."
        });
    }

    if (senderId === receiverId) {
        return res.status(400).json({
            success: false,
            message: "You cannot add yourself."
        });
    }

    try {

        const pool = await getPool();

        // Check receiver
        const receiver =
            await pool.request()
                .input(
                    "receiverId",
                    sql.Int,
                    receiverId
                )
                .query(`
                    SELECT UserId
                    FROM Users
                    WHERE UserId = @receiverId
                `);

        if (receiver.recordset.length === 0) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Check existing friendship
        const friendship =
            await pool.request()
                .input(
                    "senderId",
                    sql.Int,
                    senderId
                )
                .input(
                    "receiverId",
                    sql.Int,
                    receiverId
                )
                .query(`
                    SELECT TOP 1 FriendId
                    FROM Friends
                    WHERE
                    (
                        UserId = @senderId
                        AND FriendUserId = @receiverId
                    )
                    OR
                    (
                        UserId = @receiverId
                        AND FriendUserId = @senderId
                    )
                `);

        if (friendship.recordset.length > 0) {

            return res.status(400).json({
                success: false,
                message: "You are already friends."
            });
        }

        // Check existing request
        const existingRequest =
            await pool.request()
                .input(
                    "senderId",
                    sql.Int,
                    senderId
                )
                .input(
                    "receiverId",
                    sql.Int,
                    receiverId
                )
                .query(`
                    SELECT TOP 1
                        RequestId,
                        SenderId,
                        ReceiverId,
                        Status
                    FROM FriendRequests
                    WHERE
                    (
                        SenderId = @senderId
                        AND ReceiverId = @receiverId
                    )
                    OR
                    (
                        SenderId = @receiverId
                        AND ReceiverId = @senderId
                    )
                    ORDER BY RequestId DESC
                `);

        if (existingRequest.recordset.length > 0) {

            const request =
                existingRequest.recordset[0];

            if (request.Status === "Pending") {

                return res.status(400).json({
                    success: false,
                    message: "Friend request already exists."
                });
            }

            if (request.Status === "Accepted") {

                return res.status(400).json({
                    success: false,
                    message: "You are already friends."
                });
            }
        }

        // Create request
        await pool.request()
            .input(
                "senderId",
                sql.Int,
                senderId
            )
            .input(
                "receiverId",
                sql.Int,
                receiverId
            )
            .query(`
                INSERT INTO FriendRequests
                (
                    SenderId,
                    ReceiverId,
                    Status,
                    RequestDate
                )
                VALUES
                (
                    @senderId,
                    @receiverId,
                    'Pending',
                    GETDATE()
                )
            `);

        res.json({
            success: true,
            message: "Friend request sent."
        });

    } catch (error) {

        console.error(
            "SEND FRIEND REQUEST ERROR:"
        );

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to send friend request."
        });
    }
});


// =====================================================
// GET FRIEND REQUESTS
// =====================================================

app.get("/api/friends/requests/:userId", async (req, res) => {

    const userId =
        Number(req.params.userId);

    if (!Number.isInteger(userId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID."
        });
    }

    try {

        const pool = await getPool();

        const result =
            await pool.request()
                .input(
                    "userId",
                    sql.Int,
                    userId
                )
                .query(`
                    SELECT
                        fr.RequestId,
                        fr.SenderId,
                        fr.ReceiverId,
                        fr.Status,
                        fr.RequestDate,
                        u.Username,
                        u.DisplayName,
                        u.ProfilePicture
                    FROM FriendRequests fr
                    INNER JOIN Users u
                        ON u.UserId = fr.SenderId
                    WHERE
                        fr.ReceiverId = @userId
                        AND fr.Status = 'Pending'
                    ORDER BY fr.RequestDate DESC
                `);

        res.json({
            success: true,
            requests: result.recordset
        });

    } catch (error) {

        console.error(
            "LOAD FRIEND REQUESTS ERROR:"
        );

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to load friend requests."
        });
    }
});


// =====================================================
// ACCEPT / REJECT FRIEND REQUEST
// =====================================================

app.post(
    "/api/friends/request/respond",
    async (req, res) => {

        const requestId =
            Number(req.body.requestId);

        const userId =
            Number(req.body.userId);

        const status =
            String(req.body.status || "");

        if (
            !Number.isInteger(requestId) ||
            !Number.isInteger(userId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid request data."
            });
        }

        if (
            status !== "Accepted" &&
            status !== "Rejected"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid request status."
            });
        }

        const transaction =
            new sql.Transaction();

        try {

            const pool =
                await getPool();

            await transaction.begin();

            // Find request
            const requestResult =
                await transaction.request()
                    .input(
                        "requestId",
                        sql.Int,
                        requestId
                    )
                    .input(
                        "userId",
                        sql.Int,
                        userId
                    )
                    .query(`
                        SELECT
                            RequestId,
                            SenderId,
                            ReceiverId,
                            Status
                        FROM FriendRequests
                        WHERE
                            RequestId = @requestId
                            AND ReceiverId = @userId
                            AND Status = 'Pending'
                    `);

            if (
                requestResult.recordset.length === 0
            ) {

                await transaction.rollback();

                return res.status(404).json({
                    success: false,
                    message: "Friend request not found."
                });
            }

            const request =
                requestResult.recordset[0];

            // Update request
            await transaction.request()
                .input(
                    "requestId",
                    sql.Int,
                    requestId
                )
                .input(
                    "status",
                    sql.NVarChar,
                    status
                )
                .query(`
                    UPDATE FriendRequests
                    SET Status = @status
                    WHERE RequestId = @requestId
                `);

            // If accepted, create friendship
            if (status === "Accepted") {

                // Receiver -> Sender
                await transaction.request()
                    .input(
                        "userId",
                        sql.Int,
                        userId
                    )
                    .input(
                        "friendUserId",
                        sql.Int,
                        request.SenderId
                    )
                    .query(`
                        INSERT INTO Friends
                        (
                            UserId,
                            FriendUserId,
                            AddedDate
                        )
                        SELECT
                            @userId,
                            @friendUserId,
                            GETDATE()
                        WHERE NOT EXISTS
                        (
                            SELECT 1
                            FROM Friends
                            WHERE
                                UserId = @userId
                                AND FriendUserId = @friendUserId
                        )
                    `);

                // Sender -> Receiver
                await transaction.request()
                    .input(
                        "userId",
                        sql.Int,
                        userId
                    )
                    .input(
                        "friendUserId",
                        sql.Int,
                        request.SenderId
                    )
                    .query(`
                        INSERT INTO Friends
                        (
                            UserId,
                            FriendUserId,
                            AddedDate
                        )
                        SELECT
                            @friendUserId,
                            @userId,
                            GETDATE()
                        WHERE NOT EXISTS
                        (
                            SELECT 1
                            FROM Friends
                            WHERE
                                UserId = @friendUserId
                                AND FriendUserId = @userId
                        )
                    `);
            }

            await transaction.commit();

            res.json({
                success: true,
                message:
                    status === "Accepted"
                        ? "Friend request accepted."
                        : "Friend request rejected."
            });

        } catch (error) {

            try {
                await transaction.rollback();
            } catch (_) {}

            console.error(
                "RESPOND FRIEND REQUEST ERROR:"
            );

            console.error(error);

            res.status(500).json({
                success: false,
                message:
                    "Unable to update friend request."
            });
        }
    }
);


// =====================================================
// GET FRIENDS
// =====================================================

app.get("/api/friends/:userId", async (req, res) => {

    const userId =
        Number(req.params.userId);

    if (!Number.isInteger(userId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID."
        });
    }

    try {

        const pool =
            await getPool();

        const result =
            await pool.request()
                .input(
                    "userId",
                    sql.Int,
                    userId
                )
                .query(`
                    SELECT
                        f.FriendId,
                        f.UserId,
                        f.FriendUserId,
                        f.AddedDate,
                        u.Username,
                        u.DisplayName,
                        u.ProfilePicture,
                        u.Level,
                        u.XP
                    FROM Friends f
                    INNER JOIN Users u
                        ON u.UserId = f.FriendUserId
                    WHERE f.UserId = @userId
                    ORDER BY u.DisplayName
                `);

        res.json({
            success: true,
            friends: result.recordset
        });

    } catch (error) {

        console.error(
            "LOAD FRIENDS ERROR:"
        );

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to load friends."
        });
    }
});


// =====================================================
// REMOVE FRIEND
// =====================================================

app.post("/api/friends/remove", async (req, res) => {

    const userId =
        Number(req.body.userId);

    const friendUserId =
        Number(req.body.friendUserId);

    if (
        !Number.isInteger(userId) ||
        !Number.isInteger(friendUserId)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid user IDs."
        });
    }

    try {

        const pool =
            await getPool();

        await pool.request()
            .input(
                "userId",
                sql.Int,
                userId
            )
            .input(
                "friendUserId",
                sql.Int,
                friendUserId
            )
            .query(`
                DELETE FROM Friends
                WHERE
                (
                    UserId = @userId
                    AND FriendUserId = @friendUserId
                )
                OR
                (
                    UserId = @friendUserId
                    AND FriendUserId = @userId
                )
            `);

        res.json({
            success: true,
            message: "Friend removed."
        });

    } catch (error) {

        console.error(
            "REMOVE FRIEND ERROR:"
        );

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to remove friend."
        });
    }
});



/* =====================================================
   FIREBASE VOCABULARY XP SYSTEM
   ===================================================== */

const vocabularyAnswers = {
    1: [
        "BOOK", "LIBRARY", "HOUSE", "SCHOOL", "TEACHER",
        "PENCIL", "ERASER", "CHAIR", "TABLE", "WINDOW"
    ],
    2: [
        "BED", "KITCHEN", "PENCIL", "WATER", "DOOR",
        "REFRIGERATOR", "TOOTHBRUSH", "TELEVISION", "FEET", "CHAIR"
    ],
    3: [
        "PENCIL", "NOTEBOOK", "ERASER", "RULER", "SCHOOLBAG",
        "WHITEBOARD", "CRAYONS", "CHAIR", "CALCULATOR", "SCISSORS"
    ]
};

function calculateVocabularyLevel(totalXP) {
    let level = 1;
    let remainingXP = totalXP;

    while (remainingXP >= level * 100) {
        remainingXP -= level * 100;
        level++;
    }

    return level;
}

/* =====================================================
   SUBMIT A VOCABULARY ANSWER
   ===================================================== */

app.post(
    "/api/vocabulary/answer",
    verifyFirebaseUser,
    async (req, res) => {
        try {
            const uid = req.firebaseUser.uid;
            const lessonId = Number(req.body.lessonId);
            const questionIndex = Number(req.body.questionIndex);
            const answer = String(req.body.answer || "")
                .trim()
                .toUpperCase();

            const answers = vocabularyAnswers[lessonId];

            if (
                !answers ||
                !Number.isInteger(questionIndex) ||
                questionIndex < 0 ||
                questionIndex >= answers.length ||
                !answer
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid lesson, question, or answer."
                });
            }

            const isCorrect = answer === answers[questionIndex];

            const progressRef = db
                .collection("vocabularyProgress")
                .doc(`${uid}_lesson_${lessonId}`);

            const userRef = db.collection("users").doc(uid);

            const result = await db.runTransaction(async (transaction) => {
                const progressSnapshot =
                    await transaction.get(progressRef);

                const userSnapshot =
                    await transaction.get(userRef);

                if (!userSnapshot.exists) {
                    throw new Error("USER_PROFILE_NOT_FOUND");
                }

                const progress = progressSnapshot.exists
                    ? progressSnapshot.data()
                    : {};

                const rewarded = Array.isArray(
                    progress.rewardedQuestionIndexes
                )
                    ? progress.rewardedQuestionIndexes
                    : [];

                const answered = Array.isArray(
                    progress.answeredQuestionIndexes
                )
                    ? progress.answeredQuestionIndexes
                    : [];

                const userData = userSnapshot.data();
                const currentXP = Math.max(
                    0,
                    Number(userData.xp) || 0
                );

                const currentLevel = Math.max(
                    1,
                    Number(userData.level) || 1
                );

                if (rewarded.includes(questionIndex)) {
                    return {
                        success: true,
                        correct: isCorrect,
                        duplicate: true,
                        xpEarned: 0,
                        totalXP: currentXP,
                        level: currentLevel
                    };
                }

                const updatedAnswered = answered.includes(questionIndex)
                    ? answered
                    : [...answered, questionIndex];

                if (!isCorrect) {
                    transaction.set(
                        progressRef,
                        {
                            uid,
                            lessonId,
                            answeredQuestionIndexes: updatedAnswered,
                            updatedAt: new Date().toISOString()
                        },
                        { merge: true }
                    );

                    return {
                        success: true,
                        correct: false,
                        duplicate: false,
                        xpEarned: 0,
                        totalXP: currentXP,
                        level: currentLevel
                    };
                }

                const totalXP = currentXP + 5;
                const level = calculateVocabularyLevel(totalXP);
                const updatedRewarded = [
                    ...rewarded,
                    questionIndex
                ];

                transaction.set(
                    progressRef,
                    {
                        uid,
                        lessonId,
                        answeredQuestionIndexes: updatedAnswered,
                        rewardedQuestionIndexes: updatedRewarded,
                        xpEarned: updatedRewarded.length * 5,
                        updatedAt: new Date().toISOString()
                    },
                    { merge: true }
                );

                transaction.update(userRef, {
                    xp: totalXP,
                    level
                });

                return {
                    success: true,
                    correct: true,
                    duplicate: false,
                    xpEarned: 5,
                    totalXP,
                    level
                };
            });

            return res.json(result);
        } catch (error) {
            console.error("Vocabulary XP error:", error);

            if (error.message === "USER_PROFILE_NOT_FOUND") {
                return res.status(404).json({
                    success: false,
                    message: "Firebase user profile not found."
                });
            }

            return res.status(500).json({
                success: false,
                message: "Unable to save vocabulary XP."
            });
        }
    }
);

/* =====================================================
   COMPLETE A VOCABULARY LESSON
   This records completion but awards no additional XP.
   ===================================================== */

app.post(
    "/api/vocabulary/complete",
    verifyFirebaseUser,
    async (req, res) => {
        try {
            const uid = req.firebaseUser.uid;
            const lessonId = Number(req.body.lessonId);

            if (!vocabularyAnswers[lessonId]) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid vocabulary lesson."
                });
            }

            const progressRef = db
                .collection("vocabularyProgress")
                .doc(`${uid}_lesson_${lessonId}`);

            const userRef = db.collection("users").doc(uid);

            const result = await db.runTransaction(async (transaction) => {
                const progressSnapshot =
                    await transaction.get(progressRef);

                const userSnapshot =
                    await transaction.get(userRef);

                if (!userSnapshot.exists) {
                    throw new Error("USER_PROFILE_NOT_FOUND");
                }

                const progress = progressSnapshot.exists
                    ? progressSnapshot.data()
                    : {};

                const rewarded = Array.isArray(
                    progress.rewardedQuestionIndexes
                )
                    ? progress.rewardedQuestionIndexes
                    : [];

                const userData = userSnapshot.data();

                transaction.set(
                    progressRef,
                    {
                        uid,
                        lessonId,
                        completed: true,
                        completedAt: new Date().toISOString(),
                        xpEarned: rewarded.length * 5
                    },
                    { merge: true }
                );

                return {
                    success: true,
                    totalXP: Number(userData.xp) || 0,
                    level: Number(userData.level) || 1,
                    xpEarned: rewarded.length * 5
                };
            });

            return res.json(result);
        } catch (error) {
            console.error("Vocabulary completion error:", error);

            if (error.message === "USER_PROFILE_NOT_FOUND") {
                return res.status(404).json({
                    success: false,
                    message: "Firebase user profile not found."
                });
            }

            return res.status(500).json({
                success: false,
                message: "Unable to save lesson completion."
            });
        }
    }
);
// =====================================================
// READQUEST GAME ACHIEVEMENTS — FIRESTORE
// =====================================================

const gameAchievements = {
    text_detective: {
        title: "Text Detective",
        category: "Text Comprehension"
    },
    pixel_choices: {
        title: "Pixel Choices",
        category: "Text Comprehension"
    },
    authors_purpose: {
        title: "Author's Purpose Challenge",
        category: "Text Comprehension"
    },
    lexi_labyrinth: {
        title: "Lexi-Labyrinth",
        category: "Vocabulary"
    },
    definition_detective: {
        title: "Definition Detective",
        category: "Vocabulary"
    },
    monster_door: {
        title: "Monster Door Challenge",
        category: "Vocabulary"
    }
};

function calculateAchievementLevel(totalXP) {
    let level = 1;
    let remainingXP = totalXP;

    while (remainingXP >= level * 100) {
        remainingXP -= level * 100;
        level++;
    }

    return level;
}

// Load achievements for the authenticated Firebase user.
app.get(
    "/api/achievements",
    verifyFirebaseUser,
    async (req, res) => {
        try {
            const uid = req.firebaseUser.uid;
            const userRef = db.collection("users").doc(uid);

            const [userSnapshot, achievementsSnapshot] =
                await Promise.all([
                    userRef.get(),
                    db.collection("users")
                        .doc(uid)
                        .collection("achievements")
                        .get()
                ]);

            if (!userSnapshot.exists) {
                return res.status(404).json({
                    success: false,
                    message: "Firebase user profile not found."
                });
            }

            const userData = userSnapshot.data();
            const claimed = {};

            achievementsSnapshot.forEach((doc) => {
                claimed[doc.id] = doc.data();
            });

            const achievements = Object.entries(gameAchievements).map(
                ([id, details]) => ({
                    id,
                    ...details,
                    rewardXP: 10,
                    completed: claimed[id]?.completed === true,
                    rewarded: claimed[id]?.rewarded === true,
                    completedAt: claimed[id]?.completedAt || null
                })
            );

            return res.json({
                success: true,
                achievements,
                totalXP: Number(userData.xp) || 0,
                level: Number(userData.level) || 1
            });
        } catch (error) {
            console.error("Load achievements error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to load achievements."
            });
        }
    }
);

// Award 10 XP once per achievement.
app.post(
    "/api/achievements/complete",
    verifyFirebaseUser,
    async (req, res) => {
        try {
            const uid = req.firebaseUser.uid;
            const achievementId = String(
                req.body.achievementId || ""
            );

            const achievement = gameAchievements[achievementId];

            if (!achievement) {
                return res.status(400).json({
                    success: false,
                    message: "Unknown achievement."
                });
            }

            const userRef = db.collection("users").doc(uid);
            const achievementRef = userRef
                .collection("achievements")
                .doc(achievementId);

            const result = await db.runTransaction(async (transaction) => {
                // Read all relevant documents before writing.
                const [userSnapshot, achievementSnapshot] =
                    await Promise.all([
                        transaction.get(userRef),
                        transaction.get(achievementRef)
                    ]);

                if (!userSnapshot.exists) {
                    throw new Error("USER_PROFILE_NOT_FOUND");
                }

                const userData = userSnapshot.data();
                const currentXP = Math.max(
                    0,
                    Number(userData.xp) || 0
                );

                const currentLevel = Math.max(
                    1,
                    Number(userData.level) || 1
                );

                if (
                    achievementSnapshot.exists &&
                    achievementSnapshot.data().rewarded === true
                ) {
                    return {
                        success: true,
                        alreadyRewarded: true,
                        xpEarned: 0,
                        totalXP: currentXP,
                        level: currentLevel
                    };
                }

                const totalXP = currentXP + 10;
                const level = calculateAchievementLevel(totalXP);

                transaction.set(
                    achievementRef,
                    {
                        achievementId,
                        title: achievement.title,
                        category: achievement.category,
                        completed: true,
                        rewarded: true,
                        rewardXP: 10,
                        completedAt: new Date().toISOString()
                    },
                    { merge: true }
                );

                transaction.update(userRef, {
                    xp: totalXP,
                    level
                });

                return {
                    success: true,
                    alreadyRewarded: false,
                    xpEarned: 10,
                    totalXP,
                    level
                };
            });

            return res.json(result);
        } catch (error) {
            console.error("Complete achievement error:", error);

            if (error.message === "USER_PROFILE_NOT_FOUND") {
                return res.status(404).json({
                    success: false,
                    message: "Firebase user profile not found."
                });
            }

            return res.status(500).json({
                success: false,
                message: "Unable to save achievement reward."
            });
        }
    }
);
/* =====================================================
   START SERVER — KEEP THIS AT THE END
   ===================================================== */

app.listen(3000, () => {
    console.log("");
    console.log("=================================");
    console.log("   READQUEST SERVER RUNNING");
    console.log("=================================");
    console.log("URL: http://localhost:3000");
    console.log("Database: ReadQuestDB");
    console.log("=================================");
    console.log("");
});

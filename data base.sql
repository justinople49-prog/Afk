-- ============================================
-- ReadQuest Database
-- ============================================

CREATE DATABASE ReadQuestDB;
GO

USE ReadQuestDB;
GO

-- ============================================
-- USERS
-- ============================================

CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL, 
    DisplayName NVARCHAR(100) NOT NULL,
    ProfilePicture NVARCHAR(255) NULL,
    Level INT NOT NULL DEFAULT 1,
    XP INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- ============================================
-- LESSONS
-- ============================================
CREATE TABLE Lessons (

    LessonId INT IDENTITY(1,1) PRIMARY KEY,

    Title NVARCHAR(100) NOT NULL,

    Description NVARCHAR(MAX),

    UnlockOrder INT NOT NULL,

    IsActive BIT NOT NULL DEFAULT 1

);

-- ============================================
-- USER PROGRESS
-- ============================================
CREATE TABLE LessonProgress (

    ProgressId INT IDENTITY(1,1) PRIMARY KEY,

    UserId INT NOT NULL,

    LessonId INT NOT NULL,

    Difficulty NVARCHAR(20) NOT NULL DEFAULT 'Normal',

    ProgressPercent INT DEFAULT 0,

    Completed BIT DEFAULT 0,

    XPEarned INT DEFAULT 0,

    Stars INT DEFAULT 0,

    CompletedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY(UserId)
        REFERENCES Users(UserId),

    FOREIGN KEY(LessonId)
        REFERENCES Lessons(LessonId),

    CONSTRAINT UQ_LessonProgress
        UNIQUE(UserId, LessonId, Difficulty)

);

-- ============================================
-- FRIEND REQUESTS
-- ============================================

CREATE TABLE FriendRequests (
    RequestId INT IDENTITY(1,1) PRIMARY KEY,
    SenderId INT NOT NULL,
    ReceiverId INT NOT NULL,

    Status NVARCHAR(20) DEFAULT 'Pending',

    RequestDate DATETIME DEFAULT GETDATE(),

    FOREIGN KEY(SenderId)
        REFERENCES Users(UserId),

    FOREIGN KEY(ReceiverId)
        REFERENCES Users(UserId)
);

-- ============================================
-- FRIENDS
-- ============================================

CREATE TABLE Friends (

    FriendId INT IDENTITY(1,1) PRIMARY KEY,

    UserId INT NOT NULL,

    FriendUserId INT NOT NULL,

    AddedDate DATETIME DEFAULT GETDATE(),

    FOREIGN KEY(UserId)
        REFERENCES Users(UserId),

    FOREIGN KEY(FriendUserId)
        REFERENCES Users(UserId)
);

-- ============================================
-- ACHIEVEMENTS
-- ============================================

CREATE TABLE Achievements (

    AchievementId INT IDENTITY(1,1) PRIMARY KEY,

    Title NVARCHAR(100),

    Description NVARCHAR(MAX),

    XPReward INT
);

-- ============================================
-- USER ACHIEVEMENTS
-- ============================================

CREATE TABLE UserAchievements (

    Id INT IDENTITY(1,1) PRIMARY KEY,

    UserId INT,

    AchievementId INT,

    DateEarned DATETIME DEFAULT GETDATE(),

    FOREIGN KEY(UserId)
        REFERENCES Users(UserId),

    FOREIGN KEY(AchievementId)
        REFERENCES Achievements(AchievementId)
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE Notifications (

    NotificationId INT IDENTITY(1,1) PRIMARY KEY,

    UserId INT,

    Message NVARCHAR(255),

    IsRead BIT DEFAULT 0,

    DateCreated DATETIME DEFAULT GETDATE(),

    FOREIGN KEY(UserId)
        REFERENCES Users(UserId)
);

-- ============================================
-- SAMPLE LESSONS
-- ============================================
INSERT INTO Lessons
(
    Title,
    Description,
    UnlockOrder,
    IsActive
)

VALUES

(
    'Basic Vocabulary',
    'Learn common English words.',
    1,
    1
),

(
    'Home Vocabulary',
    'Learn vocabulary related to the home.',
    2,
    1
),

(
    'Grammar Essentials',
    'Practice English grammar.',
    3,
    1
),

(
    'Listening Skills',
    'Improve listening ability.',
    4,
    1
);
-- ============================================
-- SAMPLE ACHIEVEMENTS
-- ============================================

INSERT INTO Achievements
(
    Title,
    Description,
    XPReward
)

VALUES

(
    'First Lesson',
    'Complete your first lesson.',
    100
),

(
    'Reading Master',
    'Complete 25 lessons.',
    500
),

(
    'Vocabulary Expert',
    'Finish all vocabulary lessons.',
    300
);


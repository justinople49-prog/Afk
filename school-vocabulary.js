"use strict";

// =====================================================
// READQUEST — SCHOOL READING CHALLENGE
// SPELLING GAME
// =====================================================

// -----------------------------------------------------
// QUESTIONS
// -----------------------------------------------------

const questions = [
    {
        word: "PENCIL",
        clue: "I use this to write words and draw pictures."
    },
    {
        word: "NOTEBOOK",
        clue: "I keep my notes and lessons inside this book."
    },
    {
        word: "ERASER",
        clue: "I use this to erase mistakes in my writing."
    },
    {
        word: "RULER",
        clue: "I use this to measure objects and draw straight lines."
    },
    {
        word: "SCHOOLBAG",
        clue: "I carry my books, notebooks, and pencils in this."
    },
    {
        word: "WHITEBOARD",
        clue: "The teacher writes on this board using a marker."
    },
    {
        word: "CRAYONS",
        clue: "I use these colorful sticks to make drawings bright."
    },
    {
        word: "CHAIR",
        clue: "I sit on this while listening to my teacher."
    },
    {
        word: "CALCULATOR",
        clue: "I use this device to calculate numbers."
    },
    {
        word: "SCISSORS",
        clue: "I use these to cut paper during art class."
    }
];

// -----------------------------------------------------
// ELEMENTS
// -----------------------------------------------------

const elements = {
    missionNumber: document.getElementById("missionNumber"),
    xpText: document.getElementById("xpText"),
    xpFill: document.getElementById("xpFill"),
    xpProgress: document.getElementById("xpProgress"),

    clueText: document.getElementById("clueText"),

    answerSlots: document.getElementById("answerSlots"),
    letterContainer: document.getElementById("letterContainer"),

    backspaceBtn: document.getElementById("backspaceBtn"),
    backBtn: document.getElementById("backBtn"),

    heart1: document.getElementById("heart1"),
    heart2: document.getElementById("heart2"),
    heart3: document.getElementById("heart3"),

    gameMessage: document.getElementById("gameMessage"),

    answerPopup: document.getElementById("answerPopup"),
    popupTitle: document.getElementById("popupTitle"),
    popupMessage: document.getElementById("popupMessage"),
    popupButton: document.getElementById("popupButton"),

    lessonComplete: document.getElementById("lessonComplete"),
    finalScore: document.getElementById("finalScore"),
    finalXP: document.getElementById("finalXP"),
    saveStatus: document.getElementById("saveStatus"),
    continueBtn: document.getElementById("continueBtn")
};

// -----------------------------------------------------
// GAME STATE
// -----------------------------------------------------

const XP_PER_ANSWER = 10;
const MAX_HEARTS = 3;

let currentQuestion = 0;
let correctAnswers = 0;
let hearts = MAX_HEARTS;

let selectedLetters = [];
let answerLocked = false;
let lessonFinished = false;
let progressSaved = false;

// -----------------------------------------------------
// UTILITIES
// -----------------------------------------------------

function shuffleArray(items) {
    const shuffled = [...items];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] = [
            shuffled[j],
            shuffled[i]
        ];
    }

    return shuffled;
}

function getCurrentQuestion() {
    return questions[currentQuestion];
}

function getEarnedXP() {
    return correctAnswers * XP_PER_ANSWER;
}

// -----------------------------------------------------
// UPDATE STATUS
// -----------------------------------------------------

function updateStatus() {
    elements.missionNumber.textContent =
        `${currentQuestion + 1} / ${questions.length}`;

    const earnedXP = getEarnedXP();
    const maximumXP = questions.length * XP_PER_ANSWER;

    elements.xpText.textContent = earnedXP;

    elements.xpFill.style.width =
        `${(earnedXP / maximumXP) * 100}%`;

    elements.xpProgress.setAttribute(
        "aria-valuenow",
        String(earnedXP)
    );

    elements.xpProgress.setAttribute(
        "aria-valuemax",
        String(maximumXP)
    );

    elements.heart1.textContent =
        hearts >= 1 ? "❤️" : "🤍";

    elements.heart2.textContent =
        hearts >= 2 ? "❤️" : "🤍";

    elements.heart3.textContent =
        hearts >= 3 ? "❤️" : "🤍";
}

// -----------------------------------------------------
// CREATE ANSWER BOXES
// -----------------------------------------------------

function createAnswerBoxes(word) {
    elements.answerSlots.replaceChildren();

    for (let i = 0; i < word.length; i++) {
        const box = document.createElement("div");

        box.className = "school-answer-box";

        elements.answerSlots.appendChild(box);
    }
}

// -----------------------------------------------------
// CREATE LETTER BUTTONS
// -----------------------------------------------------

function createLetterButtons(word) {
    elements.letterContainer.replaceChildren();

    const extraLetters = [
        "A", "E", "I", "O", "U",
        "L", "N", "R", "S", "T",
        "M", "P", "D", "C", "H"
    ];

    const letters = word.split("");

    const numberOfExtras =
        currentQuestion < 3 ? 5 :
        currentQuestion < 6 ? 6 : 7;

    for (let i = 0; i < numberOfExtras; i++) {
        const randomIndex = Math.floor(
            Math.random() * extraLetters.length
        );

        letters.push(extraLetters[randomIndex]);
    }

    const shuffledLetters = shuffleArray(letters);

    shuffledLetters.forEach((letter) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "school-letter";
        button.textContent = letter;

        button.addEventListener("click", () => {
            selectLetter(button, letter);
        });

        elements.letterContainer.appendChild(button);
    });
}

// -----------------------------------------------------
// LOAD QUESTION
// -----------------------------------------------------

function loadQuestion() {
    if (currentQuestion >= questions.length) {
        finishLesson();
        return;
    }

    answerLocked = false;
    selectedLetters = [];

    const question = getCurrentQuestion();

    elements.clueText.textContent = question.clue;
    elements.gameMessage.textContent = "";

    createAnswerBoxes(question.word);
    createLetterButtons(question.word);

    updateStatus();
}

// -----------------------------------------------------
// SELECT LETTER
// -----------------------------------------------------

function selectLetter(button, letter) {
    if (answerLocked || button.disabled) {
        return;
    }

    const question = getCurrentQuestion();

    if (selectedLetters.length >= question.word.length) {
        return;
    }

    button.disabled = true;

    selectedLetters.push({
        letter,
        button
    });

    updateAnswerBoxes();

    if (selectedLetters.length === question.word.length) {
        checkAnswer();
    }
}

// -----------------------------------------------------
// UPDATE ANSWER BOXES
// -----------------------------------------------------

function updateAnswerBoxes() {
    const boxes = elements.answerSlots.querySelectorAll(
        ".school-answer-box"
    );

    boxes.forEach((box, index) => {
        const selected = selectedLetters[index];

        box.textContent = selected ? selected.letter : "";

        box.classList.toggle("filled", Boolean(selected));
    });
}

// -----------------------------------------------------
// BACKSPACE
// -----------------------------------------------------

function removeLastLetter() {
    if (answerLocked || selectedLetters.length === 0) {
        return;
    }

    const lastLetter = selectedLetters.pop();

    lastLetter.button.disabled = false;

    updateAnswerBoxes();
}

// -----------------------------------------------------
// ANSWER CHECKING
// -----------------------------------------------------

function checkAnswer() {
    if (answerLocked) {
        return;
    }

    answerLocked = true;

    const question = getCurrentQuestion();

    const answer = selectedLetters
        .map((item) => item.letter)
        .join("");

    const correct = answer === question.word;

    const boxes = elements.answerSlots.querySelectorAll(
        ".school-answer-box"
    );

    boxes.forEach((box) => {
        box.classList.add(correct ? "correct" : "wrong");
    });

    if (correct) {
        correctAnswers++;

        showAnswerPopup(
            "✅ Correct!",
            `Excellent! You spelled ${question.word} correctly. +10 XP ⭐`
        );
    } else {
        hearts--;

        showAnswerPopup(
            "❌ Incorrect",
            `The correct spelling is ${question.word}.`
        );
    }

    updateStatus();
}

// -----------------------------------------------------
// ANSWER POPUP
// -----------------------------------------------------

function showAnswerPopup(title, message) {
    elements.popupTitle.textContent = title;
    elements.popupMessage.textContent = message;

    elements.answerPopup.classList.remove("hidden");
    elements.popupButton.focus();
}

function closeAnswerPopup() {
    elements.answerPopup.classList.add("hidden");
}

// -----------------------------------------------------
// NEXT QUESTION
// -----------------------------------------------------

function nextQuestion() {
    closeAnswerPopup();

    if (hearts <= 0) {
        showGameOver();
        return;
    }

    currentQuestion++;

    if (currentQuestion >= questions.length) {
        finishLesson();
        return;
    }

    loadQuestion();
}

// -----------------------------------------------------
// GAME OVER
// -----------------------------------------------------

function showGameOver() {
    alert("💔 Game Over! Try again.");

    window.location.reload();
}

// -----------------------------------------------------
// SAVE LESSON PROGRESS
// -----------------------------------------------------

async function saveLessonProgress() {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
        throw new Error("No logged-in user found.");
    }

    const user = JSON.parse(storedUser);

    if (!user || !user.id) {
        throw new Error("User ID is missing.");
    }

    const response = await fetch("/api/lesson/complete", {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            userId: user.id,
            lessonId: 3,
            difficulty: "Easy",
            stars: correctAnswers
        })
    });

    const result = await response.json();

    if (!response.ok || (!result.success && !result.alreadyCompleted)) {
        throw new Error(
            result.message || "Unable to save lesson progress."
        );
    }

    if (result.success) {
        if (Number.isFinite(Number(result.totalXP))) {
            user.xp = Number(result.totalXP);
        }

        if (Number.isFinite(Number(result.level))) {
            user.level = Number(result.level);
        }

        localStorage.setItem("user", JSON.stringify(user));

        const storedReadquest = localStorage.getItem("readquest");

        if (storedReadquest) {
            const readquest = JSON.parse(storedReadquest);

            if (Number.isFinite(Number(result.totalXP))) {
                readquest.xp = Number(result.totalXP);
            }

            if (Number.isFinite(Number(result.level))) {
                readquest.level = Number(result.level);
            }

            localStorage.setItem(
                "readquest",
                JSON.stringify(readquest)
            );
        }
    }

    return result;
}

// -----------------------------------------------------
// LESSON COMPLETE
// -----------------------------------------------------

async function finishLesson() {
    if (lessonFinished) {
        return;
    }

    lessonFinished = true;

    elements.finalScore.textContent =
        `Score: ${correctAnswers} / ${questions.length}`;

    elements.finalXP.textContent =
        `Game XP: ${getEarnedXP()}`;

    elements.lessonComplete.classList.remove("hidden");

    elements.saveStatus.textContent = "Saving progress...";
    elements.continueBtn.disabled = true;

    try {
        const result = await saveLessonProgress();

        progressSaved = true;

        localStorage.setItem("schoolCompleted", "true");

        elements.saveStatus.textContent = result.alreadyCompleted
            ? "Lesson already completed."
            : "Progress saved successfully!";

    } catch (error) {
        console.error("School lesson save failed:", error);

        elements.saveStatus.textContent =
            "Progress was not saved. Please check your server connection.";
    } finally {
        elements.continueBtn.disabled = false;
    }
}

// -----------------------------------------------------
// NAVIGATION
// -----------------------------------------------------

function returnToLessons() {
    window.location.href = "lessons.html";
}

// -----------------------------------------------------
// EVENT LISTENERS
// -----------------------------------------------------

elements.backBtn.addEventListener(
    "click",
    returnToLessons
);

elements.backspaceBtn.addEventListener(
    "click",
    removeLastLetter
);

elements.popupButton.addEventListener(
    "click",
    nextQuestion
);

elements.continueBtn.addEventListener(
    "click",
    returnToLessons
);

// -----------------------------------------------------
// START GAME
// -----------------------------------------------------

loadQuestion();
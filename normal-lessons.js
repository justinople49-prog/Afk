// =========================================
// READQUEST DETECTIVE AGENCY
// NORMAL MODE
// =========================================


// =========================================
// ELEMENTS
// =========================================

const backBtn =
    document.getElementById("backBtn");

const case1Card =
    document.getElementById("case1Card");

const case2Card =
    document.getElementById("case2Card");

const case3Card =
    document.getElementById("case3Card");

const case1Btn =
    document.getElementById("case1Btn");

const case2Btn =
    document.getElementById("case2Btn");

const case3Btn =
    document.getElementById("case3Btn");

const progressFill =
    document.getElementById("progressFill");

const progressText =
    document.getElementById("progressText");


// =========================================
// GET LOGGED-IN USER
// =========================================

const currentUser =
    JSON.parse(
        localStorage.getItem("user")
    );


// =========================================
// USER-SPECIFIC COMPLETION KEYS
// =========================================

const userId =
    currentUser?.id ||
    currentUser?.Id ||
    currentUser?.username ||
    currentUser?.email ||
    "guest";


// =========================================
// COMPLETION KEYS
// =========================================

const CASE_1_KEY =
    `case1Completed_${userId}`;

const CASE_2_KEY =
    `case2Completed_${userId}`;

const CASE_3_KEY =
    `case3Completed_${userId}`;


// =========================================
// CHECK COMPLETION
// =========================================

function isCompleted(key) {

    return localStorage.getItem(key) === "true";

}


// =========================================
// GET COMPLETED CASES
// =========================================

function getCompletedCases() {

    let completed = 0;


    if (isCompleted(CASE_1_KEY)) {

        completed++;

    }


    if (isCompleted(CASE_2_KEY)) {

        completed++;

    }


    if (isCompleted(CASE_3_KEY)) {

        completed++;

    }


    return completed;

}


// =========================================
// LOCK CASE
// =========================================

function lockCase(
    card,
    button,
    message
) {

    card.classList.remove(
        "unlocked"
    );

    card.classList.add(
        "locked"
    );

    button.disabled = true;

    button.innerHTML =
        `<i class="fa-solid fa-lock"></i> ${message}`;

    button.onclick = null;

}


// =========================================
// UNLOCK CASE
// =========================================

function unlockCase(
    card,
    button,
    caseNumber
) {

    card.classList.remove(
        "locked"
    );

    card.classList.add(
        "unlocked"
    );

    button.disabled = false;

    button.innerHTML =
        `<i class="fa-solid fa-play"></i> Investigate`;

    button.onclick = () => {

        openCase(caseNumber);

    };

}


// =========================================
// COMPLETED CASE
// =========================================

function markCaseCompleted(
    card,
    button,
    caseNumber
) {

    card.classList.remove(
        "locked"
    );

    card.classList.add(
        "unlocked",
        "completed"
    );

    button.disabled = false;

    button.innerHTML =
        `<i class="fa-solid fa-check"></i> Case Completed`;

    button.onclick = () => {

        openCase(caseNumber);

    };

}


// =========================================
// UPDATE CASES
// =========================================

function updateCases() {

    const case1Completed =
        isCompleted(CASE_1_KEY);

    const case2Completed =
        isCompleted(CASE_2_KEY);

    const case3Completed =
        isCompleted(CASE_3_KEY);


    // =====================================
    // CASE 1
    // =====================================

    if (case1Completed) {

        markCaseCompleted(
            case1Card,
            case1Btn,
            1
        );

    }
    else {

        unlockCase(
            case1Card,
            case1Btn,
            1
        );

    }


    // =====================================
    // CASE 2
    // =====================================

    if (case2Completed) {

        markCaseCompleted(
            case2Card,
            case2Btn,
            2
        );

    }
    else if (case1Completed) {

        unlockCase(
            case2Card,
            case2Btn,
            2
        );

    }
    else {

        lockCase(
            case2Card,
            case2Btn,
            "Complete Case #001"
        );

    }


    // =====================================
    // CASE 3
    // =====================================

    if (case3Completed) {

        markCaseCompleted(
            case3Card,
            case3Btn,
            3
        );

    }
    else if (case2Completed) {

        unlockCase(
            case3Card,
            case3Btn,
            3
        );

    }
    else {

        lockCase(
            case3Card,
            case3Btn,
            "Complete Case #002"
        );

    }

}


// =========================================
// OPEN CASE
// =========================================

function openCase(caseNumber) {

    if (caseNumber === 1) {

        location.href =
            "detective-case-1.html";

        return;

    }


    if (caseNumber === 2) {

        location.href =
            "detective-case-2.html";

        return;

    }


    if (caseNumber === 3) {

        location.href =
            "detective-case-3.html";

        return;

    }

}


// =========================================
// UPDATE PROGRESS
// =========================================

function updateProgress() {

    const completed =
        getCompletedCases();

    const percentage =
        (completed / 3) * 100;


    if (progressFill) {

        progressFill.style.width =
            `${percentage}%`;

    }


    if (progressText) {

        progressText.textContent =
            `${completed} / 3 Cases Solved`;

    }

}


// =========================================
// BACK BUTTON
// =========================================

if (backBtn) {

    backBtn.addEventListener(
        "click",
        () => {

            location.href =
                "lessons.html";

        }
    );

}


// =========================================
// INITIALIZE
// =========================================

function initializeNormalMode() {

    updateCases();

    updateProgress();

}


initializeNormalMode();
// =========================================
// LESSON BUTTONS
// =========================================

// Buttons
const basicBtn =
    document.getElementById("basicVocabularyBtn");

const homeBtn =
    document.getElementById("homeVocabularyBtn");

const schoolBtn =
    document.getElementById("schoolVocabularyBtn");

const normalBtn =
    document.getElementById("normalBtn");

const hardBtn =
    document.getElementById("hardBtn");


// =========================================
// GET LOGGED-IN USER
// =========================================

const currentUser =
    JSON.parse(localStorage.getItem("user"));


// =========================================
// LOAD EVERYTHING
// =========================================

if (currentUser) {

    setupLessonButtons();

}


// =========================================
// SETUP ALL LESSON BUTTONS
// =========================================

function setupLessonButtons() {

    // =====================================
    // BASIC VOCABULARY
    // =====================================

    if (basicBtn) {

        basicBtn.disabled = false;

        basicBtn.textContent =
            "▶ Start Lesson";

        basicBtn.onclick = () => {

            location.href =
                "basic-vocabulary.html";

        };

    }


    // =====================================
    // HOME VOCABULARY
    // =====================================

    if (homeBtn) {

        homeBtn.disabled = false;

        homeBtn.textContent =
            "▶ Start Lesson";

        homeBtn.onclick = () => {

            location.href =
                "home-vocabulary.html";

        };

    }


    // =====================================
    // SCHOOL VOCABULARY
    // =====================================

    if (schoolBtn) {

        schoolBtn.disabled = false;

        schoolBtn.textContent =
            "▶ Start Lesson";

        schoolBtn.onclick = () => {

            location.href =
                "school-vocabulary.html";

        };

    }


    // =====================================
    // NORMAL MODE
    // =====================================

    if (normalBtn) {

        normalBtn.disabled = false;

        normalBtn.textContent =
            "▶ Play Normal";

        normalBtn.onclick = () => {

            location.href =
                "normal-lessons.html";

        };

    }


    // =====================================
    // HARD MODE
    // =====================================

    if (hardBtn) {

        hardBtn.disabled = false;

        hardBtn.textContent =
            "▶ Play Hard";

        hardBtn.onclick = () => {

            location.href =
                "hard-lessons.html";

        };

    }

}
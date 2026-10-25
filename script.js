/* 
Main javascript or function ng lahat 
*/



// ======================================
// LOGGED-IN USER
// ======================================

const user = JSON.parse(localStorage.getItem("user"));
if (!user) {
    window.location.href = "login.html";
}
// RPG Data
let student = {
    id: user.id,
    name: user.displayName,
    xp: user.xp,
    level: user.level,
    gamesCompleted: 0,
    accuracy: 0,
    badges: [],
    completedGames: []
};
// =============================
// LOAD SAVE
// =============================

function loadProgress(){

    const save = localStorage.getItem("readquest");

    if(save){
        student = JSON.parse(save);
    }

    // Sync profile info from logged-in user
    student.name = user.displayName;

    student.id = user.id;
student.xp = user.xp;
student.level = user.level;

    updateDashboard();

    const lessonCount = document.getElementById("lessonCount");
if (lessonCount) {
    lessonCount.textContent = student.lessonsCompleted || 0;
}

const gameCount = document.getElementById("gameCount");
if (gameCount) {
    gameCount.textContent = student.gamesPlayed || 0;
}

const achievementCount = document.getElementById("achievementCount");
if (achievementCount) {
    achievementCount.textContent = student.achievements || 0;
}

}

// =============================
// SAVE
// =============================

function saveProgress(){

    localStorage.setItem(

        "readquest",

        JSON.stringify(student)

    );

}

// =============================
// UPDATE DASHBOARD
// =============================
function updateDashboard() {

    // Navbar
    const userName = document.getElementById("userName");
    if (userName) {
        userName.textContent = student.name;
    }

    // Welcome Text
    const welcomeText = document.getElementById("welcomeText");
    if (welcomeText) {
        welcomeText.textContent = `Welcome back, ${student.name}!`;
    }

    // Hero Level
    const heroLevel = document.getElementById("heroLevel");
    if (heroLevel) {
        heroLevel.textContent = `⭐ Level ${student.level}`;
    }

    // XP
    const xpNeeded = student.level * 100;
    const percent = Math.min((student.xp / xpNeeded) * 100, 100);

    const xpFill = document.querySelector(".xp-fill");
    if (xpFill) {
        xpFill.style.width = percent + "%";
    }

    const heroXP = document.querySelector(".hero-info small");
    if (heroXP) {
        heroXP.textContent = `XP ${student.xp} / ${xpNeeded}`;
    }

    // ==========================
    // PLAYER PROFILE
    // ==========================

    const displayNameInput = document.getElementById("displayNameInput");
    if (displayNameInput) {
        displayNameInput.value = user.displayName;
    }
    
     const profileRank = document.getElementById("profileRank");

      if (profileRank) {

    let rank = "";

    if (student.level <= 2) {

        rank = "📖 Reader Apprentice";

    } else if (student.level <= 5) {

        rank = "🌱 Story Explorer";

    } else if (student.level <= 9) {

        rank = "📚 Book Adventurer";

    } else if (student.level <= 14) {

        rank = "⚔️ Reading Knight";

    } else if (student.level <= 19) {

        rank = "👑 Literacy Guardian";

    } else {

        rank = "🏆 AFK Master";

    }

    profileRank.textContent = rank;

    }

    const profileLevel = document.getElementById("profileLevel");
    if (profileLevel) {
        profileLevel.textContent = "⭐ Level " + student.level;
    }

    const profileXP = document.getElementById("profileXP");
    if (profileXP) {
        profileXP.textContent = "XP : " + student.xp;
    }

    const profileEmail = document.getElementById("profileEmail");
    if (profileEmail) {
        profileEmail.textContent = user.email;
    }

    // ==========================
    // PROFILE IMAGE
    // ==========================

    if (user.profilePicture) {

        const profileImage = document.getElementById("profileImage");
        if (profileImage) {
            profileImage.src = user.profilePicture;
        }

        const navAvatar = document.getElementById("navAvatar");
        if (navAvatar) {
            navAvatar.src = user.profilePicture;
        }

    }

}
// =============================
// XP SYSTEM
// =============================
async function addXP(amount){

    student.xp += amount;

    let required = student.level * 100;

    while(student.xp >= required){

        student.xp -= required;

        student.level++;

        required = student.level * 100;

        showNotification(
            "🎉 LEVEL UP!<br>Level " + student.level,
            "#27ae60"
        );

    }

    updateDashboard();

    saveProgress();

    try{

        const response = await fetch("http://localhost:3000/updateXP",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({
                id:student.id,
                xp:student.xp,
                level:student.level
            })

        });

        const data = await response.json();

        if(response.ok){

            // ✅ Idagdag ito dito
            loadLeaderboard();

        }else{

            console.log(data.message);

        }

    }catch(err){

        console.log(err);

    }

}
// =============================
// COMPLETE GAME
// =============================

function completeGame(name,score){

    if(!student.completedGames.includes(name)){

        student.gamesCompleted++;

        student.completedGames.push(name);

    }

    student.accuracy = score;

    addXP(30);

    updateDashboard();

    loadLeaderboard();

     saveProgress();

}

// =============================
// START BUTTON
// =============================

const startButton = document.getElementById("startBtn");

if(startButton){

    startButton.addEventListener("click",()=>{

        document.querySelector(".features").scrollIntoView({

            behavior:"smooth"

        });

    });

}

// =============================
// LOAD
// =============================

loadProgress();

/* ==========================================
READQUEST
script.js
PART 2
========================================== */

 
const particleContainer = document.getElementById("particles");

if (particleContainer) {

    function createParticle(){

        const particle=document.createElement("div");

        particle.classList.add("particle");

        const size=Math.random()*8+4;

        particle.style.width=size+"px";
        particle.style.height=size+"px";
        particle.style.left=Math.random()*window.innerWidth+"px";
        particle.style.animationDuration=(Math.random()*8+8)+"s";
        particle.style.opacity=Math.random();

        particleContainer.appendChild(particle);

        setTimeout(()=>{
            particle.remove();
        },16000);

    }

    setInterval(createParticle,300);

}




// ==========================================
// NOTIFICATION SYSTEM
// ==========================================

function showNotification(message,color="#4facfe"){

    const note = document.createElement("div");

    note.innerHTML = message;

    note.style.position="fixed";

    note.style.right="20px";

    note.style.top="30px";

    note.style.padding="18px 25px";

    note.style.background=color;

    note.style.color="white";

    note.style.borderRadius="12px";

    note.style.fontWeight="600";

    note.style.zIndex="99999";

    note.style.boxShadow="0 10px 25px rgba(0,0,0,.3)";

    note.style.opacity="0";

    note.style.transition=".4s";

    document.body.appendChild(note);

    setTimeout(()=>{

        note.style.opacity="1";

    },100);

    setTimeout(()=>{

        note.style.opacity="0";

    },2500);

    setTimeout(()=>{

        note.remove();

    },3000);

}

// ==========================================
// ACHIEVEMENTS
// ==========================================

const achievements=[

{
title:"🎮 First Game",
xp:30
},

{
title:"📖 Story Master",
xp:100
},

{
title:"⌨ Typing Ninja",
xp:200
},

{
title:"🏆 Reading Champion",
xp:500
}

];

function unlockAchievement(title){

    if(student.badges.includes(title))
        return;

    student.badges.push(title);

    saveProgress();

    showNotification(

        "🏆 Achievement Unlocked!<br>"+title,

        "#27ae60"

    );

}

// ==========================================
// SOUND SYSTEM
// ==========================================

const sounds={

click:new Audio(),

correct:new Audio(),

wrong:new Audio(),

levelup:new Audio()

};

// Example
// sounds.click.src="sounds/click.mp3";

// ==========================================
// PLAY SOUND
// ==========================================

function playSound(name){

    if(sounds[name]){

        sounds[name].currentTime=0;

        sounds[name].play();

    }

}


// BUTTON SOUND

document.querySelectorAll("button").forEach(button=>{
    button.addEventListener("click",()=>{
        // playSound("click");
    });
});

// DAILY LOGIN BONUS


function dailyReward(){
    const today=new Date().toDateString();
    const lastReward=localStorage.getItem("dailyReward");
    if(lastReward!==today){
        student.xp+=20;
        saveProgress();
        updateDashboard();
        localStorage.setItem(
            "dailyReward",
            today
        );

        showNotification(
            "🎁 Daily Reward +20 XP",
            "#f39c12"
        );
    }
}

dailyReward();

// ==========================================
// GAME BUTTONS
// ==========================================

document.querySelectorAll(".card").forEach(card=>{
    card.addEventListener("click",()=>{
        playSound("click");
    });
});

const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

if(menuBtn && sidebar){

    menuBtn.addEventListener("click",()=>{

        sidebar.classList.toggle("collapsed");

        sidebar.classList.toggle("expanded");

        if(overlay){

            overlay.classList.toggle("show");

        }

    });

}


if(overlay){

    overlay.addEventListener("click",()=>{

        sidebar.classList.add("collapsed");

        sidebar.classList.remove("expanded");

        overlay.classList.remove("show");

    });

}


// Logout
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {

        localStorage.removeItem("user");
        localStorage.removeItem("readquest");

        window.location.href = "login.html";

    });

}

const hero = document.getElementById("heroSprite");

function playWave(){

    if(!hero) return;

    hero.style.backgroundImage =
        'url("images/hero/hero-wav.png")';

    hero.style.animation =
        "heroWave .8s steps(4) 1";

    setTimeout(()=>{

        hero.style.backgroundImage =
            'url("images/hero/school-idle.png")';

        hero.style.animation =
            "heroIdle .8s steps(4) infinite";

    },800);

}

window.addEventListener("load", () => {

    playWave();

});

// ================================
// Fireflies Animation
// ================================

const fireflies = document.getElementById("fireflies");

if (fireflies) {

    const fireflyFrames = [
        "images/background/8-Fireflies 1.png",
        "images/background/8-Fireflies 2.png",
        "images/background/8-Fireflies 3.png",
        "images/background/8-Fireflies 4.png"
    ];

    let fireflyFrame = 0;

    setInterval(() => {

        fireflyFrame++;

        if (fireflyFrame >= fireflyFrames.length) {
            fireflyFrame = 0;
        }

        fireflies.src = fireflyFrames[fireflyFrame];

    },250);

}
// ================================
// Mouse Parallax
// ================================

const moon = document.querySelector(".moon");
const castle = document.querySelector(".castle");
const forest = document.querySelector(".forest");

document.addEventListener("mousemove", (e) => {

    const x = (e.clientX / window.innerWidth - 0.5);
    const y = (e.clientY / window.innerHeight - 0.5);

    if (moon) {
        moon.style.transform =
            `translate(${x * 20}px, ${y * 20}px)`;
    }

    if (castle) {
        castle.style.transform =
            `translate(${x * 40}px, ${y * 20}px)`;
    }

    if (forest) {
        forest.style.transform =
            `translate(${x * 10}px, ${y * 8}px)`;
    }

});

// ======================================
// PROFILE SYSTEM
// ======================================

const avatarInput = document.getElementById("avatarInput");
const profileImage = document.getElementById("profileImage");
const changeAvatar = document.getElementById("changeAvatar");
const saveProfile = document.getElementById("saveProfile");

if (
    avatarInput &&
    profileImage &&
    changeAvatar &&
    saveProfile 
) {

// Open file picker
changeAvatar.addEventListener("click", () => {
    avatarInput.click();
});

// Preview selected image
avatarInput.addEventListener("change", () => {

    const file = avatarInput.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e){

        profileImage.src = e.target.result;

    };

    reader.readAsDataURL(file);

});

// Save profile
saveProfile.addEventListener("click", async () => {

    const newName =
        document.getElementById("displayNameInput").value;

     student.name = newName;
     saveProgress();
    try{

        const response = await fetch("http://localhost:3000/updateProfile",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                id:student.id,

                displayName:newName,

                profilePicture:profileImage.src

            })

        });
    

        const data = await response.json();

        if(response.ok){

            user.displayName = newName;

            user.profilePicture = profileImage.src;

            localStorage.setItem(
                "user",
                JSON.stringify(user)
            );

            updateDashboard();

            showNotification(
                "✅ Profile Updated!",
                "#27ae60"
            );

             const navName = document.getElementById("userName");
            const navAvatar = document.getElementById("navAvatar");
if (navName) {
    navName.textContent = user.displayName;
}

profileImage.src = user.profilePicture;

if (navAvatar) {
    navAvatar.src = user.profilePicture;
}

        }else{

            showNotification(
                data.message,
                "#e74c3c"
            );

        }

    }catch(err){

        console.log(err);

        showNotification(
            "Server Error",
            "#e74c3c"
        );
        

    }

});
}

// ==============================
// LEADERBOARD
// ==============================

async function loadLeaderboard() {
    const list = document.getElementById("leaderboardList");
    if (!list) return;

    list.textContent = "Loading leaderboard...";

    try {
        // Import Firestore functions from the Firebase Web SDK.
        const { db } = await import("./firebase.js");
        const {
            collection,
            getDocs,
            query,
            orderBy,
            limit
        } = await import(
            "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js"
        );

        const leaderboardQuery = query(
            collection(db, "users"),
            orderBy("xp", "desc"),
            limit(50)
        );

        const snapshot = await getDocs(leaderboardQuery);
        const players = snapshot.docs.map(doc => doc.data());

        list.replaceChildren();

        if (players.length === 0) {
            list.textContent = "No players on the leaderboard yet.";
            return;
        }

        players.forEach((player, index) => {
            const item = document.createElement("div");
            item.className = "leaderboard-item";

            const currentUsername =
                (player.username || "").toLowerCase();

            const loggedInUsername =
                (user?.username || user?.displayName || "").toLowerCase();

            if (
                currentUsername &&
                currentUsername === loggedInUsername
            ) {
                item.classList.add("current-player");
            }

            const left = document.createElement("div");
            left.className = "leaderboard-left";

            const rank = document.createElement("span");
            rank.className = "rank";
            rank.textContent =
                index === 0 ? "🥇" :
                index === 1 ? "🥈" :
                index === 2 ? "🥉" :
                `#${index + 1}`;

            const avatar = document.createElement("img");
            avatar.className = "leaderboard-avatar";
            avatar.src =
                player.profilePicture || "images/default-avatar.png";
            avatar.alt = `${player.username || "Player"}'s avatar`;

            const info = document.createElement("div");
            info.className = "player-info";

            const name = document.createElement("strong");
            name.textContent =
                player.displayName || player.username || "Player";

            const level = document.createElement("small");
            level.textContent = `Level ${Number(player.level) || 1}`;

            info.append(name, level);
            left.append(rank, avatar, info);

            const xp = document.createElement("div");
            xp.className = "player-xp";
            xp.textContent = `⭐ ${Number(player.xp) || 0} XP`;

            item.append(left, xp);
            list.appendChild(item);
        });

    } catch (error) {
        console.error("Failed to load Firestore leaderboard:", error);
        list.textContent =
            "Unable to load leaderboard. Check the browser console and Firestore rules.";
    }
}

loadLeaderboard();



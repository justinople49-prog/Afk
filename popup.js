// ===============================
// ANSWER POPUP
// ===============================

function showPopup(type, message){

    console.log("Popup called");

    const popup = document.getElementById("answerPopup");
    const title = document.getElementById("popupTitle");
    const text = document.getElementById("popupMessage");

    console.log(popup);

    popup.classList.remove("hidden");

    popup.style.display = "flex";

     popup.offsetHeight; 

    if(type==="correct"){

        title.innerHTML="✅ Correct!";
        title.className="popup-correct";

    }else{

        title.innerHTML="❌ Incorrect!";
        title.className="popup-wrong";

    }

    text.innerHTML=message;

    setTimeout(() => {

    popup.classList.add("hidden");

    popup.style.display = "none";

}, 1800);
}
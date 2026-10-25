// =========================================
// READQUEST FRIENDS SYSTEM
// =========================================

const API_URL = "http://localhost:3000";


// =========================================
// GET CURRENT USER
// =========================================

const currentUser =
    JSON.parse(localStorage.getItem("user"));

if (!currentUser) {
    window.location.href = "login.html";
    throw new Error("No logged-in user.");
}


// =========================================
// ELEMENTS
// =========================================

const searchInput =
    document.getElementById("friendSearchInput");

const searchButton =
    document.getElementById("friendSearchBtn");

const searchResults =
    document.getElementById("searchResults");

const requestList =
    document.getElementById("requestList");

const requestCount =
    document.getElementById("requestCount");

const friendsList =
    document.getElementById("friendsList");

const backDashboardButton =
    document.getElementById("backDashboardBtn");


// =========================================
// BACK TO DASHBOARD
// =========================================

backDashboardButton.addEventListener("click", () => {
    window.location.href = "index.html";
});


// =========================================
// SEARCH FRIENDS
// =========================================

searchButton.addEventListener("click", searchUsers);

searchInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        searchUsers();
    }

});


async function searchUsers() {

    const username =
        searchInput.value.trim();

    if (!username) {

        searchResults.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔎</div>
                Enter a username to search.
            </div>
        `;

        return;
    }


    searchResults.innerHTML = `
        <div class="empty-state">
            🔄 Searching...
        </div>
    `;


    try {

        const response = await fetch(
            `${API_URL}/api/friends/search?username=${encodeURIComponent(username)}&userId=${currentUser.id}`
        );


        const data =
            await response.json();


        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to search users."
            );
        }


        if (!data.users || data.users.length === 0) {

            searchResults.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">😕</div>
                    No players found.
                </div>
            `;

            return;
        }


        searchResults.innerHTML = "";


        data.users.forEach(user => {

            const item =
                document.createElement("div");

            item.className =
                "user-result";


            item.innerHTML = `

                <div>
                    <div class="user-result-name">
                        ${escapeHTML(user.DisplayName)}
                    </div>

                    <div class="user-result-id">
                        Player ID: ${user.UserId}
                    </div>
                </div>

                <button
                    class="send-request-btn"
                    type="button"
                >
                    ➕ Add Friend
                </button>

            `;


            const button =
                item.querySelector(
                    ".send-request-btn"
                );


            button.addEventListener(
                "click",
                () => sendFriendRequest(
                    user.UserId,
                    button
                )
            );


            searchResults.appendChild(item);

        });


    } catch (error) {

        console.error(
            "Search error:",
            error
        );


        searchResults.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                Unable to search players.
                <br>
                Please make sure the server is running.
            </div>
        `;
    }
}


// =========================================
// SEND FRIEND REQUEST
// =========================================

async function sendFriendRequest(
    receiverId,
    button
) {

    button.disabled = true;
    button.textContent = "Sending...";


    try {

        const response = await fetch(
            `${API_URL}/api/friends/request`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    senderId: currentUser.id,
                    receiverId: receiverId
                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to send friend request."
            );

        }


        button.textContent = "✓ Sent";
        button.style.background = "#20e6a0";


    } catch (error) {

        console.error(
            "Friend request error:",
            error
        );


        alert(
            error.message ||
            "Unable to send friend request."
        );


        button.disabled = false;
        button.textContent = "➕ Add Friend";

    }

}


// =========================================
// LOAD REQUESTS
// =========================================

async function loadRequests() {

    requestList.innerHTML = `
        <div class="empty-state">
            🔄 Loading requests...
        </div>
    `;


    try {

        const response = await fetch(
            `${API_URL}/api/friends/requests/${currentUser.id}`
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load requests."
            );

        }


        const requests =
            data.requests || [];


        requestCount.textContent =
            requests.length;


        if (requests.length === 0) {

            requestList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📩</div>
                    No pending friend requests.
                </div>
            `;

            return;
        }


        requestList.innerHTML = "";


        requests.forEach(request => {

            const item =
                document.createElement("div");

            item.className =
                "request-item";


            item.innerHTML = `

                <div>
                    <div class="request-name">
                        ${escapeHTML(request.DisplayName)}
                    </div>
                </div>

                <div class="request-actions">

                    <button
                        class="accept-btn"
                        type="button"
                    >
                        ✓ Accept
                    </button>

                    <button
                        class="reject-btn"
                        type="button"
                    >
                        ✕ Reject
                    </button>

                </div>

            `;


            const acceptButton =
                item.querySelector(
                    ".accept-btn"
                );

            const rejectButton =
                item.querySelector(
                    ".reject-btn"
                );


            acceptButton.addEventListener(
                "click",
                () => respondToRequest(
                    request.RequestId,
                    "Accepted"
                )
            );


            rejectButton.addEventListener(
                "click",
                () => respondToRequest(
                    request.RequestId,
                    "Rejected"
                )
            );


            requestList.appendChild(item);

        });


    } catch (error) {

        console.error(
            "Load requests error:",
            error
        );


        requestList.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <strong>Unable to load requests.</strong>
                <br>
                ${escapeHTML(error.message)}
            </div>
        `;
    }
}


// =========================================
// ACCEPT / REJECT REQUEST
// =========================================

async function respondToRequest(
    requestId,
    status
) {

    try {

        const response = await fetch(
            `${API_URL}/api/friends/request/respond`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    requestId: requestId,
                    userId: currentUser.id,
                    status: status
                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to update request."
            );

        }


        await loadRequests();
        await loadFriends();


    } catch (error) {

        console.error(
            "Respond request error:",
            error
        );


        alert(
            error.message ||
            "Unable to update request."
        );

    }

}


// =========================================
// LOAD FRIENDS
// =========================================

async function loadFriends() {

    friendsList.innerHTML = `
        <div class="empty-state">
            🔄 Loading friends...
        </div>
    `;


    try {

        const response = await fetch(
            `${API_URL}/api/friends/${currentUser.id}`
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load friends."
            );

        }


        const friends =
            data.friends || [];


        if (friends.length === 0) {

            friendsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    No friends yet.
                    <br>
                    Search for a player above and send your first friend request.
                </div>
            `;

            return;
        }


        friendsList.innerHTML = "";


        friends.forEach(friend => {

            const item =
                document.createElement("div");

            item.className =
                "friend-item";


            item.innerHTML = `

                <div>
                    <div class="friend-name">
                        💙 ${escapeHTML(friend.DisplayName)}
                    </div>
                </div>

                <button
                    class="remove-btn"
                    type="button"
                >
                    Remove
                </button>

            `;


            const removeButton =
                item.querySelector(
                    ".remove-btn"
                );


            removeButton.addEventListener(
                "click",
                () => removeFriend(
                    friend.UserId
                )
            );


            friendsList.appendChild(item);

        });


    } catch (error) {

        console.error(
            "Load friends error:",
            error
        );


        friendsList.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                Unable to load friends.
            </div>
        `;
    }
}


// =========================================
// REMOVE FRIEND
// =========================================

async function removeFriend(friendUserId) {

    const confirmed =
        confirm(
            "Are you sure you want to remove this friend?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/api/friends/remove`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    userId: currentUser.id,
                    friendUserId: friendUserId
                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to remove friend."
            );

        }


        await loadFriends();


    } catch (error) {

        console.error(
            "Remove friend error:",
            error
        );


        alert(
            error.message ||
            "Unable to remove friend."
        );

    }

}


// =========================================
// HTML SAFETY
// =========================================

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// =========================================
// INITIAL LOAD
// =========================================

loadRequests();
loadFriends();
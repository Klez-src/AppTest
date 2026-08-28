"use strict";


/* =========================================================
   CONFIG
   ========================================================= */

const API_URL =
    "http://127.0.0.1:3000";


/* =========================================================
   STATE
   ========================================================= */

let loaderToken = null;
let currentAccount = null;
let injectionRunning = false;
let injectionTimer = null;


/* =========================================================
   ELEMENTS
   ========================================================= */

const tokenSection =
    document.getElementById(
        "tokenSection"
    );

const loaderSection =
    document.getElementById(
        "loaderSection"
    );

const tokenInput =
    document.getElementById(
        "tokenInput"
    );

const rememberToken =
    document.getElementById(
        "rememberToken"
    );

const authenticateButton =
    document.getElementById(
        "authenticateButton"
    );

const tokenMessage =
    document.getElementById(
        "tokenMessage"
    );

const gameTabs =
    document.querySelectorAll(
        ".game-tab"
    );

const gameCards =
    document.querySelectorAll(
        ".game-card"
    );

const injectButton =
    document.getElementById(
        "injectButton"
    );

const injectionScreen =
    document.getElementById(
        "injectionScreen"
    );

const injectionTitle =
    document.getElementById(
        "injectionTitle"
    );

const injectionProgress =
    document.getElementById(
        "injectionProgress"
    );

const cancelInjection =
    document.getElementById(
        "cancelInjection"
    );

const minimizeButton =
    document.getElementById(
        "minimizeButton"
    );

const closeButton =
    document.getElementById(
        "closeButton"
    );


/* =========================================================
   STORAGE
   ========================================================= */

function readRememberedToken() {
    try {
        return localStorage.getItem(
            "loaderToken"
        );
    } catch {
        return null;
    }
}


function rememberUserToken(token) {
    try {
        localStorage.setItem(
            "loaderToken",
            token
        );
    } catch {}
}


function forgetUserToken() {
    try {
        localStorage.removeItem(
            "loaderToken"
        );
    } catch {}
}


/* =========================================================
   API
   ========================================================= */

async function authenticateToken(token) {
    const response =
        await fetch(
            `${API_URL}/api/loader/account`,
            {
                method: "GET",

                headers: {
                    "X-Loader-Token":
                        token
                }
            }
        );

    let data = {};

    try {
        data =
            await response.json();
    } catch {}

    if (!response.ok) {
        throw new Error(
            data.error ||
            "Unable to authenticate."
        );
    }

    return data;
}


/* =========================================================
   AUTH UI
   ========================================================= */

function showAuth() {
    tokenSection.classList.remove(
        "hidden"
    );

    loaderSection.classList.add(
        "hidden"
    );
}


function showLoader() {
    tokenSection.classList.add(
        "hidden"
    );

    loaderSection.classList.remove(
        "hidden"
    );
}


function showTokenMessage(message) {
    tokenMessage.textContent =
        message || "";
}


/* =========================================================
   AUTHENTICATE
   ========================================================= */

async function loginWithToken(
    token,
    remember
) {
    token =
        String(token || "").trim();

    if (!token) {
        showTokenMessage(
            "Enter your account token."
        );

        return false;
    }


    authenticateButton.disabled =
        true;

    showTokenMessage(
        "Authenticating..."
    );


    try {
        const account =
            await authenticateToken(
                token
            );


        loaderToken =
            token;

        currentAccount =
            account;


        if (remember) {
            rememberUserToken(
                token
            );
        } else {
            forgetUserToken();
        }


        showTokenMessage("");

        showLoader();

        applySubscriptions(
            account.subscriptions
        );

        return true;

    } catch (error) {
        loaderToken = null;
        currentAccount = null;

        showTokenMessage(
            error.message ||
            "Unable to authenticate."
        );

        return false;

    } finally {
        authenticateButton.disabled =
            false;
    }
}


/* =========================================================
   AUTH BUTTON
   ========================================================= */

authenticateButton.addEventListener(
    "click",
    () => {
        loginWithToken(
            tokenInput.value,
            rememberToken.checked
        );
    }
);


tokenInput.addEventListener(
    "keydown",
    event => {
        if (
            event.key === "Enter"
        ) {
            event.preventDefault();

            loginWithToken(
                tokenInput.value,
                rememberToken.checked
            );
        }
    }
);


/* =========================================================
   REFRESH ACCOUNT
   ========================================================= */

async function refreshAccount() {
    if (!loaderToken) {
        return false;
    }


    try {
        const account =
            await authenticateToken(
                loaderToken
            );


        currentAccount =
            account;


        applySubscriptions(
            account.subscriptions
        );


        return true;

    } catch {
        currentAccount = null;
        loaderToken = null;


        showAuth();

        tokenInput.value = "";


        showTokenMessage(
            "Your token could not be authenticated."
        );


        return false;
    }
}


/* =========================================================
   SUBSCRIPTIONS
   ========================================================= */

function applySubscriptions(
    subscriptions
) {
    const owned =
        new Set(
            Array.isArray(
                subscriptions
            )
                ? subscriptions
                : []
        );


    gameCards.forEach(card => {
        const productId =
            card.dataset.productId;


        const status =
            card.querySelector(
                ".subscription"
            );


        if (!status) {
            return;
        }


        const subscribed =
            owned.has(productId);


        status.classList.toggle(
            "subscribed",
            subscribed
        );


        status.classList.toggle(
            "not-subscribed",
            !subscribed
        );


        status.textContent =
            subscribed
                ? "Subscribed"
                : "Not subscribed";
    });
}


/* =========================================================
   TABS
   ========================================================= */

function setActiveTab(tab) {
    gameTabs.forEach(
        item => {
            item.classList.toggle(
                "active",
                item === tab
            );
        }
    );
}


function updateGameCards(game) {
    gameCards.forEach(card => {
        const games =
            (
                card.dataset.games ||
                ""
            )
                .split(",")
                .map(
                    value =>
                        value.trim()
                );


        const visible =
            game === "all" ||
            games.includes(game);


        card.classList.toggle(
            "hidden-game",
            !visible
        );
    });
}


gameTabs.forEach(tab => {
    tab.addEventListener(
        "click",
        () => {
            const game =
                tab.dataset.game;


            setActiveTab(tab);

            updateGameCards(
                game
            );
        }
    );
});


/* =========================================================
   CARD SELECTION
   ========================================================= */

gameCards.forEach(card => {
    card.addEventListener(
        "click",
        () => {
            if (
                card.classList.contains(
                    "hidden-game"
                )
            ) {
                return;
            }


            gameCards.forEach(
                item => {
                    item.classList.remove(
                        "selected"
                    );
                }
            );


            card.classList.add(
                "selected"
            );
        }
    );
});


function getSelectedCard() {
    return (
        document.querySelector(
            ".game-card.selected:not(.hidden-game)"
        ) ||
        document.querySelector(
            ".game-card:not(.hidden-game)"
        )
    );
}


/* =========================================================
   MOCK LOAD ACTION
   ========================================================= */

async function loadSelected() {
    /*
        Always re-check the backend immediately
        before performing the mock action.
    */

    const authenticated =
        await refreshAccount();


    if (!authenticated) {
        return;
    }


    const card =
        getSelectedCard();


    if (!card) {
        return;
    }


    const productId =
        card.dataset.productId;


    const subscriptions =
        new Set(
            currentAccount?.subscriptions ||
            []
        );


    /*
        USER DOES NOT OWN THIS OPTION

        In WebView2, send the event to the
        native C++ application so it can show
        a normal Windows MessageBox.

        When running outside WebView2, retain
        the original browser alert as fallback.
    */

    if (
        !subscriptions.has(
            productId
        )
    ) {
        if (
            window.chrome &&
            window.chrome.webview
        ) {
            window.chrome.webview.postMessage(
                "auth.failed"
            );
        } else {
            window.alert(
                "Unable to authenticate this option."
            );
        }

        return;
    }


    const name =
        card.dataset.option ||
        "Option";


    injectionTitle.textContent =
        `Loading ${name}`;


    injectionProgress.style.width =
        "0%";


    injectionScreen.classList.add(
        "active"
    );


    injectionScreen.setAttribute(
        "aria-hidden",
        "false"
    );


    injectionRunning =
        true;


    let progress = 0;


    function update() {
        if (!injectionRunning) {
            return;
        }


        progress += 2;


        injectionProgress.style.width =
            `${Math.min(
                progress,
                100
            )}%`;


        if (progress >= 100) {
            injectionRunning =
                false;


            injectionTimer =
                setTimeout(
                    () => {
                        injectionScreen.classList.remove(
                            "active"
                        );


                        injectionScreen.setAttribute(
                            "aria-hidden",
                            "true"
                        );
                    },
                    300
                );


            return;
        }


        injectionTimer =
            setTimeout(
                update,
                30
            );
    }


    update();
}


injectButton.addEventListener(
    "click",
    loadSelected
);


/* =========================================================
   CANCEL
   ========================================================= */

cancelInjection.addEventListener(
    "click",
    () => {
        injectionRunning =
            false;


        if (
            injectionTimer !== null
        ) {
            clearTimeout(
                injectionTimer
            );


            injectionTimer = null;
        }


        injectionScreen.classList.remove(
            "active"
        );


        injectionScreen.setAttribute(
            "aria-hidden",
            "true"
        );


        injectionProgress.style.width =
            "0%";
    }
);


/* =========================================================
   WINDOW CONTROLS
   ========================================================= */

minimizeButton?.addEventListener(
    "click",
    () => {
        if (
            window.chrome &&
            window.chrome.webview
        ) {
            window.chrome.webview.postMessage(
                "window.minimize"
            );
        }
    }
);


closeButton?.addEventListener(
    "click",
    () => {
        if (
            window.chrome &&
            window.chrome.webview
        ) {
            window.chrome.webview.postMessage(
                "window.close"
            );
        }
    }
);


/* =========================================================
   DRAG
   ========================================================= */

document
    .querySelector(
        ".topbar-drag-area"
    )
    ?.addEventListener(
        "mousedown",
        event => {
            if (
                event.button !== 0
            ) {
                return;
            }


            if (
                window.chrome &&
                window.chrome.webview
            ) {
                window.chrome.webview.postMessage(
                    "window.drag"
                );
            }
        }
    );


/* =========================================================
   STARTUP
   ========================================================= */

(async function start() {
    const savedToken =
        readRememberedToken();


    if (!savedToken) {
        showAuth();

        tokenInput.focus();

        return;
    }


    tokenInput.value =
        savedToken;


    rememberToken.checked =
        true;


    /*
        Automatically authenticate the saved
        token when the loader opens.
    */

    const success =
        await loginWithToken(
            savedToken,
            true
        );


    if (!success) {
        forgetUserToken();

        tokenInput.value = "";

        tokenInput.focus();
    }
})();

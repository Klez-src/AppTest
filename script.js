"use strict";


/* =========================================================
   NATIVE WEBVIEW BRIDGE
   ========================================================= */

function nativeMessage(message) {

    if (
        window.chrome &&
        window.chrome.webview
    ) {

        window.chrome.webview.postMessage(
            message
        );

    }

}


/* =========================================================
   ELEMENTS
   ========================================================= */

const tabs =
    document.querySelectorAll(
        ".game-tab"
    );


const cards =
    document.querySelectorAll(
        ".game-card"
    );


const injectButton =
    document.getElementById(
        "injectButton"
    );


const queueScreen =
    document.getElementById(
        "queueScreen"
    );


const queueProgress =
    document.getElementById(
        "queueProgress"
    );


const queueCount =
    document.getElementById(
        "queueCount"
    );


const queuePosition =
    document.getElementById(
        "queuePosition"
    );


const queueTime =
    document.getElementById(
        "queueTime"
    );


const cancelQueue =
    document.getElementById(
        "cancelQueue"
    );


const closeButton =
    document.getElementById(
        "closeButton"
    );


const minimizeButton =
    document.getElementById(
        "minimizeButton"
    );


/* =========================================================
   GAME TAB
   ========================================================= */

const GAME_KEY =
    "undercal.selectedGame";


function setGame(
    game
) {

    localStorage.setItem(
        GAME_KEY,
        game
    );


    tabs.forEach(
        tab => {

            tab.classList.toggle(
                "active",
                tab.dataset.game === game
            );

        }
    );


    cards.forEach(
        card => {

            const games =
                card.dataset.games
                    .split(",");


            const visible =
                game === "all" ||
                games.includes(game);


            card.classList.toggle(
                "hidden-game",
                !visible
            );

        }
    );

}


tabs.forEach(
    tab => {

        tab.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                setGame(
                    tab.dataset.game
                );

            }
        );

    }
);


const savedGame =
    localStorage.getItem(
        GAME_KEY
    );


setGame(
    savedGame || "csgo"
);


/* =========================================================
   QUEUE
   ========================================================= */

let queueRunning =
    false;


let queueFrame =
    null;


let queueStart =
    0;


let queueDuration =
    0;


let startingAhead =
    0;


/*
 * Roughly 29 seconds,
 * but not exactly 29 every time.
 *
 * 25–33 seconds.
 */

function randomDuration() {

    return (
        25000 +
        Math.floor(
            Math.random() * 9000
        )
    );

}


/*
 * 1–4 people ahead.
 */

function randomQueue() {

    return (
        Math.floor(
            Math.random() * 4
        ) + 1
    );

}


function updateQueue(
    progress
) {

    const remaining =
        Math.max(
            0,
            Math.ceil(
                startingAhead *
                (1 - progress)
            )
        );


    queueCount.textContent =
        remaining;


    queuePosition.textContent =
        remaining + 1;


    queueProgress.style.width =
        (
            progress * 100
        ) + "%";


    const elapsed =
        performance.now() -
        queueStart;


    const seconds =
        Math.max(
            0,
            Math.ceil(
                (
                    queueDuration -
                    elapsed
                ) / 1000
            )
        );


    queueTime.textContent =
        "~" +
        seconds +
        " seconds";

}


function animateQueue() {

    if (!queueRunning) {

        return;

    }


    const elapsed =
        performance.now() -
        queueStart;


    const progress =
        Math.min(
            elapsed /
            queueDuration,
            1
        );


    updateQueue(
        progress
    );


    if (
        progress >= 1
    ) {

        finishQueue();

        return;

    }


    queueFrame =
        requestAnimationFrame(
            animateQueue
        );

}


function startQueue() {

    if (queueRunning) {

        return;

    }


    queueRunning =
        true;


    startingAhead =
        randomQueue();


    queueDuration =
        randomDuration();


    queueStart =
        performance.now();


    queueCount.textContent =
        startingAhead;


    queuePosition.textContent =
        startingAhead + 1;


    queueTime.textContent =
        "~" +
        Math.ceil(
            queueDuration / 1000
        ) +
        " seconds";


    queueProgress.style.width =
        "0%";


    queueScreen.classList.add(
        "active"
    );


    queueFrame =
        requestAnimationFrame(
            animateQueue
        );

}


/* =========================================================
   FINISH
   ========================================================= */

function finishQueue() {

    queueRunning =
        false;


    if (queueFrame) {

        cancelAnimationFrame(
            queueFrame
        );

        queueFrame =
            null;

    }


    queueProgress.style.width =
        "100%";


    queueCount.textContent =
        "0";


    queuePosition.textContent =
        "1";


    queueTime.textContent =
        "Ready";


    /*
     * Keep the completed state
     * visible briefly.
     */

    setTimeout(
        () => {

            queueScreen.classList.remove(
                "active"
            );

        },
        500
    );

}


/* =========================================================
   INJECT BUTTON
   ========================================================= */

injectButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        startQueue();

    }
);


/* =========================================================
   CANCEL
   ========================================================= */

cancelQueue.addEventListener(
    "click",
    event => {

        event.stopPropagation();


        if (!queueRunning) {

            return;

        }


        queueRunning =
            false;


        if (queueFrame) {

            cancelAnimationFrame(
                queueFrame
            );

            queueFrame =
                null;

        }


        queueScreen.classList.remove(
            "active"
        );


        queueProgress.style.width =
            "0%";

    }
);


/* =========================================================
   WINDOW CONTROLS
   ========================================================= */

closeButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        nativeMessage(
            "window.close"
        );

    }
);


minimizeButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        nativeMessage(
            "window.minimize"
        );

    }
);


/* =========================================================
   DRAG
   ========================================================= */

/*
 * The WebView owns the mouse input, so
 * send the native C++ window a message
 * whenever the user starts dragging on
 * non-interactive UI.
 *
 * We deliberately DON'T change the cursor
 * to a hand.
 */

document.addEventListener(
    "pointerdown",
    event => {

        if (
            event.button !== 0
        ) {

            return;

        }


        if (
            event.target.closest(
                "button, [data-no-drag]"
            )
        ) {

            return;

        }


        nativeMessage(
            "window.drag"
        );

    }
);


/* =========================================================
   DISABLE CONTEXT MENU
   ========================================================= */

document.addEventListener(
    "contextmenu",
    event => {

        event.preventDefault();

    }
);


/* =========================================================
   DISABLE SELECTION
   ========================================================= */

document.addEventListener(
    "selectstart",
    event => {

        event.preventDefault();

    }
);

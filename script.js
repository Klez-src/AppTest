"use strict";


/* ============================================================
   ELEMENTS
   ============================================================ */

const optionsElement =
    document.getElementById("options");

const injectButton =
    document.getElementById("injectButton");

const loadingScreen =
    document.getElementById("loadingScreen");

const loadingOption =
    document.getElementById("loadingOption");

const loadingBar =
    document.getElementById("loadingBar");

const cancelButton =
    document.getElementById("cancelButton");

const minimizeButton =
    document.getElementById("minimizeButton");

const closeButton =
    document.getElementById("closeButton");

const gameTabs =
    document.querySelectorAll(".game-tab");


/* ============================================================
   OPTIONS
   ============================================================ */

/*
    IMPORTANT:

    All games:
        Primordial CS:GO
        GameSense CS:GO
        Primordial CS2

    CS:GO:
        Primordial CS:GO
        GameSense CS:GO

    CS2:
        Primordial CS2
*/

const OPTIONS = {

    primordialCsgo: {
        id: "primordial-csgo",
        name: "Primordial",
        game: "CS:GO",
        image: "./primordial.png"
    },

    gamesenseCsgo: {
        id: "gamesense-csgo",
        name: "Gamesense",
        game: "CS:GO",
        image: "./gamesense.png"
    },

    primordialCs2: {
        id: "primordial-cs2",
        name: "Primordial",
        game: "CS2",
        image: "./primordial.png"
    }

};


const GAME_OPTIONS = {

    all: [
        OPTIONS.primordialCsgo,
        OPTIONS.gamesenseCsgo,
        OPTIONS.primordialCs2
    ],

    csgo: [
        OPTIONS.primordialCsgo,
        OPTIONS.gamesenseCsgo
    ],

    cs2: [
        OPTIONS.primordialCs2
    ]

};


/* ============================================================
   STATE
   ============================================================ */

let currentGame = "all";

let selectedOption =
    OPTIONS.primordialCsgo;

let launchTimer = null;

let launchStartTime = 0;

let launchDuration = 11000;

let launchRunning = false;


/* ============================================================
   NATIVE WINDOW MESSAGES
   ============================================================ */

function sendNativeMessage(message)
{
    try
    {
        if (
            window.chrome &&
            window.chrome.webview
        )
        {
            window.chrome.webview.postMessage(
                message
            );
        }
    }
    catch
    {
        // Normal browser fallback.
    }
}


/* ============================================================
   WINDOW CONTROLS
   ============================================================ */

minimizeButton.addEventListener(
    "click",
    event =>
    {
        event.stopPropagation();

        sendNativeMessage(
            "window.minimize"
        );
    }
);


closeButton.addEventListener(
    "click",
    event =>
    {
        event.stopPropagation();

        sendNativeMessage(
            "window.close"
        );
    }
);


/* ============================================================
   DRAGGING
   ============================================================ */

document.addEventListener(
    "mousedown",
    event =>
    {
        if (event.button !== 0)
            return;

        const target =
            event.target;

        /*
            Do not start a native drag when the user
            is interacting with an actual control.
        */

        if (
            target.closest(
                "button, input, textarea, select, a"
            )
        )
        {
            return;
        }

        sendNativeMessage(
            "window.drag"
        );
    }
);


/* ============================================================
   RENDER OPTIONS
   ============================================================ */

function renderOptions()
{
    optionsElement.innerHTML = "";

    const available =
        GAME_OPTIONS[currentGame];

    /*
        If the currently selected option is not valid
        for the newly selected game, automatically pick
        the first valid option.
    */

    const stillAvailable =
        available.some(
            option =>
                option.id === selectedOption.id
        );

    if (!stillAvailable)
    {
        selectedOption =
            available[0];
    }


    available.forEach(
        option =>
        {
            const card =
                document.createElement(
                    "button"
                );

            card.type = "button";

            card.className =
                "option-card";

            card.dataset.option =
                option.id;

            if (
                option.id ===
                selectedOption.id
            )
            {
                card.classList.add(
                    "selected"
                );
            }


            const logo =
                document.createElement(
                    "div"
                );

            logo.className =
                "option-logo";


            const image =
                document.createElement(
                    "img"
                );

            image.src =
                option.image;

            image.alt =
                "";


            const name =
                document.createElement(
                    "div"
                );

            name.className =
                "option-name";


            const title =
                document.createElement(
                    "div"
                );

            title.className =
                "option-title";

            title.textContent =
                option.name;


            const actions =
                document.createElement(
                    "div"
                );

            actions.className =
                "option-actions";


            const subscription =
                document.createElement(
                    "div"
                );

            subscription.className =
                "subscription";

            subscription.textContent =
                "Not subscribed";


            const gameBadge =
                document.createElement(
                    "div"
                );

            gameBadge.className =
                "game-badge";

            gameBadge.textContent =
                option.game;


            logo.appendChild(image);

            name.appendChild(title);

            actions.appendChild(
                subscription
            );

            actions.appendChild(
                gameBadge
            );

            card.appendChild(logo);

            card.appendChild(name);

            card.appendChild(actions);


            card.addEventListener(
                "click",
                event =>
                {
                    event.stopPropagation();

                    selectedOption =
                        option;

                    renderOptions();
                }
            );


            optionsElement.appendChild(
                card
            );
        }
    );
}


/* ============================================================
   GAME TABS
   ============================================================ */

gameTabs.forEach(
    tab =>
    {
        tab.addEventListener(
            "click",
            event =>
            {
                event.stopPropagation();

                currentGame =
                    tab.dataset.game;

                gameTabs.forEach(
                    other =>
                    {
                        other.classList.toggle(
                            "active",
                            other === tab
                        );
                    }
                );

                renderOptions();
            }
        );
    }
);


/* ============================================================
   LOADING
   ============================================================ */

function showLoading()
{
    loadingOption.textContent =
        selectedOption.name +
        " " +
        selectedOption.game;

    loadingBar.style.width =
        "0%";

    loadingScreen.classList.add(
        "visible"
    );

    loadingScreen.setAttribute(
        "aria-hidden",
        "false"
    );
}


function hideLoading()
{
    if (launchTimer)
    {
        cancelAnimationFrame(
            launchTimer
        );

        launchTimer = null;
    }

    launchRunning = false;

    loadingBar.style.width =
        "0%";

    loadingScreen.classList.remove(
        "visible"
    );

    loadingScreen.setAttribute(
        "aria-hidden",
        "true"
    );
}


/*
    Uses a real elapsed-time calculation instead of
    stepping the bar by a fixed percentage.

    A small amount of easing/variation is applied so
    it doesn't look like a perfectly mechanical
    0,1,2,3... animation.
*/

function getProgress(elapsed)
{
    const raw =
        Math.min(
            1,
            elapsed / launchDuration
        );

    /*
        Slightly slower at the beginning,
        a little quicker through the middle,
        then naturally settles near the end.
    */

    const eased =
        1 -
        Math.pow(
            1 - raw,
            1.18
        );

    return eased * 100;
}


function launchFrame(now)
{
    if (!launchRunning)
        return;


    const elapsed =
        now - launchStartTime;


    const progress =
        getProgress(elapsed);


    loadingBar.style.width =
        `${progress}%`;


    if (
        elapsed >=
        launchDuration
    )
    {
        loadingBar.style.width =
            "100%";

        setTimeout(
            () =>
            {
                if (launchRunning)
                {
                    hideLoading();
                }
            },
            180
        );

        return;
    }


    launchTimer =
        requestAnimationFrame(
            launchFrame
        );
}


function startLaunch()
{
    if (launchRunning)
        return;


    launchRunning = true;


    /*
        Roughly eleven seconds, but not mathematically
        identical every time.

        Range:
            10.6s - 11.5s
    */

    launchDuration =
        10600 +
        Math.random() * 900;


    showLoading();


    launchStartTime =
        performance.now();


    launchTimer =
        requestAnimationFrame(
            launchFrame
        );
}


/* ============================================================
   CANCEL
   ============================================================ */

cancelButton.addEventListener(
    "click",
    event =>
    {
        event.stopPropagation();

        hideLoading();
    }
);


/* ============================================================
   INJECT
   ============================================================ */

injectButton.addEventListener(
    "click",
    event =>
    {
        event.stopPropagation();

        startLaunch();
    }
);


/* ============================================================
   INITIAL STATE
   ============================================================ */

renderOptions();

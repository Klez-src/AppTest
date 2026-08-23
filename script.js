"use strict";


/* ============================================================
   ELEMENTS
   ============================================================ */

const mainUI =
    document.getElementById("main-ui");

const loadingScreen =
    document.getElementById("loading-screen");

const loadingTitle =
    document.getElementById("loading-title");

const loadingOption =
    document.getElementById("loading-option");

const loadingFill =
    document.getElementById("loading-fill");

const optionsList =
    document.getElementById("options-list");

const injectButton =
    document.getElementById("injectButton");

const cancelButton =
    document.getElementById("cancelButton");

const minimizeButton =
    document.getElementById("minimizeButton");

const closeButton =
    document.getElementById("closeButton");

const gameTabs =
    document.querySelectorAll(".game-tab");


/* ============================================================
   ASSETS
   ============================================================ */

const ASSETS = {
    primordial: "./primordial.png",
    gamesense: "./gamesense.png"
};


/* ============================================================
   GAME / OPTION DATA
   ============================================================ */

const OPTIONS = {

    primordialCSGO: {
        id: "primordial-csgo",
        name: "Primordial",
        game: "CS:GO",
        logo: ASSETS.primordial
    },

    gamesenseCSGO: {
        id: "gamesense-csgo",
        name: "Gamesense",
        game: "CS:GO",
        logo: ASSETS.gamesense
    },

    primordialCS2: {
        id: "primordial-cs2",
        name: "Primordial",
        game: "CS:2",
        logo: ASSETS.primordial
    }

};


/* ============================================================
   TAB -> AVAILABLE OPTIONS
   ============================================================ */

const GAME_OPTIONS = {

    all: [
        OPTIONS.primordialCSGO,
        OPTIONS.gamesenseCSGO,
        OPTIONS.primordialCS2
    ],

    csgo: [
        OPTIONS.primordialCSGO,
        OPTIONS.gamesenseCSGO
    ],

    cs2: [
        OPTIONS.primordialCS2
    ]

};


/* ============================================================
   STATE
   ============================================================ */

let currentGame = "all";

let selectedOption =
    OPTIONS.primordialCSGO;

let launchRunning = false;

let animationFrame = null;

let launchStart = 0;


/* ============================================================
   WEBVIEW NATIVE MESSAGES
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
   GAME SELECTOR
   ============================================================ */

function updateGameTabs()
{
    gameTabs.forEach(tab =>
    {
        tab.classList.toggle(
            "active",
            tab.dataset.game === currentGame
        );
    });
}


function setGame(game)
{
    if (!GAME_OPTIONS[game])
        return;

    currentGame = game;

    const available =
        GAME_OPTIONS[currentGame];

    /*
       If the previous selection isn't available
       for this game, select the first valid option.
    */

    if (
        !available.some(
            option =>
                option.id === selectedOption.id
        )
    )
    {
        selectedOption =
            available[0];
    }

    updateGameTabs();

    renderOptions();
}


gameTabs.forEach(tab =>
{
    tab.addEventListener(
        "click",
        event =>
        {
            event.stopPropagation();

            setGame(
                tab.dataset.game
            );
        }
    );
});


/* ============================================================
   OPTION CARDS
   ============================================================ */

function renderOptions()
{
    optionsList.innerHTML = "";

    const available =
        GAME_OPTIONS[currentGame];

    available.forEach(option =>
    {
        const card =
            document.createElement("button");

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


        const logoWrap =
            document.createElement("span");

        logoWrap.className =
            "option-logo-wrap";


        const logo =
            document.createElement("img");

        logo.className =
            "option-logo";

        logo.src =
            option.logo;

        logo.alt =
            "";


        logoWrap.appendChild(
            logo
        );


        const info =
            document.createElement("span");

        info.className =
            "option-info";


        const name =
            document.createElement("span");

        name.className =
            "option-name";

        name.textContent =
            option.name;


        /*
           Important:
           There is intentionally NO second
           game label underneath the product name.
        */

        info.appendChild(
            name
        );


        const actions =
            document.createElement("span");

        actions.className =
            "option-actions";


        const subscription =
            document.createElement("span");

        subscription.className =
            "subscription";

        subscription.textContent =
            "Not subscribed";


        const gamePill =
            document.createElement("span");

        gamePill.className =
            "game-pill";

        gamePill.textContent =
            option.game;


        actions.appendChild(
            subscription
        );

        actions.appendChild(
            gamePill
        );


        card.appendChild(
            logoWrap
        );

        card.appendChild(
            info
        );

        card.appendChild(
            actions
        );


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


        optionsList.appendChild(
            card
        );
    });
}


/* ============================================================
   LOADING SCREEN
   ============================================================ */

function showLoadingScreen()
{
    loadingTitle.textContent =
        "Injecting";

    loadingOption.textContent =
        selectedOption.name +
        " — " +
        selectedOption.game;

    loadingFill.style.width =
        "0%";

    loadingScreen.classList.add(
        "visible"
    );

    loadingScreen.setAttribute(
        "aria-hidden",
        "false"
    );
}


function hideLoadingScreen()
{
    if (animationFrame !== null)
    {
        cancelAnimationFrame(
            animationFrame
        );

        animationFrame = null;
    }

    loadingScreen.classList.remove(
        "visible"
    );

    loadingScreen.setAttribute(
        "aria-hidden",
        "true"
    );

    loadingFill.style.width =
        "0%";

    launchRunning =
        false;
}


/* ============================================================
   REALISTIC ~11 SECOND PROGRESS
   ============================================================ */

/*
   This deliberately isn't a perfectly linear 0 -> 100
   animation.

   The progress has several natural-looking slowdowns,
   while the total duration remains about 11 seconds.
*/

function calculateProgress(elapsed)
{
    const duration =
        11000;

    const t =
        Math.min(
            1,
            elapsed / duration
        );


    /*
       Piecewise progress.

       Early:
       fairly quick.

       Middle:
       slows down.

       Late:
       noticeably slower before finishing.
    */

    if (t < .10)
    {
        return (
            t / .10
        ) * 15;
    }

    if (t < .28)
    {
        return (
            15 +
            ((t - .10) / .18) * 22
        );
    }

    if (t < .48)
    {
        return (
            37 +
            ((t - .28) / .20) * 18
        );
    }

    if (t < .66)
    {
        return (
            55 +
            ((t - .48) / .18) * 13
        );
    }

    if (t < .80)
    {
        return (
            68 +
            ((t - .66) / .14) * 9
        );
    }

    if (t < .91)
    {
        return (
            77 +
            ((t - .80) / .11) * 8
        );
    }

    if (t < .975)
    {
        return (
            85 +
            ((t - .91) / .065) * 11
        );
    }

    return (
        96 +
        ((t - .975) / .025) * 4
    );
}


function animateLaunch(timestamp)
{
    if (!launchRunning)
        return;


    if (!launchStart)
    {
        launchStart =
            timestamp;
    }


    const elapsed =
        timestamp -
        launchStart;


    const progress =
        calculateProgress(
            elapsed
        );


    loadingFill.style.width =
        progress.toFixed(2) + "%";


    if (elapsed >= 11000)
    {
        loadingFill.style.width =
            "100%";

        setTimeout(
            () =>
            {
                if (!launchRunning)
                    return;

                hideLoadingScreen();
            },
            220
        );

        return;
    }


    animationFrame =
        requestAnimationFrame(
            animateLaunch
        );
}


function startLaunch()
{
    if (launchRunning)
        return;


    launchRunning =
        true;

    launchStart =
        0;

    showLoadingScreen();


    animationFrame =
        requestAnimationFrame(
            animateLaunch
        );
}


function cancelLaunch()
{
    if (!launchRunning)
        return;

    hideLoadingScreen();
}


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


cancelButton.addEventListener(
    "click",
    event =>
    {
        event.stopPropagation();

        cancelLaunch();
    }
);


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
   WINDOW DRAGGING
   ============================================================ */

/*
   The window itself is borderless.

   Any ordinary empty part of the UI can therefore drag
   the native window.

   Buttons / images / controls are deliberately excluded.

   Cursor stays as the normal arrow — no "hand" cursor.
*/

document.addEventListener(
    "mousedown",
    event =>
    {
        if (
            event.button !== 0
        )
        {
            return;
        }


        const target =
            event.target;


        if (
            target.closest(
                "button, img, input, textarea, select"
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
   INITIALISE
   ============================================================ */

setGame("all");

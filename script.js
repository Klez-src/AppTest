"use strict";


/* =========================================================
   ELEMENTS
   ========================================================= */

const app = document.getElementById("app");

const navButtons = document.querySelectorAll(".nav-button");
const views = document.querySelectorAll(".view");

const homeLaunch = document.getElementById("homeLaunch");
const launchButton = document.getElementById("launchButton");

const launchScreen = document.getElementById("launchScreen");

const launchTitle = document.getElementById("launchTitle");
const launchStatus = document.getElementById("launchStatus");
const launchStep = document.getElementById("launchStep");
const launchPercent = document.getElementById("launchPercent");
const launchProgressBar = document.getElementById("launchProgressBar");
const launchTime = document.getElementById("launchTime");
const launchFooterStatus =
    document.getElementById("launchFooterStatus");

const toggles = document.querySelectorAll(".toggle");


/* =========================================================
   SETTINGS
   ========================================================= */

const SETTINGS_KEY = "orro_settings_v1";

const defaultSettings = {
    rememberSession: false,
    automaticUpdates: false,
    closeAfterLaunch: false
};

let settings = {
    ...defaultSettings
};


/* =========================================================
   LOAD SETTINGS
   ========================================================= */

function loadSettings() {

    try {

        const saved =
            localStorage.getItem(SETTINGS_KEY);

        if (!saved)
            return;

        const parsed =
            JSON.parse(saved);

        if (
            parsed &&
            typeof parsed === "object"
        ) {
            settings = {
                ...defaultSettings,
                ...parsed
            };
        }

    } catch (error) {

        console.warn(
            "Could not load orro settings.",
            error
        );

        settings = {
            ...defaultSettings
        };
    }
}


/* =========================================================
   SAVE SETTINGS
   ========================================================= */

function saveSettings() {

    try {

        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify(settings)
        );

    } catch (error) {

        console.warn(
            "Could not save orro settings.",
            error
        );
    }
}


/* =========================================================
   APPLY SETTINGS
   ========================================================= */

function applySettings() {

    toggles.forEach(toggle => {

        const setting =
            toggle.dataset.setting;

        const enabled =
            Boolean(settings[setting]);

        toggle.classList.toggle(
            "on",
            enabled
        );

        toggle.setAttribute(
            "aria-pressed",
            enabled ? "true" : "false"
        );
    });
}


/* =========================================================
   TOGGLE EVENTS
   ========================================================= */

toggles.forEach(toggle => {

    toggle.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            const setting =
                toggle.dataset.setting;

            settings[setting] =
                !Boolean(settings[setting]);

            saveSettings();
            applySettings();
        }
    );
});


/* =========================================================
   NAVIGATION
   ========================================================= */

function showView(viewName) {

    views.forEach(view => {

        view.classList.toggle(
            "active",
            view.id === viewName
        );
    });


    navButtons.forEach(button => {

        button.classList.toggle(
            "selected",
            button.dataset.view === viewName
        );
    });
}


navButtons.forEach(button => {

    button.addEventListener(
        "click",
        event => {

            event.preventDefault();

            const view =
                button.dataset.view;

            if (!view)
                return;

            showView(view);
        }
    );
});


/* =========================================================
   LAUNCH STATE
   ========================================================= */

let launchTimer = null;
let launchStarted = false;

const LAUNCH_DURATION = 35000;


/* =========================================================
   LAUNCH PHASES
   ========================================================= */

const launchPhases = [
    {
        at: 0,
        title: "Preparing",
        status: "Starting launch sequence",
        step: "Initialising"
    },

    {
        at: 0.10,
        title: "Preparing",
        status: "Checking local environment",
        step: "Checking environment"
    },

    {
        at: 0.22,
        title: "Initialising",
        status: "Preparing orro components",
        step: "Initialising components"
    },

    {
        at: 0.36,
        title: "Initialising",
        status: "Loading application data",
        step: "Loading data"
    },

    {
        at: 0.50,
        title: "Starting",
        status: "Starting launcher services",
        step: "Starting services"
    },

    {
        at: 0.65,
        title: "Starting",
        status: "Preparing session",
        step: "Preparing session"
    },

    {
        at: 0.79,
        title: "Verifying",
        status: "Checking launch state",
        step: "Verifying state"
    },

    {
        at: 0.91,
        title: "Finishing",
        status: "Finalising launch",
        step: "Finalising"
    },

    {
        at: 0.985,
        title: "Ready",
        status: "Launch sequence complete",
        step: "Complete"
    }
];


/* =========================================================
   WEBVIEW NATIVE MESSAGING
   ========================================================= */

function sendNativeMessage(message) {

    try {

        if (
            window.chrome &&
            window.chrome.webview
        ) {

            window.chrome.webview.postMessage(
                message
            );

            return true;
        }

    } catch (error) {

        console.warn(
            "Native message failed.",
            error
        );
    }

    return false;
}


/* =========================================================
   FORMAT TIME
   ========================================================= */

function formatTime(seconds) {

    const safeSeconds =
        Math.max(
            0,
            Math.ceil(seconds)
        );

    const minutes =
        Math.floor(
            safeSeconds / 60
        );

    const remaining =
        safeSeconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remaining).padStart(2, "0")
    );
}


/* =========================================================
   UPDATE PHASE
   ========================================================= */

function updateLaunchPhase(progress) {

    let current =
        launchPhases[0];

    for (
        let i = 0;
        i < launchPhases.length;
        i++
    ) {

        if (
            progress >=
            launchPhases[i].at
        ) {
            current =
                launchPhases[i];
        }
    }


    launchTitle.textContent =
        current.title;

    launchStatus.textContent =
        current.status;

    launchStep.textContent =
        current.step;
}


/* =========================================================
   OPEN LAUNCH SCREEN
   ========================================================= */

function openLaunchScreen() {

    if (launchStarted)
        return;

    launchStarted = true;


    /* Reset */

    launchProgressBar.style.width =
        "0%";

    launchPercent.textContent =
        "0%";

    launchTime.textContent =
        "00:35";

    launchTitle.textContent =
        "Preparing";

    launchStatus.textContent =
        "Starting launch sequence";

    launchStep.textContent =
        "Initialising";

    launchFooterStatus.textContent =
        "Launching";


    /* Show */

    launchScreen.classList.add(
        "visible"
    );


    const startTime =
        performance.now();


    function tick(now) {

        const elapsed =
            now - startTime;

        const progress =
            Math.min(
                elapsed / LAUNCH_DURATION,
                1
            );


        const percent =
            Math.floor(
                progress * 100
            );


        const remaining =
            Math.ceil(
                (LAUNCH_DURATION - elapsed) /
                1000
            );


        launchProgressBar.style.width =
            `${percent}%`;

        launchPercent.textContent =
            `${percent}%`;

        launchTime.textContent =
            formatTime(
                remaining
            );


        updateLaunchPhase(
            progress
        );


        if (progress < 1) {

            launchTimer =
                requestAnimationFrame(
                    tick
                );

            return;
        }


        finishLaunch();
    }


    launchTimer =
        requestAnimationFrame(
            tick
        );
}


/* =========================================================
   FINISH LAUNCH
   ========================================================= */

function finishLaunch() {

    if (launchTimer) {

        cancelAnimationFrame(
            launchTimer
        );

        launchTimer = null;
    }


    launchProgressBar.style.width =
        "100%";

    launchPercent.textContent =
        "100%";

    launchTime.textContent =
        "00:00";

    launchTitle.textContent =
        "Ready";

    launchStatus.textContent =
        "Launch sequence complete";

    launchStep.textContent =
        "Complete";

    launchFooterStatus.textContent =
        "Ready";


    /*
       Small pause so the user actually sees
       the completed state.
    */

    setTimeout(() => {

        if (
            settings.closeAfterLaunch
        ) {

            sendNativeMessage(
                "window.close"
            );

            return;
        }


        launchScreen.classList.remove(
            "visible"
        );

        setTimeout(() => {

            launchScreen.style.display =
                "none";

            launchStarted = false;

        }, 280);

    }, 650);
}


/* =========================================================
   LAUNCH BUTTONS
   ========================================================= */

if (homeLaunch) {

    homeLaunch.addEventListener(
        "click",
        event => {

            event.preventDefault();

            openLaunchScreen();
        }
    );
}


if (launchButton) {

    launchButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            openLaunchScreen();
        }
    );
}


/* =========================================================
   PREVENT TEXT SELECTION
   ========================================================= */

document.addEventListener(
    "selectstart",
    event => {

        event.preventDefault();
    }
);


/* =========================================================
   PREVENT DRAGGING TEXT / IMAGES
   ========================================================= */

document.addEventListener(
    "dragstart",
    event => {

        event.preventDefault();
    }
);


/* =========================================================
   INITIALISE
   ========================================================= */

loadSettings();
applySettings();
showView("home");

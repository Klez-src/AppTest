"use strict";


// =========================================================
// ELEMENTS
// =========================================================

const intro = document.getElementById("intro");
const app = document.getElementById("app");

const closeButton = document.getElementById("closeButton");

const navButtons =
    document.querySelectorAll(".nav-button");

const views =
    document.querySelectorAll(".view");

const homeLaunch =
    document.getElementById("homeLaunch");

const launchButton =
    document.getElementById("launchButton");

const launchScreen =
    document.getElementById("launchScreen");

const launchTitle =
    document.getElementById("launchTitle");

const launchStatus =
    document.getElementById("launchStatus");

const launchProgressBar =
    document.getElementById("launchProgressBar");

const launchStep =
    document.getElementById("launchStep");

const launchPercent =
    document.getElementById("launchPercent");


// =========================================================
// NATIVE WINDOW COMMUNICATION
// =========================================================

function sendNative(message) {

    try {

        if (
            window.chrome &&
            window.chrome.webview
        ) {

            window.chrome.webview.postMessage(
                message
            );

        }

    } catch (_) {

        // Running directly in browser.
        // Nothing needs to happen.

    }

}


function closeApplication() {

    sendNative("window.close");

}


// =========================================================
// INTRO
// =========================================================

function startIntro() {

    // Keep the intro on screen long enough
    // for the animation to actually be visible.

    setTimeout(() => {

        intro.classList.add("finished");

        setTimeout(() => {

            app.classList.add("ready");

        }, 250);

    }, 2500);

}


// =========================================================
// NAVIGATION
// =========================================================

function showView(viewName) {

    views.forEach(view => {

        view.classList.remove("active");

    });


    navButtons.forEach(button => {

        button.classList.remove("active");

    });


    const target =
        document.getElementById(viewName);

    const selectedButton =
        document.querySelector(
            `.nav-button[data-view="${viewName}"]`
        );


    if (target) {

        target.classList.add("active");

    }


    if (selectedButton) {

        selectedButton.classList.add("active");

    }

}


navButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const view =
                button.dataset.view;

            if (view) {

                showView(view);

            }

        }
    );

});


// =========================================================
// SETTINGS
// =========================================================

const defaultSettings = {

    rememberSession: false,

    automaticUpdates: false,

    closeAfterLaunch: false

};


let settings = {
    ...defaultSettings
};


function loadSettings() {

    try {

        const saved =
            localStorage.getItem(
                "orro-settings"
            );


        if (saved) {

            const parsed =
                JSON.parse(saved);

            settings = {
                ...defaultSettings,
                ...parsed
            };

        }

    } catch (_) {

        settings = {
            ...defaultSettings
        };

    }


    updateSettingUI();

}


function saveSettings() {

    try {

        localStorage.setItem(
            "orro-settings",
            JSON.stringify(settings)
        );

    } catch (_) {

        // Local storage may be unavailable.
        // App still works without it.

    }

}


function updateSettingUI() {

    document
        .querySelectorAll(".toggle")
        .forEach(toggle => {

            const key =
                toggle.dataset.setting;

            const enabled =
                Boolean(settings[key]);

            toggle.classList.toggle(
                "enabled",
                enabled
            );

            toggle.setAttribute(
                "aria-pressed",
                enabled
                    ? "true"
                    : "false"
            );

        });

}


document
    .querySelectorAll(".toggle")
    .forEach(toggle => {

        toggle.addEventListener(
            "click",
            () => {

                const key =
                    toggle.dataset.setting;

                if (!key)
                    return;


                settings[key] =
                    !Boolean(settings[key]);


                saveSettings();

                updateSettingUI();

            }
        );

    });


// =========================================================
// LAUNCH SEQUENCE
// =========================================================

let launchRunning = false;

let launchTimer = null;

let launchStart = 0;


// Approximately 36 seconds total.

const LAUNCH_DURATION = 36000;


const launchStages = [

    {
        at: 0,
        title: "Preparing",
        status: "Starting launch sequence",
        step: "Initialising"
    },

    {
        at: 4500,
        title: "Checking",
        status: "Checking required components",
        step: "Checking files"
    },

    {
        at: 9000,
        title: "Loading",
        status: "Loading launch components",
        step: "Loading"
    },

    {
        at: 14500,
        title: "Initialising",
        status: "Initialising orro",
        step: "Initialising"
    },

    {
        at: 20500,
        title: "Preparing",
        status: "Preparing environment",
        step: "Preparing environment"
    },

    {
        at: 27000,
        title: "Starting",
        status: "Starting application",
        step: "Starting"
    },

    {
        at: 33000,
        title: "Finishing",
        status: "Completing launch sequence",
        step: "Finishing"
    },

    {
        at: 36000,
        title: "Ready",
        status: "Launch complete",
        step: "Complete"
    }

];


function setLaunchStage(stage) {

    launchTitle.textContent =
        stage.title;

    launchStatus.textContent =
        stage.status;

    launchStep.textContent =
        stage.step;

}


function updateLaunchProgress() {

    if (!launchRunning)
        return;


    const elapsed =
        performance.now() -
        launchStart;


    const progress =
        Math.min(
            elapsed / LAUNCH_DURATION,
            1
        );


    const percentage =
        Math.floor(progress * 100);


    launchProgressBar.style.width =
        `${percentage}%`;

    launchPercent.textContent =
        `${percentage}%`;


    let currentStage =
        launchStages[0];


    for (
        const stage of launchStages
    ) {

        if (
            elapsed >= stage.at
        ) {

            currentStage = stage;

        }

    }


    setLaunchStage(
        currentStage
    );


    if (
        progress >= 1
    ) {

        finishLaunch();

        return;

    }


    launchTimer =
        requestAnimationFrame(
            updateLaunchProgress
        );

}


function startLaunch() {

    if (launchRunning)
        return;


    launchRunning = true;


    // Make the launch screen become
    // the entire application.

    launchScreen.classList.add(
        "active"
    );


    launchProgressBar.style.width =
        "0%";

    launchPercent.textContent =
        "0%";


    setLaunchStage(
        launchStages[0]
    );


    launchStart =
        performance.now();


    launchTimer =
        requestAnimationFrame(
            updateLaunchProgress
        );

}


function finishLaunch() {

    launchRunning = false;


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


    setLaunchStage(
        launchStages[
            launchStages.length - 1
        ]
    );


    // Give the completed state a moment
    // before closing.

    if (
        settings.closeAfterLaunch
    ) {

        setTimeout(
            () => {

                closeApplication();

            },
            850
        );

    }

}


// =========================================================
// LAUNCH BUTTONS
// =========================================================

if (homeLaunch) {

    homeLaunch.addEventListener(
        "click",
        startLaunch
    );

}


if (launchButton) {

    launchButton.addEventListener(
        "click",
        startLaunch
    );

}


// =========================================================
// CLOSE
// =========================================================

if (closeButton) {

    closeButton.addEventListener(
        "click",
        closeApplication
    );

}


// =========================================================
// WINDOW DRAGGING
// =========================================================
//
// Anything that isn't an interactive control can
// be used to drag the native window.
//

document.addEventListener(
    "pointerdown",
    event => {

        const target =
            event.target;


        if (
            target.closest(
                "button, input, a"
            )
        ) {

            return;

        }


        sendNative(
            "window.drag"
        );

    }
);


// =========================================================
// KEYBOARD
// =========================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            if (launchRunning) {

                return;

            }

            closeApplication();

        }

    }
);


// =========================================================
// START
// =========================================================

loadSettings();

startIntro();

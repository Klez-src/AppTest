"use strict";


/* =========================================================
   SETTINGS
   ========================================================= */

const DEFAULT_SETTINGS = {

    rememberSession: true,

    automaticUpdates: true,

    minimiseOnLaunch: false,

    closeAfterLaunch: false

};


let settings = {
    ...DEFAULT_SETTINGS
};


/* =========================================================
   LOAD SETTINGS
   ========================================================= */

function loadSettings() {

    try {

        const stored =
            localStorage.getItem(
                "orro.settings"
            );


        if (stored) {

            const parsed =
                JSON.parse(stored);


            settings = {

                ...DEFAULT_SETTINGS,

                ...parsed

            };

        }

    } catch {

        settings = {
            ...DEFAULT_SETTINGS
        };

    }

}


/* =========================================================
   SAVE SETTINGS
   ========================================================= */

function saveSettings() {

    try {

        localStorage.setItem(

            "orro.settings",

            JSON.stringify(
                settings
            )

        );

    } catch {

        // Storage unavailable.
    }

}


/* =========================================================
   UPDATE TOGGLES
   ========================================================= */

function updateToggles() {

    document
        .querySelectorAll(".toggle")
        .forEach(toggle => {

            const setting =
                toggle.dataset.setting;


            toggle.classList.toggle(

                "on",

                Boolean(
                    settings[setting]
                )

            );

        });

}


/* =========================================================
   SETTINGS EVENTS
   ========================================================= */

function setupSettings() {

    document
        .querySelectorAll(".toggle")
        .forEach(toggle => {

            toggle.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    const setting =
                        toggle.dataset.setting;


                    settings[setting] =
                        !settings[setting];


                    saveSettings();

                    updateToggles();

                }
            );

        });

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function showView(viewName) {

    document
        .querySelectorAll(".view")
        .forEach(view => {

            view.classList.remove(
                "active"
            );

        });


    const target =
        document.getElementById(
            viewName
        );


    if (!target)
        return;


    target.classList.add(
        "active"
    );


    document
        .querySelectorAll(".nav-button")
        .forEach(button => {

            button.classList.toggle(

                "selected",

                button.dataset.view ===
                viewName

            );

        });

}


/* =========================================================
   NAVIGATION EVENTS
   ========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(".nav-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    showView(
                        button.dataset.view
                    );

                }
            );

        });

}


/* =========================================================
   NATIVE WEBVIEW2
   ========================================================= */

function nativeMessage(message) {

    try {

        if (

            window.chrome &&

            window.chrome.webview

        ) {

            window.chrome.webview.postMessage(
                message
            );

        }

    } catch {

        // Browser preview.
    }

}


/* =========================================================
   WINDOW DRAG
   ========================================================= */

function setupDragging() {

    document.addEventListener(

        "mousedown",

        event => {

            if (
                event.button !== 0
            ) {
                return;
            }


            const element =
                event.target;


            /*
             * Buttons and controls need
             * their normal click behavior.
             */

            if (

                element.closest(
                    "button, input, select, textarea, a"
                )

            ) {

                return;

            }


            nativeMessage(
                "window.drag"
            );

        }

    );

}


/* =========================================================
   LAUNCH STAGES
   ========================================================= */

const LAUNCH_DURATION =
    35000;


const launchStages = [

    {
        at: 0,
        title: "Preparing",
        status: "Starting launch sequence",
        step: "Initialising"
    },

    {
        at: 3500,
        title: "Checking",
        status: "Checking required components",
        step: "Checking"
    },

    {
        at: 8000,
        title: "Loading",
        status: "Loading launch components",
        step: "Loading"
    },

    {
        at: 13500,
        title: "Preparing session",
        status: "Preparing the session",
        step: "Preparing"
    },

    {
        at: 19500,
        title: "Starting",
        status: "Starting required components",
        step: "Starting"
    },

    {
        at: 26000,
        title: "Finalising",
        status: "Finalising launch",
        step: "Finalising"
    },

    {
        at: 32000,
        title: "Almost ready",
        status: "Completing launch sequence",
        step: "Completing"
    },

    {
        at: 35000,
        title: "Ready",
        status: "Launch complete",
        step: "Complete"
    }

];


let launchRunning = false;

let launchStartTime = 0;

let launchFrame = null;


/* =========================================================
   LAUNCH ELEMENTS
   ========================================================= */

function launchElements() {

    return {

        screen:
            document.getElementById(
                "launchScreen"
            ),

        title:
            document.getElementById(
                "launchTitle"
            ),

        status:
            document.getElementById(
                "launchStatus"
            ),

        bar:
            document.getElementById(
                "launchProgressBar"
            ),

        step:
            document.getElementById(
                "launchStep"
            ),

        percent:
            document.getElementById(
                "launchPercent"
            )

    };

}


/* =========================================================
   UPDATE STAGE
   ========================================================= */

function updateLaunchStage(
    elapsed,
    elements
) {

    let stage =
        launchStages[0];


    for (
        let i = 0;
        i < launchStages.length;
        i++
    ) {

        if (
            elapsed >=
            launchStages[i].at
        ) {

            stage =
                launchStages[i];

        }

    }


    elements.title.textContent =
        stage.title;


    elements.status.textContent =
        stage.status;


    elements.step.textContent =
        stage.step;

}


/* =========================================================
   LAUNCH LOOP
   ========================================================= */

function launchLoop() {

    if (!launchRunning)
        return;


    const elements =
        launchElements();


    const elapsed =
        performance.now() -
        launchStartTime;


    const progress =
        Math.min(

            elapsed /
            LAUNCH_DURATION,

            1

        );


    const percentage =
        Math.floor(
            progress * 100
        );


    elements.bar.style.width =
        percentage + "%";


    elements.percent.textContent =
        percentage + "%";


    updateLaunchStage(
        elapsed,
        elements
    );


    if (
        progress >= 1
    ) {

        finishLaunch();

        return;

    }


    launchFrame =
        requestAnimationFrame(
            launchLoop
        );

}


/* =========================================================
   START LAUNCH
   ========================================================= */

function startLaunch() {

    if (launchRunning)
        return;


    launchRunning = true;


    const elements =
        launchElements();


    elements.screen.classList.add(
        "active"
    );


    elements.bar.style.width =
        "0%";


    elements.percent.textContent =
        "0%";


    elements.title.textContent =
        "Preparing";


    elements.status.textContent =
        "Starting launch sequence";


    elements.step.textContent =
        "Initialising";


    launchStartTime =
        performance.now();


    /*
     * Do not minimise here.
     *
     * The launching screen is supposed
     * to take over the entire app menu.
     */


    launchFrame =
        requestAnimationFrame(
            launchLoop
        );

}


/* =========================================================
   FINISH LAUNCH
   ========================================================= */

function finishLaunch() {

    launchRunning = false;


    if (launchFrame !== null) {

        cancelAnimationFrame(
            launchFrame
        );

        launchFrame = null;

    }


    const elements =
        launchElements();


    elements.bar.style.width =
        "100%";


    elements.percent.textContent =
        "100%";


    elements.title.textContent =
        "Ready";


    elements.status.textContent =
        "Launch complete";


    elements.step.textContent =
        "Complete";


    /*
     * Let the completed state remain
     * visible very briefly.
     */

    setTimeout(

        () => {

            if (
                settings.closeAfterLaunch
            ) {

                nativeMessage(
                    "window.close"
                );

                return;

            }


            elements.screen.classList.remove(
                "active"
            );

        },

        650

    );

}


/* =========================================================
   LAUNCH BUTTONS
   ========================================================= */

function setupLaunchButtons() {

    const homeButton =
        document.getElementById(
            "homeLaunch"
        );


    const launchButton =
        document.getElementById(
            "launchButton"
        );


    if (homeButton) {

        homeButton.addEventListener(

            "click",

            event => {

                event.stopPropagation();

                startLaunch();

            }

        );

    }


    if (launchButton) {

        launchButton.addEventListener(

            "click",

            event => {

                event.stopPropagation();

                startLaunch();

            }

        );

    }

}


/* =========================================================
   STARTUP
   ========================================================= */

function initialise() {

    loadSettings();

    setupSettings();

    updateToggles();

    setupNavigation();

    setupDragging();

    setupLaunchButtons();

}


document.addEventListener(

    "DOMContentLoaded",

    initialise

);

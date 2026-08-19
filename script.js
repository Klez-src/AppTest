"use strict";


/* =========================================================
   SETTINGS
   ========================================================= */

const DEFAULT_SETTINGS = {
    rememberSession: true,
    automaticUpdates: true,
    closeAfterLaunch: false
};


let settings = {
    ...DEFAULT_SETTINGS
};


function loadSettings() {

    try {

        const saved =
            localStorage.getItem("orro-settings");

        if (saved) {

            settings = {
                ...DEFAULT_SETTINGS,
                ...JSON.parse(saved)
            };
        }

    } catch (error) {

        settings = {
            ...DEFAULT_SETTINGS
        };
    }
}


function saveSettings() {

    try {

        localStorage.setItem(
            "orro-settings",
            JSON.stringify(settings)
        );

    } catch (error) {
        // Ignore storage errors.
    }
}


/* =========================================================
   APPLY SETTINGS
   ========================================================= */

function updateToggleUI() {

    document
        .querySelectorAll(".toggle")
        .forEach(toggle => {

            const setting =
                toggle.dataset.setting;

            toggle.classList.toggle(
                "on",
                !!settings[setting]
            );
        });
}


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

                    updateToggleUI();
                }
            );

        });

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function showView(id) {

    document
        .querySelectorAll(".view")
        .forEach(view => {

            view.classList.remove("active");
        });


    const target =
        document.getElementById(id);

    if (!target)
        return;


    target.classList.add("active");


    document
        .querySelectorAll(".nav-button")
        .forEach(button => {

            button.classList.toggle(
                "selected",
                button.dataset.view === id
            );

        });
}


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
   NATIVE WINDOW MESSAGES
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

        }

    } catch (error) {
        // Browser preview / non-WebView2 environment.
    }
}


/* =========================================================
   DRAG WINDOW
   ========================================================= */

function setupDragging() {

    document.addEventListener(
        "mousedown",
        event => {

            if (event.button !== 0)
                return;


            const target =
                event.target;


            /*
             * Don't steal clicks from controls.
             */

            if (
                target.closest(
                    "button, input, a, select, textarea"
                )
            ) {
                return;
            }


            sendNativeMessage(
                "window.drag"
            );

        }
    );

}


/* =========================================================
   LAUNCH SCREEN
   ========================================================= */

const launchStages = [

    {
        time: 0,
        title: "Preparing",
        status: "Starting launch sequence",
        step: "Initialising"
    },

    {
        time: 3500,
        title: "Checking",
        status: "Checking required components",
        step: "Checking"
    },

    {
        time: 8000,
        title: "Loading",
        status: "Loading launch components",
        step: "Loading"
    },

    {
        time: 13500,
        title: "Preparing session",
        status: "Preparing the session",
        step: "Preparing"
    },

    {
        time: 19500,
        title: "Starting",
        status: "Starting required components",
        step: "Starting"
    },

    {
        time: 26000,
        title: "Finalising",
        status: "Finalising launch",
        step: "Finalising"
    },

    {
        time: 32000,
        title: "Almost ready",
        status: "Completing launch sequence",
        step: "Completing"
    },

    {
        time: 35000,
        title: "Ready",
        status: "Launch complete",
        step: "Complete"
    }

];


let launchRunning = false;
let launchStart = 0;
let launchAnimation = null;


function getLaunchElements() {

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


function updateLaunchStage(
    elapsed,
    elements
) {

    let current =
        launchStages[0];


    for (
        let i = 0;
        i < launchStages.length;
        i++
    ) {

        if (
            elapsed >=
            launchStages[i].time
        ) {

            current =
                launchStages[i];

        }

    }


    elements.title.textContent =
        current.title;

    elements.status.textContent =
        current.status;

    elements.step.textContent =
        current.step;

}


function launchTick() {

    if (!launchRunning)
        return;


    const elements =
        getLaunchElements();


    const elapsed =
        performance.now() -
        launchStart;


    const duration =
        35000;


    const progress =
        Math.min(
            elapsed / duration,
            1
        );


    const percentage =
        Math.round(
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


    if (progress >= 1) {

        finishLaunch();

        return;
    }


    launchAnimation =
        requestAnimationFrame(
            launchTick
        );

}


function startLaunch() {

    if (launchRunning)
        return;


    launchRunning = true;


    const elements =
        getLaunchElements();


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


    launchStart =
        performance.now();


    launchAnimation =
        requestAnimationFrame(
            launchTick
        );

}


function finishLaunch() {

    launchRunning = false;


    if (launchAnimation) {

        cancelAnimationFrame(
            launchAnimation
        );

        launchAnimation = null;
    }


    const elements =
        getLaunchElements();


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
     * Give the completed state a moment
     * before closing.
     */

    setTimeout(
        () => {

            if (
                settings.closeAfterLaunch
            ) {

                sendNativeMessage(
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

    const homeLaunch =
        document.getElementById(
            "homeLaunch"
        );


    const launchButton =
        document.getElementById(
            "launchButton"
        );


    if (homeLaunch) {

        homeLaunch.addEventListener(
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

    updateToggleUI();

    setupNavigation();

    setupDragging();

    setupLaunchButtons();

}


document.addEventListener(
    "DOMContentLoaded",
    initialise
);

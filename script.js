/* =========================================================
   ORRO — SCRIPT
   ========================================================= */


/* =========================================================
   NATIVE WEBVIEW MESSAGE
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
   CUSTOM WINDOW CONTROLS
   ========================================================= */

function closeWindow() {

    nativeMessage(
        "window.close"
    );

}


function minimiseWindow() {

    nativeMessage(
        "window.minimize"
    );

}


function dragWindow() {

    nativeMessage(
        "window.drag"
    );

}


/* =========================================================
   ELEMENTS
   ========================================================= */

const app =
    document.getElementById("app");

const intro =
    document.getElementById("intro");

const launchingScreen =
    document.getElementById("launching-screen");

const launchingTitle =
    document.getElementById("launching-title");

const launchingSubtitle =
    document.getElementById("launching-subtitle");

const launchingProgress =
    document.getElementById("launching-progress-fill");

const launchingStatus =
    document.getElementById("launching-status-text");

const launchingCancel =
    document.getElementById("launching-cancel");


/* =========================================================
   INTRO
   ========================================================= */

window.addEventListener(
    "load",
    () => {

        setTimeout(
            () => {

                if (intro) {

                    intro.classList.add(
                        "intro-hidden"
                    );

                }

                if (app) {

                    app.classList.add(
                        "app-visible"
                    );

                }

            },
            900
        );

    }
);


/* =========================================================
   NAVIGATION
   ========================================================= */

function showView(
    viewName,
    button
) {

    const views =
        document.querySelectorAll(
            ".view"
        );

    views.forEach(
        view => {

            view.classList.remove(
                "active"
            );

        }
    );


    const target =
        document.getElementById(
            viewName
        );


    if (!target) {

        return;

    }


    target.classList.add(
        "active"
    );


    const navButtons =
        document.querySelectorAll(
            ".nav button"
        );


    navButtons.forEach(
        navButton => {

            navButton.classList.remove(
                "selected"
            );

        }
    );


    if (button) {

        button.classList.add(
            "selected"
        );

    }


    /*
     * Make sure every page remains positioned
     * at the top and never carries over a
     * previous scroll position.
     */

    const content =
        document.querySelector(
            ".content"
        );


    if (content) {

        content.scrollTop = 0;

    }


    window.scrollTo(
        0,
        0
    );

}


/* =========================================================
   PERSISTENT SETTINGS
   ========================================================= */

const SETTINGS_KEY =
    "orro_settings";


const defaultSettings = {

    remember: true,

    updates: true,

    minimise: false,

    closeAfter: false

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
            localStorage.getItem(
                SETTINGS_KEY
            );


        if (saved) {

            const parsed =
                JSON.parse(
                    saved
                );


            settings = {

                ...defaultSettings,

                ...parsed

            };

        }

    }
    catch (error) {

        settings = {
            ...defaultSettings
        };

    }


    applySettings();

}


/* =========================================================
   SAVE SETTINGS
   ========================================================= */

function saveSettings() {

    try {

        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify(
                settings
            )
        );

    }
    catch (error) {

        console.warn(
            "Unable to save orro settings.",
            error
        );

    }

}


/* =========================================================
   APPLY SETTINGS
   ========================================================= */

function applySettings() {

    const toggles =
        document.querySelectorAll(
            ".toggle"
        );


    toggles.forEach(
        toggle => {

            const settingName =
                toggle.dataset.setting;


            if (
                !settingName ||
                !(settingName in settings)
            ) {

                return;

            }


            toggle.classList.toggle(
                "on",
                Boolean(
                    settings[
                        settingName
                    ]
                )
            );


            toggle.setAttribute(
                "aria-pressed",
                settings[
                    settingName
                ]
                    ? "true"
                    : "false"
            );

        }
    );

}


/* =========================================================
   TOGGLE SETTING
   ========================================================= */

function toggleSetting(
    button
) {

    if (!button) {

        return;

    }


    const settingName =
        button.dataset.setting;


    if (
        !settingName ||
        !(settingName in settings)
    ) {

        return;

    }


    settings[
        settingName
    ] =
        !settings[
            settingName
        ];


    saveSettings();

    applySettings();

}


/* =========================================================
   LAUNCH STATE
   ========================================================= */

let launchTimer = null;

let launchRunning = false;


/* =========================================================
   LAUNCH
   ========================================================= */

function launch(
    sourceButton
) {

    if (launchRunning) {

        return;

    }


    launchRunning = true;


    /*
     * Always move to the Launch page first.
     * This means pressing Launch from Home and
     * pressing Launch from the Launch page both
     * behave consistently.
     */

    const launchButton =
        document.querySelector(
            '.nav button[data-view="launch"]'
        );


    showView(
        "launch",
        launchButton
    );


    /*
     * Show the launching overlay after the
     * navigation has completed.
     */

    requestAnimationFrame(
        () => {

            startLaunchScreen();

        }
    );

}


/* =========================================================
   START LAUNCH SCREEN
   ========================================================= */

function startLaunchScreen() {

    if (!launchingScreen) {

        launchRunning = false;

        return;

    }


    launchingScreen.classList.add(
        "visible"
    );


    launchingScreen.classList.remove(
        "finished"
    );


    if (launchingProgress) {

        launchingProgress.style.width =
            "0%";

    }


    if (launchingTitle) {

        launchingTitle.textContent =
            "Launching";

    }


    if (launchingSubtitle) {

        launchingSubtitle.textContent =
            "Preparing your session.";

    }


    if (launchingStatus) {

        launchingStatus.textContent =
            "Initialising";

    }


    /*
     * Small staged updates make the animation
     * feel smooth rather than jumping through
     * several states instantly.
     */

    const stages = [

        {
            progress: 18,
            status: "Initialising",
            delay: 120
        },

        {
            progress: 38,
            status: "Checking version",
            delay: 500
        },

        {
            progress: 61,
            status: "Preparing session",
            delay: 950
        },

        {
            progress: 82,
            status: "Starting application",
            delay: 1450
        },

        {
            progress: 100,
            status: "Ready",
            delay: 2050
        }

    ];


    stages.forEach(
        stage => {

            setTimeout(
                () => {

                    if (
                        !launchRunning
                    ) {

                        return;

                    }


                    if (
                        launchingProgress
                    ) {

                        launchingProgress.style.width =
                            `${stage.progress}%`;

                    }


                    if (
                        launchingStatus
                    ) {

                        launchingStatus.textContent =
                            stage.status;

                    }

                },
                stage.delay
            );

        }
    );


    launchTimer =
        setTimeout(
            finishLaunch,
            2350
        );

}


/* =========================================================
   FINISH LAUNCH
   ========================================================= */

function finishLaunch() {

    if (!launchRunning) {

        return;

    }


    launchRunning = false;


    if (launchTimer) {

        clearTimeout(
            launchTimer
        );

        launchTimer = null;

    }


    if (launchingProgress) {

        launchingProgress.style.width =
            "100%";

    }


    if (launchingStatus) {

        launchingStatus.textContent =
            "Ready";

    }


    /*
     * Respect the user's persistent settings.
     */

    if (
        settings.closeAfter
    ) {

        setTimeout(
            () => {

                closeWindow();

            },
            250
        );

        return;

    }


    if (
        settings.minimise
    ) {

        setTimeout(
            () => {

                minimiseWindow();

            },
            250
        );

        return;

    }


    /*
     * Otherwise return to the Launch page.
     */

    setTimeout(
        () => {

            if (launchingScreen) {

                launchingScreen.classList.remove(
                    "visible"
                );

            }

        },
        400
    );

}


/* =========================================================
   CANCEL LAUNCH
   ========================================================= */

function cancelLaunch() {

    launchRunning = false;


    if (launchTimer) {

        clearTimeout(
            launchTimer
        );

        launchTimer = null;

    }


    if (launchingProgress) {

        launchingProgress.style.width =
            "0%";

    }


    if (launchingScreen) {

        launchingScreen.classList.remove(
            "visible"
        );

    }


    if (launchingStatus) {

        launchingStatus.textContent =
            "Cancelled";

    }

}


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        /*
         * Escape closes the launching screen
         * if it is currently active.
         */

        if (
            event.key === "Escape" &&
            launchRunning
        ) {

            cancelLaunch();

            return;

        }

    }
);


/* =========================================================
   INITIALISE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadSettings();


        /*
         * Make sure Home is selected initially.
         */

        const homeButton =
            document.querySelector(
                '.nav button[data-view="home"]'
            );


        const activeView =
            document.querySelector(
                ".view.active"
            );


        if (
            !activeView
        ) {

            showView(
                "home",
                homeButton
            );

        }


        /*
         * Prevent accidental browser scrolling.
         * The application itself is designed to fit
         * entirely inside the WebView.
         */

        document.documentElement.style.overflow =
            "hidden";

        document.body.style.overflow =
            "hidden";

    }
);

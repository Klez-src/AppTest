/* =========================================================
   ORRO
   Main application logic
   ========================================================= */


/* =========================================================
   HELPERS
   ========================================================= */

const $ = (selector) =>
    document.querySelector(selector);


const $$ = (selector) =>
    document.querySelectorAll(selector);


/* =========================================================
   NATIVE WEBVIEW BRIDGE
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

    } catch (error) {

        console.warn(
            "Native bridge unavailable:",
            error
        );

    }
}


/* =========================================================
   CLOSE
   ========================================================= */

function closeApp() {
    nativeMessage("window.close");
}


$("#closeButton")?.addEventListener(
    "click",
    closeApp
);


/* =========================================================
   DRAGGING
   ========================================================= */

/*
    The whole application can be dragged.

    We don't make normal buttons draggable.
    Clicking anywhere else in the UI starts the native
    window drag operation.
*/

document.addEventListener(
    "mousedown",
    (event) => {

        if (
            event.button !== 0
        ) {
            return;
        }


        const target =
            event.target;


        if (
            target.closest(
                "button"
            )
        ) {
            return;
        }


        if (
            target.closest(
                "input"
            )
        ) {
            return;
        }


        if (
            target.closest(
                ".launch-close"
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
   INTRO
   ========================================================= */

const intro =
    $("#intro");

const app =
    $("#app");


function finishIntro() {

    if (!intro) {
        app?.classList.add(
            "ready"
        );

        return;
    }


    setTimeout(
        () => {

            intro.classList.add(
                "hidden"
            );

            app?.classList.add(
                "ready"
            );

        },
        2300
    );
}


window.addEventListener(
    "load",
    finishIntro
);


/* =========================================================
   NAVIGATION
   ========================================================= */

const navButtons =
    $$(".nav-button");

const views =
    $$(".view");


function showView(
    viewName
) {

    views.forEach(
        (view) => {

            view.classList.toggle(
                "active",
                view.id === viewName
            );

        }
    );


    navButtons.forEach(
        (button) => {

            button.classList.toggle(
                "selected",
                button.dataset.view === viewName
            );

        }
    );

}


navButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                const view =
                    button.dataset.view;

                if (!view) {
                    return;
                }

                showView(
                    view
                );

            }
        );

    }
);


/* =========================================================
   SETTINGS
   ========================================================= */

const SETTINGS_KEY =
    "orro.settings";


const defaultSettings = {

    rememberSession: false,

    automaticUpdates: false,

    minimiseOnLaunch: false,

    closeAfterLaunch: false

};


let settings = {
    ...defaultSettings
};


function loadSettings() {

    try {

        const saved =
            localStorage.getItem(
                SETTINGS_KEY
            );


        if (saved) {

            const parsed =
                JSON.parse(saved);


            settings = {
                ...defaultSettings,
                ...parsed
            };

        }

    } catch (error) {

        console.warn(
            "Unable to load settings.",
            error
        );

        settings = {
            ...defaultSettings
        };

    }

}


function saveSettings() {

    try {

        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify(
                settings
            )
        );

    } catch (error) {

        console.warn(
            "Unable to save settings.",
            error
        );

    }

}


function renderSettings() {

    $$(".toggle").forEach(
        (toggle) => {

            const name =
                toggle.dataset.setting;


            if (!name) {
                return;
            }


            toggle.classList.toggle(
                "on",
                Boolean(
                    settings[name]
                )
            );

        }
    );

}


loadSettings();
renderSettings();


$$(".toggle").forEach(
    (toggle) => {

        toggle.addEventListener(
            "click",
            () => {

                const name =
                    toggle.dataset.setting;


                if (!name) {
                    return;
                }


                settings[name] =
                    !Boolean(
                        settings[name]
                    );


                saveSettings();
                renderSettings();

            }
        );

    }
);


/* =========================================================
   LAUNCH SCREEN
   ========================================================= */

const launchScreen =
    $("#launchScreen");

const launchTitle =
    $("#launchTitle");

const launchStatus =
    $("#launchStatus");

const launchProgressBar =
    $("#launchProgressBar");

const launchStep =
    $("#launchStep");

const launchPercent =
    $("#launchPercent");

const launchClose =
    $("#launchClose");


let launchTimer =
    null;

let launchStart =
    0;

let launchCancelled =
    false;


/*
    Approximately 35 seconds.

    The actual sequence is deliberately not a
    perfectly uniform progress bar. It moves through
    several realistic stages.
*/

const launchStages = [

    {
        until: 7,
        title: "Preparing",
        status: "Preparing launch environment",
        step: "Initialising"
    },

    {
        until: 14,
        title: "Checking",
        status: "Checking local components",
        step: "Checking"
    },

    {
        until: 22,
        title: "Loading",
        status: "Loading required components",
        step: "Loading"
    },

    {
        until: 29,
        title: "Starting",
        status: "Starting application session",
        step: "Starting"
    },

    {
        until: 35,
        title: "Finishing",
        status: "Finalising launch",
        step: "Finalising"
    }

];


function setLaunchProgress(
    seconds
) {

    const percent =
        Math.min(
            100,
            Math.floor(
                (
                    seconds /
                    35
                ) * 100
            )
        );


    let stage =
        launchStages[
            launchStages.length - 1
        ];


    for (
        const candidate
        of launchStages
    ) {

        if (
            seconds <=
            candidate.until
        ) {

            stage =
                candidate;

            break;

        }

    }


    if (launchTitle) {

        launchTitle.textContent =
            stage.title;

    }


    if (launchStatus) {

        launchStatus.textContent =
            stage.status;

    }


    if (launchStep) {

        launchStep.textContent =
            stage.step;

    }


    if (launchPercent) {

        launchPercent.textContent =
            `${percent}%`;

    }


    if (launchProgressBar) {

        launchProgressBar.style.width =
            `${percent}%`;

    }

}


function resetLaunchScreen() {

    if (launchTimer) {

        clearInterval(
            launchTimer
        );

        launchTimer =
            null;

    }


    launchStart =
        0;

    launchCancelled =
        false;


    setLaunchProgress(
        0
    );

}


function openLaunchScreen() {

    resetLaunchScreen();


    launchScreen?.classList.add(
        "active"
    );


    launchStart =
        Date.now();


    launchTimer =
        setInterval(
            updateLaunch,
            100
        );


    updateLaunch();

}


function updateLaunch() {

    const elapsed =
        (
            Date.now() -
            launchStart
        ) / 1000;


    if (
        elapsed >= 35
    ) {

        finishLaunch();

        return;

    }


    setLaunchProgress(
        elapsed
    );

}


function finishLaunch() {

    if (launchTimer) {

        clearInterval(
            launchTimer
        );

        launchTimer =
            null;

    }


    if (launchCancelled) {
        return;
    }


    setLaunchProgress(
        35
    );


    if (launchTitle) {

        launchTitle.textContent =
            "Ready";

    }


    if (launchStatus) {

        launchStatus.textContent =
            "Launch sequence complete";

    }


    if (launchStep) {

        launchStep.textContent =
            "Complete";

    }


    if (launchPercent) {

        launchPercent.textContent =
            "100%";

    }


    if (launchProgressBar) {

        launchProgressBar.style.width =
            "100%";

    }


    /*
        Give the completed state a short moment
        so the user actually sees that it finished.
    */

    setTimeout(
        () => {

            if (
                settings.closeAfterLaunch
            ) {

                closeApp();

                return;

            }


            launchScreen?.classList.remove(
                "active"
            );

        },
        900
    );

}


function cancelLaunch() {

    launchCancelled =
        true;


    if (launchTimer) {

        clearInterval(
            launchTimer
        );

        launchTimer =
            null;

    }


    launchScreen?.classList.remove(
        "active"
    );

}


/* =========================================================
   LAUNCH BUTTONS
   ========================================================= */

$("#homeLaunch")?.addEventListener(
    "click",
    () => {

        openLaunchScreen();

    }
);


$("#launchButton")?.addEventListener(
    "click",
    () => {

        openLaunchScreen();

    }
);


launchClose?.addEventListener(
    "click",
    cancelLaunch
);


/* =========================================================
   KEYBOARD
   ========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            launchScreen?.classList.contains(
                "active"
            )
        ) {

            cancelLaunch();

        }

    }
);


/* =========================================================
   PREVENT CONTEXT MENU
   ========================================================= */

document.addEventListener(
    "contextmenu",
    (event) => {

        event.preventDefault();

    }
);


/* =========================================================
   PREVENT IMAGE DRAGGING
   ========================================================= */

document.addEventListener(
    "dragstart",
    (event) => {

        event.preventDefault();

    }
);

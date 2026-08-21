/* =========================================================
   ORRO
   ========================================================= */

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
   SETTINGS
   ========================================================= */

const SETTINGS_KEY =
    "orro.settings";


const DEFAULT_SETTINGS = {

    rememberSession: true,

    automaticUpdates: true,

    minimiseOnLaunch: false

};


function getSettings() {

    try {

        const saved =
            localStorage.getItem(
                SETTINGS_KEY
            );


        if (!saved) {

            return {
                ...DEFAULT_SETTINGS
            };

        }


        return {

            ...DEFAULT_SETTINGS,

            ...JSON.parse(
                saved
            )

        };

    }

    catch {

        return {
            ...DEFAULT_SETTINGS
        };

    }

}


function saveSettings(
    settings
) {

    try {

        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify(
                settings
            )
        );

    }

    catch {

        /*
         * Storage can be unavailable in
         * unusual WebView configurations.
         */

    }

}


/* =========================================================
   SETTINGS UI
   ========================================================= */

function updateSettingsUI() {

    const settings =
        getSettings();


    document
        .querySelectorAll(
            "[data-setting]"
        )
        .forEach(
            toggle => {

                const name =
                    toggle.dataset.setting;


                toggle.classList.toggle(
                    "on",
                    Boolean(
                        settings[name]
                    )
                );

            }
        );

}


document
    .querySelectorAll(
        "[data-setting]"
    )
    .forEach(
        toggle => {

            toggle.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    const settings =
                        getSettings();


                    const name =
                        toggle.dataset.setting;


                    settings[name] =
                        !settings[name];


                    saveSettings(
                        settings
                    );


                    updateSettingsUI();

                }
            );

        }
    );


updateSettingsUI();


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

const navItems =
    document.querySelectorAll(
        ".nav-item"
    );


const pages =
    document.querySelectorAll(
        ".page"
    );


function showPage(
    name
) {

    /*
     * Never navigate while the fullscreen
     * queue is active.
     */

    if (launchRunning) {

        return;

    }


    navItems.forEach(
        item => {

            item.classList.toggle(
                "active",
                item.dataset.page === name
            );

        }
    );


    pages.forEach(
        page => {

            page.classList.toggle(
                "active",
                page.id ===
                "page-" + name
            );

        }
    );

}


navItems.forEach(
    item => {

        item.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                showPage(
                    item.dataset.page
                );

            }
        );

    }
);


/* =========================================================
   HOME LAUNCH BUTTON
   ========================================================= */

const homeLaunchButton =
    document.getElementById(
        "homeLaunchButton"
    );


homeLaunchButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        /*
         * IMPORTANT:
         *
         * Home Launch does NOT start
         * the queue.
         *
         * It simply opens Launch.
         */

        showPage(
            "launch"
        );

    }
);


/* =========================================================
   QUEUE ELEMENTS
   ========================================================= */

const launchingPage =
    document.getElementById(
        "launching-page"
    );


const launchProgress =
    document.getElementById(
        "launchProgress"
    );


const queueAhead =
    document.getElementById(
        "queueAhead"
    );


const queueEstimate =
    document.getElementById(
        "queueEstimate"
    );


const queuePosition =
    document.getElementById(
        "queuePosition"
    );


const launchButton =
    document.getElementById(
        "launchButton"
    );


const cancelButton =
    document.getElementById(
        "cancelLaunch"
    );


/* =========================================================
   LAUNCH STATE
   ========================================================= */

let launchRunning =
    false;


let launchFrame =
    null;


let launchStart =
    0;


let launchDuration =
    0;


let initialQueueAhead =
    1;


/* =========================================================
   RANDOM VALUES
   ========================================================= */

/*
 * 25–33 seconds.
 *
 * This keeps it around 29 seconds
 * without making every launch identical.
 */

function getLaunchDuration() {

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

function getQueueAhead() {

    return (
        Math.floor(
            Math.random() * 4
        ) + 1
    );

}


/* =========================================================
   QUEUE UI
   ========================================================= */

function updateQueue(
    progress
) {

    /*
     * Smoothly reduce the queue count.
     */

    const remainingAhead =
        Math.max(
            0,
            Math.ceil(
                initialQueueAhead *
                (1 - progress)
            )
        );


    const currentPosition =
        Math.max(
            1,
            remainingAhead + 1
        );


    queueAhead.textContent =
        remainingAhead;


    queuePosition.textContent =
        currentPosition;


    launchProgress.style.width =
        (
            progress * 100
        ) + "%";


    const remainingSeconds =
        Math.max(
            0,
            Math.ceil(
                (
                    launchDuration -
                    (
                        performance.now() -
                        launchStart
                    )
                ) / 1000
            )
        );


    queueEstimate.textContent =
        "~" +
        remainingSeconds +
        " seconds";

}


/* =========================================================
   QUEUE ANIMATION
   ========================================================= */

function animateLaunch() {

    if (!launchRunning) {

        return;

    }


    const elapsed =
        performance.now() -
        launchStart;


    const progress =
        Math.min(
            elapsed /
            launchDuration,
            1
        );


    updateQueue(
        progress
    );


    if (
        progress >= 1
    ) {

        finishLaunch();

        return;

    }


    launchFrame =
        requestAnimationFrame(
            animateLaunch
        );

}


/* =========================================================
   START LAUNCH
   ========================================================= */

function startLaunch() {

    if (launchRunning) {

        return;

    }


    launchRunning =
        true;


    initialQueueAhead =
        getQueueAhead();


    launchDuration =
        getLaunchDuration();


    launchStart =
        performance.now();


    /*
     * Reset queue.
     */

    queueAhead.textContent =
        initialQueueAhead;


    queuePosition.textContent =
        initialQueueAhead + 1;


    queueEstimate.textContent =
        "~" +
        Math.ceil(
            launchDuration / 1000
        ) +
        " seconds";


    launchProgress.style.width =
        "0%";


    /*
     * Take over the ENTIRE GUI.
     *
     * The launching page sits above
     * the sidebar and main UI.
     */

    launchingPage.classList.add(
        "active"
    );


    /*
     * Minimise setting.
     */

    const settings =
        getSettings();


    if (
        settings.minimiseOnLaunch
    ) {

        nativeMessage(
            "window.minimize"
        );

    }


    launchFrame =
        requestAnimationFrame(
            animateLaunch
        );

}


/* =========================================================
   LAUNCH BUTTON
   ========================================================= */

launchButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        startLaunch();

    }
);


/* =========================================================
   CANCEL
   ========================================================= */

function cancelLaunch() {

    if (!launchRunning) {

        return;

    }


    launchRunning =
        false;


    if (launchFrame) {

        cancelAnimationFrame(
            launchFrame
        );

        launchFrame =
            null;

    }


    launchingPage.classList.remove(
        "active"
    );


    launchProgress.style.width =
        "0%";


    queueAhead.textContent =
        initialQueueAhead;


    queuePosition.textContent =
        initialQueueAhead + 1;


    queueEstimate.textContent =
        "~" +
        Math.ceil(
            launchDuration / 1000
        ) +
        " seconds";


    /*
     * Return to Launch page.
     */

    showPage(
        "launch"
    );

}


cancelButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        cancelLaunch();

    }
);


/* =========================================================
   FINISH
   ========================================================= */

function finishLaunch() {

    launchRunning =
        false;


    if (launchFrame) {

        cancelAnimationFrame(
            launchFrame
        );

        launchFrame =
            null;

    }


    launchProgress.style.width =
        "100%";


    queueAhead.textContent =
        "0";


    queuePosition.textContent =
        "1";


    queueEstimate.textContent =
        "Ready";


    /*
     * Keep the fullscreen launch page
     * visible for a tiny moment so the
     * completed bar doesn't flash away.
     */

    setTimeout(
        () => {

            launchingPage.classList.remove(
                "active"
            );


            /*
             * Respect close-after-launch
             * only if it exists in stored
             * settings from an older version.
             */

            const settings =
                getSettings();


            if (
                settings.closeAfter === true
            ) {

                nativeMessage(
                    "window.close"
                );

                return;

            }


            showPage(
                "launch"
            );

        },
        450
    );

}


/* =========================================================
   CLOSE BUTTON
   ========================================================= */

const closeButton =
    document.getElementById(
        "closeButton"
    );


closeButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        nativeMessage(
            "window.close"
        );

    }
);


/* =========================================================
   DRAG FROM ANYWHERE
   ========================================================= */

/*
 * The cursor stays as the normal arrow.
 *
 * Any non-button area can request the
 * native C++ window drag.
 */

document.addEventListener(
    "pointerdown",
    event => {

        if (
            event.button !== 0
        ) {

            return;

        }


        /*
         * Don't drag when clicking
         * interactive controls.
         */

        if (
            event.target.closest(
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


/* =========================================================
   DISABLE TEXT SELECTION / DRAG
   ========================================================= */

document.addEventListener(
    "selectstart",
    event => {

        event.preventDefault();

    }
);


document.addEventListener(
    "dragstart",
    event => {

        event.preventDefault();

    }
);


/* =========================================================
   RIGHT CLICK
   ========================================================= */

document.addEventListener(
    "contextmenu",
    event => {

        event.preventDefault();

    }
);


/* =========================================================
   DEFAULT PAGE
   ========================================================= */

showPage(
    "home"
);

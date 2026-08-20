/* ==================================================
   ORRO
   ================================================== */

let launchRunning = false;

let launchAnimation = null;

let launchStartedAt = 0;

let launchDuration = 0;

let queueAhead = 1;


/* ==================================================
   CLOSE
   ================================================== */

function closeWindow() {

    if (
        window.chrome &&
        window.chrome.webview
    ) {

        window.chrome.webview.postMessage(
            "window.close"
        );

    }

}


/* ==================================================
   WINDOW DRAG
   ================================================== */

document.addEventListener(
    "mousedown",
    function (event) {

        if (event.button !== 0) {
            return;
        }


        /*
         * Never treat actual controls as
         * draggable areas.
         */

        if (
            event.target.closest(
                "button, input, select, textarea, a"
            )
        ) {
            return;
        }


        /*
         * While the full queue is visible,
         * allow dragging from the queue itself.
         */

        if (
            window.chrome &&
            window.chrome.webview
        ) {

            window.chrome.webview.postMessage(
                "window.drag"
            );

        }

    }
);


/* ==================================================
   NAVIGATION
   ================================================== */

function showView(
    viewId,
    button
) {

    if (launchRunning) {
        return;
    }


    document
        .querySelectorAll(".view")
        .forEach(
            function (view) {

                view.classList.remove(
                    "active"
                );

            }
        );


    const target =
        document.getElementById(
            viewId
        );


    if (!target) {
        return;
    }


    target.classList.add(
        "active"
    );


    document
        .querySelectorAll(
            ".nav button"
        )
        .forEach(
            function (navButton) {

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

}


/* ==================================================
   HOME LAUNCH BUTTON
   ================================================== */

function goToLaunchPage() {

    const button =
        document.querySelector(
            '.nav button[data-view="launch"]'
        );


    showView(
        "launch",
        button
    );

}


/* ==================================================
   SETTINGS
   ================================================== */

function toggleSetting(button) {

    if (!button) {
        return;
    }


    const setting =
        button.dataset.setting;


    if (!setting) {
        return;
    }


    const enabled =
        !button.classList.contains(
            "on"
        );


    button.classList.toggle(
        "on",
        enabled
    );


    button.setAttribute(
        "aria-pressed",
        enabled
            ? "true"
            : "false"
    );


    try {

        localStorage.setItem(
            "orro_setting_" + setting,
            enabled
                ? "true"
                : "false"
        );

    }
    catch (error) {

        console.warn(
            "Unable to save setting:",
            error
        );

    }

}


function loadSettings() {

    document
        .querySelectorAll(
            ".toggle[data-setting]"
        )
        .forEach(
            function (button) {

                const setting =
                    button.dataset.setting;


                try {

                    const saved =
                        localStorage.getItem(
                            "orro_setting_" +
                            setting
                        );


                    /*
                     * No saved value:
                     * retain the HTML default.
                     */

                    if (
                        saved === null
                    ) {
                        return;
                    }


                    const enabled =
                        saved === "true";


                    button.classList.toggle(
                        "on",
                        enabled
                    );


                    button.setAttribute(
                        "aria-pressed",
                        enabled
                            ? "true"
                            : "false"
                    );

                }
                catch (error) {

                    console.warn(
                        "Unable to load setting:",
                        error
                    );

                }

            }
        );

}


/* ==================================================
   RANDOM QUEUE
   ================================================== */

function randomQueueAhead() {

    return (
        Math.floor(
            Math.random() * 4
        ) + 1
    );

}


function randomLaunchDuration() {

    /*
     * Roughly 29 seconds.
     *
     * Random range:
     * 25–34 seconds.
     */

    return (
        Math.floor(
            Math.random() * 10
        ) + 25
    ) * 1000;

}


/* ==================================================
   QUEUE DISPLAY
   ================================================== */

function updateQueueDisplay(
    progress
) {

    const fill =
        document.getElementById(
            "queue-progress-fill"
        );


    const time =
        document.getElementById(
            "queue-time"
        );


    const ahead =
        document.getElementById(
            "queue-ahead-number"
        );


    if (fill) {

        fill.style.width =
            (
                progress * 100
            ) + "%";

    }


    if (time) {

        const elapsed =
            performance.now() -
            launchStartedAt;


        const remaining =
            Math.max(
                0,
                Math.ceil(
                    (
                        launchDuration -
                        elapsed
                    ) / 1000
                )
            );


        time.textContent =
            "~" +
            remaining +
            " seconds";

    }


    if (ahead) {

        /*
         * Keep the queue count visually
         * stable for most of the wait, then
         * smoothly reduce it toward zero.
         */

        const displayedAhead =
            Math.max(
                0,
                Math.ceil(
                    queueAhead *
                    (1 - progress)
                )
            );


        ahead.textContent =
            displayedAhead;

    }

}


/* ==================================================
   QUEUE ANIMATION
   ================================================== */

function animateQueue() {

    if (!launchRunning) {
        return;
    }


    const elapsed =
        performance.now() -
        launchStartedAt;


    const progress =
        Math.min(
            elapsed /
            launchDuration,
            1
        );


    /*
     * requestAnimationFrame keeps the bar
     * continuously smooth instead of using
     * chunky interval jumps.
     */

    updateQueueDisplay(
        progress
    );


    if (
        progress >= 1
    ) {

        finishLaunch();

        return;

    }


    launchAnimation =
        requestAnimationFrame(
            animateQueue
        );

}


/* ==================================================
   START LAUNCH
   ================================================== */

function launch() {

    if (launchRunning) {
        return;
    }


    launchRunning = true;


    queueAhead =
        randomQueueAhead();


    launchDuration =
        randomLaunchDuration();


    launchStartedAt =
        performance.now();


    const queue =
        document.getElementById(
            "queue"
        );


    const fill =
        document.getElementById(
            "queue-progress-fill"
        );


    const ahead =
        document.getElementById(
            "queue-ahead-number"
        );


    const position =
        document.getElementById(
            "queue-position"
        );


    const time =
        document.getElementById(
            "queue-time"
        );


    if (fill) {

        fill.style.width =
            "0%";

    }


    if (ahead) {

        ahead.textContent =
            queueAhead;

    }


    if (position) {

        position.textContent =
            queueAhead + 1;

    }


    if (time) {

        time.textContent =
            "~" +
            Math.ceil(
                launchDuration / 1000
            ) +
            " seconds";

    }


    /*
     * Hide the normal application.
     */

    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    const content =
        document.querySelector(
            ".content"
        );


    const close =
        document.querySelector(
            ".window-close"
        );


    if (sidebar) {

        sidebar.style.display =
            "none";

    }


    if (content) {

        content.style.display =
            "none";

    }


    if (close) {

        close.style.display =
            "none";

    }


    /*
     * Show the queue over the
     * entire application.
     */

    if (queue) {

        queue.classList.add(
            "active"
        );

    }


    launchAnimation =
        requestAnimationFrame(
            animateQueue
        );

}


/* ==================================================
   CANCEL
   ================================================== */

function cancelLaunch() {

    if (!launchRunning) {
        return;
    }


    launchRunning = false;


    if (launchAnimation) {

        cancelAnimationFrame(
            launchAnimation
        );

        launchAnimation = null;

    }


    const queue =
        document.getElementById(
            "queue"
        );


    if (queue) {

        queue.classList.remove(
            "active"
        );

    }


    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    const content =
        document.querySelector(
            ".content"
        );


    const close =
        document.querySelector(
            ".window-close"
        );


    if (sidebar) {

        sidebar.style.display =
            "";

    }


    if (content) {

        content.style.display =
            "";

    }


    if (close) {

        close.style.display =
            "";

    }


    /*
     * Return to Launch page.
     */

    document
        .querySelectorAll(".view")
        .forEach(
            function (view) {

                view.classList.remove(
                    "active"
                );

            }
        );


    const launchView =
        document.getElementById(
            "launch"
        );


    if (launchView) {

        launchView.classList.add(
            "active"
        );

    }


    document
        .querySelectorAll(
            ".nav button"
        )
        .forEach(
            function (button) {

                button.classList.toggle(
                    "selected",
                    button.dataset.view ===
                    "launch"
                );

            }
        );

}


/* ==================================================
   FINISH LAUNCH
   ================================================== */

function finishLaunch() {

    launchRunning = false;


    if (launchAnimation) {

        cancelAnimationFrame(
            launchAnimation
        );

        launchAnimation = null;

    }


    const fill =
        document.getElementById(
            "queue-progress-fill"
        );


    const time =
        document.getElementById(
            "queue-time"
        );


    const ahead =
        document.getElementById(
            "queue-ahead-number"
        );


    if (fill) {

        fill.style.width =
            "100%";

    }


    if (time) {

        time.textContent =
            "Ready";

    }


    if (ahead) {

        ahead.textContent =
            "0";

    }


    const minimise =
        document.querySelector(
            '[data-setting="minimise"]'
        );


    const closeAfter =
        document.querySelector(
            '[data-setting="closeAfter"]'
        );


    if (
        minimise &&
        minimise.classList.contains("on")
    ) {

        if (
            window.chrome &&
            window.chrome.webview
        ) {

            window.chrome.webview.postMessage(
                "window.minimize"
            );

        }

    }


    if (
        closeAfter &&
        closeAfter.classList.contains("on")
    ) {

        setTimeout(
            closeWindow,
            350
        );

    }

}


/* ==================================================
   INITIALISE
   ================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadSettings();

    }
);

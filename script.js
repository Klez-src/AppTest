let launchRunning = false;

let launchAnimation = null;

let launchStartedAt = 0;

let launchDuration = 0;

let previousView = "home";

let queueAhead = 1;



/* ==================================================
   WINDOW
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
   DRAGGING
   ================================================== */

/*
    The WebView normally consumes mouse input itself.

    This lets the user drag the native window from
    essentially anywhere that isn't an interactive
    element.

    Buttons, toggles and links remain clickable.
*/

document.addEventListener(
    "mousedown",
    function (event) {

        if (
            event.button !== 0
        ) {
            return;
        }


        const interactive =
            event.target.closest(
                "button, input, select, textarea, a"
            );


        if (interactive) {
            return;
        }


        if (launchRunning) {
            return;
        }


        if (
            window.chrome &&
            window.chrome.webview
        ) {

            document
                .getElementById("app")
                ?.classList.add(
                    "dragging"
                );


            window.chrome.webview.postMessage(
                "window.drag"
            );

        }

    }
);


document.addEventListener(
    "mouseup",
    function () {

        document
            .getElementById("app")
            ?.classList.remove(
                "dragging"
            );

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
        .forEach(function (view) {

            view.classList.remove(
                "active"
            );

        });


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


    previousView =
        viewId;


    document
        .querySelectorAll(
            ".nav button"
        )
        .forEach(function (navButton) {

            navButton.classList.remove(
                "selected"
            );

        });


    if (button) {

        button.classList.add(
            "selected"
        );

    }

}



/* ==================================================
   HOME LAUNCH BUTTON
   ================================================== */

/*
    Home's Launch button ONLY opens
    the Launch tab.

    It does NOT start the queue.
*/

function goToLaunchPage() {

    showView(
        "launch",
        document.querySelector(
            '.nav button[data-view="launch"]'
        )
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
            "Could not save setting.",
            error
        );

    }

}



function loadSettings() {

    document
        .querySelectorAll(
            ".toggle[data-setting]"
        )
        .forEach(function (button) {

            const setting =
                button.dataset.setting;


            try {

                const saved =
                    localStorage.getItem(
                        "orro_setting_" + setting
                    );


                if (saved === null) {
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
                    "Could not load setting.",
                    error
                );

            }

        });

}



/* ==================================================
   QUEUE RANDOMISATION
   ================================================== */

function randomQueueAhead() {

    /*
        1–4 people ahead.
    */

    return Math.floor(
        Math.random() * 4
    ) + 1;

}



function randomLaunchDuration() {

    /*
        Roughly 29 seconds.

        Possible values:

        25
        26
        27
        28
        29
        30
        31
        32
        33
        34
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


    /*
        Smoothly move through the queue.

        This isn't tied to a visible percentage.
    */

    const aheadElement =
        document.getElementById(
            "queue-ahead-number"
        );


    if (aheadElement) {

        const completed =
            Math.floor(
                progress *
                queueAhead
            );


        const remaining =
            Math.max(
                0,
                queueAhead -
                completed
            );


        aheadElement.textContent =
            remaining;

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


    /*
        New random values every launch.
    */

    queueAhead =
        randomQueueAhead();


    launchDuration =
        randomLaunchDuration();


    launchStartedAt =
        performance.now();


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


    const fill =
        document.getElementById(
            "queue-progress-fill"
        );


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


    if (fill) {

        fill.style.width =
            "0%";

    }


    /*
        Hide the entire normal interface.

        The queue becomes the whole window.
    */

    const queue =
        document.getElementById(
            "queue"
        );


    if (queue) {

        queue.classList.add(
            "active"
        );

    }


    document
        .querySelectorAll(".view")
        .forEach(function (view) {

            view.classList.remove(
                "active"
            );

        });


    /*
        Hide the sidebar and normal
        close button while queueing.
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
        Begin the smooth animation.
    */

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


    /*
        Remove queue screen.
    */

    const queue =
        document.getElementById(
            "queue"
        );


    if (queue) {

        queue.classList.remove(
            "active"
        );

    }


    /*
        Restore normal GUI.
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
        Return to Launch tab.
    */

    document
        .querySelectorAll(".view")
        .forEach(function (view) {

            view.classList.remove(
                "active"
            );

        });


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
        .forEach(function (button) {

            button.classList.remove(
                "selected"
            );


            if (
                button.dataset.view ===
                "launch"
            ) {

                button.classList.add(
                    "selected"
                );

            }

        });


    /*
        Reset queue progress.
    */

    const fill =
        document.getElementById(
            "queue-progress-fill"
        );


    if (fill) {

        fill.style.width =
            "0%";

    }

}



/* ==================================================
   FINISH
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


    /*
        Keep the full-screen launch state
        after the queue has finished.

        Existing launch settings are then
        respected.
    */

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
   INIT
   ================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadSettings();

    }
);

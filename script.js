let launchRunning = false;

let launchAnimation = null;

let launchStartedAt = 0;

let launchDuration = 29000;

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
   NAVIGATION
   ================================================== */

function showView(viewId, button) {

    if (launchRunning)
        return;


    const current =
        document.querySelector(
            ".view.active"
        );


    if (current) {

        previousView =
            current.id;

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


    if (!target)
        return;


    target.classList.add(
        "active"
    );


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
   SETTINGS
   ================================================== */

function toggleSetting(button) {

    if (!button)
        return;


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


                if (saved === null)
                    return;


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
   QUEUE
   ================================================== */

function randomQueueAhead() {

    return Math.floor(
        Math.random() * 4
    ) + 1;

}



function randomLaunchDuration() {

    /*
        Roughly 29 seconds.

        Range:
        25–34 seconds.
    */

    return (
        Math.floor(
            Math.random() * 10
        ) + 25
    ) * 1000;

}



function updateQueueDisplay(progress) {

    const fill =
        document.getElementById(
            "queue-progress-fill"
        );


    const percent =
        document.getElementById(
            "queue-percent"
        );


    const time =
        document.getElementById(
            "queue-time"
        );


    if (fill) {

        fill.style.width =
            (progress * 100) + "%";

    }


    if (percent) {

        percent.textContent =
            Math.floor(
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

}



function animateQueue() {

    if (!launchRunning)
        return;


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


    /*
        Gradually reduce the displayed
        queue position as the wait progresses.
    */

    const completedAhead =
        Math.floor(
            progress *
            queueAhead
        );


    const remainingAhead =
        Math.max(
            0,
            queueAhead -
            completedAhead
        );


    const aheadElement =
        document.getElementById(
            "queue-ahead-number"
        );


    if (aheadElement) {

        aheadElement.textContent =
            remainingAhead;

    }


    if (progress >= 1) {

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

    if (launchRunning)
        return;


    launchRunning = true;


    queueAhead =
        randomQueueAhead();


    launchDuration =
        randomLaunchDuration();


    launchStartedAt =
        performance.now();


    const queuePosition =
        document.getElementById(
            "queue-position"
        );


    const aheadElement =
        document.getElementById(
            "queue-ahead-number"
        );


    const fill =
        document.getElementById(
            "queue-progress-fill"
        );


    const percent =
        document.getElementById(
            "queue-percent"
        );


    const time =
        document.getElementById(
            "queue-time"
        );


    if (aheadElement) {

        aheadElement.textContent =
            queueAhead;

    }


    if (queuePosition) {

        queuePosition.textContent =
            queueAhead + 1;

    }


    if (fill) {

        fill.style.width =
            "0%";

    }


    if (percent) {

        percent.textContent =
            "0%";

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
        Switch to the actual queue page.
    */

    document
        .querySelectorAll(".view")
        .forEach(function (view) {

            view.classList.remove(
                "active"
            );

        });


    document
        .querySelectorAll(
            ".nav button"
        )
        .forEach(function (button) {

            button.classList.remove(
                "selected"
            );

        });


    const queue =
        document.getElementById(
            "queue"
        );


    if (queue) {

        queue.classList.add(
            "active"
        );

    }


    /*
        Start the smooth animation
        on the next frame.
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

    if (!launchRunning)
        return;


    launchRunning = false;


    if (launchAnimation) {

        cancelAnimationFrame(
            launchAnimation
        );

        launchAnimation = null;

    }


    /*
        Reset queue.
    */

    const fill =
        document.getElementById(
            "queue-progress-fill"
        );


    const percent =
        document.getElementById(
            "queue-percent"
        );


    if (fill) {

        fill.style.width =
            "0%";

    }


    if (percent) {

        percent.textContent =
            "0%";

    }


    /*
        Return to whatever page
        the user launched from.
    */

    const target =
        document.getElementById(
            previousView
        );


    document
        .querySelectorAll(".view")
        .forEach(function (view) {

            view.classList.remove(
                "active"
            );

        });


    if (target) {

        target.classList.add(
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
                previousView
            ) {

                button.classList.add(
                    "selected"
                );

            }

        });

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


    const percent =
        document.getElementById(
            "queue-percent"
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


    if (percent) {

        percent.textContent =
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
        Respect the existing settings.
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

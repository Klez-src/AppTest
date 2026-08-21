/* =========================================================
   ORRO LOADER
   ========================================================= */


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
   NAVIGATION
   ========================================================= */

function showView(
    id,
    button
) {

    if (launchRunning) {
        return;
    }


    var views =
        document.querySelectorAll(
            ".view"
        );


    for (
        var i = 0;
        i < views.length;
        i++
    ) {

        views[i].classList.remove(
            "active"
        );

    }


    var selectedView =
        document.getElementById(
            id
        );


    if (selectedView) {

        selectedView.classList.add(
            "active"
        );

    }


    var buttons =
        document.querySelectorAll(
            ".nav button"
        );


    for (
        var j = 0;
        j < buttons.length;
        j++
    ) {

        buttons[j].classList.remove(
            "selected"
        );

    }


    if (button) {

        button.classList.add(
            "selected"
        );

    }

}


/* =========================================================
   HOME -> LAUNCH PAGE
   ========================================================= */

function goToLaunchPage() {

    var launchButton =
        document.querySelector(
            '.nav button[onclick*="showView(\'launch\'"]'
        );


    showView(
        "launch",
        launchButton
    );

}


/* =========================================================
   SETTINGS STORAGE
   ========================================================= */

var SETTINGS_KEY =
    "orro.settings";


var defaultSettings = {

    remember: true,

    updates: true,

    minimise: false,

    closeAfter: false

};


function getSettings() {

    try {

        var stored =
            localStorage.getItem(
                SETTINGS_KEY
            );


        if (!stored) {

            return Object.assign(
                {},
                defaultSettings
            );

        }


        var parsed =
            JSON.parse(
                stored
            );


        return Object.assign(
            {},
            defaultSettings,
            parsed
        );

    }

    catch (error) {

        return Object.assign(
            {},
            defaultSettings
        );

    }

}


function saveSettings(
    settings
) {

    try {

        window.localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify(
                settings
            )
        );

    }

    catch (error) {

        /*
         * WebView storage can theoretically
         * be unavailable. The UI still works.
         */

    }

}


/* =========================================================
   LOAD SETTINGS
   ========================================================= */

function loadSettings() {

    var settings =
        getSettings();


    var toggles =
        document.querySelectorAll(
            ".toggle[data-setting]"
        );


    for (
        var i = 0;
        i < toggles.length;
        i++
    ) {

        var toggle =
            toggles[i];


        var settingName =
            toggle.dataset.setting;


        var enabled =
            !!settings[
                settingName
            ];


        toggle.classList.toggle(
            "on",
            enabled
        );

    }

}


loadSettings();


/* =========================================================
   TOGGLE SETTING
   ========================================================= */

function toggleSetting(
    element
) {

    if (!element) {
        return;
    }


    var settingName =
        element.dataset.setting;


    if (!settingName) {
        return;
    }


    var settings =
        getSettings();


    settings[
        settingName
    ] =
        !settings[
            settingName
        ];


    saveSettings(
        settings
    );


    element.classList.toggle(
        "on",
        settings[
            settingName
        ]
    );

}


/* =========================================================
   CLOSE WINDOW
   ========================================================= */

function closeWindow() {

    nativeMessage(
        "window.close"
    );

}


/* =========================================================
   LAUNCH STATE
   ========================================================= */

var launchRunning =
    false;


var launchAnimation =
    null;


var launchStartedAt =
    0;


var launchDuration =
    0;


var queueAhead =
    1;


/* =========================================================
   RANDOM QUEUE
   ========================================================= */

function randomQueueAhead() {

    return (
        Math.floor(
            Math.random() * 4
        ) + 1
    );

}


/*
 * Roughly 29 seconds.
 *
 * Range:
 * 25–33 seconds.
 *
 * So it can be 27 one time,
 * 29 another, 31 another, etc.
 */

function randomLaunchDuration() {

    return (
        Math.floor(
            Math.random() * 9
        ) + 25
    ) * 1000;

}


/* =========================================================
   QUEUE ELEMENTS
   ========================================================= */

function queueElement(
    id
) {

    return document.getElementById(
        id
    );

}


/* =========================================================
   UPDATE QUEUE
   ========================================================= */

function updateQueue(
    progress
) {

    var fill =
        queueElement(
            "queue-progress-fill"
        );


    var ahead =
        queueElement(
            "queue-ahead-number"
        );


    var position =
        queueElement(
            "queue-position"
        );


    var time =
        queueElement(
            "queue-time"
        );


    if (fill) {

        fill.style.width =
            (
                progress * 100
            ) + "%";

    }


    if (ahead) {

        /*
         * Keep the queue feeling natural.
         * People gradually leave the queue
         * instead of the number jumping every
         * frame.
         */

        var displayedAhead =
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


    if (position) {

        var displayedPosition =
            Math.max(
                1,
                Math.ceil(
                    (
                        queueAhead + 1
                    ) *
                    (1 - progress)
                )
            );


        position.textContent =
            displayedPosition;

    }


    if (time) {

        var elapsed =
            performance.now() -
            launchStartedAt;


        var remaining =
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


/* =========================================================
   QUEUE ANIMATION
   ========================================================= */

function animateQueue() {

    if (!launchRunning) {
        return;
    }


    var elapsed =
        performance.now() -
        launchStartedAt;


    var progress =
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


    launchAnimation =
        requestAnimationFrame(
            animateQueue
        );

}


/* =========================================================
   START LAUNCH
   ========================================================= */

function launch(
    button
) {

    if (launchRunning) {
        return;
    }


    launchRunning =
        true;


    queueAhead =
        randomQueueAhead();


    launchDuration =
        randomLaunchDuration();


    launchStartedAt =
        performance.now();


    var settings =
        getSettings();


    var queue =
        document.getElementById(
            "queue-screen"
        );


    var fill =
        queueElement(
            "queue-progress-fill"
        );


    var ahead =
        queueElement(
            "queue-ahead-number"
        );


    var position =
        queueElement(
            "queue-position"
        );


    var time =
        queueElement(
            "queue-time"
        );


    if (button) {

        button.dataset.originalText =
            button.textContent;

        button.style.opacity =
            ".55";

        button.disabled =
            true;

    }


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
     * The queue replaces the whole UI.
     */

    var sidebar =
        document.querySelector(
            ".sidebar"
        );


    var content =
        document.querySelector(
            ".content"
        );


    var close =
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


    if (queue) {

        queue.classList.add(
            "active"
        );

    }


    /*
     * Honour minimise-on-launch.
     *
     * The queue is still started first,
     * so the setting behaves exactly as
     * the native window setting says.
     */

    if (settings.minimise) {

        nativeMessage(
            "window.minimize"
        );

    }


    launchAnimation =
        requestAnimationFrame(
            animateQueue
        );

}


/* =========================================================
   CANCEL
   ========================================================= */

function cancelLaunch() {

    if (!launchRunning) {
        return;
    }


    launchRunning =
        false;


    if (launchAnimation) {

        cancelAnimationFrame(
            launchAnimation
        );

        launchAnimation =
            null;

    }


    var queue =
        document.getElementById(
            "queue-screen"
        );


    if (queue) {

        queue.classList.remove(
            "active"
        );

    }


    var sidebar =
        document.querySelector(
            ".sidebar"
        );


    var content =
        document.querySelector(
            ".content"
        );


    var close =
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


    var buttons =
        document.querySelectorAll(
            ".launch-button, .launch-action"
        );


    for (
        var i = 0;
        i < buttons.length;
        i++
    ) {

        buttons[i].disabled =
            false;

        buttons[i].style.opacity =
            "1";

        buttons[i].textContent =
            "Launch";

    }


    /*
     * Return to the Launch tab.
     */

    var launchButton =
        document.querySelector(
            '.nav button[onclick*="showView(\'launch\'"]'
        );


    showView(
        "launch",
        launchButton
    );

}


/* =========================================================
   FINISH
   ========================================================= */

function finishLaunch() {

    launchRunning =
        false;


    if (launchAnimation) {

        cancelAnimationFrame(
            launchAnimation
        );

        launchAnimation =
            null;

    }


    var fill =
        queueElement(
            "queue-progress-fill"
        );


    var ahead =
        queueElement(
            "queue-ahead-number"
        );


    var position =
        queueElement(
            "queue-position"
        );


    var time =
        queueElement(
            "queue-time"
        );


    if (fill) {

        fill.style.width =
            "100%";

    }


    if (ahead) {

        ahead.textContent =
            "0";

    }


    if (position) {

        position.textContent =
            "1";

    }


    if (time) {

        time.textContent =
            "Ready";

    }


    var settings =
        getSettings();


    /*
     * Restore the normal UI after
     * the queue has completed.
     */

    var queue =
        document.getElementById(
            "queue-screen"
        );


    if (queue) {

        queue.classList.remove(
            "active"
        );

    }


    var sidebar =
        document.querySelector(
            ".sidebar"
        );


    var content =
        document.querySelector(
            ".content"
        );


    var close =
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


    var buttons =
        document.querySelectorAll(
            ".launch-button, .launch-action"
        );


    for (
        var i = 0;
        i < buttons.length;
        i++
    ) {

        buttons[i].disabled =
            false;

        buttons[i].style.opacity =
            "1";

        buttons[i].textContent =
            "Launch";

    }


    /*
     * Close after launch if enabled.
     */

    if (settings.closeAfter) {

        setTimeout(
            function () {

                nativeMessage(
                    "window.close"
                );

            },
            250
        );

        return;

    }


    /*
     * Otherwise remain on Launch.
     */

    var launchButton =
        document.querySelector(
            '.nav button[onclick*="showView(\'launch\'"]'
        );


    showView(
        "launch",
        launchButton
    );

}


/* =========================================================
   DRAG FROM ANYWHERE
   ========================================================= */

document.addEventListener(
    "pointerdown",
    function(event) {

        if (
            event.button !== 0
        ) {

            return;

        }


        /*
         * Buttons must stay clickable.
         */

        if (
            event.target.closest(
                "button"
            )
        ) {

            return;

        }


        /*
         * The queue itself is deliberately
         * draggable too.
         */

        nativeMessage(
            "window.drag"
        );

    }
);


/* =========================================================
   RIGHT CLICK
   ========================================================= */

document.addEventListener(
    "contextmenu",
    function(event) {

        event.preventDefault();

    }
);

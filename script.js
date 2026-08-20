/* =========================================================
   ORRO
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

        return;

    }


    var matchingButton =
        document.querySelector(
            '.nav button[data-view="' +
            id +
            '"]'
        );


    if (matchingButton) {

        matchingButton.classList.add(
            "selected"
        );

    }

}


/* =========================================================
   SETTINGS
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

        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify(
                settings
            )
        );

    }

    catch (error) {

        return;

    }

}


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


        toggle.setAttribute(
            "aria-pressed",
            enabled
                ? "true"
                : "false"
        );

    }

}


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


    var enabled =
        !!settings[
            settingName
        ];


    element.classList.toggle(
        "on",
        enabled
    );


    element.setAttribute(
        "aria-pressed",
        enabled
            ? "true"
            : "false"
    );

}


loadSettings();


/* =========================================================
   LAUNCHING SCREEN
   ========================================================= */

var launchingScreen =
    document.getElementById(
        "launching-screen"
    );


var launchingProgress =
    document.getElementById(
        "launching-progress-fill"
    );


var launchingStatus =
    document.getElementById(
        "launching-status-text"
    );


var launchingTitle =
    document.getElementById(
        "launching-title"
    );


var launchingSubtitle =
    document.getElementById(
        "launching-subtitle"
    );


var launchTimers = [];

var launchRunning =
    false;


/* =========================================================
   SMOOTH STATUS TRANSITION
   ========================================================= */

function changeLaunchStatus(
    text
) {

    if (
        launchingStatus.textContent === text
    ) {

        return;

    }


    launchingStatus.style.opacity =
        "0";

    launchingStatus.style.transform =
        "translateY(2px)";


    setTimeout(
        function() {

            launchingStatus.textContent =
                text;

            launchingStatus.style.opacity =
                "1";

            launchingStatus.style.transform =
                "translateY(0)";

        },
        120
    );

}


/* =========================================================
   SMOOTH PROGRESS
   ========================================================= */

function setLaunchProgress(
    percentage
) {

    launchingProgress.style.width =
        percentage + "%";

}


/* =========================================================
   CLEAR TIMERS
   ========================================================= */

function clearLaunchTimers() {

    for (
        var i = 0;
        i < launchTimers.length;
        i++
    ) {

        clearTimeout(
            launchTimers[i]
        );

    }


    launchTimers = [];

}


/* =========================================================
   START LAUNCH
   ========================================================= */

function launch(
    button
) {

    /*
     * Both Launch buttons always switch
     * to the Launch page first.
     */

    showView(
        "launch"
    );


    if (launchRunning) {

        return;

    }


    launchRunning =
        true;


    clearLaunchTimers();


    var settings =
        getSettings();


    /*
     * Button feedback.
     */

    var launchButtons =
        document.querySelectorAll(
            ".launch-button, .launch-action"
        );


    for (
        var i = 0;
        i < launchButtons.length;
        i++
    ) {

        launchButtons[i].dataset.originalText =
            launchButtons[i].textContent;

        launchButtons[i].textContent =
            "Launching...";

        launchButtons[i].style.opacity =
            ".55";

    }


    /*
     * Reset overlay.
     */

    launchingProgress.style.width =
        "0%";


    launchingStatus.textContent =
        "Initialising";


    launchingStatus.style.opacity =
        "1";

    launchingStatus.style.transform =
        "translateY(0)";


    launchingTitle.textContent =
        "Launching";


    launchingSubtitle.textContent =
        "Preparing your session.";


    /*
     * Show overlay.
     */

    launchingScreen.classList.add(
        "active"
    );


    /*
     * Native minimise option.
     */

    if (settings.minimise) {

        nativeMessage(
            "window.minimize"
        );

    }


    /*
     * Smooth launch timeline.
     *
     * Each stage has a target progress value.
     * CSS handles the interpolation between
     * those values, so the bar never jumps.
     */

    var stages = [

        {
            time: 0,
            progress: 3,
            text: "Initialising"
        },

        {
            time: 2500,
            progress: 11,
            text: "Loading configuration"
        },

        {
            time: 5200,
            progress: 20,
            text: "Checking installation"
        },

        {
            time: 8000,
            progress: 30,
            text: "Checking environment"
        },

        {
            time: 10800,
            progress: 41,
            text: "Preparing files"
        },

        {
            time: 13600,
            progress: 52,
            text: "Loading components"
        },

        {
            time: 16400,
            progress: 63,
            text: "Preparing session"
        },

        {
            time: 19300,
            progress: 73,
            text: "Initialising services"
        },

        {
            time: 22200,
            progress: 82,
            text: "Starting core"
        },

        {
            time: 25100,
            progress: 90,
            text: "Connecting"
        },

        {
            time: 27900,
            progress: 96,
            text: "Starting orro"
        },

        {
            time: 30600,
            progress: 100,
            text: "Ready"
        }

    ];


    for (
        var stageIndex = 0;
        stageIndex < stages.length;
        stageIndex++
    ) {

        (function(stage) {

            var timer =
                setTimeout(
                    function() {

                        setLaunchProgress(
                            stage.progress
                        );


                        changeLaunchStatus(
                            stage.text
                        );

                    },
                    stage.time
                );


            launchTimers.push(
                timer
            );

        })(stages[stageIndex]);

    }


    /*
     * Give the final 100% state time
     * to settle before closing the overlay.
     */

    var finishTimer =
        setTimeout(
            function() {

                launchRunning =
                    false;


                launchingTitle.textContent =
                    "Ready";


                launchingSubtitle.textContent =
                    "Session ready.";


                setLaunchProgress(
                    100
                );


                changeLaunchStatus(
                    "Ready"
                );


                /*
                 * Restore launch buttons.
                 */

                var buttons =
                    document.querySelectorAll(
                        ".launch-button, .launch-action"
                    );


                for (
                    var i = 0;
                    i < buttons.length;
                    i++
                ) {

                    buttons[i].textContent =
                        buttons[i].dataset.originalText ||
                        "Launch";

                    buttons[i].style.opacity =
                        "1";

                }


                /*
                 * Close if requested.
                 */

                var currentSettings =
                    getSettings();


                if (
                    currentSettings.closeAfter
                ) {

                    var closeTimer =
                        setTimeout(
                            function() {

                                nativeMessage(
                                    "window.close"
                                );

                            },
                            700
                        );


                    launchTimers.push(
                        closeTimer
                    );


                    return;

                }


                /*
                 * Smoothly hide the overlay.
                 */

                var hideTimer =
                    setTimeout(
                        function() {

                            launchingScreen.classList.remove(
                                "active"
                            );


                            var resetTimer =
                                setTimeout(
                                    function() {

                                        launchingProgress.style.width =
                                            "0%";

                                        launchingStatus.textContent =
                                            "Initialising";

                                        launchingTitle.textContent =
                                            "Launching";

                                        launchingSubtitle.textContent =
                                            "Preparing your session.";

                                    },
                                    500
                                );


                            launchTimers.push(
                                resetTimer
                            );

                        },
                        1000
                    );


                launchTimers.push(
                    hideTimer
                );

            },
            31600
        );


    launchTimers.push(
        finishTimer
    );

}


/* =========================================================
   CANCEL LAUNCH
   ========================================================= */

function cancelLaunch() {

    if (!launchRunning) {

        return;

    }


    launchRunning =
        false;


    clearLaunchTimers();


    launchingScreen.classList.remove(
        "active"
    );


    launchingProgress.style.width =
        "0%";


    launchingStatus.textContent =
        "Initialising";


    launchingTitle.textContent =
        "Launching";


    launchingSubtitle.textContent =
        "Preparing your session.";


    var buttons =
        document.querySelectorAll(
            ".launch-button, .launch-action"
        );


    for (
        var i = 0;
        i < buttons.length;
        i++
    ) {

        buttons[i].textContent =
            buttons[i].dataset.originalText ||
            "Launch";

        buttons[i].style.opacity =
            "1";

    }


    showView(
        "launch"
    );

}


/* =========================================================
   WINDOW DRAGGING
   ========================================================= */

document.addEventListener(
    "pointerdown",
    function(event) {

        if (
            event.button !== 0
        ) {

            return;

        }


        if (
            event.target.closest(
                "button"
            )
        ) {

            return;

        }


        if (
            event.target.closest(
                "#launching-screen"
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
   RIGHT CLICK
   ========================================================= */

document.addEventListener(
    "contextmenu",
    function(event) {

        event.preventDefault();

    }
);

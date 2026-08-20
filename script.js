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


    /*
     * If the function was called from
     * a button, select that button.
     */

    if (button) {

        button.classList.add(
            "selected"
        );

        return;

    }


    /*
     * Otherwise find the correct
     * navigation button by data-view.
     */

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


/* =========================================================
   GET SETTINGS
   ========================================================= */

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


/* =========================================================
   SAVE SETTINGS
   ========================================================= */

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

        /*
         * Nothing else is required here.
         * WebView2 normally provides persistent
         * localStorage for this hosted page.
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


        toggle.setAttribute(
            "aria-pressed",
            enabled
                ? "true"
                : "false"
        );

    }

}


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


/* =========================================================
   LOAD SETTINGS IMMEDIATELY
   ========================================================= */

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
   CLEAR LAUNCH TIMERS
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
   UPDATE LAUNCH SCREEN
   ========================================================= */

function updateLaunch(
    percentage,
    status
) {

    launchingProgress.style.width =
        percentage + "%";


    launchingStatus.textContent =
        status;

}


/* =========================================================
   START LAUNCH
   ========================================================= */

function launch(
    button
) {

    /*
     * IMPORTANT:
     *
     * Every Launch button goes to the
     * exact same Launch page first.
     *
     * This also changes the selected
     * sidebar item to Launch.
     */

    showView(
        "launch"
    );


    if (launchRunning) {
        return;
    }


    launchRunning = true;


    clearLaunchTimers();


    var settings =
        getSettings();


    /*
     * Button feedback.
     */

    if (button) {

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            "Launching...";

        button.style.opacity =
            ".55";

    }


    /*
     * Show launch overlay.
     */

    launchingScreen.classList.add(
        "active"
    );


    launchingTitle.textContent =
        "Launching";


    launchingSubtitle.textContent =
        "Preparing your session.";


    updateLaunch(
        0,
        "Initialising"
    );


    /*
     * Minimise if enabled.
     */

    if (settings.minimise) {

        nativeMessage(
            "window.minimize"
        );

    }


    /*
     * Launch stages.
     */

    var stages = [

        {
            time: 1500,
            progress: 4,
            text: "Initialising"
        },

        {
            time: 4300,
            progress: 9,
            text: "Loading configuration"
        },

        {
            time: 7200,
            progress: 15,
            text: "Checking installation"
        },

        {
            time: 10400,
            progress: 23,
            text: "Checking environment"
        },

        {
            time: 13900,
            progress: 31,
            text: "Preparing files"
        },

        {
            time: 17600,
            progress: 40,
            text: "Loading components"
        },

        {
            time: 21100,
            progress: 49,
            text: "Preparing session"
        },

        {
            time: 24700,
            progress: 61,
            text: "Initialising services"
        },

        {
            time: 27900,
            progress: 70,
            text: "Starting core"
        },

        {
            time: 30700,
            progress: 79,
            text: "Connecting"
        },

        {
            time: 33100,
            progress: 90,
            text: "Starting orro"
        },

        {
            time: 35500,
            progress: 100,
            text: "Ready"
        }

    ];


    for (
        var i = 0;
        i < stages.length;
        i++
    ) {

        (function(stage) {

            var timer =
                setTimeout(
                    function() {

                        updateLaunch(
                            stage.progress,
                            stage.text
                        );

                    },
                    stage.time
                );


            launchTimers.push(
                timer
            );

        })(stages[i]);

    }


    /*
     * Finish.
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


                updateLaunch(
                    100,
                    "Ready"
                );


                /*
                 * Restore ALL launch buttons.
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
                 * Close if enabled.
                 */

                var currentSettings =
                    getSettings();


                if (
                    currentSettings.closeAfter
                ) {

                    nativeMessage(
                        "window.close"
                    );

                    return;

                }


                /*
                 * Otherwise return to
                 * the Launch page.
                 */

                var returnTimer =
                    setTimeout(
                        function() {

                            launchingScreen.classList.remove(
                                "active"
                            );


                            updateLaunch(
                                0,
                                "Initialising"
                            );


                            launchingTitle.textContent =
                                "Launching";


                            launchingSubtitle.textContent =
                                "Preparing your session.";

                        },
                        900
                    );


                launchTimers.push(
                    returnTimer
                );


            },
            37000
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
            "Launch";

        buttons[i].style.opacity =
            "1";

    }


    /*
     * Keep the user on the Launch page
     * after cancelling.
     */

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


        /*
         * Never steal clicks from buttons.
         */

        if (
            event.target.closest(
                "button"
            )
        ) {

            return;

        }


        /*
         * Don't drag the launching overlay.
         */

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
   DISABLE RIGHT CLICK
   ========================================================= */

document.addEventListener(
    "contextmenu",
    function(event) {

        event.preventDefault();

    }
);

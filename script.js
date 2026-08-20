"use strict";


/* ============================================================
   ELEMENTS
   ============================================================ */

const intro =
    document.getElementById("intro");

const app =
    document.getElementById("app");

const launchScreen =
    document.getElementById("launchScreen");

const launchTitle =
    document.getElementById("launchTitle");

const launchStatus =
    document.getElementById("launchStatus");

const launchProgressBar =
    document.getElementById("launchProgressBar");

const launchStep =
    document.getElementById("launchStep");

const launchPercent =
    document.getElementById("launchPercent");


/* ============================================================
   SETTINGS
   ============================================================ */

const DEFAULT_SETTINGS = {

    rememberSession: true,

    automaticUpdates: true,

    closeAfterLaunch: false

};


let settings = {
    ...DEFAULT_SETTINGS
};


function loadSettings()
{
    try
    {
        const saved =
            localStorage.getItem(
                "orro-settings"
            );

        if (saved)
        {
            settings = {
                ...DEFAULT_SETTINGS,
                ...JSON.parse(saved)
            };
        }
    }
    catch
    {
        settings = {
            ...DEFAULT_SETTINGS
        };
    }
}


function saveSettings()
{
    try
    {
        localStorage.setItem(
            "orro-settings",
            JSON.stringify(settings)
        );
    }
    catch
    {
        // Ignore storage errors.
    }
}


function updateToggleUI()
{
    document
        .querySelectorAll(".toggle")
        .forEach(toggle =>
        {
            const name =
                toggle.dataset.setting;

            toggle.classList.toggle(
                "on",
                !!settings[name]
            );
        });
}


/* ============================================================
   WEBVIEW NATIVE MESSAGES
   ============================================================ */

function sendNativeMessage(message)
{
    try
    {
        if (
            window.chrome &&
            window.chrome.webview
        )
        {
            window.chrome.webview.postMessage(
                message
            );
        }
    }
    catch
    {
        // Running directly in a normal browser.
    }
}


/* ============================================================
   INTRO
   ============================================================ */

function startIntro()
{
    setTimeout(() =>
    {
        intro.style.opacity = "0";

        intro.style.transition =
            "opacity .55s ease";

        app.classList.add("ready");

        setTimeout(() =>
        {
            intro.style.display = "none";
        }, 600);

    }, 1900);
}


/* ============================================================
   NAVIGATION
   ============================================================ */

const navButtons =
    document.querySelectorAll(
        ".nav-button"
    );

const views =
    document.querySelectorAll(
        ".view"
    );


function showView(viewName)
{
    navButtons.forEach(button =>
    {
        button.classList.toggle(
            "selected",
            button.dataset.view === viewName
        );
    });


    views.forEach(view =>
    {
        view.classList.toggle(
            "active",
            view.id === viewName
        );
    });
}


navButtons.forEach(button =>
{
    button.addEventListener(
        "click",
        event =>
        {
            event.stopPropagation();

            showView(
                button.dataset.view
            );
        }
    );
});


/* ============================================================
   SETTINGS BUTTONS
   ============================================================ */

document
    .querySelectorAll(".toggle")
    .forEach(toggle =>
    {
        toggle.addEventListener(
            "click",
            event =>
            {
                event.stopPropagation();

                const name =
                    toggle.dataset.setting;

                settings[name] =
                    !settings[name];

                saveSettings();

                updateToggleUI();
            }
        );
    });


/* ============================================================
   LAUNCH SEQUENCE
   ============================================================ */

let launchRunning = false;

let launchTimer = null;


const launchStages = [

    {
        start: 0,
        end: 8,
        title: "Preparing",
        status: "Starting launch sequence",
        step: "Initialising"
    },

    {
        start: 8,
        end: 20,
        title: "Checking",
        status: "Checking required components",
        step: "Verifying"
    },

    {
        start: 20,
        end: 34,
        title: "Loading",
        status: "Loading orro components",
        step: "Loading"
    },

    {
        start: 34,
        end: 50,
        title: "Initialising",
        status: "Initialising runtime",
        step: "Initialising runtime"
    },

    {
        start: 50,
        end: 68,
        title: "Preparing",
        status: "Preparing session",
        step: "Preparing session"
    },

    {
        start: 68,
        end: 84,
        title: "Starting",
        status: "Starting orro",
        step: "Starting"
    },

    {
        start: 84,
        end: 96,
        title: "Finalising",
        status: "Finishing launch sequence",
        step: "Finalising"
    },

    {
        start: 96,
        end: 100,
        title: "Complete",
        status: "Launch complete",
        step: "Complete"
    }

];


function getLaunchStage(percent)
{
    for (
        let i = 0;
        i < launchStages.length;
        i++
    )
    {
        const stage =
            launchStages[i];

        if (
            percent >= stage.start &&
            percent <= stage.end
        )
        {
            return stage;
        }
    }

    return launchStages[
        launchStages.length - 1
    ];
}


function updateLaunchUI(percent)
{
    const rounded =
        Math.min(
            100,
            Math.floor(percent)
        );


    const stage =
        getLaunchStage(rounded);


    launchTitle.textContent =
        stage.title;

    launchStatus.textContent =
        stage.status;

    launchStep.textContent =
        stage.step;

    launchPercent.textContent =
        `${rounded}%`;


    launchProgressBar.style.width =
        `${rounded}%`;
}


function finishLaunch()
{
    clearInterval(launchTimer);

    launchTimer = null;

    updateLaunchUI(100);


    setTimeout(() =>
    {
        if (
            settings.closeAfterLaunch
        )
        {
            sendNativeMessage(
                "window.close"
            );

            return;
        }


        launchScreen.classList.remove(
            "visible"
        );

        showView("home");

        launchRunning = false;

    }, 850);
}


function startLaunch()
{
    if (launchRunning)
        return;


    launchRunning = true;


    // Make sure preferences are current.
    loadSettings();
    updateToggleUI();


    // Entire menu becomes the launcher.
    launchScreen.classList.add(
        "visible"
    );


    updateLaunchUI(0);


    /*
       36 SECOND REAL-TIME DEMO

       0% -> 100%
       approximately 36 seconds.
    */

    const duration = 36000;

    const startTime =
        performance.now();


    launchTimer =
        setInterval(() =>
        {
            const elapsed =
                performance.now() -
                startTime;


            const percent =
                Math.min(
                    100,
                    (elapsed / duration) * 100
                );


            updateLaunchUI(percent);


            if (percent >= 100)
            {
                finishLaunch();
            }

        }, 100);
}


/* ============================================================
   LAUNCH BUTTONS
   ============================================================ */

const homeLaunch =
    document.getElementById(
        "homeLaunch"
    );

const launchButton =
    document.getElementById(
        "launchButton"
    );


homeLaunch.addEventListener(
    "click",
    event =>
    {
        event.stopPropagation();

        startLaunch();
    }
);


launchButton.addEventListener(
    "click",
    event =>
    {
        event.stopPropagation();

        startLaunch();
    }
);


/* ============================================================
   WINDOW DRAGGING
   ============================================================ */

/*
    The native C++ window has no title bar.

    Clicking normal empty areas of the application
    tells WebView2 to move the native window.

    Buttons and interactive controls are excluded.
*/

document.addEventListener(
    "mousedown",
    event =>
    {
        if (
            event.button !== 0
        )
        {
            return;
        }


        const target =
            event.target;


        if (
            target.closest(
                "button, input, textarea, select, a"
            )
        )
        {
            return;
        }


        sendNativeMessage(
            "window.drag"
        );
    }
);


/* ============================================================
   KEYBOARD SAFETY
   ============================================================ */

document.addEventListener(
    "keydown",
    event =>
    {
        // Prevent Ctrl+A from selecting the whole UI.
        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "a"
        )
        {
            event.preventDefault();
        }
    }
);


/* ============================================================
   STARTUP
   ============================================================ */

loadSettings();

updateToggleUI();

startIntro();

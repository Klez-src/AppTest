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
        // Storage may be unavailable in some environments.
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
   NATIVE WEBVIEW MESSAGES
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
        // Normal browser mode.
    }
}


/* ============================================================
   INTRO
   ============================================================ */

function startIntro()
{
    /*
        Keep the original intro timing.

        The intro remains the first thing shown.
        The application fades in behind it.
    */

    setTimeout(() =>
    {
        intro.style.transition =
            "opacity .55s ease";

        intro.style.opacity =
            "0";

        app.classList.add(
            "ready"
        );

        setTimeout(() =>
        {
            intro.style.display =
                "none";

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

            if (launchRunning)
                return;

            showView(
                button.dataset.view
            );
        }
    );
});


/* ============================================================
   SETTINGS
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

let launchRunning =
    false;

let launchTimer =
    null;

let launchFinishTimer =
    null;


/*
    The sequence lasts 36 seconds.

    It deliberately has multiple phases so the progress
    does not feel like a simple fake counter.
*/

const launchStages = [

    {
        start: 0,
        end: 8,

        title: "Preparing",

        status:
            "Starting launch sequence",

        step:
            "Initialising"
    },


    {
        start: 8,
        end: 20,

        title: "Checking",

        status:
            "Checking required components",

        step:
            "Verifying"
    },


    {
        start: 20,
        end: 34,

        title: "Loading",

        status:
            "Loading orro components",

        step:
            "Loading"
    },


    {
        start: 34,
        end: 50,

        title: "Initialising",

        status:
            "Initialising runtime",

        step:
            "Initialising runtime"
    },


    {
        start: 50,
        end: 68,

        title: "Preparing",

        status:
            "Preparing session",

        step:
            "Preparing session"
    },


    {
        start: 68,
        end: 84,

        title: "Starting",

        status:
            "Starting orro",

        step:
            "Starting"
    },


    {
        start: 84,
        end: 96,

        title: "Finalising",

        status:
            "Finishing launch sequence",

        step:
            "Finalising"
    },


    {
        start: 96,
        end: 100,

        title: "Complete",

        status:
            "Launch complete",

        step:
            "Complete"
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
        getLaunchStage(
            rounded
        );


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


/* ============================================================
   FINISH
   ============================================================ */

function finishLaunch()
{
    if (!launchRunning)
        return;


    clearInterval(
        launchTimer
    );

    launchTimer =
        null;


    updateLaunchUI(
        100
    );


    launchFinishTimer =
        setTimeout(() =>
        {

            launchFinishTimer =
                null;


            /*
                IMPORTANT:

                If Close after launch is enabled,
                tell the native C++ shell to close.

                Otherwise return smoothly to Home.
            */

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


            setTimeout(() =>
            {
                showView(
                    "home"
                );

                launchRunning =
                    false;

            }, 450);


        }, 900);
}


/* ============================================================
   START LAUNCH
   ============================================================ */

function startLaunch()
{
    if (launchRunning)
        return;


    launchRunning =
        true;


    loadSettings();

    updateToggleUI();


    /*
        Reset the launcher completely.
    */

    clearInterval(
        launchTimer
    );

    clearTimeout(
        launchFinishTimer
    );


    launchProgressBar.style.width =
        "0%";


    updateLaunchUI(
        0
    );


    /*
        Let the main application exist underneath
        the launch screen.

        The launch screen then fades naturally over it.
    */

    requestAnimationFrame(() =>
    {
        launchScreen.classList.add(
            "visible"
        );
    });


    /*
        36 SECOND SEQUENCE
    */

    const duration =
        36000;


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


            updateLaunchUI(
                percent
            );


            if (
                percent >= 100
            )
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
    The C++ window has no title bar.

    Therefore normal empty areas of the UI can drag
    the native window.

    Interactive controls are excluded.
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
   TEXT SELECTION PREVENTION
   ============================================================ */

document.addEventListener(
    "selectstart",
    event =>
    {
        event.preventDefault();
    }
);


document.addEventListener(
    "dragstart",
    event =>
    {
        event.preventDefault();
    }
);


/* ============================================================
   KEYBOARD SAFETY
   ============================================================ */

document.addEventListener(
    "keydown",
    event =>
    {

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "a"
        )
        {
            event.preventDefault();
        }


        if (
            event.key === "F5"
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

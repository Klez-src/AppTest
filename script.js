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


/* ============================================================
   LOAD SETTINGS
   ============================================================ */

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


/* ============================================================
   SAVE SETTINGS
   ============================================================ */

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
        /*
            Ignore storage errors.
        */
    }
}


/* ============================================================
   UPDATE TOGGLE UI
   ============================================================ */

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
        /*
            Running directly in a normal browser.
        */
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
    /*
        Never change the active page while
        the launching screen is running.
    */

    if (launchRunning)
        return;


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

let launchRunning =
    false;

let launchTimer =
    null;


/*
    Same launch sequence as the existing application.
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


/* ============================================================
   GET CURRENT LAUNCH STAGE
   ============================================================ */

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


/* ============================================================
   UPDATE LAUNCH UI
   ============================================================ */

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
   FINISH LAUNCH
   ============================================================ */

function finishLaunch()
{
    clearInterval(
        launchTimer
    );


    launchTimer = null;


    updateLaunchUI(
        100
    );


    /*
        Give the Complete state a short moment
        before leaving the launch screen.
    */

    setTimeout(() =>
    {

        /*
            If Close after launch is enabled,
            close the actual native application.
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


        /*
            Otherwise smoothly return to
            the normal application.
        */

        launchScreen.classList.remove(
            "visible"
        );


        /*
            Allow the fade-out animation to finish
            before marking the sequence inactive.
        */

        setTimeout(() =>
        {
            showView(
                "home"
            );

            launchRunning =
                false;

        }, 500);

    }, 850);
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


    /*
        Make sure preferences are current.
    */

    loadSettings();

    updateToggleUI();


    /*
        Make the launch screen become the entire
        application surface.

        It does NOT open a new page.
        It does NOT open another window.
        It fades over the existing menu.
    */

    launchScreen.classList.add(
        "visible"
    );


    /*
        Reset the progress bar immediately.
    */

    launchProgressBar.style.width =
        "0%";


    updateLaunchUI(
        0
    );


    /*
        36 SECOND LAUNCH.

        This deliberately remains around the
        30–40 second range requested.
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
    The native C++ window has no title bar.

    Empty parts of the interface can therefore
    drag the whole native window.

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


        /*
            Don't drag when the user is
            interacting with a control.
        */

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


        /*
            Don't initiate a drag from
            the launch progress itself.
        */

        if (
            target.closest(
                "#launchScreen"
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
        /*
            Prevent Ctrl+A / Cmd+A
            from selecting the interface.
        */

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

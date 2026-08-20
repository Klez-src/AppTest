let launchRunning = false;

let launchTimer = null;

let launchStartedAt = 0;

const LAUNCH_DURATION = 29000;



const launchStages = [

    {
        at: 0,
        title: "Launching",
        subtitle: "Initialising your session.",
        status: "Initialising",
        step: 0
    },

    {
        at: 6500,
        title: "Preparing",
        subtitle: "Preparing the application environment.",
        status: "Preparing",
        step: 1
    },

    {
        at: 14000,
        title: "Starting",
        subtitle: "Starting your orro session.",
        status: "Starting",
        step: 2
    },

    {
        at: 22500,
        title: "Finalising",
        subtitle: "Finishing up your session.",
        status: "Finalising",
        step: 3
    }

];



function getElement(id) {

    return document.getElementById(id);

}



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



function showView(viewId, button) {

    if (launchRunning)
        return;


    document
        .querySelectorAll(".view")
        .forEach(function (view) {

            view.classList.remove("active");

        });


    const view =
        getElement(viewId);


    if (view) {

        view.classList.add("active");

    }


    document
        .querySelectorAll(".nav button")
        .forEach(function (navButton) {

            navButton.classList.remove("selected");

        });


    if (button) {

        button.classList.add("selected");

    }

}



function toggleSetting(button) {

    if (!button)
        return;


    const setting =
        button.dataset.setting;


    const enabled =
        !button.classList.contains("on");


    button.classList.toggle(
        "on",
        enabled
    );


    button.setAttribute(
        "aria-pressed",
        enabled ? "true" : "false"
    );


    try {

        localStorage.setItem(
            "orro_setting_" + setting,
            enabled ? "true" : "false"
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
        .querySelectorAll(".toggle[data-setting]")
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



function setLaunchStage(stage) {

    const title =
        getElement("launching-title");

    const subtitle =
        getElement("launching-subtitle");

    const status =
        getElement("launching-status-text");


    if (title)
        title.textContent = stage.title;


    if (subtitle)
        subtitle.textContent = stage.subtitle;


    if (status)
        status.textContent = stage.status;


    document
        .querySelectorAll(".launch-step")
        .forEach(function (element) {

            const index =
                Number(
                    element.dataset.step
                );


            element.classList.toggle(
                "active",
                index === stage.step
            );


            element.classList.toggle(
                "done",
                index < stage.step
            );

        });

}



function updateLaunchProgress() {

    if (!launchRunning)
        return;


    const elapsed =
        performance.now() -
        launchStartedAt;


    const progress =
        Math.min(
            elapsed / LAUNCH_DURATION,
            1
        );


    const percentage =
        Math.floor(progress * 100);


    const fill =
        getElement(
            "launching-progress-fill"
        );


    const percent =
        getElement(
            "launching-percent"
        );


    const time =
        getElement(
            "launching-time"
        );


    if (fill) {

        fill.style.width =
            (progress * 100) + "%";

    }


    if (percent) {

        percent.textContent =
            percentage + "%";

    }


    if (time) {

        const remaining =
            Math.max(
                0,
                Math.ceil(
                    (LAUNCH_DURATION - elapsed) / 1000
                )
            );


        time.textContent =
            remaining + "s";

    }


    for (
        let i = launchStages.length - 1;
        i >= 0;
        i--
    ) {

        if (
            elapsed >=
            launchStages[i].at
        ) {

            setLaunchStage(
                launchStages[i]
            );

            break;

        }

    }


    if (progress >= 1) {

        finishLaunch();

        return;

    }


    launchTimer =
        requestAnimationFrame(
            updateLaunchProgress
        );

}



function launch(button) {

    if (launchRunning)
        return;


    launchRunning = true;


    const overlay =
        getElement(
            "launching-screen"
        );


    const fill =
        getElement(
            "launching-progress-fill"
        );


    const percent =
        getElement(
            "launching-percent"
        );


    const time =
        getElement(
            "launching-time"
        );


    if (fill)
        fill.style.width = "0%";


    if (percent)
        percent.textContent = "0%";


    if (time)
        time.textContent = "29s";


    setLaunchStage(
        launchStages[0]
    );


    if (overlay) {

        overlay.classList.add(
            "visible"
        );

        overlay.classList.add(
            "active"
        );

    }


    launchStartedAt =
        performance.now();


    launchTimer =
        requestAnimationFrame(
            updateLaunchProgress
        );

}



function cancelLaunch() {

    if (!launchRunning)
        return;


    launchRunning = false;


    if (launchTimer) {

        cancelAnimationFrame(
            launchTimer
        );

        launchTimer = null;

    }


    const overlay =
        getElement(
            "launching-screen"
        );


    if (overlay) {

        overlay.classList.remove(
            "active"
        );

        overlay.classList.remove(
            "visible"
        );

    }


    setTimeout(function () {

        const fill =
            getElement(
                "launching-progress-fill"
            );


        const percent =
            getElement(
                "launching-percent"
            );


        const time =
            getElement(
                "launching-time"
            );


        if (fill)
            fill.style.width = "0%";


        if (percent)
            percent.textContent = "0%";


        if (time)
            time.textContent = "29s";


        setLaunchStage(
            launchStages[0]
        );

    }, 350);

}



function finishLaunch() {

    launchRunning = false;


    if (launchTimer) {

        cancelAnimationFrame(
            launchTimer
        );

        launchTimer = null;

    }


    const fill =
        getElement(
            "launching-progress-fill"
        );


    const percent =
        getElement(
            "launching-percent"
        );


    const time =
        getElement(
            "launching-time"
        );


    if (fill)
        fill.style.width = "100%";


    if (percent)
        percent.textContent = "100%";


    if (time)
        time.textContent = "0s";


    setLaunchStage({

        title: "Ready",

        subtitle:
            "Your session is ready.",

        status:
            "Complete",

        step: 3

    });


    document
        .querySelectorAll(".launch-step")
        .forEach(function (element) {

            element.classList.remove(
                "active"
            );

            element.classList.add(
                "done"
            );

        });


    const overlay =
        getElement(
            "launching-screen"
        );


    setTimeout(function () {

        if (overlay) {

            overlay.classList.remove(
                "active"
            );

            overlay.classList.remove(
                "visible"
            );

        }


        const minimiseButton =
            document.querySelector(
                '[data-setting="minimise"]'
            );


        const closeButton =
            document.querySelector(
                '[data-setting="closeAfter"]'
            );


        if (
            minimiseButton &&
            minimiseButton.classList.contains("on")
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
            closeButton &&
            closeButton.classList.contains("on")
        ) {

            closeWindow();

        }

    }, 900);

}



document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadSettings();

    }
);

(() => {

    "use strict";


    /* =====================================================
       PERSISTENT SETTINGS
       ===================================================== */

    const STORAGE_KEY = "orro_settings";


    const defaultSettings = {

        rememberSession: true,

        automaticUpdates: true,

        minimiseOnLaunch: false

    };


    function loadSettings() {

        try {

            const stored =
                localStorage.getItem(STORAGE_KEY);


            if (!stored)
                return { ...defaultSettings };


            const parsed =
                JSON.parse(stored);


            return {
                ...defaultSettings,
                ...parsed
            };

        } catch {

            return {
                ...defaultSettings
            };

        }

    }


    let settings =
        loadSettings();


    function saveSettings() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(settings)
            );

        } catch {

            // Storage may be unavailable.
            // The UI still works normally.

        }

    }


    /* =====================================================
       SETTINGS UI
       ===================================================== */

    const toggles =
        document.querySelectorAll(
            "[data-setting]"
        );


    function updateToggleUI() {

        toggles.forEach(toggle => {

            const setting =
                toggle.dataset.setting;


            toggle.classList.toggle(
                "on",
                Boolean(settings[setting])
            );

        });

    }


    toggles.forEach(toggle => {

        toggle.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                const setting =
                    toggle.dataset.setting;


                settings[setting] =
                    !settings[setting];


                saveSettings();

                updateToggleUI();

            }
        );

    });


    updateToggleUI();


    /* =====================================================
       PAGE NAVIGATION
       ===================================================== */

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );


    const pages =
        document.querySelectorAll(
            ".page"
        );


    function showPage(name) {

        navItems.forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.page === name
            );

        });


        pages.forEach(page => {

            page.classList.toggle(
                "active",
                page.id === `page-${name}`
            );

        });

    }


    navItems.forEach(item => {

        item.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                const page =
                    item.dataset.page;


                if (page)
                    showPage(page);

            }
        );

    });


    /* =====================================================
       LAUNCHING SCREEN
       ===================================================== */

    const launchingPage =
        document.getElementById(
            "launching-page"
        );


    const launchProgress =
        document.getElementById(
            "launchProgress"
        );


    const launchStatus =
        document.getElementById(
            "launchStatus"
        );


    const cancelLaunch =
        document.getElementById(
            "cancelLaunch"
        );


    let launchTimer = null;


    function setLaunchProgress(
        amount,
        status
    ) {

        launchProgress.style.width =
            `${amount}%`;

        launchStatus.textContent =
            status;

    }


    function closeLaunchingPage() {

        if (launchTimer) {

            clearTimeout(launchTimer);

            launchTimer = null;

        }


        launchingPage.classList.remove(
            "active"
        );


        setLaunchProgress(
            0,
            "Initialising"
        );

    }


    function startLaunch() {

        /*
         * Show the launching page.
         */

        launchingPage.classList.add(
            "active"
        );


        setLaunchProgress(
            8,
            "Initialising"
        );


        /*
         * Small staged sequence so it
         * feels like an actual launcher.
         */

        launchTimer = setTimeout(
            () => {

                setLaunchProgress(
                    28,
                    "Checking environment"
                );


                launchTimer = setTimeout(
                    () => {

                        setLaunchProgress(
                            52,
                            "Preparing session"
                        );


                        launchTimer = setTimeout(
                            () => {

                                setLaunchProgress(
                                    76,
                                    "Starting orro"
                                );


                                launchTimer =
                                    setTimeout(
                                        () => {

                                            setLaunchProgress(
                                                100,
                                                "Ready"
                                            );


                                            /*
                                             * If your C++
                                             * loader handles
                                             * launching the
                                             * actual application,
                                             * this is where you
                                             * can send the message.
                                             */

                                            if (
                                                window.chrome &&
                                                window.chrome.webview
                                            ) {

                                                window.chrome.webview.postMessage(
                                                    "launch"
                                                );

                                            }


                                            /*
                                             * If "minimise on
                                             * launch" is enabled,
                                             * tell the C++ side.
                                             */

                                            if (
                                                settings.minimiseOnLaunch &&
                                                window.chrome &&
                                                window.chrome.webview
                                            ) {

                                                window.chrome.webview.postMessage(
                                                    "window.minimise"
                                                );

                                            }

                                        },
                                        650
                                    );

                            },
                            550
                        );

                    },
                    550
                );

            },
            450
        );

    }


    document
        .querySelectorAll("[data-launch]")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    startLaunch();

                }
            );

        });


    cancelLaunch.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            closeLaunchingPage();

        }
    );


    /* =====================================================
       CLOSE
       ===================================================== */

    const closeButton =
        document.getElementById(
            "closeButton"
        );


    closeButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            if (
                window.chrome &&
                window.chrome.webview
            ) {

                window.chrome.webview.postMessage(
                    "window.close"
                );

            }

        }
    );


    /* =====================================================
       ENTIRE WINDOW DRAGGABLE
       ===================================================== */

    /*
     * IMPORTANT:
     *
     * The whole loader is draggable.
     *
     * Buttons, toggles and navigation remain
     * interactive and aren't treated as drag
     * areas.
     */

    document.addEventListener(
        "mousedown",
        event => {

            if (event.button !== 0)
                return;


            /*
             * Anything interactive should
             * remain clickable.
             */

            const interactive =
                event.target.closest(
                    "button, input, select, textarea, a"
                );


            if (interactive)
                return;


            /*
             * Send drag request to C++.
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


    /* =====================================================
       NO TEXT SELECTION
       ===================================================== */

    document.addEventListener(
        "selectstart",
        event => {

            event.preventDefault();

        }
    );


    document.addEventListener(
        "dragstart",
        event => {

            event.preventDefault();

        }
    );


    /* =====================================================
       DEFAULT PAGE
       ===================================================== */

    showPage("home");


})();

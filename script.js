/* =========================================================
   ORRO UI
   ========================================================= */

(() => {

    "use strict";


    /* =====================================================
       ELEMENTS
       ===================================================== */

    const topbar =
        document.querySelector(".topbar");


    const topbarDragArea =
        document.querySelector(".topbar-drag-area");


    const gameTabs =
        document.querySelectorAll(".game-tab");


    const gameCards =
        document.querySelectorAll(".game-card");


    const minimizeButton =
        document.getElementById("minimizeButton");


    const closeButton =
        document.getElementById("closeButton");


    const injectButton =
        document.getElementById("injectButton");


    const queueScreen =
        document.getElementById("queueScreen");


    const cancelQueue =
        document.getElementById("cancelQueue");


    const queueCount =
        document.getElementById("queueCount");


    const queuePosition =
        document.getElementById("queuePosition");


    const queueTime =
        document.getElementById("queueTime");


    const queueProgress =
        document.getElementById("queueProgress");


    /* =====================================================
       WEBVIEW BRIDGE
       ===================================================== */

    function sendWindowMessage(message) {

        try {

            if (
                window.chrome &&
                window.chrome.webview
            ) {

                window.chrome.webview.postMessage(
                    message
                );

                return true;
            }

        } catch (_) {}

        return false;

    }


    /* =====================================================
       WINDOW CONTROLS
       ===================================================== */

    minimizeButton?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            sendWindowMessage(
                "window.minimize"
            );

        }
    );


    closeButton?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            sendWindowMessage(
                "window.close"
            );

        }
    );


    /* =====================================================
       WINDOW DRAG
       ===================================================== */

    /*
       IMPORTANT:

       The previous rewrite had the visual top bar,
       but it no longer actually told the C++ host
       that the user was trying to drag the window.

       The C++ already understands:

           window.drag

       so all we need to do is send that message when
       the user presses the top bar.

       Buttons are deliberately excluded.
       The cursor stays completely normal.
    */

    function beginWindowDrag(event) {

        if (
            event.button !== 0
        ) {

            return;

        }


        const target =
            event.target;


        /*
           Never drag when clicking the window controls.
        */

        if (
            target.closest &&
            target.closest(".window-controls")
        ) {

            return;

        }


        event.preventDefault();


        sendWindowMessage(
            "window.drag"
        );

    }


    topbar?.addEventListener(
        "mousedown",
        beginWindowDrag
    );


    topbarDragArea?.addEventListener(
        "mousedown",
        beginWindowDrag
    );


    /* =====================================================
       GAME TAB SELECTION
       ===================================================== */

    function setActiveTab(tab) {

        gameTabs.forEach(
            currentTab => {

                currentTab.classList.toggle(
                    "active",
                    currentTab === tab
                );

            }
        );

    }


    function updateGames(game) {

        gameCards.forEach(
            card => {

                const supportedGames =
                    (card.dataset.games || "")
                        .split(",")
                        .map(
                            value =>
                                value.trim()
                        );


                if (
                    game === "all" ||
                    supportedGames.includes(game)
                ) {

                    card.classList.remove(
                        "hidden-game"
                    );

                } else {

                    card.classList.add(
                        "hidden-game"
                    );

                }

            }
        );


        /*
           Don't leave a selection on a card that
           is no longer visible.
        */

        gameCards.forEach(
            card => {

                if (
                    card.classList.contains(
                        "hidden-game"
                    )
                ) {

                    card.classList.remove(
                        "selected"
                    );

                }

            }
        );

    }


    gameTabs.forEach(
        tab => {

            tab.addEventListener(
                "click",
                () => {

                    const game =
                        tab.dataset.game;


                    setActiveTab(tab);

                    updateGames(game);

                }
            );

        }
    );


    /* =====================================================
       GAME CARD SELECTION
       ===================================================== */

    function selectCard(card) {

        gameCards.forEach(
            currentCard => {

                currentCard.classList.remove(
                    "selected"
                );

            }
        );


        card.classList.add(
            "selected"
        );

    }


    gameCards.forEach(
        card => {

            card.addEventListener(
                "click",
                () => {

                    if (
                        card.classList.contains(
                            "hidden-game"
                        )
                    ) {

                        return;

                    }

                    selectCard(card);

                }
            );


            card.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {

                        event.preventDefault();

                        selectCard(card);

                    }

                }
            );

        }
    );


    /* =====================================================
       QUEUE
       ===================================================== */

    let queueTimer = null;

    let queueAnimation = null;

    let queueDuration = 0;

    let queueStarted = 0;


    function randomQueueTime() {

        /*
           Around 29 seconds, but not identical every
           launch.

           Range:
               27–31 seconds
        */

        return (
            27000 +
            Math.floor(
                Math.random() * 5000
            )
        );

    }


    function stopQueueTimers() {

        if (
            queueTimer !== null
        ) {

            clearTimeout(
                queueTimer
            );

            queueTimer = null;

        }


        if (
            queueAnimation !== null
        ) {

            cancelAnimationFrame(
                queueAnimation
            );

            queueAnimation = null;

        }

    }


    function finishQueue() {

        stopQueueTimers();


        if (queueProgress) {

            queueProgress.style.width =
                "100%";

        }

    }


    function startQueue() {

        if (!queueScreen) {
            return;
        }


        const peopleAhead =
            Math.floor(
                Math.random() * 4
            ) + 1;


        const position =
            peopleAhead + 1;


        queueDuration =
            randomQueueTime();


        queueStarted =
            performance.now();


        if (queueCount) {

            queueCount.textContent =
                peopleAhead;

        }


        if (queuePosition) {

            queuePosition.textContent =
                position;

        }


        if (queueTime) {

            queueTime.textContent =
                "~" +
                Math.round(
                    queueDuration / 1000
                ) +
                " seconds";

        }


        if (queueProgress) {

            queueProgress.style.width =
                "0%";

        }


        queueScreen.classList.add(
            "active"
        );


        stopQueueTimers();


        function tick(now) {

            const elapsed =
                now - queueStarted;


            const progress =
                Math.min(
                    elapsed / queueDuration,
                    1
                );


            if (queueProgress) {

                queueProgress.style.width =
                    (progress * 100) +
                    "%";

            }


            if (
                progress < 1
            ) {

                queueAnimation =
                    requestAnimationFrame(
                        tick
                    );

            }

        }


        queueAnimation =
            requestAnimationFrame(
                tick
            );


        queueTimer =
            window.setTimeout(
                finishQueue,
                queueDuration
            );

    }


    function cancelQueueLaunch() {

        stopQueueTimers();


        queueScreen.classList.remove(
            "active"
        );


        if (queueProgress) {

            queueProgress.style.width =
                "0%";

        }

    }


    injectButton?.addEventListener(
        "click",
        startQueue
    );


    cancelQueue?.addEventListener(
        "click",
        cancelQueueLaunch
    );


    /* =====================================================
       INITIAL STATE
       ===================================================== */

    const defaultTab =
        document.querySelector(
            '.game-tab[data-game="csgo"]'
        );


    if (defaultTab) {

        setActiveTab(
            defaultTab
        );

        updateGames(
            "csgo"
        );

    }

})();

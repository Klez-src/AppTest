/* =========================================================
   ORRO UI
   ========================================================= */

(() => {

    "use strict";


    /* =====================================================
       ELEMENTS
       ===================================================== */

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

            }

        } catch (_) {

            // Normal browser fallback.

        }

    }


    /* =====================================================
       WINDOW CONTROLS
       ===================================================== */

    minimizeButton?.addEventListener(
        "click",
        () => {

            sendWindowMessage(
                "window.minimize"
            );

        }
    );


    closeButton?.addEventListener(
        "click",
        () => {

            sendWindowMessage(
                "window.close"
            );

        }
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
            If the currently selected card became
            hidden after switching games, remove
            its visual selection.
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

        /*
            Only one card can be selected at a time.
        */

        gameCards.forEach(
            currentCard => {

                currentCard.classList.remove(
                    "selected"
                );

            }
        );


        /*
            Add the subtle outline.
        */

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


            /*
                Keyboard accessibility without changing
                the visual design.
            */

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
       DEFAULT SELECTION
       ===================================================== */

    /*
        Nothing is aggressively purple by default.

        We leave the cards unselected until the user
        actually picks one.
    */

    gameCards.forEach(
        card => {

            card.classList.remove(
                "selected"
            );

        }
    );


    /* =====================================================
       INJECT / QUEUE
       ===================================================== */

    let queueTimer = null;

    let queueAnimation = null;

    let queueDuration = 0;

    let queueStarted = 0;


    function randomQueueTime() {

        /*
            Roughly 29 seconds.

            Small variation means it isn't exactly
            the same duration every time.
        */

        return (
            27000 +
            Math.floor(
                Math.random() * 5000
            )
        );

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


            if (progress < 1) {

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


    function stopQueueTimers() {

        if (queueTimer !== null) {

            clearTimeout(
                queueTimer
            );

            queueTimer = null;

        }


        if (queueAnimation !== null) {

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

        /*
            Keep the screen here for now.

            This preserves the existing launch/queue
            behaviour without inventing another UI.
        */

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

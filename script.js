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


    const injectionScreen =
        document.getElementById("injectionScreen");

    const injectionTitle =
        document.getElementById("injectionTitle");

    const injectionProgress =
        document.getElementById("injectionProgress");

    const cancelInjection =
        document.getElementById("cancelInjection");


    /* =====================================================
       LOCALHOST SUBSCRIPTION API
       ===================================================== */

    const SUBSCRIPTION_API =
        "http://127.0.0.1:3000/api/loader/subscriptions";


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

    function beginWindowDrag(event) {

        if (
            event.button !== 0
        ) {
            return;
        }


        const target =
            event.target;


        if (
            target &&
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
                        )
                        .filter(Boolean);


                const visible =
                    game === "all" ||
                    supportedGames.includes(game);


                card.classList.toggle(
                    "hidden-game",
                    !visible
                );

            }
        );


        const selectedCard =
            document.querySelector(
                ".game-card.selected"
            );


        if (
            selectedCard &&
            selectedCard.classList.contains(
                "hidden-game"
            )
        ) {

            selectedCard.classList.remove(
                "selected"
            );
        }
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

                        if (
                            !card.classList.contains(
                                "hidden-game"
                            )
                        ) {

                            selectCard(card);

                        }

                    }

                }
            );

        }
    );


    /* =====================================================
       SUBSCRIPTION PRODUCT IDs
       ===================================================== */

    function getProductId(card) {

        const option =
            card.dataset.option || "";

        const game =
            card.dataset.gameLabel || "";


        if (
            option === "Primordial" &&
            game === "CS:GO"
        ) {
            return "primordial-csgo";
        }


        if (
            option === "Gamesense" &&
            game === "CS:GO"
        ) {
            return "gamesense-csgo";
        }


        if (
            option === "Primordial" &&
            game === "CS2"
        ) {
            return "primordial-cs2";
        }


        return null;
    }


    /* =====================================================
       UPDATE SUBSCRIPTION UI
       ===================================================== */

    function applySubscriptions(
        subscriptions
    ) {

        const owned =
            new Set(
                Array.isArray(subscriptions)
                    ? subscriptions
                    : []
            );


        gameCards.forEach(
            card => {

                const productId =
                    getProductId(card);

                const badge =
                    card.querySelector(
                        ".subscription"
                    );


                if (!badge) {
                    return;
                }


                const subscribed =
                    productId !== null &&
                    owned.has(productId);


                badge.textContent =
                    subscribed
                        ? "Subscribed"
                        : "Not subscribed";


                badge.classList.toggle(
                    "subscribed",
                    subscribed
                );

            }
        );
    }


    /* =====================================================
       SYNC SUBSCRIPTIONS
       ===================================================== */

    let subscriptionRequest = null;


    async function syncSubscriptions() {

        if (subscriptionRequest) {
            return subscriptionRequest;
        }


        subscriptionRequest =
            (async () => {

                try {

                    const response =
                        await fetch(
                            SUBSCRIPTION_API,
                            {
                                method: "GET",
                                cache: "no-store"
                            }
                        );


                    if (!response.ok) {
                        return;
                    }


                    const data =
                        await response.json();


                    applySubscriptions(
                        data.subscriptions || []
                    );

                } catch (_) {

                    /*
                     * If localhost isn't running,
                     * leave the loader visually unchanged.
                     */

                } finally {

                    subscriptionRequest =
                        null;
                }

            })();


        return subscriptionRequest;
    }


    /* =====================================================
       SELECTED OPTION
       ===================================================== */

    function getSelectedCard() {

        const selected =
            document.querySelector(
                ".game-card.selected:not(.hidden-game)"
            );


        if (selected) {
            return selected;
        }


        return Array.from(gameCards)
            .find(
                card =>
                    !card.classList.contains(
                        "hidden-game"
                    )
            ) || null;
    }


    function getSelectedOption() {

        const card =
            getSelectedCard();


        if (!card) {
            return "Primordial";
        }


        return (
            card.dataset.option ||
            card.querySelector(
                ".game-name"
            )?.textContent.trim() ||
            "Primordial"
        );
    }


    /* =====================================================
       INJECTION OWNERSHIP CHECK
       ===================================================== */

    async function ownsSelectedSubscription() {

        await syncSubscriptions();


        const card =
            getSelectedCard();


        if (!card) {
            return false;
        }


        const productId =
            getProductId(card);


        if (!productId) {
            return false;
        }


        try {

            const response =
                await fetch(
                    SUBSCRIPTION_API,
                    {
                        cache: "no-store"
                    }
                );


            if (!response.ok) {
                return false;
            }


            const data =
                await response.json();


            return (
                data.signedIn === true &&
                Array.isArray(
                    data.subscriptions
                ) &&
                data.subscriptions.includes(
                    productId
                )
            );

        } catch (_) {

            return false;
        }
    }


    /* =====================================================
       INJECTION ANIMATION
       ===================================================== */

    let injectionAnimation = null;

    let injectionTimer = null;

    let injectionRunning = false;


    function stopInjectionAnimation() {

        if (
            injectionAnimation !== null
        ) {

            cancelAnimationFrame(
                injectionAnimation
            );

            injectionAnimation = null;
        }


        if (
            injectionTimer !== null
        ) {

            clearTimeout(
                injectionTimer
            );

            injectionTimer = null;
        }
    }


    function hideInjectionScreen() {

        stopInjectionAnimation();

        injectionRunning = false;


        if (injectionProgress) {

            injectionProgress.style.width =
                "0%";

            injectionProgress.style.transform =
                "none";
        }


        if (injectionScreen) {

            injectionScreen.classList.remove(
                "active"
            );

            injectionScreen.setAttribute(
                "aria-hidden",
                "true"
            );
        }
    }


    /* =====================================================
       WINDOWS-STYLE OWNERSHIP ERROR
       ===================================================== */

    function showNotSubscribedError() {

        window.alert(
            "Windows cannot complete this operation.\n\n" +
            "You do not have an active subscription for this loader."
        );
    }


    async function startInjection() {

        if (
            injectionRunning
        ) {
            return;
        }


        const owned =
            await ownsSelectedSubscription();


        if (!owned) {

            showNotSubscribedError();

            return;
        }


        const selectedOption =
            getSelectedOption();


        if (injectionTitle) {

            injectionTitle.textContent =
                `Injecting ${selectedOption}`;
        }


        if (injectionProgress) {

            injectionProgress.style.width =
                "0%";

            injectionProgress.style.transform =
                "none";
        }


        if (injectionScreen) {

            injectionScreen.classList.add(
                "active"
            );

            injectionScreen.setAttribute(
                "aria-hidden",
                "false"
            );
        }


        injectionRunning = true;


        stopInjectionAnimation();


        const duration =
            10500 +
            Math.floor(
                Math.random() * 1200
            );


        const started =
            performance.now();


        const phaseA =
            0.17 +
            Math.random() * 0.035;

        const phaseB =
            0.57 +
            Math.random() * 0.06;

        const phaseC =
            0.86 +
            Math.random() * 0.035;


        function progressCurve(value) {

            if (value <= phaseA) {

                const local =
                    value / phaseA;

                return (
                    local *
                    local *
                    phaseA
                );
            }


            if (value <= phaseB) {

                const local =
                    (value - phaseA) /
                    (phaseB - phaseA);

                const eased =
                    local *
                    (2 - local);

                return (
                    phaseA +
                    eased *
                    (phaseB - phaseA)
                );
            }


            if (value <= phaseC) {

                const local =
                    (value - phaseB) /
                    (phaseC - phaseB);

                const eased =
                    1 -
                    Math.pow(
                        1 - local,
                        1.35
                    );

                return (
                    phaseB +
                    eased *
                    (phaseC - phaseB)
                );
            }


            const local =
                (value - phaseC) /
                (1 - phaseC);

            const eased =
                1 -
                Math.pow(
                    1 - local,
                    1.7
                );

            return (
                phaseC +
                eased *
                (1 - phaseC)
            );
        }


        function tick(now) {

            if (
                !injectionRunning
            ) {
                return;
            }


            const elapsed =
                now - started;


            const rawProgress =
                Math.min(
                    elapsed / duration,
                    1
                );


            const curved =
                progressCurve(
                    rawProgress
                );


            const microVariation =
                rawProgress < 0.985
                    ? Math.sin(
                        rawProgress *
                        Math.PI *
                        7
                    ) *
                    0.0018
                    : 0;


            const progress =
                Math.max(
                    0,
                    Math.min(
                        1,
                        curved +
                        microVariation
                    )
                );


            if (injectionProgress) {

                injectionProgress.style.width =
                    `${progress * 100}%`;
            }


            if (
                rawProgress < 1
            ) {

                injectionAnimation =
                    requestAnimationFrame(
                        tick
                    );

                return;
            }


            injectionAnimation = null;


            injectionTimer =
                window.setTimeout(
                    () => {

                        injectionRunning =
                            false;

                        if (
                            injectionProgress
                        ) {

                            injectionProgress.style.width =
                                "100%";
                        }

                    },
                    80
                );
        }


        injectionAnimation =
            requestAnimationFrame(
                tick
            );
    }


    /* =====================================================
       INJECT / CANCEL
       ===================================================== */

    injectButton?.addEventListener(
        "click",
        startInjection
    );


    cancelInjection?.addEventListener(
        "click",
        hideInjectionScreen
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


    /* =====================================================
       INITIAL SUBSCRIPTION SYNC
       ===================================================== */

    syncSubscriptions();


    window.setInterval(
        syncSubscriptions,
        3000
    );

})();

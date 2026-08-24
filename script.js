/* =========================================================
   LOADER UI
   ========================================================= */

(() => {

    "use strict";


    /* =====================================================
       CONFIGURATION
       ===================================================== */

    /*
        This is the backend API, NOT the GitHub repository.

        Your mock website/backend should expose:

            GET /api/me/subscriptions

        and return:

            {
                "loggedIn": true,
                "subscriptions": [
                    "Primordial:CS:GO"
                ]
            }

        The desktop loader can authenticate using its normal
        session/cookie mechanism. No subscription ownership is
        stored in localStorage.
    */

    const SUBSCRIPTION_API =
        "http://localhost:3000/api/me/subscriptions";


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
       SUBSCRIPTION STATE
       ===================================================== */

    let ownedSubscriptions =
        new Set();

    let subscriptionStateLoaded =
        false;


    function normalizeSubscriptionKey(value) {

        return String(value || "")
            .trim()
            .toLowerCase();
    }


    function cardSubscriptionKey(card) {

        return normalizeSubscriptionKey(
            card?.dataset.subscriptionKey
        );
    }


    function setCardSubscriptionState(
        card,
        subscribed
    ) {

        const subscription =
            card.querySelector(
                ".subscription"
            );


        if (!subscription) {
            return;
        }


        subscription.classList.toggle(
            "subscribed",
            subscribed
        );


        subscription.textContent =
            subscribed
                ? "Subscribed"
                : "Not subscribed";
    }


    function renderSubscriptionState() {

        gameCards.forEach(
            card => {

                const key =
                    cardSubscriptionKey(card);


                setCardSubscriptionState(
                    card,
                    ownedSubscriptions.has(key)
                );

            }
        );
    }


    /* =====================================================
       BACKEND SUBSCRIPTION CHECK
       ===================================================== */

    async function loadSubscriptions() {

        /*
            Reset first so stale ownership is never retained.
        */

        ownedSubscriptions =
            new Set();

        subscriptionStateLoaded =
            false;

        renderSubscriptionState();


        try {

            const response =
                await fetch(
                    SUBSCRIPTION_API,
                    {
                        method: "GET",

                        credentials: "include",

                        cache: "no-store",

                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            if (!response.ok) {
                throw new Error(
                    `Subscription API returned ${response.status}`
                );
            }


            const data =
                await response.json();


            if (
                !data ||
                data.loggedIn !== true
            ) {

                renderSubscriptionState();

                return;
            }


            const subscriptions =
                Array.isArray(
                    data.subscriptions
                )
                    ? data.subscriptions
                    : [];


            subscriptions.forEach(
                subscription => {

                    if (
                        typeof subscription ===
                        "string"
                    ) {

                        ownedSubscriptions.add(
                            normalizeSubscriptionKey(
                                subscription
                            )
                        );

                        return;
                    }


                    /*
                        Also supports:

                        {
                            "name": "Primordial",
                            "game": "CS:GO"
                        }
                    */

                    if (
                        subscription &&
                        typeof subscription ===
                        "object"
                    ) {

                        const name =
                            subscription.name;

                        const game =
                            subscription.game;


                        if (
                            name &&
                            game
                        ) {

                            ownedSubscriptions.add(
                                normalizeSubscriptionKey(
                                    `${name}:${game}`
                                )
                            );
                        }
                    }

                }
            );


            subscriptionStateLoaded =
                true;


            renderSubscriptionState();

        } catch (error) {

            /*
                Fail closed.

                If the backend cannot be reached,
                nothing is considered subscribed.
            */

            ownedSubscriptions =
                new Set();

            subscriptionStateLoaded =
                false;

            renderSubscriptionState();

            console.error(
                "Unable to load subscription state:",
                error
            );
        }
    }


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


    function getSelectedSubscriptionKey() {

        const card =
            getSelectedCard();


        if (!card) {
            return "";
        }


        return cardSubscriptionKey(
            card
        );
    }


    /* =====================================================
       SUBSCRIPTION OWNERSHIP
       ===================================================== */

    function ownsSelectedOption() {

        const key =
            getSelectedSubscriptionKey();


        if (!key) {
            return false;
        }


        return ownedSubscriptions.has(
            key
        );
    }


    /* =====================================================
       WINDOWS-STYLE OWNERSHIP ERROR
       ===================================================== */

    function showNotSubscribedError() {

        /*
            The loader does not silently proceed when the
            account doesn't own the selected option.

            The native desktop host can replace this message
            with its own native MessageBox if desired.
        */

        const sent =
            sendWindowMessage({
                type:
                    "subscription.required",

                title:
                    "Loader",

                message:
                    "You are not subscribed to this option."
            });


        if (sent) {
            return;
        }


        window.alert(
            "You are not subscribed to this option."
        );
    }


    /* =====================================================
       INJECTION ANIMATION
       ===================================================== */

    let injectionAnimation =
        null;

    let injectionTimer =
        null;

    let injectionRunning =
        false;


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


    function startInjection() {

        if (
            injectionRunning
        ) {
            return;
        }


        /*
            Fail closed until the backend has supplied
            an ownership result.
        */

        if (
            !subscriptionStateLoaded ||
            !ownsSelectedOption()
        ) {

            showNotSubscribedError();

            return;
        }


        const selectedOption =
            getSelectedOption();


        const selectedKey =
            getSelectedSubscriptionKey();


        /*
            Notify the native host that an owned option
            was selected for injection.

            This does NOT contain an actual DLL/manual-map/
            process-injection implementation.
        */

        sendWindowMessage({
            type:
                "loader.inject",

            option:
                selectedOption,

            subscription:
                selectedKey
        });


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


            injectionAnimation =
                null;


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


    /*
        Load ownership from the backend when the loader
        starts.

        Nothing is persisted in localStorage.
    */

    loadSubscriptions();


    /*
        Refresh periodically so a subscription purchased
        through the website can appear in the loader without
        requiring the loader UI to be redesigned/restarted.
    */

    window.setInterval(
        loadSubscriptions,
        30000
    );


})();

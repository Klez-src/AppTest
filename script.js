(() => {

    "use strict";


    /* =====================================================
       CONFIG
       ===================================================== */

    /*
        Your local website.

        The loader itself is hosted from GitHub, but the
        account/subscription API is running locally.
    */

    const API_BASE =
        "http://localhost:3000";


    /*
        The C++ loader can provide the account token through
        the query string:

            ?token=YOUR_TOKEN

        Example:

            index.html?token=abc123
    */

    const params =
        new URLSearchParams(
            window.location.search
        );

    let authToken =
        params.get("token");


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

    const injectionScreen =
        document.getElementById("injectionScreen");

    const injectionTitle =
        document.getElementById("injectionTitle");

    const injectionProgress =
        document.getElementById("injectionProgress");

    const cancelInjection =
        document.getElementById("cancelInjection");


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
       API
       ===================================================== */

    async function api(path, options = {}) {

        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };


        if (authToken) {

            headers.Authorization =
                `Bearer ${authToken}`;
        }


        const response =
            await fetch(
                `${API_BASE}${path}`,
                {
                    ...options,
                    headers
                }
            );


        let data = {};


        try {

            data =
                await response.json();

        } catch (_) {}


        if (!response.ok) {

            throw new Error(
                data.error ||
                `Request failed (${response.status})`
            );
        }


        return data;
    }


    /* =====================================================
       SUBSCRIPTIONS
       ===================================================== */

    let subscriptions =
        new Set();


    async function loadSubscriptions() {

        if (!authToken) {

            updateSubscriptionUI();

            return;
        }


        try {

            const data =
                await api("/api/me");


            subscriptions =
                new Set(
                    Array.isArray(
                        data.user.subscriptions
                    )
                        ? data.user.subscriptions
                        : []
                );


            updateSubscriptionUI();

        } catch (_) {

            /*
                Invalid/expired token.

                Do not treat the user as subscribed.
            */

            subscriptions =
                new Set();

            updateSubscriptionUI();
        }
    }


    function updateSubscriptionUI() {

        gameCards.forEach(card => {

            const productId =
                card.dataset.productId;

            const subscription =
                card.querySelector(
                    ".subscription"
                );


            if (!subscription) {
                return;
            }


            const subscribed =
                subscriptions.has(
                    productId
                );


            subscription.textContent =
                subscribed
                    ? "Subscribed"
                    : "Not subscribed";


            subscription.classList.toggle(
                "subscribed",
                subscribed
            );

        });
    }


    function ownsSelectedCard() {

        const card =
            getSelectedCard();


        if (!card) {
            return false;
        }


        return subscriptions.has(
            card.dataset.productId
        );
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


    document
        .querySelector(".topbar")
        ?.addEventListener(
            "mousedown",
            beginWindowDrag
        );


    document
        .querySelector(".topbar-drag-area")
        ?.addEventListener(
            "mousedown",
            beginWindowDrag
        );


    /* =====================================================
       GAME TABS
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
       SELECTED CARD
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
            "Primordial"
        );
    }


    /* =====================================================
       INJECTION
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


    function showOwnershipError() {

        /*
            Native-style browser alert is intentional here.
            The actual native Windows MessageBox is handled
            by C++ if the bridge receives this message.
        */

        const sent =
            sendWindowMessage(
                "subscription.required"
            );


        if (!sent) {

            window.alert(
                "Windows cannot complete this operation.\n\n" +
                "You are not subscribed to this option."
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
            IMPORTANT:

            Subscription is checked locally against the
            server-provided account state before anything
            can be started.
        */

        if (!ownsSelectedCard()) {

            showOwnershipError();

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


            /*
                Tell C++ that the subscribed mock action
                completed.
            */

            sendWindowMessage({
                type: "loader.complete",
                product: getSelectedCard()?.dataset.productId,
                option: selectedOption
            });


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
        Load the account's subscriptions from the backend.
    */

    loadSubscriptions();


    /*
        Refresh periodically so a subscription purchased/
        removed on the website appears in the loader.
    */

    window.setInterval(
        loadSubscriptions,
        5000
    );

})();

(() => {
    "use strict";

    const LOADER_API =
        "http://127.0.0.1:3000";

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
       LOADER TOKEN
       ===================================================== */

    let loaderToken = null;

    let rememberedToken = null;

    try {
        rememberedToken =
            window.localStorage.getItem(
                "loaderToken"
            );
    } catch {
        rememberedToken = null;
    }


    if (rememberedToken) {
        loaderToken = rememberedToken;
    }


    /*
     * The loader token can also be supplied by
     * the native host through window.loaderToken.
     */

    if (
        !loaderToken &&
        typeof window.loaderToken === "string" &&
        window.loaderToken.trim()
    ) {
        loaderToken =
            window.loaderToken.trim();
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
        if (event.button !== 0) {
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
       SUBSCRIPTION API
       ===================================================== */

    async function getLoaderAccount() {
        if (!loaderToken) {
            throw new Error(
                "No loader token has been configured."
            );
        }

        const response =
            await fetch(
                `${LOADER_API}/api/loader/account`,
                {
                    method: "GET",

                    headers: {
                        "X-Loader-Token":
                            loaderToken
                    }
                }
            );

        let data = {};

        try {
            data =
                await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Unable to authenticate loader."
            );
        }

        return data;
    }


    function applySubscriptions(
        subscriptions
    ) {
        const owned =
            new Set(
                Array.isArray(
                    subscriptions
                )
                    ? subscriptions
                    : []
            );

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
                owned.has(productId);

            subscription.classList.toggle(
                "subscribed",
                subscribed
            );

            subscription.classList.toggle(
                "not-subscribed",
                !subscribed
            );

            subscription.textContent =
                subscribed
                    ? "Subscribed"
                    : "Not subscribed";
        });
    }


    async function refreshSubscriptions() {
        try {
            const account =
                await getLoaderAccount();

            applySubscriptions(
                account.subscriptions
            );

            return true;
        } catch (error) {
            console.error(
                "Loader authentication failed:",
                error
            );

            applySubscriptions([]);

            return false;
        }
    }


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
        gameCards.forEach(card => {
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
        });

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


    gameTabs.forEach(tab => {
        tab.addEventListener(
            "click",
            () => {
                const game =
                    tab.dataset.game;

                setActiveTab(tab);
                updateGames(game);
            }
        );
    });


    /* =====================================================
       CARD SELECTION
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


    gameCards.forEach(card => {
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
    });


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

        return Array.from(
            gameCards
        ).find(
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
            return null;
        }

        return {
            name:
                card.dataset.option ||
                "Unknown",

            productId:
                card.dataset.productId ||
                ""
        };
    }


    function selectedCardIsSubscribed() {
        const card =
            getSelectedCard();

        if (!card) {
            return false;
        }

        const subscription =
            card.querySelector(
                ".subscription"
            );

        return Boolean(
            subscription &&
            subscription.classList.contains(
                "subscribed"
            )
        );
    }


    /* =====================================================
       DEMO ACTION
       ===================================================== */

    let injectionRunning = false;

    let injectionAnimation = null;

    let injectionTimer = null;


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
        }

        injectionScreen?.classList.remove(
            "active"
        );

        injectionScreen?.setAttribute(
            "aria-hidden",
            "true"
        );
    }


    function startDemoAction() {
        if (injectionRunning) {
            return;
        }

        /*
         * Re-check the backend immediately before
         * allowing the demo action.
         */

        refreshSubscriptions()
            .then(isAuthenticated => {
                if (!isAuthenticated) {
                    window.alert(
                        "Unable to authenticate this loader."
                    );

                    return;
                }

                if (
                    !selectedCardIsSubscribed()
                ) {
                    window.alert(
                        "Windows-style error:\n\nYou are not subscribed to this option."
                    );

                    return;
                }

                const selected =
                    getSelectedOption();

                if (!selected) {
                    return;
                }

                injectionTitle.textContent =
                    `Loading ${selected.name}`;

                injectionProgress.style.width =
                    "0%";

                injectionScreen.classList.add(
                    "active"
                );

                injectionScreen.setAttribute(
                    "aria-hidden",
                    "false"
                );

                injectionRunning = true;

                const started =
                    performance.now();

                const duration = 3000;

                function tick(now) {
                    if (!injectionRunning) {
                        return;
                    }

                    const progress =
                        Math.min(
                            (now - started) /
                            duration,
                            1
                        );

                    injectionProgress.style.width =
                        `${progress * 100}%`;

                    if (progress < 1) {
                        injectionAnimation =
                            requestAnimationFrame(
                                tick
                            );
                    } else {
                        injectionRunning =
                            false;

                        injectionTimer =
                            setTimeout(
                                () => {
                                    hideInjectionScreen();
                                },
                                250
                            );
                    }
                }

                injectionAnimation =
                    requestAnimationFrame(
                        tick
                    );
            });
    }


    injectButton?.addEventListener(
        "click",
        startDemoAction
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
     * Authenticate every time the loader starts.
     */

    refreshSubscriptions();

})();

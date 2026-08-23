"use strict";


/* ============================================================
   ASSET / PRODUCT DATA
   ============================================================ */

const PRODUCTS = {
    primordialCsGo: {
        id: "primordial-csgo",
        name: "Primordial",
        game: "CS:GO",
        logo: "./primordial.png"
    },

    gamesenseCsGo: {
        id: "gamesense-csgo",
        name: "Gamesense",
        game: "CS:GO",
        logo: "./gamesense.png"
    },

    primordialCs2: {
        id: "primordial-cs2",
        name: "Primordial",
        game: "CS:2",
        logo: "./primordial.png"
    }
};


/*
    IMPORTANT:

    All games:
        Primordial CS:GO
        Gamesense CS:GO
        Primordial CS:2

    CS:GO:
        Primordial CS:GO
        Gamesense CS:GO

    CS:2:
        Primordial CS:2
*/

const GAME_LISTS = {
    all: [
        PRODUCTS.primordialCsGo,
        PRODUCTS.gamesenseCsGo,
        PRODUCTS.primordialCs2
    ],

    csgo: [
        PRODUCTS.primordialCsGo,
        PRODUCTS.gamesenseCsGo
    ],

    cs2: [
        PRODUCTS.primordialCs2
    ]
};


/* ============================================================
   STATE
   ============================================================ */

let selectedGame = "all";

let selectedProduct =
    "primordial-csgo";

let launchTimer = null;

let launchRunning = false;


/* ============================================================
   ELEMENTS
   ============================================================ */

const products =
    document.getElementById("products");

const gameFilters =
    document.querySelectorAll(".game-filter");

const injectButton =
    document.getElementById("injectButton");

const launchScreen =
    document.getElementById("launchScreen");

const launchOption =
    document.getElementById("launchOption");

const launchProgress =
    document.getElementById("launchProgress");

const cancelLaunchButton =
    document.getElementById("cancelLaunch");

const minimizeButton =
    document.getElementById("minimizeButton");

const closeButton =
    document.getElementById("closeButton");


/* ============================================================
   NATIVE MESSAGES
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
        // Normal browser fallback.
    }
}


/* ============================================================
   GAME FILTERS
   ============================================================ */

function setGame(game)
{
    selectedGame = game;

    /*
        Keep the currently selected product when it still exists
        in the selected game category.
    */

    const available =
        GAME_LISTS[game];

    const stillAvailable =
        available.some(
            product =>
                product.id === selectedProduct
        );

    if (!stillAvailable)
    {
        selectedProduct =
            available[0].id;
    }

    gameFilters.forEach(button =>
    {
        button.classList.toggle(
            "active",
            button.dataset.game === game
        );
    });

    renderProducts();
}


gameFilters.forEach(button =>
{
    button.addEventListener(
        "click",
        event =>
        {
            event.stopPropagation();

            setGame(
                button.dataset.game
            );
        }
    );
});


/* ============================================================
   PRODUCT RENDERING
   ============================================================ */

function renderProducts()
{
    products.innerHTML = "";

    const list =
        GAME_LISTS[selectedGame];

    list.forEach(product =>
    {
        const card =
            document.createElement("article");

        card.className =
            "product-card";

        card.dataset.product =
            product.id;

        if (
            product.id ===
            selectedProduct
        )
        {
            card.classList.add(
                "selected"
            );
        }


        const logoWrap =
            document.createElement("div");

        logoWrap.className =
            "product-logo-wrap";


        const logo =
            document.createElement("img");

        logo.className =
            "product-logo";

        logo.classList.add(
            product.name
                .toLowerCase()
        );

        logo.src =
            product.logo;

        logo.alt =
            product.name;


        logoWrap.appendChild(
            logo
        );


        const info =
            document.createElement("div");

        info.className =
            "product-info";


        const name =
            document.createElement("div");

        name.className =
            "product-name";

        name.textContent =
            product.name;


        /*
            Deliberately no game text here.

            The previous version duplicated CS:GO/CS:2 under
            the product name. The game belongs only on the
            right-side option button.
        */

        info.appendChild(
            name
        );


        const actions =
            document.createElement("div");

        actions.className =
            "product-actions";


        const subscription =
            document.createElement("div");

        subscription.className =
            "subscription";

        subscription.textContent =
            "Not subscribed";


        const option =
            document.createElement("button");

        option.className =
            "game-option";

        option.textContent =
            product.game;

        option.dataset.product =
            product.id;

        if (
            product.id ===
            selectedProduct
        )
        {
            option.classList.add(
                "active"
            );
        }


        option.addEventListener(
            "click",
            event =>
            {
                event.stopPropagation();

                selectProduct(
                    product.id
                );
            }
        );


        actions.appendChild(
            subscription
        );

        actions.appendChild(
            option
        );


        card.appendChild(
            logoWrap
        );

        card.appendChild(
            info
        );

        card.appendChild(
            actions
        );


        card.addEventListener(
            "click",
            event =>
            {
                event.stopPropagation();

                selectProduct(
                    product.id
                );
            }
        );


        products.appendChild(
            card
        );
    });
}


/* ============================================================
   PRODUCT SELECTION
   ============================================================ */

function selectProduct(productId)
{
    selectedProduct =
        productId;

    document
        .querySelectorAll(
            ".product-card"
        )
        .forEach(card =>
        {
            const selected =
                card.dataset.product ===
                productId;

            card.classList.toggle(
                "selected",
                selected
            );

            const option =
                card.querySelector(
                    ".game-option"
                );

            if (option)
            {
                option.classList.toggle(
                    "active",
                    selected
                );
            }
        });
}


/* ============================================================
   INJECT
   ============================================================ */

function getSelectedProduct()
{
    for (
        const key of Object.keys(PRODUCTS)
    )
    {
        if (
            PRODUCTS[key].id ===
            selectedProduct
        )
        {
            return PRODUCTS[key];
        }
    }

    return PRODUCTS.primordialCsGo;
}


function startLaunch()
{
    if (launchRunning)
        return;

    launchRunning = true;

    const product =
        getSelectedProduct();

    launchOption.textContent =
        product.name +
        " " +
        product.game;

    launchProgress.style.width =
        "0%";

    launchScreen.classList.add(
        "visible"
    );


    /*
        Roughly 11 seconds.

        Slightly varied every run so it doesn't look like a
        fixed scripted duration.
    */

    const duration =
        10300 +
        Math.random() * 1400;

    const startTime =
        performance.now();


    launchTimer =
        requestAnimationFrame(
            function tick(now)
            {
                if (!launchRunning)
                    return;

                const elapsed =
                    now -
                    startTime;

                const linear =
                    Math.min(
                        elapsed / duration,
                        1
                    );


                /*
                    Deliberately not perfectly linear.

                    Small changes in velocity make the bar feel
                    more like an actual process rather than a
                    CSS animation.
                */

                let progress;

                if (linear < .12)
                {
                    progress =
                        linear * .72;
                }
                else if (linear < .82)
                {
                    progress =
                        .0864 +
                        (
                            linear -
                            .12
                        ) * 1.03;
                }
                else
                {
                    progress =
                        .8085 +
                        (
                            linear -
                            .82
                        ) * .94;
                }


                progress =
                    Math.min(
                        progress,
                        1
                    );


                launchProgress.style.width =
                    `${progress * 100}%`;


                if (
                    linear >= 1
                )
                {
                    launchProgress.style.width =
                        "100%";

                    setTimeout(
                        finishLaunch,
                        250
                    );

                    return;
                }


                launchTimer =
                    requestAnimationFrame(
                        tick
                    );
            }
        );
}


function finishLaunch()
{
    launchRunning =
        false;

    launchTimer =
        null;

    launchScreen.classList.remove(
        "visible"
    );
}


function cancelLaunch()
{
    launchRunning =
        false;

    if (launchTimer)
    {
        cancelAnimationFrame(
            launchTimer
        );
    }

    launchTimer =
        null;

    launchProgress.style.width =
        "0%";

    launchScreen.classList.remove(
        "visible"
    );
}


injectButton.addEventListener(
    "click",
    event =>
    {
        event.stopPropagation();

        startLaunch();
    }
);


cancelLaunchButton.addEventListener(
    "click",
    event =>
    {
        event.stopPropagation();

        cancelLaunch();
    }
);


/* ============================================================
   WINDOW CONTROLS
   ============================================================ */

minimizeButton.addEventListener(
    "click",
    event =>
    {
        event.stopPropagation();

        sendNativeMessage(
            "window.minimize"
        );
    }
);


closeButton.addEventListener(
    "click",
    event =>
    {
        event.stopPropagation();

        sendNativeMessage(
            "window.close"
        );
    }
);


/* ============================================================
   STARTUP
   ============================================================ */

renderProducts();


/*
    Make the initial state exactly:

        All games
        Primordial CS:GO selected
*/

setGame("all");

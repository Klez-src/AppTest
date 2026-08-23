/* =========================================================
   ORRO
   ========================================================= */


/* =========================================================
   NATIVE WEBVIEW BRIDGE
   ========================================================= */

function nativeMessage(message) {

    if (
        window.chrome &&
        window.chrome.webview
    ) {
        window.chrome.webview.postMessage(message);
    }
}


/* =========================================================
   PRODUCT DEFINITIONS
   ========================================================= */

/*
    IMPORTANT:

    These are the ONLY three products.

    CS:GO:
        Primordial
        Gamesense

    CS:2:
        Primordial

    There is intentionally NO Gamesense CS:2.
*/

const PRODUCTS = [

    {
        id: "primordial-csgo",
        name: "Primordial",
        game: "csgo",
        gameLabel: "CS:GO",
        image: "primordial.png"
    },

    {
        id: "gamesense-csgo",
        name: "Gamesense",
        game: "csgo",
        gameLabel: "CS:GO",
        image: "gamesense.png"
    },

    {
        id: "primordial-cs2",
        name: "Primordial",
        game: "cs2",
        gameLabel: "CS:2",
        image: "primordial.png"
    }

];


/* =========================================================
   STATE
   ========================================================= */

let selectedGame = "all";

let selectedProduct = null;

let launchRunning = false;

let launchAnimationFrame = null;

let launchStartTime = 0;

let launchDuration = 11000;


/* =========================================================
   ELEMENTS
   ========================================================= */

const productList =
    document.getElementById("productList");

const gameTabs =
    document.querySelectorAll(".game-tab");

const injectButton =
    document.getElementById("injectButton");

const launchingScreen =
    document.getElementById("launching-screen");

const launchingTitle =
    document.getElementById("launching-title");

const launchingOption =
    document.getElementById("launching-option");

const launchingProgress =
    document.getElementById("launching-progress-fill");

const launchingCancel =
    document.getElementById("launching-cancel");

const closeButton =
    document.getElementById("closeButton");

const minimizeButton =
    document.getElementById("minimizeButton");


/* =========================================================
   FILTER PRODUCTS
   ========================================================= */

function getVisibleProducts() {

    if (selectedGame === "all") {

        return PRODUCTS;

    }

    return PRODUCTS.filter(
        product =>
            product.game === selectedGame
    );
}


/* =========================================================
   RENDER PRODUCTS
   ========================================================= */

function renderProducts() {

    productList.innerHTML = "";

    const products =
        getVisibleProducts();

    /*
        If the previously selected product
        isn't available in this game tab,
        clear it.
    */

    if (
        selectedProduct &&
        !products.some(
            product =>
                product.id === selectedProduct.id
        )
    ) {
        selectedProduct = null;
    }


    products.forEach(
        product => {

            const card =
                document.createElement("button");

            card.type = "button";

            card.className =
                "product-card";

            if (
                selectedProduct &&
                selectedProduct.id === product.id
            ) {
                card.classList.add(
                    "selected"
                );
            }


            /*
                Entire card is clickable.
            */

            card.addEventListener(
                "click",
                () => {

                    selectProduct(product);

                }
            );


            const icon =
                document.createElement("div");

            icon.className =
                "product-icon";


            const image =
                document.createElement("img");

            image.src =
                product.image;

            image.alt =
                "";


            /*
                Keep both supplied game logos
                exactly the same physical size.
            */

            icon.appendChild(image);


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


            const game =
                document.createElement("div");

            game.className =
                "product-game";

            game.textContent =
                product.gameLabel;


            info.appendChild(name);
            info.appendChild(game);


            const meta =
                document.createElement("div");

            meta.className =
                "product-meta";


            const subscription =
                document.createElement("div");

            subscription.className =
                "subscription";

            subscription.textContent =
                "Not subscribed";


            const gameChip =
                document.createElement("div");

            gameChip.className =
                "game-chip";

            gameChip.textContent =
                product.gameLabel;


            meta.appendChild(
                subscription
            );

            meta.appendChild(
                gameChip
            );


            card.appendChild(icon);
            card.appendChild(info);
            card.appendChild(meta);


            productList.appendChild(card);

        }
    );

}


/* =========================================================
   SELECT PRODUCT
   ========================================================= */

function selectProduct(product) {

    selectedProduct =
        product;


    document
        .querySelectorAll(".product-card")
        .forEach(
            card => {

                card.classList.remove(
                    "selected"
                );

            }
        );


    /*
        Match by product ID rather than
        name/game text.

        This prevents Primordial CS:GO
        and Primordial CS:2 from being
        treated as the same selection.
    */

    const cards =
        document.querySelectorAll(
            ".product-card"
        );

    const visible =
        getVisibleProducts();

    visible.forEach(
        (item, index) => {

            if (
                item.id === product.id &&
                cards[index]
            ) {
                cards[index].classList.add(
                    "selected"
                );
            }

        }
    );

}


/* =========================================================
   GAME TAB SELECTION
   ========================================================= */

gameTabs.forEach(
    tab => {

        tab.addEventListener(
            "click",
            () => {

                selectedGame =
                    tab.dataset.game;


                gameTabs.forEach(
                    other => {

                        other.classList.toggle(
                            "active",
                            other === tab
                        );

                    }
                );


                /*
                    Re-render from the actual
                    product mapping.

                    CS:2 therefore gives:

                    Primordial CS:2

                    and NOTHING else.
                */

                renderProducts();

            }
        );

    }
);


/* =========================================================
   INJECT BUTTON
   ========================================================= */

injectButton.addEventListener(
    "click",
    () => {

        if (
            launchRunning
        ) {
            return;
        }


        /*
            Nothing is selected:
            don't start a fake launch.
        */

        if (
            !selectedProduct
        ) {

            /*
                Select the first visible
                product so the UI has a
                deterministic choice.
            */

            const visible =
                getVisibleProducts();

            if (
                visible.length === 0
            ) {
                return;
            }

            selectProduct(
                visible[0]
            );

        }


        startInjection();

    }
);


/* =========================================================
   START INJECTION
   ========================================================= */

function startInjection() {

    if (
        launchRunning ||
        !selectedProduct
    ) {
        return;
    }


    launchRunning = true;


    /*
        Around 11 seconds.

        Small variation keeps it from
        finishing at exactly the same
        millisecond every time.
    */

    launchDuration =
        10800 +
        Math.random() * 600;


    launchStartTime =
        performance.now();


    launchingTitle.textContent =
        "Injecting";


    launchingOption.textContent =
        selectedProduct.name +
        " · " +
        selectedProduct.gameLabel;


    launchingProgress.style.width =
        "0%";


    launchingScreen.classList.add(
        "active"
    );


    /*
        Use requestAnimationFrame rather
        than chunky setTimeout stages.

        This makes the bar continuous
        without making it look artificially
        perfectly linear.
    */

    launchAnimationFrame =
        requestAnimationFrame(
            updateInjection
        );

}


/* =========================================================
   REALISTIC PROGRESS
   ========================================================= */

function updateInjection(
    now
) {

    if (
        !launchRunning
    ) {
        return;
    }


    const elapsed =
        now -
        launchStartTime;


    let progress =
        elapsed /
        launchDuration;


    if (
        progress >= 1
    ) {

        launchingProgress.style.width =
            "100%";


        finishInjection();

        return;

    }


    /*
        Slightly irregular but restrained
        progression.

        It never jumps backwards.
        It doesn't use visible percentages.
    */

    const eased =
        1 -
        Math.pow(
            1 - progress,
            1.45
        );


    launchingProgress.style.width =
        (eased * 100).toFixed(3) +
        "%";


    launchAnimationFrame =
        requestAnimationFrame(
            updateInjection
        );

}


/* =========================================================
   FINISH
   ========================================================= */

function finishInjection() {

    launchRunning =
        false;


    if (
        launchAnimationFrame !== null
    ) {

        cancelAnimationFrame(
            launchAnimationFrame
        );

        launchAnimationFrame =
            null;

    }


    launchingProgress.style.width =
        "100%";


    /*
        Keep the screen visible very briefly
        instead of snapping away immediately.
    */

    setTimeout(
        () => {

            launchingScreen.classList.remove(
                "active"
            );


            launchingProgress.style.width =
                "0%";

        },
        350
    );

}


/* =========================================================
   CANCEL
   ========================================================= */

launchingCancel.addEventListener(
    "click",
    () => {

        cancelInjection();

    }
);


function cancelInjection() {

    if (
        !launchRunning
    ) {
        return;
    }


    launchRunning =
        false;


    if (
        launchAnimationFrame !== null
    ) {

        cancelAnimationFrame(
            launchAnimationFrame
        );

        launchAnimationFrame =
            null;

    }


    launchingScreen.classList.remove(
        "active"
    );


    launchingProgress.style.width =
        "0%";

}


/* =========================================================
   CLOSE
   ========================================================= */

closeButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        nativeMessage(
            "window.close"
        );

    }
);


/* =========================================================
   MINIMIZE
   ========================================================= */

minimizeButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        nativeMessage(
            "window.minimize"
        );

    }
);


/* =========================================================
   WINDOW DRAGGING
   ========================================================= */

/*
    Only the actual top bar is sent to C++ here.

    This avoids the cursor becoming a hand and
    prevents buttons/cards from accidentally
    starting a drag.
*/

const windowDragSpace =
    document.querySelector(
        ".window-drag-space"
    );


windowDragSpace.addEventListener(
    "pointerdown",
    event => {

        if (
            event.button !== 0
        ) {
            return;
        }


        nativeMessage(
            "window.drag"
        );

    }
);


/* =========================================================
   PREVENT TEXT DRAGGING
   ========================================================= */

document.addEventListener(
    "dragstart",
    event => {

        event.preventDefault();

    }
);


/* =========================================================
   INITIAL RENDER
   ========================================================= */

renderProducts();

/* =========================================================
   WINDOW CONTROLS
   ========================================================= */

function sendWindowMessage(message) {
    try {
        if (
            window.chrome &&
            window.chrome.webview
        ) {
            window.chrome.webview.postMessage(message);
        }
    } catch (_) {
        // Running outside WebView2.
    }
}


function closeWindow() {
    sendWindowMessage("window.close");
}


function minimizeWindow() {
    sendWindowMessage("window.minimize");
}


/* =========================================================
   GAME DATA
   ========================================================= */

const games = {

    all: [
        {
            id: "primordial",
            name: "Primordial",
            logo: "primordial.png",
            game: "CS:GO"
        },

        {
            id: "primordial-2",
            name: "Primordial",
            logo: "primordial.png",
            game: "CS:GO"
        },

        {
            id: "gamesense",
            name: "Gamesense",
            logo: "gamesense.png",
            game: "CS:GO"
        }
    ],


    csgo: [
        {
            id: "primordial",
            name: "Primordial",
            logo: "primordial.png",
            game: "CS:GO"
        },

        {
            id: "primordial-2",
            name: "Primordial",
            logo: "primordial.png",
            game: "CS:GO"
        },

        {
            id: "gamesense",
            name: "Gamesense",
            logo: "gamesense.png",
            game: "CS:GO"
        }
    ],


    cs2: [
        {
            id: "primordial-cs2",
            name: "Primordial",
            logo: "primordial.png",
            game: "CS:2"
        },

        {
            id: "gamesense-cs2",
            name: "Gamesense",
            logo: "gamesense.png",
            game: "CS:2"
        }
    ]
};


/* =========================================================
   STATE
   ========================================================= */

let selectedGame = "csgo";

let selectedOption = null;

let injectionTimer = null;

let injectionStart = 0;

let injectionCancelled = false;


/* =========================================================
   DOM
   ========================================================= */

const optionsElement =
    document.getElementById("options");

const loadingScreen =
    document.getElementById("loadingScreen");

const loadingOption =
    document.getElementById("loadingOption");

const loadingFill =
    document.getElementById("loadingFill");


/* =========================================================
   INITIALISE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        selectGame("csgo");

    }
);


/* =========================================================
   SELECT GAME
   ========================================================= */

function selectGame(game) {

    if (!games[game]) {
        return;
    }

    selectedGame = game;

    document
        .querySelectorAll(".game-option")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.game === game
            );

        });


    renderOptions(
        games[game]
    );
}


/* =========================================================
   RENDER OPTIONS
   ========================================================= */

function renderOptions(options) {

    optionsElement.innerHTML = "";

    if (!options.length) {

        const empty =
            document.createElement("div");

        empty.className =
            "empty-options";

        empty.textContent =
            "No options available.";

        optionsElement.appendChild(
            empty
        );

        selectedOption = null;

        return;
    }


    /*
     * Preserve the currently selected option
     * where possible.
     */

    const existing =
        options.find(
            option =>
                option.id === selectedOption
        );


    selectedOption =
        existing
            ? existing.id
            : options[0].id;


    options.forEach(
        option => {

            const card =
                document.createElement("div");

            card.className =
                "option-card";

            if (
                option.id === selectedOption
            ) {
                card.classList.add(
                    "selected"
                );
            }


            card.dataset.option =
                option.id;


            card.addEventListener(
                "click",
                () => {

                    selectOption(
                        option.id
                    );

                }
            );


            /*
             * Logo
             */

            const logo =
                document.createElement("div");

            logo.className =
                "option-logo";


            const image =
                document.createElement("img");

            image.src =
                option.logo;

            image.alt =
                "";


            logo.appendChild(
                image
            );


            /*
             * Name
             */

            const info =
                document.createElement("div");

            info.className =
                "option-info";


            const name =
                document.createElement("div");

            name.className =
                "option-name";

            name.textContent =
                option.name;


            info.appendChild(
                name
            );


            /*
             * Right side
             */

            const side =
                document.createElement("div");

            side.className =
                "option-side";


            const subscription =
                document.createElement("div");

            subscription.className =
                "subscription";

            subscription.textContent =
                "Not subscribed";


            const gameBadge =
                document.createElement("div");

            gameBadge.className =
                "game-badge";

            gameBadge.textContent =
                option.game;


            side.appendChild(
                subscription
            );

            side.appendChild(
                gameBadge
            );


            /*
             * Assemble
             */

            card.appendChild(
                logo
            );

            card.appendChild(
                info
            );

            card.appendChild(
                side
            );


            optionsElement.appendChild(
                card
            );

        }
    );
}


/* =========================================================
   SELECT OPTION
   ========================================================= */

function selectOption(id) {

    const available =
        games[selectedGame] || [];

    const option =
        available.find(
            item => item.id === id
        );


    if (!option) {
        return;
    }


    selectedOption =
        id;


    document
        .querySelectorAll(".option-card")
        .forEach(card => {

            card.classList.toggle(
                "selected",
                card.dataset.option === id
            );

        });
}


/* =========================================================
   INJECTION
   ========================================================= */

function beginInjection() {

    if (!selectedOption) {
        return;
    }


    const option =
        games[selectedGame]
            ?.find(
                item =>
                    item.id === selectedOption
            );


    if (!option) {
        return;
    }


    /*
     * Fullscreen loading screen.
     */

    loadingOption.textContent =
        option.name;


    loadingFill.style.width =
        "0%";


    loadingScreen.classList.add(
        "visible"
    );


    injectionCancelled =
        false;


    injectionStart =
        performance.now();


    /*
     * Approximately 11 seconds.
     *
     * The progress is intentionally uneven.
     * It advances in small realistic chunks rather
     * than behaving like one perfectly linear CSS
     * animation.
     */

    const duration =
        11000;


    const stages = [
        { time: 0,    progress: 0 },
        { time: 420,  progress: 5 },
        { time: 930,  progress: 11 },
        { time: 1420, progress: 17 },
        { time: 2070, progress: 23 },
        { time: 2630, progress: 29 },
        { time: 3310, progress: 35 },
        { time: 3970, progress: 42 },
        { time: 4520, progress: 47 },
        { time: 5180, progress: 54 },
        { time: 5730, progress: 59 },
        { time: 6390, progress: 64 },
        { time: 7010, progress: 69 },
        { time: 7580, progress: 73 },
        { time: 8170, progress: 78 },
        { time: 8720, progress: 82 },
        { time: 9260, progress: 87 },
        { time: 9780, progress: 91 },
        { time: 10240, progress: 94 },
        { time: 10680, progress: 97 },
        { time: 11000, progress: 100 }
    ];


    let stageIndex = 0;


    function updateStage() {

        if (injectionCancelled) {
            return;
        }


        const elapsed =
            performance.now() -
            injectionStart;


        while (
            stageIndex <
            stages.length &&
            elapsed >=
                stages[stageIndex].time
        ) {

            loadingFill.style.width =
                stages[stageIndex].progress +
                "%";

            stageIndex++;

        }


        if (
            elapsed >= duration
        ) {

            clearInterval(
                injectionTimer
            );

            injectionTimer =
                null;


            /*
             * Leave the bar completed very
             * briefly before returning.
             */

            setTimeout(
                () => {

                    if (
                        !injectionCancelled
                    ) {
                        finishInjection();
                    }

                },
                180
            );

            return;
        }


        injectionTimer =
            requestAnimationFrame(
                updateStage
            );
    }


    injectionTimer =
        requestAnimationFrame(
            updateStage
        );
}


/* =========================================================
   CANCEL
   ========================================================= */

function cancelInjection() {

    injectionCancelled =
        true;


    if (injectionTimer !== null) {

        cancelAnimationFrame(
            injectionTimer
        );

        injectionTimer =
            null;
    }


    loadingFill.style.width =
        "0%";


    loadingScreen.classList.remove(
        "visible"
    );
}


/* =========================================================
   FINISH
   ========================================================= */

function finishInjection() {

    loadingScreen.classList.remove(
        "visible"
    );


    loadingFill.style.width =
        "0%";


    /*
     * Keep the loader UI where it was.
     * Actual injection can be connected here
     * later without changing the interface.
     */
}


/* =========================================================
   PREVENT IMAGE DRAGGING
   ========================================================= */

document.addEventListener(
    "dragstart",
    event => {

        if (
            event.target.tagName ===
            "IMG"
        ) {
            event.preventDefault();
        }

    }
);

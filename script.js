/* =========================================================
   WINDOW CONTROLS
   ========================================================= */

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


function closeWindow() {
    sendWindowMessage(
        "window.close"
    );
}


function minimizeWindow() {
    sendWindowMessage(
        "window.minimize"
    );
}



/* =========================================================
   GAME / OPTION DATA
   ========================================================= */

/*
    All available options:

    Primordial CS:2
    Primordial CS:GO
    Gamesense CS:GO

    Filtering:

    ALL
      ├─ Primordial — CS:2
      ├─ Primordial — CS:GO
      └─ Gamesense — CS:GO

    CS:GO
      ├─ Primordial — CS:GO
      └─ Gamesense — CS:GO

    CS:2
      └─ Primordial — CS:2
*/


const allOptions = [

    {
        id: "primordial-cs2",

        name: "Primordial",

        logo: "primordial.png",

        game: "CS:2"
    },


    {
        id: "primordial-csgo",

        name: "Primordial",

        logo: "primordial.png",

        game: "CS:GO"
    },


    {
        id: "gamesense-csgo",

        name: "Gamesense",

        logo: "gamesense.png",

        game: "CS:GO"
    }

];



/* =========================================================
   STATE
   ========================================================= */

let selectedGame =
    "csgo";


let selectedOption =
    "primordial-csgo";


let injectionTimer =
    null;


let injectionStart =
    0;


let injectionCancelled =
    false;



/* =========================================================
   DOM
   ========================================================= */

const optionsElement =
    document.getElementById(
        "options"
    );


const loadingScreen =
    document.getElementById(
        "loadingScreen"
    );


const loadingOption =
    document.getElementById(
        "loadingOption"
    );


const loadingFill =
    document.getElementById(
        "loadingFill"
    );



/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        selectGame(
            "csgo"
        );

    }
);



/* =========================================================
   GAME FILTERING
   ========================================================= */

function getOptionsForGame(
    game
) {

    if (game === "all") {

        return [
            ...allOptions
        ];

    }


    return allOptions.filter(
        option =>
            option.game ===
            (
                game === "cs2"
                    ? "CS:2"
                    : "CS:GO"
            )
    );
}



/* =========================================================
   SELECT GAME
   ========================================================= */

function selectGame(
    game
) {

    selectedGame =
        game;


    /*
     * Selected game pill.
     */

    document
        .querySelectorAll(
            ".game-option"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.game ===
                    game
                );

            }
        );


    const available =
        getOptionsForGame(
            game
        );


    /*
     * If our previous selection
     * isn't available in this game,
     * automatically choose the first
     * appropriate option.
     */

    const stillAvailable =
        available.some(
            option =>
                option.id ===
                selectedOption
        );


    if (!stillAvailable) {

        selectedOption =
            available.length
                ? available[0].id
                : null;

    }


    renderOptions(
        available
    );
}



/* =========================================================
   RENDER OPTIONS
   ========================================================= */

function renderOptions(
    options
) {

    optionsElement.innerHTML =
        "";


    if (!options.length) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "empty-options";

        empty.textContent =
            "No options available.";

        optionsElement.appendChild(
            empty
        );

        return;
    }


    options.forEach(
        option => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "option-card";


            if (
                option.id ===
                selectedOption
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



            /* -----------------------------
               LOGO
               ----------------------------- */

            const logo =
                document.createElement(
                    "div"
                );

            logo.className =
                "option-logo";


            const image =
                document.createElement(
                    "img"
                );

            image.src =
                option.logo;

            image.alt =
                "";


            logo.appendChild(
                image
            );



            /* -----------------------------
               NAME
               ----------------------------- */

            const info =
                document.createElement(
                    "div"
                );

            info.className =
                "option-info";


            const name =
                document.createElement(
                    "div"
                );

            name.className =
                "option-name";

            name.textContent =
                option.name;


            info.appendChild(
                name
            );



            /* -----------------------------
               RIGHT SIDE
               ----------------------------- */

            const side =
                document.createElement(
                    "div"
                );

            side.className =
                "option-side";


            const subscription =
                document.createElement(
                    "div"
                );

            subscription.className =
                "subscription";

            subscription.textContent =
                "Not subscribed";


            const gameBadge =
                document.createElement(
                    "div"
                );

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



            /* -----------------------------
               BUILD
               ----------------------------- */

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

function selectOption(
    id
) {

    const available =
        getOptionsForGame(
            selectedGame
        );


    const option =
        available.find(
            item =>
                item.id ===
                id
        );


    if (!option) {
        return;
    }


    selectedOption =
        id;


    document
        .querySelectorAll(
            ".option-card"
        )
        .forEach(
            card => {

                card.classList.toggle(
                    "selected",
                    card.dataset.option ===
                    id
                );

            }
        );
}



/* =========================================================
   BEGIN INJECTION
   ========================================================= */

function beginInjection() {

    if (!selectedOption) {
        return;
    }


    const option =
        allOptions.find(
            item =>
                item.id ===
                selectedOption
        );


    if (!option) {
        return;
    }


    loadingOption.textContent =
        option.name +
        " " +
        option.game;


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
     * Roughly 11 seconds.
     * Progress deliberately has small
     * irregular pauses/steps.
     */

    const duration =
        11000;


    const stages = [

        [0, 0],

        [410, 5],

        [870, 10],

        [1370, 16],

        [1950, 22],

        [2490, 27],

        [3180, 34],

        [3750, 40],

        [4390, 46],

        [5030, 52],

        [5630, 58],

        [6260, 63],

        [6900, 68],

        [7470, 73],

        [8110, 78],

        [8660, 82],

        [9240, 87],

        [9740, 91],

        [10280, 95],

        [10720, 98],

        [11000, 100]

    ];


    let stageIndex =
        0;


    function update() {

        if (
            injectionCancelled
        ) {
            return;
        }


        const elapsed =
            performance.now() -
            injectionStart;


        while (
            stageIndex <
            stages.length &&
            elapsed >=
            stages[stageIndex][0]
        ) {

            loadingFill.style.width =
                stages[stageIndex][1] +
                "%";


            stageIndex++;

        }


        if (
            elapsed >=
            duration
        ) {

            injectionTimer =
                null;


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
                update
            );
    }


    injectionTimer =
        requestAnimationFrame(
            update
        );
}



/* =========================================================
   CANCEL
   ========================================================= */

function cancelInjection() {

    injectionCancelled =
        true;


    if (
        injectionTimer !== null
    ) {

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

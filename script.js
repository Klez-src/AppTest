(() => {

    "use strict";


    /* =====================================================
       PAGE NAVIGATION
       ===================================================== */

    const navItems =
        document.querySelectorAll(".nav-item");

    const pages =
        document.querySelectorAll(".page");


    function showPage(name) {

        navItems.forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.page === name
            );

        });


        pages.forEach(page => {

            page.classList.toggle(
                "active",
                page.id === `page-${name}`
            );

        });

    }


    navItems.forEach(item => {

        item.addEventListener("click", () => {

            const page =
                item.dataset.page;

            if (!page)
                return;

            showPage(page);

        });

    });


    /* =====================================================
       SETTINGS TOGGLES
       ===================================================== */

    document
        .querySelectorAll("[data-toggle]")
        .forEach(toggle => {

            toggle.addEventListener(
                "click",
                () => {

                    toggle.classList.toggle("on");

                }
            );

        });


    /* =====================================================
       LAUNCH BUTTON
       ===================================================== */

    document
        .querySelectorAll("[data-launch]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    if (button.dataset.loading)
                        return;


                    button.dataset.loading = "true";

                    const oldText =
                        button.innerHTML;

                    button.innerHTML =
                        "Launching...";

                    button.style.opacity = ".65";


                    setTimeout(() => {

                        button.innerHTML =
                            oldText;

                        button.style.opacity =
                            "1";

                        delete button.dataset.loading;

                    }, 1200);

                }
            );

        });


    /* =====================================================
       CLOSE
       ===================================================== */

    const closeButton =
        document.getElementById("closeButton");


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {

                if (
                    window.chrome &&
                    window.chrome.webview
                ) {

                    window.chrome.webview.postMessage(
                        "window.close"
                    );

                }

            }
        );

    }


    /* =====================================================
       WINDOW DRAG
       ===================================================== */

    const dragArea =
        document.querySelector("[data-drag]");


    if (dragArea) {

        dragArea.addEventListener(
            "mousedown",
            event => {

                if (event.button !== 0)
                    return;


                if (
                    window.chrome &&
                    window.chrome.webview
                ) {

                    window.chrome.webview.postMessage(
                        "window.drag"
                    );

                }

            }
        );

    }


    /* =====================================================
       DISABLE TEXT SELECTION
       ===================================================== */

    document.addEventListener(
        "selectstart",
        event => {

            event.preventDefault();

        }
    );


    document.addEventListener(
        "dragstart",
        event => {

            event.preventDefault();

        }
    );


    /* =====================================================
       DEFAULT PAGE
       ===================================================== */

    showPage("home");

})();

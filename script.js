(() => {

  /* ==================================================
     NAVIGATION
     ================================================== */

  const navButtons =
    document.querySelectorAll(".nav-button");

  const views =
    document.querySelectorAll(".view");


  function showView(id, button) {

    views.forEach(view => {

      view.classList.remove("active");

    });


    const target =
      document.getElementById(id);


    if (target) {

      target.classList.add("active");

    }


    navButtons.forEach(nav => {

      nav.classList.remove("selected");

    });


    if (button) {

      button.classList.add("selected");

    }

  }


  navButtons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        showView(
          button.dataset.view,
          button
        );

      }
    );

  });


  /* ==================================================
     SETTINGS
     ================================================== */

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


  /* ==================================================
     LAUNCH
     ================================================== */

  document
    .querySelectorAll("[data-launch]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const original =
            button.textContent;

          button.textContent =
            "Launching...";

          button.disabled =
            true;

          button.style.opacity =
            ".55";


          setTimeout(() => {

            button.textContent =
              original;

            button.disabled =
              false;

            button.style.opacity =
              "1";

          }, 1400);

        }
      );

    });


  /* ==================================================
     CLOSE WINDOW
     ================================================== */

  const closeButton =
    document.querySelector(
      '[data-window="close"]'
    );


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


  /* ==================================================
     DRAG WINDOW
     ================================================== */

  document
    .querySelectorAll("[data-drag]")
    .forEach(region => {

      region.addEventListener(
        "mousedown",
        event => {

          if (event.button !== 0)
            return;


          if (
            event.target.closest("button")
          )
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

    });


  /* ==================================================
     PREVENT ACCIDENTAL TEXT SELECTION
     ================================================== */

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


})();

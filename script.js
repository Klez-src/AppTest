(function () {

  const nav = document.querySelectorAll(".nav-button");
  const views = document.querySelectorAll(".view");


  /* ==================================================
     NAVIGATION
     ================================================== */

  function showView(id, button) {

    views.forEach(view => {
      view.classList.remove("active");
    });

    const target = document.getElementById(id);

    if (target) {
      target.classList.add("active");
    }

    nav.forEach(item => {
      item.classList.remove("selected");
    });

    if (button) {
      button.classList.add("selected");
    }
  }


  nav.forEach(button => {

    button.addEventListener("click", () => {

      showView(
        button.dataset.view,
        button
      );

    });

  });


  /* ==================================================
     SETTINGS TOGGLES
     ================================================== */

  document
    .querySelectorAll("[data-toggle]")
    .forEach(toggle => {

      toggle.addEventListener("click", () => {

        toggle.classList.toggle("on");

      });

    });


  /* ==================================================
     LAUNCH BUTTON
     ================================================== */

  document
    .querySelectorAll("[data-launch]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const original =
          button.textContent;

        button.textContent =
          "Launching...";

        button.style.opacity =
          ".55";

        button.disabled =
          true;


        setTimeout(() => {

          button.textContent =
            original;

          button.style.opacity =
            "1";

          button.disabled =
            false;

        }, 1400);

      });

    });


  /* ==================================================
     NATIVE WINDOW CONTROLS
     ================================================== */

  document
    .querySelectorAll("[data-window]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const action =
          button.dataset.window;

        if (
          window.chrome &&
          window.chrome.webview
        ) {

          window.chrome.webview.postMessage(
            "window." + action
          );

        }

      });

    });


  /* ==================================================
     WINDOW DRAGGING
     ================================================== */

  document
    .querySelectorAll("[data-drag]")
    .forEach(region => {

      region.addEventListener(
        "mousedown",
        event => {

          if (event.button !== 0) {
            return;
          }

          if (
            event.target.closest("button")
          ) {
            return;
          }

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

})();

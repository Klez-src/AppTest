(() => {

  /*
   * ========================================================
   * TAB NAVIGATION
   * ========================================================
   */

  const tabs = Array.from(
    document.querySelectorAll(".nav-item")
  );

  const views = Array.from(
    document.querySelectorAll(".view")
  );


  function switchTab(viewName) {

    /*
     * Hide every page.
     */

    views.forEach(view => {

      view.classList.remove("active");

    });


    /*
     * Remove active state from every tab.
     */

    tabs.forEach(tab => {

      tab.classList.remove("active");

    });


    /*
     * Find requested page.
     */

    const target =
      document.getElementById(viewName);


    /*
     * Find requested tab.
     */

    const selectedTab =
      tabs.find(
        tab =>
          tab.dataset.view === viewName
      );


    /*
     * Activate them.
     */

    if (target) {

      target.classList.add("active");

    }


    if (selectedTab) {

      selectedTab.classList.add("active");

    }

  }


  /*
   * Attach navigation events.
   */

  tabs.forEach(tab => {

    tab.addEventListener(
      "click",
      event => {

        event.preventDefault();

        event.stopPropagation();

        const view =
          tab.dataset.view;

        if (view) {

          switchTab(view);

        }

      }
    );

  });


  /*
   * ========================================================
   * TOGGLES
   * ========================================================
   */

  document
    .querySelectorAll("[data-toggle]")
    .forEach(toggle => {

      toggle.addEventListener(
        "click",
        event => {

          event.preventDefault();

          toggle.classList.toggle("on");

        }
      );

    });


  /*
   * ========================================================
   * LAUNCH BUTTONS
   * ========================================================
   */

  document
    .querySelectorAll("[data-launch]")
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.preventDefault();

          if (button.disabled)
            return;


          const originalText =
            button.innerHTML;


          button.innerHTML =
            "Launching...";


          button.disabled =
            true;


          button.style.opacity =
            ".55";


          setTimeout(() => {

            button.innerHTML =
              originalText;

            button.disabled =
              false;

            button.style.opacity =
              "1";

          }, 1400);

        }
      );

    });


  /*
   * ========================================================
   * CLOSE
   * ========================================================
   */

  const closeButton =
    document.querySelector(
      '[data-window="close"]'
    );


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      event => {

        event.preventDefault();

        event.stopPropagation();


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


  /*
   * ========================================================
   * WINDOW DRAGGING
   * ========================================================
   */

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


  /*
   * ========================================================
   * PREVENT SELECTION / DRAGGING
   * ========================================================
   */

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


  /*
   * ========================================================
   * START ON HOME
   * ========================================================
   */

  switchTab("home");

})();

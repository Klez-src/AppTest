/* ==================================================
   NAVIGATION
   ================================================== */

function showView(id, button){

    var views =
        document.querySelectorAll(".view");


    for(
        var i = 0;
        i < views.length;
        i++
    ){

        views[i]
            .classList
            .remove("active");

    }


    document
        .getElementById(id)
        .classList
        .add("active");


    var buttons =
        document.querySelectorAll(
            ".nav button"
        );


    for(
        var j = 0;
        j < buttons.length;
        j++
    ){

        buttons[j]
            .classList
            .remove("selected");

    }


    button
        .classList
        .add("selected");

}



/* ==================================================
   SETTINGS
   ================================================== */

function toggle(element){

    element
        .classList
        .toggle("on");

}



/* ==================================================
   LAUNCH SCREEN
   ================================================== */

var launchRunning = false;

var launchDuration = 35000;


var launchPhases = [

    {
        progress:0,
        title:"Preparing",
        status:"Starting launch sequence",
        step:"Initialising"
    },

    {
        progress:.10,
        title:"Preparing",
        status:"Checking local environment",
        step:"Checking environment"
    },

    {
        progress:.22,
        title:"Initialising",
        status:"Preparing orro components",
        step:"Initialising components"
    },

    {
        progress:.36,
        title:"Initialising",
        status:"Loading application data",
        step:"Loading data"
    },

    {
        progress:.50,
        title:"Starting",
        status:"Starting launcher services",
        step:"Starting services"
    },

    {
        progress:.64,
        title:"Starting",
        status:"Preparing session",
        step:"Preparing session"
    },

    {
        progress:.78,
        title:"Verifying",
        status:"Checking launch state",
        step:"Verifying state"
    },

    {
        progress:.90,
        title:"Finishing",
        status:"Finalising launch",
        step:"Finalising"
    },

    {
        progress:.985,
        title:"Ready",
        status:"Launch sequence complete",
        step:"Complete"
    }

];



function updateLaunchPhase(progress){

    var phase =
        launchPhases[0];


    for(
        var i = 0;
        i < launchPhases.length;
        i++
    ){

        if(
            progress >=
            launchPhases[i].progress
        ){

            phase =
                launchPhases[i];

        }

    }


    document
        .getElementById(
            "launchTitle"
        )
        .textContent =
        phase.title;


    document
        .getElementById(
            "launchStatus"
        )
        .textContent =
        phase.status;


    document
        .getElementById(
            "launchStep"
        )
        .textContent =
        phase.step;

}



/* ==================================================
   LAUNCH
   ================================================== */

function launch(button){

    if(launchRunning){

        return;

    }


    launchRunning = true;


    var screen =
        document.getElementById(
            "launchScreen"
        );


    var progressBar =
        document.getElementById(
            "launchProgressBar"
        );


    var percent =
        document.getElementById(
            "launchPercent"
        );


    var time =
        document.getElementById(
            "launchTime"
        );


    var footer =
        document.getElementById(
            "launchFooterStatus"
        );


    progressBar.style.width =
        "0%";


    percent.textContent =
        "0%";


    time.textContent =
        "00:35";


    footer.textContent =
        "Launching";


    document
        .getElementById(
            "launchTitle"
        )
        .textContent =
        "Preparing";


    document
        .getElementById(
            "launchStatus"
        )
        .textContent =
        "Starting launch sequence";


    document
        .getElementById(
            "launchStep"
        )
        .textContent =
        "Initialising";


    screen.classList.add(
        "visible"
    );


    var start =
        performance.now();



    function update(now){

        var elapsed =
            now - start;


        var progress =
            Math.min(
                elapsed /
                launchDuration,
                1
            );


        var percentage =
            Math.floor(
                progress * 100
            );


        var remaining =
            Math.max(
                0,
                Math.ceil(
                    (launchDuration - elapsed) /
                    1000
                )
            );


        progressBar.style.width =
            percentage + "%";


        percent.textContent =
            percentage + "%";


        var minutes =
            Math.floor(
                remaining / 60
            );


        var seconds =
            remaining % 60;


        time.textContent =

            String(minutes)
                .padStart(2,"0")

            + ":"

            +

            String(seconds)
                .padStart(2,"0");


        updateLaunchPhase(
            progress
        );


        if(
            progress < 1
        ){

            requestAnimationFrame(
                update
            );

            return;

        }


        finishLaunch();

    }


    requestAnimationFrame(
        update
    );

}



/* ==================================================
   FINISH
   ================================================== */

function finishLaunch(){

    document
        .getElementById(
            "launchProgressBar"
        )
        .style.width =
        "100%";


    document
        .getElementById(
            "launchPercent"
        )
        .textContent =
        "100%";


    document
        .getElementById(
            "launchTime"
        )
        .textContent =
        "00:00";


    document
        .getElementById(
            "launchTitle"
        )
        .textContent =
        "Ready";


    document
        .getElementById(
            "launchStatus"
        )
        .textContent =
        "Launch sequence complete";


    document
        .getElementById(
            "launchStep"
        )
        .textContent =
        "Complete";


    document
        .getElementById(
            "launchFooterStatus"
        )
        .textContent =
        "Ready";


    setTimeout(function(){

        var screen =
            document.getElementById(
                "launchScreen"
            );


        screen.classList.remove(
            "visible"
        );


        setTimeout(function(){

            screen.style.display =
                "none";


            launchRunning =
                false;

        },300);


    },700);

}

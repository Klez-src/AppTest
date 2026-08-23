#include <windows.h>
#include <dwmapi.h>
#include <wrl.h>
#include <WebView2.h>

#include <chrono>
#include <string>

#pragma comment(lib, "dwmapi.lib")

using Microsoft::WRL::Callback;
using Microsoft::WRL::ComPtr;


// ============================================================
// CONFIG
// ============================================================

static const wchar_t* APP_URL =
L"https://socloseyetsofar.github.io/AppTest/";

static const wchar_t* WINDOW_CLASS =
L"WebViewLoaderWindow";


// ============================================================
// GLOBALS
// ============================================================

static HWND g_window = nullptr;

static ComPtr<ICoreWebView2Controller> g_controller;
static ComPtr<ICoreWebView2> g_webview;

static EventRegistrationToken g_webMessageToken{};


// ============================================================
// GET FRESH URL
// ============================================================

static std::wstring GetFreshUrl()
{
    const auto now =
        std::chrono::duration_cast<
        std::chrono::milliseconds
        >(
            std::chrono::system_clock::now()
            .time_since_epoch()
        ).count();


    std::wstring url =
        APP_URL;


    if (
        url.find(L'?') ==
        std::wstring::npos
        )
    {
        url += L"?";
    }
    else
    {
        url += L"&";
    }


    url += L"app_refresh=";

    url +=
        std::to_wstring(
            now
        );


    return url;
}


// ============================================================
// RESIZE WEBVIEW
// ============================================================

static void ResizeWebView()
{
    if (
        !g_controller ||
        !g_window
        )
    {
        return;
    }


    RECT rect{};


    GetClientRect(
        g_window,
        &rect
    );


    g_controller->put_Bounds(
        rect
    );
}


// ============================================================
// HANDLE WEB MESSAGES
// ============================================================

static void HandleWebMessage(
    ICoreWebView2WebMessageReceivedEventArgs* args
)
{
    if (!args)
    {
        return;
    }


    LPWSTR messageText =
        nullptr;


    HRESULT result =
        args->TryGetWebMessageAsString(
            &messageText
        );


    if (
        FAILED(result) ||
        !messageText
        )
    {
        return;
    }


    // --------------------------------------------------------
    // CLOSE
    // --------------------------------------------------------

    if (
        wcscmp(
            messageText,
            L"window.close"
        ) == 0
        )
    {
        if (g_window)
        {
            DestroyWindow(
                g_window
            );
        }
    }


    // --------------------------------------------------------
    // MINIMIZE
    // --------------------------------------------------------

    else if (
        wcscmp(
            messageText,
            L"window.minimize"
        ) == 0
        )
    {
        if (g_window)
        {
            ShowWindow(
                g_window,
                SW_MINIMIZE
            );
        }
    }


    // --------------------------------------------------------
    // DRAG
    // --------------------------------------------------------

    else if (
        wcscmp(
            messageText,
            L"window.drag"
        ) == 0
        )
    {
        if (g_window)
        {
            ReleaseCapture();


            SendMessageW(
                g_window,
                WM_NCLBUTTONDOWN,
                HTCAPTION,
                0
            );
        }
    }


    CoTaskMemFree(
        messageText
    );
}


// ============================================================
// INSTALL NATIVE DRAG SUPPORT
// ============================================================

static HRESULT InstallDragHandler()
{
    if (!g_webview)
    {
        return E_FAIL;
    }


    /*
        This is deliberately injected by the native host.

        It means the native drag behaviour remains available
        independently of changes to the GitHub JavaScript.

        The top bar is draggable.

        Window controls are explicitly excluded.

        The cursor remains the ordinary arrow.
    */

    const wchar_t* dragScript =
        LR"JS(
(function () {

    function installWindowDrag() {

        function isWindowControl(target) {

            if (!target)
                return false;

            if (!target.closest)
                return false;

            return !!target.closest(
                ".window-controls, " +
                "#closeButton, " +
                "#minimizeButton, " +
                ".window-button"
            );
        }


        function handleMouseDown(event) {

            if (
                event.button !== 0
            ) {
                return;
            }


            if (
                isWindowControl(
                    event.target
                )
            ) {
                return;
            }


            let dragArea =
                false;


            if (
                event.target &&
                event.target.closest
            ) {

                dragArea =
                    !!event.target.closest(
                        ".topbar, " +
                        ".topbar-drag-area"
                    );
            }


            if (!dragArea)
                return;


            event.preventDefault();
            event.stopPropagation();


            try {

                if (
                    window.chrome &&
                    window.chrome.webview
                ) {

                    window.chrome.webview.postMessage(
                        "window.drag"
                    );
                }

            } catch (_) {}

        }


        document.addEventListener(
            "mousedown",
            handleMouseDown,
            true
        );
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            installWindowDrag,
            {
                once: true
            }
        );

    }
    else {

        installWindowDrag();

    }

})();
)JS";


    return g_webview->
        AddScriptToExecuteOnDocumentCreated(
            dragScript,
            nullptr
        );
}


// ============================================================
// CREATE WEBVIEW
// ============================================================

static void CreateWebView()
{
    HRESULT result =
        CreateCoreWebView2EnvironmentWithOptions(
            nullptr,
            nullptr,
            nullptr,

            Callback<
            ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler
            >(
                [](HRESULT result,
                    ICoreWebView2Environment* environment)
                -> HRESULT
                {
                    if (
                        FAILED(result) ||
                        !environment
                        )
                    {
                        return result;
                    }


                    // ------------------------------------------------
                    // CREATE CONTROLLER
                    // ------------------------------------------------

                    return environment->
                        CreateCoreWebView2Controller(

                            g_window,

                            Callback<
                            ICoreWebView2CreateCoreWebView2ControllerCompletedHandler
                            >(
                                [](HRESULT result,
                                    ICoreWebView2Controller* controller)
                                -> HRESULT
                                {
                                    if (
                                        FAILED(result) ||
                                        !controller
                                        )
                                    {
                                        return result;
                                    }


                                    // --------------------------------
                                    // STORE CONTROLLER
                                    // --------------------------------

                                    g_controller =
                                        controller;


                                    // --------------------------------
                                    // GET WEBVIEW
                                    // --------------------------------

                                    HRESULT webviewResult =
                                        g_controller->
                                        get_CoreWebView2(
                                            &g_webview
                                        );


                                    if (
                                        FAILED(
                                            webviewResult
                                        )
                                        )
                                    {
                                        return webviewResult;
                                    }


                                    // --------------------------------
                                    // RESIZE
                                    // --------------------------------

                                    ResizeWebView();


                                    // --------------------------------
                                    // SETTINGS
                                    // --------------------------------

                                    ComPtr<
                                        ICoreWebView2Settings
                                    > settings;


                                    HRESULT settingsResult =
                                        g_webview->
                                        get_Settings(
                                            &settings
                                        );


                                    if (
                                        SUCCEEDED(
                                            settingsResult
                                        ) &&
                                        settings
                                        )
                                    {
                                        settings->
                                            put_IsStatusBarEnabled(
                                                FALSE
                                            );


                                        settings->
                                            put_AreDefaultContextMenusEnabled(
                                                FALSE
                                            );


                                        settings->
                                            put_AreDevToolsEnabled(
                                                FALSE
                                            );


                                        settings->
                                            put_IsZoomControlEnabled(
                                                FALSE
                                            );
                                    }


                                    // --------------------------------
                                    // NATIVE DRAG SUPPORT
                                    // --------------------------------

                                    HRESULT dragResult =
                                        InstallDragHandler();


                                    if (
                                        FAILED(
                                            dragResult
                                        )
                                        )
                                    {
                                        return dragResult;
                                    }


                                    // --------------------------------
                                    // WEB MESSAGES
                                    // --------------------------------

                                    HRESULT messageResult =
                                        g_webview->
                                        add_WebMessageReceived(

                                            Callback<
                                            ICoreWebView2WebMessageReceivedEventHandler
                                            >(
                                                [](
                                                    ICoreWebView2*,
                                                    ICoreWebView2WebMessageReceivedEventArgs* args
                                                    )
                                                -> HRESULT
                                                {
                                                    HandleWebMessage(
                                                        args
                                                    );

                                                    return S_OK;
                                                }
                                            ).Get(),

                                            &g_webMessageToken
                                        );


                                    if (
                                        FAILED(
                                            messageResult
                                        )
                                        )
                                    {
                                        return messageResult;
                                    }


                                    // --------------------------------
                                    // NAVIGATE TO CURRENT GITHUB PAGE
                                    // --------------------------------

                                    const std::wstring freshUrl =
                                        GetFreshUrl();


                                    return g_webview->
                                        Navigate(
                                            freshUrl.c_str()
                                        );
                                }
                            ).Get()
                        );
                }
            ).Get()
        );


    (void)result;
}


// ============================================================
// WINDOW PROCEDURE
// ============================================================

static LRESULT CALLBACK WindowProc(
    HWND hwnd,
    UINT message,
    WPARAM wParam,
    LPARAM lParam
)
{
    switch (message)
    {

        // --------------------------------------------------------
        // RESIZE
        // --------------------------------------------------------

    case WM_SIZE:
    {
        ResizeWebView();

        return 0;
    }


    // --------------------------------------------------------
    // PREVENT BACKGROUND FLASH
    // --------------------------------------------------------

    case WM_ERASEBKGND:
    {
        return 1;
    }


    // --------------------------------------------------------
    // DESTROY
    // --------------------------------------------------------

    case WM_DESTROY:
    {
        if (g_webview)
        {
            g_webview->
                remove_WebMessageReceived(
                    g_webMessageToken
                );
        }


        g_webview.Reset();

        g_controller.Reset();


        PostQuitMessage(
            0
        );


        return 0;
    }

    }


    return DefWindowProcW(
        hwnd,
        message,
        wParam,
        lParam
    );
}


// ============================================================
// REGISTER WINDOW CLASS
// ============================================================

static bool RegisterWindowClass(
    HINSTANCE instance
)
{
    WNDCLASSEXW wc{};


    wc.cbSize =
        sizeof(WNDCLASSEXW);


    wc.style =
        CS_HREDRAW |
        CS_VREDRAW;


    wc.lpfnWndProc =
        WindowProc;


    wc.hInstance =
        instance;


    wc.hCursor =
        LoadCursorW(
            nullptr,
            IDC_ARROW
        );


    wc.hbrBackground =
        reinterpret_cast<HBRUSH>(
            GetStockObject(
                BLACK_BRUSH
            )
            );


    wc.lpszClassName =
        WINDOW_CLASS;


    return RegisterClassExW(
        &wc
    ) != 0;
}


// ============================================================
// ENTRY POINT
// ============================================================

int WINAPI wWinMain(
    HINSTANCE instance,
    HINSTANCE,
    PWSTR,
    int showCommand
)
{
    // --------------------------------------------------------
    // COM
    // --------------------------------------------------------

    HRESULT result =
        CoInitializeEx(
            nullptr,
            COINIT_APARTMENTTHREADED
        );


    if (
        FAILED(result)
        )
    {
        return 1;
    }


    // --------------------------------------------------------
    // REGISTER WINDOW
    // --------------------------------------------------------

    if (
        !RegisterWindowClass(
            instance
        )
        )
    {
        CoUninitialize();

        return 1;
    }


    // --------------------------------------------------------
    // CREATE BORDERLESS 325x430 WINDOW
    // --------------------------------------------------------

    g_window =
        CreateWindowExW(

            WS_EX_APPWINDOW,

            WINDOW_CLASS,

            L"Loader",

            WS_POPUP,

            CW_USEDEFAULT,
            CW_USEDEFAULT,

            325,
            430,

            nullptr,
            nullptr,

            instance,
            nullptr
        );


    if (
        !g_window
        )
    {
        CoUninitialize();

        return 1;
    }


    // --------------------------------------------------------
    // ROUNDED WINDOWS CORNER
    // --------------------------------------------------------

    DWM_WINDOW_CORNER_PREFERENCE corner =
        DWMWCP_ROUND;


    DwmSetWindowAttribute(
        g_window,

        DWMWA_WINDOW_CORNER_PREFERENCE,

        &corner,

        sizeof(corner)
    );


    // --------------------------------------------------------
    // SHOW
    // --------------------------------------------------------

    ShowWindow(
        g_window,

        showCommand == SW_HIDE
        ? SW_SHOW
        : showCommand
    );


    UpdateWindow(
        g_window
    );


    // --------------------------------------------------------
    // CREATE WEBVIEW2
    // --------------------------------------------------------

    CreateWebView();


    // --------------------------------------------------------
    // MESSAGE LOOP
    // --------------------------------------------------------

    MSG windowsMessage{};


    while (
        GetMessageW(
            &windowsMessage,
            nullptr,
            0,
            0
        ) > 0
        )
    {
        TranslateMessage(
            &windowsMessage
        );


        DispatchMessageW(
            &windowsMessage
        );
    }


    // --------------------------------------------------------
    // COM CLEANUP
    // --------------------------------------------------------

    CoUninitialize();


    return static_cast<int>(
        windowsMessage.wParam
        );
}

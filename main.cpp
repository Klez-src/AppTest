#include <windows.h>
#include <wrl.h>
#include <wil/com.h>
#include <WebView2.h>
#include <dwmapi.h>

using namespace Microsoft::WRL;

static HWND g_hwnd = nullptr;
static ComPtr<ICoreWebView2Controller> g_controller;
static ComPtr<ICoreWebView2> g_webview;

// Change this to your GitHub Pages URL.
static constexpr wchar_t ORRO_URL[] =
    L"https://YOUR-USERNAME.github.io/orro/";

static constexpr wchar_t WINDOW_CLASS[] = L"orroBorderlessWindow";

void ResizeWebView()
{
    if (!g_controller || !g_hwnd) return;

    RECT rc{};
    GetClientRect(g_hwnd, &rc);
    g_controller->put_Bounds(rc);
}

void HandleWebMessage(ICoreWebView2WebMessageReceivedEventArgs* args)
{
    wil::unique_cotaskmem_string message;
    if (FAILED(args->TryGetWebMessageAsString(&message)) || !message)
        return;

    const wchar_t* msg = message.get();

    if (wcscmp(msg, L"window.close") == 0)
    {
        DestroyWindow(g_hwnd);
    }
    else if (wcscmp(msg, L"window.minimize") == 0)
    {
        ShowWindow(g_hwnd, SW_MINIMIZE);
    }
    else if (wcscmp(msg, L"window.maximize") == 0)
    {
        if (IsZoomed(g_hwnd))
            ShowWindow(g_hwnd, SW_RESTORE);
        else
            ShowWindow(g_hwnd, SW_MAXIMIZE);
    }
    else if (wcscmp(msg, L"window.drag") == 0)
    {
        ReleaseCapture();
        SendMessageW(g_hwnd, WM_NCLBUTTONDOWN, HTCAPTION, 0);
    }
}

void CreateWebView()
{
    CreateCoreWebView2EnvironmentWithOptions(
        nullptr,
        nullptr,
        nullptr,
        Callback<ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler>(
            [](HRESULT hr, ICoreWebView2Environment* env) -> HRESULT
            {
                if (FAILED(hr) || !env) return hr;

                return env->CreateCoreWebView2Controller(
                    g_hwnd,
                    Callback<ICoreWebView2CreateCoreWebView2ControllerCompletedHandler>(
                        [](HRESULT hr, ICoreWebView2Controller* controller) -> HRESULT
                        {
                            if (FAILED(hr) || !controller) return hr;

                            g_controller = controller;
                            g_controller->get_CoreWebView2(&g_webview);
                            ResizeWebView();

                            ComPtr<ICoreWebView2Settings> settings;
                            g_webview->get_Settings(&settings);
                            if (settings)
                            {
                                settings->put_IsStatusBarEnabled(FALSE);
                                settings->put_AreDefaultContextMenusEnabled(FALSE);
                                settings->put_AreDevToolsEnabled(TRUE);
                                settings->put_IsZoomControlEnabled(FALSE);
                            }

                            EventRegistrationToken token{};
                            g_webview->add_WebMessageReceived(
                                Callback<ICoreWebView2WebMessageReceivedEventHandler>(
                                    [](ICoreWebView2*, ICoreWebView2WebMessageReceivedEventArgs* args) -> HRESULT
                                    {
                                        HandleWebMessage(args);
                                        return S_OK;
                                    }
                                ).Get(),
                                &token
                            );

                            // Keep the native shell locked to the GitHub-hosted UI.
                            g_webview->Navigate(ORRO_URL);
                            return S_OK;
                        }
                    ).Get()
                );
            }
        ).Get()
    );
}

LRESULT CALLBACK WindowProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
    switch (msg)
    {
        case WM_SIZE:
            ResizeWebView();
            return 0;

        case WM_ERASEBKGND:
            return 1;

        case WM_DESTROY:
            PostQuitMessage(0);
            return 0;
    }

    return DefWindowProcW(hwnd, msg, wParam, lParam);
}

bool RegisterWindowClass(HINSTANCE instance)
{
    WNDCLASSEXW wc{};
    wc.cbSize = sizeof(wc);
    wc.hInstance = instance;
    wc.lpfnWndProc = WindowProc;
    wc.lpszClassName = WINDOW_CLASS;
    wc.hCursor = LoadCursorW(nullptr, IDC_ARROW);
    wc.hbrBackground = reinterpret_cast<HBRUSH>(GetStockObject(BLACK_BRUSH));
    wc.style = CS_HREDRAW | CS_VREDRAW;

    return RegisterClassExW(&wc) != 0;
}

int WINAPI wWinMain(HINSTANCE instance, HINSTANCE, PWSTR, int)
{
    HRESULT hr = CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
    if (FAILED(hr)) return 1;

    if (!RegisterWindowClass(instance))
    {
        CoUninitialize();
        return 1;
    }

    g_hwnd = CreateWindowExW(
        WS_EX_APPWINDOW,
        WINDOW_CLASS,
        L"orro",
        WS_POPUP,
        CW_USEDEFAULT,
        CW_USEDEFAULT,
        1120,
        720,
        nullptr,
        nullptr,
        instance,
        nullptr
    );

    if (!g_hwnd)
    {
        CoUninitialize();
        return 1;
    }

    // Rounded native corners where supported by Windows 11.
    const DWM_WINDOW_CORNER_PREFERENCE corner = DWMWCP_ROUND;
    DwmSetWindowAttribute(
        g_hwnd,
        DWMWA_WINDOW_CORNER_PREFERENCE,
        &corner,
        sizeof(corner)
    );

    ShowWindow(g_hwnd, SW_SHOW);
    UpdateWindow(g_hwnd);

    CreateWebView();

    MSG message{};
    while (GetMessageW(&message, nullptr, 0, 0) > 0)
    {
        TranslateMessage(&message);
        DispatchMessageW(&message);
    }

    g_webview.Reset();
    g_controller.Reset();
    CoUninitialize();

    return static_cast<int>(message.wParam);
}

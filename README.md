# orro desktop shell

This project is a borderless native Windows shell around the GitHub-hosted orro UI.

## Structure

- `main.cpp` — Win32 + WebView2 desktop shell
- `index.html` — hosted UI structure
- `style.css` — orro styling + locked intro
- `script.js` — navigation, toggles, launch demo, native window controls

## 1. Put the web UI on GitHub Pages

Upload `index.html`, `style.css`, and `script.js` to your GitHub repository and enable GitHub Pages.

## 2. Change the URL

At the top of `main.cpp`, replace:

`https://YOUR-USERNAME.github.io/orro/`

with your real GitHub Pages URL.

## 3. Build

Use Visual Studio 2022 with the Microsoft WebView2 SDK available to the project. Link against `dwmapi.lib`.

The WebView2 runtime must be installed on the Windows PC.

## 4. Runtime model

`orro.exe` does not contain the HTML UI. It opens the configured HTTPS GitHub Pages URL every time it starts, so changes pushed to GitHub can be picked up by the desktop app without rebuilding the C++ shell.

# Weather Now

A simple responsive, client-side weather webpage.

## Features
- Current temperature in °F
- Coat/umbrella recommendation based on temperature and precipitation in the next few hours
- UV index with five text levels
- Wind speed in mph
- Browser geolocation
- Responsive desktop/mobile layout
- No API key and no custom server required

## Run locally
Because browser geolocation is restricted on some `file://` pages, use a local web server if needed.

For example, from this folder:
`python -m http.server 8000`

Then open `http://localhost:8000`.

## GitHub Pages
1. Create a new public GitHub repository.
2. Upload `index.html`, `style.css`, and `script.js` to the repository root.
3. Open repository **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose the `main` branch and `/ (root)`, then save.
6. GitHub will provide the live Pages URL after deployment.

The site uses Open-Meteo directly from the browser.

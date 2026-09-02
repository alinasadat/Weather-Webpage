# Weather Now

A responsive, fully client-side weather page. Chicago loads by default.

- Search by city or postal code to see up to four matching locations.
- Select a result to update temperature, coat/umbrella advice, UV and winds.
- Use my location requests browser location access only when clicked. Previously allowed or denied permission may be remembered by the browser.
- UV shows the highest forecast index in the current hour and next three hours, with Low (below 3), Moderate (3–5), High (6–7), Very High (8–10), and Extreme (11+) guidance.
- Temperature is in Fahrenheit and wind speed is in mph.
- Weather/geocoding requests go directly from the browser to Open-Meteo. No API key or custom backend is needed.
- Your coordinates are sent to Open-Meteo to retrieve weather. This page does not save them.
- On a search failure or denied location permission, you can continue using the displayed location.

## Publish or update GitHub Pages
Upload index.html, style.css and script.js to your existing repository, replacing the previous files.
For a new repository: Settings → Pages → Deploy from a branch → main → / (root).
Use the HTTPS Pages URL so browser geolocation can work.

Weather: https://open-meteo.com/
UV guidance: https://www.weather.gov/ilx/uv-index

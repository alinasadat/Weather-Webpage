const $ = id => document.getElementById(id);
const buttons = document.querySelectorAll(".side-button");
const panels = document.querySelectorAll(".panel");
buttons.forEach(button => {
  button.setAttribute("aria-pressed", String(button.classList.contains("active")));
  button.addEventListener("click", () => {
    buttons.forEach(b => { b.classList.remove("active"); b.setAttribute("aria-pressed", "false"); });
    panels.forEach(p => p.classList.add("hidden"));
    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");
    $(button.dataset.panel).classList.remove("hidden");
  });
});

function uvGuidance(uv) {
  if (!Number.isFinite(uv)) return ["Unavailable", "UV guidance is unavailable right now."];
  if (uv >= 11) return ["Extreme", "Avoid midday sun; stay indoors when possible. Outside, use SPF 30+ sunscreen, covering clothing, a hat and sunglasses."];
  if (uv >= 8) return ["Very High", "Extra protection needed: minimize midday sun, use SPF 30+ sunscreen and cover up with a hat and sunglasses."];
  if (uv >= 6) return ["High", "Protection essential: use SPF 30+ sunscreen, cover up and reduce time in the midday sun."];
  if (uv >= 3) return ["Moderate", "Some protection needed: use SPF 30+ sunscreen, a hat and sunglasses; seek shade around midday."];
  return ["Low", "Minimal protection needed. Wear sunglasses on bright days; use SPF 30+ sunscreen and cover up if you burn easily."];
}
function weatherAdvice(tempF, probability, precipitation) {
  if (![tempF, probability, precipitation].every(Number.isFinite)) return "Coat and umbrella guidance is unavailable right now.";
  const coat = tempF < 60, umbrella = probability >= 35 || precipitation > 0;
  if (coat && umbrella) return "Bring a coat and an umbrella if you're going out in the next few hours.";
  if (coat) return "Bring a coat if you're going out in the next few hours. An umbrella probably isn't needed.";
  if (umbrella) return "You probably don't need a coat, but bring an umbrella for the next few hours.";
  return "You probably don't need a coat or umbrella for the next few hours.";
}
let weatherController;
let selectionVersion = 0;
function showError(message) {
  $("loading").classList.add("hidden");
  $("error").textContent = message;
  $("error").classList.remove("hidden");
}
async function fetchJSON(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Service unavailable");
  return response.json();
}
async function loadWeather(place) {
  weatherController?.abort();
  const controller = new AbortController();
  weatherController = controller;
  const timeout = setTimeout(() => controller.abort(), 20000);
  $("error").classList.add("hidden");
  $("loading").textContent = "Getting weather…";
  $("loading").classList.remove("hidden");
  $("location").textContent = place.label;
  $("temperature").textContent = "--°F";
  $("wind-speed").textContent = "--";
  $("uv-value").textContent = "--";
  $("uv-level").textContent = "Checking UV level…";
  $("uv-protection").textContent = "";
  $("advice").textContent = "Checking the next few hours…";
  $("updated").textContent = "";
  try {
    const params = new URLSearchParams({
      latitude: place.latitude, longitude: place.longitude,
      current: "temperature_2m,wind_speed_10m",
      hourly: "precipitation_probability,precipitation,uv_index",
      temperature_unit: "fahrenheit", wind_speed_unit: "mph",
      precipitation_unit: "inch", forecast_days: "2", timezone: "auto"
    });
    const data = await fetchJSON("https://api.open-meteo.com/v1/forecast?" + params, controller.signal);
    if (weatherController !== controller) return;
    if (!data.current || !data.hourly?.time) throw new Error("Incomplete forecast");
    const start = data.hourly.time.findIndex(t => t.slice(0, 13) === data.current.time.slice(0, 13));
    const peak = values => {
      const slice = start < 0 ? [] : (values || []).slice(start, start + 4);
      return slice.length === 4 && slice.every(Number.isFinite) ? Math.max(...slice) : NaN;
    };
    const uv = peak(data.hourly.uv_index);
    const temp = data.current.temperature_2m;
    const wind = data.current.wind_speed_10m;
    $("temperature").textContent = Number.isFinite(temp) ? Math.round(temp) + "°F" : "--°F";
    $("wind-speed").textContent = Number.isFinite(wind) ? Math.round(wind) : "--";
    $("advice").textContent = weatherAdvice(temp, peak(data.hourly.precipitation_probability), peak(data.hourly.precipitation));
    $("uv-value").textContent = Number.isFinite(uv) ? uv.toFixed(1) : "--";
    const [level, guidance] = uvGuidance(uv);
    $("uv-level").textContent = level;
    $("uv-protection").textContent = guidance;
    $("updated").textContent = "Updated " + data.current.time.slice(11, 16) + " (" + data.timezone + ")";
    $("loading").classList.add("hidden");
  } catch (error) {
    if (weatherController !== controller) return;
    $("advice").textContent = "Weather is unavailable.";
    $("uv-level").textContent = "Unavailable";
    $("uv-protection").textContent = "UV guidance is unavailable right now.";
    showError("Couldn't load weather. Search again or try Use my location.");
  } finally { clearTimeout(timeout); }
}

let searchController, searchVersion = 0, debounce;
function clearSearch() {
  clearTimeout(debounce);
  searchVersion++;
  searchController?.abort();
  $("search-results").replaceChildren();
  $("search-results").classList.add("hidden");
}
function choosePlace(place) {
  selectionVersion++;
  $("use-location").disabled = false;
  $("use-location").textContent = "Use my location";
  clearSearch();
  $("search-input").value = "";
  $("search-status").textContent = "";
  loadWeather(place);
}
async function searchPlaces() {
  clearSearch();
  const query = $("search-input").value.trim();
  if (query.length < 2) {
    $("search-status").textContent = query ? "Enter at least two characters." : "";
    return;
  }
  const version = searchVersion;
  const controller = new AbortController();
  searchController = controller;
  const timeout = setTimeout(() => controller.abort(), 15000);
  $("search-status").textContent = "Searching…";
  try {
    const params = new URLSearchParams({ name: query, count: "4", language: "en", format: "json" });
    const data = await fetchJSON("https://geocoding-api.open-meteo.com/v1/search?" + params, controller.signal);
    if (version !== searchVersion) return;
    const results = (data.results || []).slice(0, 4);
    $("search-status").textContent = results.length ? "Choose a location below." : "No matching locations. Try another city or postal code.";
    for (const result of results) {
      const label = [result.name, result.admin1, result.country].filter(Boolean).join(", ");
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", () => choosePlace({ latitude: result.latitude, longitude: result.longitude, label }));
      item.append(button);
      $("search-results").append(item);
    }
    $("search-results").classList.toggle("hidden", !results.length);
  } catch (error) {
    if (version === searchVersion) $("search-status").textContent = "Location search is unavailable. Please try again.";
  } finally { clearTimeout(timeout); }
}
$("location-search").addEventListener("submit", event => { event.preventDefault(); searchPlaces(); });
$("search-input").addEventListener("input", () => {
  clearSearch();
  const query = $("search-input").value.trim();
  $("search-status").textContent = query.length < 2 ? (query ? "Enter at least two characters." : "") : "Searching…";
  if (query.length >= 2) debounce = setTimeout(searchPlaces, 300);
});
$("search-input").addEventListener("keydown", event => {
  if (event.key === "Escape") { clearSearch(); $("search-status").textContent = ""; }
  if (event.key === "ArrowDown") {
    const first = $("search-results").querySelector("button");
    if (first) { event.preventDefault(); first.focus(); }
  }
});
$("use-location").addEventListener("click", () => {
  if (!window.isSecureContext || !navigator.geolocation) {
    showError("Location requires a secure HTTPS page and a browser with location support. You can still search for a city.");
    return;
  }
  const version = ++selectionVersion;
  clearSearch();
  $("search-status").textContent = "";
  $("error").classList.add("hidden");
  $("use-location").disabled = true;
  $("use-location").textContent = "Locating…";
  navigator.geolocation.getCurrentPosition(position => {
    if (version !== selectionVersion) return;
    choosePlace({ latitude: position.coords.latitude, longitude: position.coords.longitude, label: "Your current location" });
  }, error => {
    if (version !== selectionVersion) return;
    $("use-location").disabled = false;
    $("use-location").textContent = "Use my location";
    const message = error.code === 1 ? "Location access was denied. Allow it in your browser settings or search for a city." :
      error.code === 3 ? "Location request timed out. Try again or search for a city." :
      "Couldn't determine your location. Try again or search for a city.";
    showError(message);
  }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
});
loadWeather({ latitude: 41.8781, longitude: -87.6298, label: "Chicago, Illinois" });

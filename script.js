const buttons = document.querySelectorAll(".side-button");
const panels = document.querySelectorAll(".panel");

buttons.forEach(button => {
  button.addEventListener("click", () => {
    buttons.forEach(b => b.classList.remove("active"));
    panels.forEach(p => p.classList.add("hidden"));
    button.classList.add("active");
    document.getElementById(button.dataset.panel).classList.remove("hidden");
  });
});

function uvLabel(uv) {
  if (uv >= 11) return "Extremely high";
  if (uv >= 6) return "High";
  if (uv >= 3) return "Moderate";
  if (uv >= 1) return "Low";
  return "Very low";
}

function weatherAdvice(tempF, precipProb, precipInches) {
  const needsCoat = tempF < 60;
  const needsUmbrella = precipProb >= 35 || precipInches > 0;

  if (needsCoat && needsUmbrella) {
    return "Bring a coat and an umbrella if you're going out in the next few hours.";
  }
  if (needsCoat) {
    return "Bring a coat if you're going out in the next few hours. An umbrella probably isn't needed.";
  }
  if (needsUmbrella) {
    return "You probably don't need a coat, but bring an umbrella for the next few hours.";
  }
  return "You probably don't need a coat or umbrella for the next few hours.";
}

async function loadChicagoWeather() {
  // Fixed Chicago coordinates — the site never asks for the user's location.
  const latitude = 41.8781;
  const longitude = -87.6298;

  const params = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m,wind_speed_10m",
    hourly: "precipitation_probability,precipitation,uv_index",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
    forecast_days: "1",
    timezone: "America/Chicago"
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) throw new Error("Weather service could not be reached.");

  const data = await response.json();

  // Match the API's current timestamp to the hourly forecast, then inspect
  // that hour plus the next three hours.
  const currentHourString = data.current.time.slice(0, 13);
  let start = data.hourly.time.findIndex(t => t.slice(0, 13) === currentHourString);
  if (start < 0) start = 0;
  const end = Math.min(start + 4, data.hourly.time.length);

  const precipProb = Math.max(
    ...data.hourly.precipitation_probability.slice(start, end).map(v => v ?? 0)
  );
  const precip = Math.max(
    ...data.hourly.precipitation.slice(start, end).map(v => v ?? 0)
  );
  const uv = Math.max(
    ...data.hourly.uv_index.slice(start, end).map(v => v ?? 0)
  );

  const temp = Math.round(data.current.temperature_2m);
  const wind = Math.round(data.current.wind_speed_10m);

  document.getElementById("temperature").textContent = `${temp}°F`;
  document.getElementById("advice").textContent =
    weatherAdvice(temp, precipProb, precip);
  document.getElementById("uv-value").textContent = uv.toFixed(1);
  document.getElementById("uv-level").textContent = uvLabel(uv);
  document.getElementById("wind-speed").textContent = wind;

  const updatedTime = new Date(data.current.time);
  document.getElementById("updated").textContent =
    `Updated ${updatedTime.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    })}`;

  document.getElementById("loading").classList.add("hidden");
}

function showError(message) {
  document.getElementById("loading").classList.add("hidden");
  const error = document.getElementById("error");
  error.textContent = message;
  error.classList.remove("hidden");
}

loadChicagoWeather().catch(err => showError(err.message));

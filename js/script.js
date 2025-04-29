import { windDirections } from "./constants/windDirections.js";
/* 
// Weather icons mapping based on AEMET codes
const weatherIcons = {
  11: "sun", // Despejado
  "11n": "moon", // Despejado noche
  12: "cloud-sun", // Poco nuboso
  "12n": "cloud-moon", // Poco nuboso noche
  13: "cloud", // Intervalos nubosos
  14: "cloud", // Nuboso
  15: "cloud", // Muy nuboso
  16: "cloud", // Cubierto
  17: "cloud", // Nubes altas
  23: "cloud-rain", // Lluvia
  26: "cloud-rain", // Cubierto con lluvia
  43: "cloud-rain", // Intervalos nubosos con lluvia
  44: "cloud-rain", // Nuboso con lluvia
  45: "cloud-rain", // Muy nuboso con lluvia
  46: "cloud-rain", // Cubierto con lluvia escasa
  51: "cloud-rain", // Intervalos nubosos con lluvia escasa
  53: "cloud-rain", // Nuboso con lluvia escasa
  55: "cloud-rain", // Muy nuboso con lluvia escasa
  61: "cloud-showers-heavy", // Chubascos
  63: "cloud-showers-heavy", // Chubascos
  71: "snowflake", // Nieve
  73: "snowflake", // Nieve
  81: "bolt", // Tormenta
  82: "bolt", // Tormenta
  83: "bolt", // Tormenta con lluvia
  84: "bolt", // Tormenta con nieve
  85: "bolt", // Tormenta con granizo
  86: "bolt", // Tormenta con lluvia y granizo
}; */
/* 
// Get weather icon class based on AEMET code
function getWeatherIcon(code) {
  const baseCode = code.replace("n", ""); // Remove night indicator for matching
  const isNight = code.includes("n");

  // Default to cloud icon if not found
  return (
    weatherIcons[code] ||
    weatherIcons[baseCode] ||
    (isNight ? "cloud-moon" : "cloud-sun")
  );
}
 */

import { getWeatherIcon } from "./utils/getWeatherIcon.js";

// Format date to Spanish format
function formatDate(dateString) {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", options);
}

// Get time from period (e.g., "03" -> "3:00")
function getTimeFromPeriod(period) {
  return `${parseInt(period)}:00`;
}

// Get wind direction icon
function getWindDirectionIcon(direction) {
  const dir = windDirections[direction] || {
    icon: "question",
    rotate: "0",
    name: "Desconocido",
  };
  return `<i class="fas fa-${dir.icon} wind-direction" style="transform: rotate(${dir.rotate}deg)"></i> ${dir.name}`;
}

// Calculate average temperature
function calculateAverageTemp(temperatures) {
  if (!temperatures || temperatures.length === 0) return null;

  const sum = temperatures.reduce((acc, temp) => acc + parseInt(temp.value), 0);
  return Math.round(sum / temperatures.length);
}

// Calculate min/max temperature
function calculateMinMaxTemp(temperatures) {
  if (!temperatures || temperatures.length === 0)
    return { min: null, max: null };

  const values = temperatures.map((temp) => parseInt(temp.value));
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

// Calculate total precipitation
function calculateTotalPrecipitation(precipitations) {
  if (!precipitations || precipitations.length === 0) return 0;

  return precipitations
    .reduce((acc, precip) => acc + parseFloat(precip.value || 0), 0)
    .toFixed(1);
}

// Get max precipitation probability
function getMaxPrecipProbability(probPrecipitacion) {
  if (!probPrecipitacion || probPrecipitacion.length === 0) return 0;

  return Math.max(...probPrecipitacion.map((prob) => parseInt(prob.value)));
}

// Get max wind speed
function getMaxWindSpeed(vientoAndRachaMax) {
  if (!vientoAndRachaMax || vientoAndRachaMax.length === 0) return null;

  let maxSpeed = 0;
  vientoAndRachaMax.forEach((item) => {
    if (item.velocidad) {
      const speed = parseInt(item.velocidad[0]);
      if (speed > maxSpeed) maxSpeed = speed;
    }
  });
  return maxSpeed;
}

// Get predominant wind direction
function getPredominantWindDirection(vientoAndRachaMax) {
  if (!vientoAndRachaMax || vientoAndRachaMax.length === 0) return null;

  const directions = {};
  vientoAndRachaMax.forEach((item) => {
    if (item.direccion) {
      const dir = item.direccion[0];
      directions[dir] = (directions[dir] || 0) + 1;
    }
  });

  // Find the direction with highest count
  return Object.keys(directions).reduce((a, b) =>
    directions[a] > directions[b] ? a : b
  );
}

// Render hourly forecast
function renderHourlyForecast(dayData, container) {
  container.innerHTML = "";

  if (!dayData) return;

  dayData.estadoCielo.slice(0, 24).forEach((cielo, index) => {
    const hora = cielo.periodo;
    const temp =
      dayData.temperatura.find((t) => t.periodo === hora)?.value || "--";
    const precip =
      dayData.precipitacion.find((p) => p.periodo === hora)?.value || "0";
    const wind = dayData.vientoAndRachaMax.find((w) => w.periodo === hora);

    const windSpeed = wind?.velocidad ? wind.velocidad[0] : "--";
    const windDir = wind?.direccion ? wind.direccion[0] : null;

    const weatherIcon = getWeatherIcon(cielo.value);

    const hourElement = document.createElement("div");
    hourElement.className =
      "col hourly-item text-center p-2 bg-white rounded border";

    hourElement.innerHTML = `
                    <div class="fw-bold text-primary">${getTimeFromPeriod(
                      hora
                    )}</div>
                    <div class="my-2 h5 text-primary fw-bold">${temp}°</div>
                    <div class="h4 mb-1 text-secondary">
                        <i class="fas fa-${weatherIcon}"></i>
                    </div>
                    <div class="small text-muted">${precip} mm</div>
                    <div class="small mt-1 text-muted">
                        ${
                          windDir ? getWindDirectionIcon(windDir) : ""
                        } ${windSpeed} km/h
                    </div>
                `;

    container.appendChild(hourElement);
  });
}

// Render humidity chart
function renderHumidityChart(humedadRelativa, container) {
  container.innerHTML = "";
  if (!humedadRelativa || humedadRelativa.length === 0) {
    container.innerHTML = '<p class="text-muted">No hay datos de humedad</p>';
    return;
  }

  // Crear un objeto para mapear las horas recibidas
  const humidityMap = {};
  humedadRelativa.forEach((hum) => {
    const hour = parseInt(hum.periodo);
    humidityMap[hour] = parseInt(hum.value); // Guardar la humedad para cada hora
  });

  // Crear el contenedor del gráfico
  const chartContainer = document.createElement("div");
  chartContainer.className = "humidity-chart-container";

  // Crear el eje Y
  const yAxis = document.createElement("div");
  yAxis.className = "y-axis";
  for (let i = 0; i <= 100; i += 10) {
    const tick = document.createElement("div");
    tick.className = "y-tick";
    tick.style.bottom = `${i}%`;
    tick.textContent = i === 0 ? "0%" : `${i}%`;
    yAxis.appendChild(tick);
  }

  // Crear el contenedor de las barras
  const barsContainer = document.createElement("div");
  barsContainer.className = "humidity-bars";

  // Crear el eje X
  const xAxis = document.createElement("div");
  xAxis.className = "x-axis";
  for (let i = 0; i <= 24; i += 4) {
    const tick = document.createElement("div");
    tick.className = "x-tick";
    tick.style.left = `${(i / 24) * 100}%`;
    tick.textContent = `${i}h`;
    xAxis.appendChild(tick);
  }

  // Crear barras para todas las horas del día (0-23)
  for (let hour = 0; hour < 24; hour++) {
    const bar = document.createElement("div");
    bar.className = "humidity-bar";

    if (humidityMap.hasOwnProperty(hour)) {
      // Si hay datos para esta hora, establecer la altura y el color
      const humidity = humidityMap[hour];
      bar.style.height = `${humidity}%`;
      bar.setAttribute("data-hour", hour);
      bar.setAttribute("data-humidity", humidity);
      bar.title = `${humidity}% a las ${hour}:00`;
    } else {
      // Si no hay datos para esta hora, hacer la barra transparente y de 0 píxeles
      bar.style.height = "0%";
      bar.style.backgroundColor = "transparent";
      bar.title = `Sin datos a las ${hour}:00`;
    }

    barsContainer.appendChild(bar);
  }

  // Añadir todos los elementos al contenedor del gráfico
  chartContainer.appendChild(yAxis);
  chartContainer.appendChild(barsContainer);
  chartContainer.appendChild(xAxis);
  container.appendChild(chartContainer);
}

// Render sky status
function renderSkyStatus(estadoCielo, container) {
  container.innerHTML = "";

  if (!estadoCielo || estadoCielo.length === 0) {
    container.innerHTML =
      '<p class="text-muted">No hay datos del estado del cielo</p>';
    return;
  }

  // Group by description and count occurrences
  const statusCounts = {};
  estadoCielo.forEach((cielo) => {
    statusCounts[cielo.descripcion] =
      (statusCounts[cielo.descripcion] || 0) + 1;
  });

  // Display the most common statuses
  Object.entries(statusCounts)
    .slice(0, 6)
    .forEach(([desc, count]) => {
      const icon = getWeatherIcon(desc.includes("noche") ? "11n" : "11"); // Simplified icon mapping

      const statusElement = document.createElement("div");
      statusElement.className = "col";

      statusElement.innerHTML = `
                    <div class="card h-100">
                        <div class="card-body text-center p-2">
                            <div class="h4 mb-1">
                                <i class="fas fa-${icon}"></i>
                            </div>
                            <div class="small fw-bold">${desc}</div>
                            <div class="small text-muted">${count} horas</div>
                        </div>
                    </div>
                `;

      container.appendChild(statusElement);
    });
}
// Render precipitation chart
function renderPrecipitationChart(precipitacion, container) {
  container.innerHTML = "";
  if (!precipitacion || precipitacion.length === 0) {
    container.innerHTML =
      '<p class="text-muted">No hay datos de precipitación</p>';
    return;
  }

  // Create chart container
  const chartContainer = document.createElement("div");
  chartContainer.className = "precipitation-chart-container";

  // Create Y axis
  const yAxis = document.createElement("div");
  yAxis.className = "y-axis";

  // Add Y axis ticks and labels (every 1 mm)
  const maxPrecipitation = Math.max(
    ...precipitacion.map((p) => parseFloat(p.value || 0))
  );
  const maxYTick = Math.ceil(maxPrecipitation);
  for (let i = 0; i <= maxYTick; i++) {
    const tick = document.createElement("div");
    tick.className = "y-tick";
    tick.style.bottom = `${(i / maxYTick) * 100}%`;
    tick.textContent = `${i} mm`;
    yAxis.appendChild(tick);
  }

  // Create X axis
  const xAxis = document.createElement("div");
  xAxis.className = "x-axis";

  // Add X axis ticks and labels (every 4 hours)
  const hours = precipitacion.map((p) => parseInt(p.periodo));
  const minHour = Math.min(...hours);
  const maxHour = Math.max(...hours);
  for (let i = 0; i <= 24; i += 4) {
    const tick = document.createElement("div");
    tick.className = "x-tick";
    tick.style.left = `${(i / 24) * 100}%`;
    tick.textContent = `${i}h`;
    xAxis.appendChild(tick);
  }

  // Create bars for each hour
  const barsContainer = document.createElement("div");
  barsContainer.className = "precipitation-bars";

  for (let hour = 0; hour < 24; hour++) {
    const bar = document.createElement("div");
    bar.className = "precipitation-bar";

    const precip = precipitacion.find((p) => parseInt(p.periodo) === hour);
    const value = precip ? parseFloat(precip.value || 0) : 0;

    if (value > 0) {
      bar.style.height = `${(value / maxYTick) * 100}%`;
      bar.setAttribute("data-hour", hour);
      bar.setAttribute("data-precipitation", value.toFixed(1));
      bar.title = `${value.toFixed(1)} mm a las ${hour}:00`;
    } else {
      bar.style.height = "0%";
      bar.style.backgroundColor = "transparent";
      bar.title = `Sin precipitación a las ${hour}:00`;
    }

    barsContainer.appendChild(bar);
  }

  // Add all elements to chart container
  chartContainer.appendChild(yAxis);
  chartContainer.appendChild(barsContainer);
  chartContainer.appendChild(xAxis);
  container.appendChild(chartContainer);
}
// Render day summary
function renderDaySummary(dayData, dayIndex) {
  const dayNames = ["Hoy", "Mañana", "Pasado"];
  const container = document.getElementById(`day-${dayIndex}`);

  if (!dayData) {
    container.innerHTML = `<p class="text-muted">No hay datos disponibles para ${dayNames[dayIndex]}</p>`;
    return;
  }

  const { min, max } = calculateMinMaxTemp(dayData.temperatura);
  const avgTemp = calculateAverageTemp(dayData.temperatura);
  const totalPrecip = calculateTotalPrecipitation(dayData.precipitacion);
  const maxPrecipProb = getMaxPrecipProbability(dayData.probPrecipitacion);
  const maxWindSpeed = getMaxWindSpeed(dayData.vientoAndRachaMax);
  const predominantWindDir = getPredominantWindDirection(
    dayData.vientoAndRachaMax
  );

  container.innerHTML = `
                <div class="row g-3 mb-4">
                    <div class="col-md-4">
                        <div class="weather-card card h-100 bg-primary bg-opacity-10">
                            <div class="card-body">
                                <h3 class="h6 card-title text-primary">
                                    <i class="fas fa-temperature-high me-2"></i> Temperatura
                                </h3>
                                <div class="display-6 text-primary mb-1">${avgTemp}°</div>
                                <div class="small text-muted">
                                    <span class="text-danger">Máx: ${max}°</span> | 
                                    <span class="text-primary">Mín: ${min}°</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="weather-card card h-100 bg-secondary bg-opacity-10">
                            <div class="card-body">
                                <h3 class="h6 card-title text-secondary">
                                    <i class="fas fa-cloud-rain me-2"></i> Precipitación
                                </h3>
                                <div class="display-6 text-secondary mb-1">${totalPrecip} mm</div>
                                <div class="small text-muted">
                                    Probabilidad máxima: ${maxPrecipProb}%
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="weather-card card h-100 bg-info bg-opacity-10">
                            <div class="card-body">
                                <h3 class="h6 card-title text-info">
                                    <i class="fas fa-wind me-2"></i> Viento
                                </h3>
                                <div class="display-6 text-info mb-1">${maxWindSpeed} km/h</div>
                                <div class="small text-muted">
                                    ${
                                      predominantWindDir
                                        ? getWindDirectionIcon(
                                            predominantWindDir
                                          )
                                        : "Dirección no disponible"
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <h3 class="h5 mb-3">Pronóstico por horas</h3>

                <div class="hourly-forecast-${dayIndex} hourly-forecast row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 row-cols-xxl-6 g-3 mb-4">
    <!-- Hourly forecast will be inserted here by JavaScript -->
  </div>

                <h3 class="h5 mb-3">Detalles</h3>
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-body">
                                <h4 class="h6 card-title text-muted mb-3">
                                    <i class="fas fa-percentage me-2"></i> Humedad Relativa
                                </h4>
                                <div class="humidity-chart-${dayIndex} humidity-chart-container">
                                    <!-- Humidity chart will be inserted here by JavaScript -->
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                      <div class="card h-100">
                        <div class="card-body">
                          <h4 class="h6 card-title text-muted mb-3">
                            <i class="fas fa-cloud-rain me-2"></i> Precipitación por Hora
                          </h4>
                          <div class="precipitation-chart-${dayIndex} precipitation-chart-container">
                            <!-- Precipitation chart will be inserted here by JavaScript -->
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
            `;

  // Render hourly forecast for this day
  const hourlyContainer = container.querySelector(
    `.hourly-forecast-${dayIndex}`
  );
  renderHourlyForecast(dayData, hourlyContainer);

  // Render humidity chart for this day
  const humidityContainer = container.querySelector(
    `.humidity-chart-${dayIndex}`
  );
  renderHumidityChart(dayData.humedadRelativa, humidityContainer);

  const precipitationContainer = container.querySelector(
    `.precipitation-chart-${dayIndex}`
  );
  renderPrecipitationChart(dayData.precipitacion, precipitationContainer);
}

// Main function to render all weather data
function renderWeatherData(predicciones) {
  const weatherData = predicciones[0];

  // Show weather container
  document.getElementById("weather-container").classList.remove("d-none");

  // Set location info
  document.getElementById("location-name").textContent = weatherData.nombre;
  document.getElementById("location-province").textContent =
    weatherData.provincia;
  document.getElementById(
    "current-date"
  ).textContent = `Actualizado: ${new Date(
    weatherData.elaborado
  ).toLocaleString()}`;

  // Set sun times for today
  const today = weatherData.prediccion.dia[0];
  document.getElementById(
    "sun-times"
  ).textContent = `Amanecer: ${today.orto} | Atardecer: ${today.ocaso}`;

  // Render today's summary in the main card
  const tempSummary = calculateAverageTemp(today.temperatura);
  const { min, max } = calculateMinMaxTemp(today.temperatura);
  const totalPrecip = calculateTotalPrecipitation(today.precipitacion);
  const maxPrecipProb = getMaxPrecipProbability(today.probPrecipitacion);
  const maxWindSpeed = getMaxWindSpeed(today.vientoAndRachaMax);
  const predominantWindDir = getPredominantWindDirection(
    today.vientoAndRachaMax
  );

  document.getElementById("temp-summary").textContent = `${tempSummary}°`;
  document.getElementById(
    "temp-feels-like"
  ).innerHTML = `<span class="text-danger">Máx: ${max}°</span> | <span class="text-primary">Mín: ${min}°</span>`;
  document.getElementById("precip-summary").textContent = `${totalPrecip} mm`;
  document.getElementById(
    "precip-prob"
  ).textContent = `Probabilidad máxima: ${maxPrecipProb}%`;
  document.getElementById("wind-summary").textContent = `${maxWindSpeed} km/h`;
  document.getElementById("wind-direction").innerHTML = predominantWindDir
    ? getWindDirectionIcon(predominantWindDir)
    : "Dirección no disponible";

  // Render hourly forecast for today
  const hourlyContainer = document.querySelector(".hourly-forecast");
  renderHourlyForecast(today, hourlyContainer);

  // Render humidity chart for today
  const humidityContainer = document.getElementById("humidity-chart");
  renderHumidityChart(today.humedadRelativa, humidityContainer);

  // Render sky status for today
  const skyStatusContainer = document.getElementById("sky-status");
  renderSkyStatus(today.estadoCielo, skyStatusContainer);

  // Render summaries for tomorrow and the day after
  renderDaySummary(weatherData.prediccion.dia[1], 1);
  renderDaySummary(weatherData.prediccion.dia[2], 2);

  // Add tab switching functionality
  document.querySelectorAll(".day-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      // Update active tab
      document.querySelectorAll(".day-tab").forEach((t) => {
        t.classList.remove("active", "btn-primary");
        t.classList.add("btn-outline-secondary");
      });

      this.classList.remove("btn-outline-secondary");
      this.classList.add("active", "btn-primary");

      // Show corresponding content
      document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
      });

      const dayIndex = this.getAttribute("data-day");
      document.getElementById(`day-${dayIndex}`).classList.add("active");
    });
  });
}

// Function to get municipalities based on selected province
const obten_municipios = function (provincia) {
  fetch("../recursos/municipios.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("No se pudo cargar el archivo JSON");
      }
      return response.json();
    })
    .then((data) => {
      const provincia_seleccionada = document.getElementById("provincia").value;
      const datos_provincia = data.filter(
        (m) => m.Provincia === provincia_seleccionada
      );

      const selector_municipio = document.getElementById("municipio");
      selector_municipio.innerHTML =
        '<option value="">Selecciona un municipio</option>';

      datos_provincia.forEach((municipio) => {
        const opcion = document.createElement("option"); // También declarada con const
        opcion.textContent = municipio.Municipio; // Mejor que innerText
        opcion.value = municipio.Codigo;
        selector_municipio.appendChild(opcion);
      });

      selector_municipio.disabled = false;
    })
    .catch((error) => {
      console.error("Error al leer municipios.json:", error);
      // Opcional: Mostrar mensaje al usuario
      const selector_municipio = document.getElementById("municipio");
      selector_municipio.innerHTML =
        '<option value="">Error cargando municipios</option>';
    });
};

// Function to make API request and get weather data
const hacer_peticion_api = function () {
  let codMunicipio = document.getElementById("municipio").value;

  if (!codMunicipio) {
    alert("Por favor, selecciona un municipio");
    return;
  }

  console.log("Consultando datos para municipio:", codMunicipio);

  // Show loading state
  const button = document.getElementById("peticion");
  const originalText = button.innerHTML;
  button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Cargando...';
  button.disabled = true;

  const apiKey =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhaXRvci5kb25hZG9AZ21haWwuY29tIiwianRpIjoiOWVkNGFhYzQtNTI3YS00N2YzLTg5NzMtMTNlNGIxMTE4ZDUxIiwiaXNzIjoiQUVNRVQiLCJpYXQiOjE3MzU4MDY0NTYsInVzZXJJZCI6IjllZDRhYWM0LTUyN2EtNDdmMy04OTczLTEzZTRiMTExOGQ1MSIsInJvbGUiOiIifQ.vNGn79c-G44_Eu8MnrimYDDfHf0il9jILxXeBE2z1AE";
  let url = `https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/horaria/${codMunicipio}?api_key=${apiKey}`;

  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error en la respuesta: " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Datos recibidos de la API:", data);
      // The response has a 'datos' property with the URL for the actual data
      return fetch(data.datos);
    })
    .then((response) => response.json())
    .then((predicciones) => {
      console.log("Predicciones:", predicciones);
      renderWeatherData(predicciones);
    })
    .catch((error) => {
      console.error("Hubo un error en la petición:", error);
      alert(
        "Error al obtener los datos meteorológicos. Por favor, intenta nuevamente."
      );
    })
    .finally(() => {
      // Restore button state
      button.innerHTML = originalText;
      button.disabled = false;
    });
};

// Event listeners
document
  .getElementById("provincia")
  .addEventListener("change", obten_municipios);
document
  .getElementById("peticion")
  .addEventListener("click", hacer_peticion_api);

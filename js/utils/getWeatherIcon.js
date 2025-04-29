// Get weather icon class based on AEMET code
import { weatherIcons } from "../constants/weatherIcons.js";

export function getWeatherIcon(code) {
  const baseCode = code.replace("n", ""); // Remove night indicator for matching
  const isNight = code.includes("n");

  // Default to cloud icon if not found
  return (
    weatherIcons[code] ||
    weatherIcons[baseCode] ||
    (isNight ? "cloud-moon" : "cloud-sun")
  );
}

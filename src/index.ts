import { fetchWeatherApi } from 'openmeteo';
import axios from 'axios';
import cron from 'node-cron';

// Configuration
const LATITUDE = 37.1673;
const LONGITUDE = -87.6925;
const TIMEZONE = 'America/Chicago';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'YOUR_WEBHOOK_URL_HERE'; // Get webhook URL from environment variable or use a placeholder

if (WEBHOOK_URL === 'YOUR_WEBHOOK_URL_HERE') {
  console.warn('Warning: WEBHOOK_URL is not set. Please set it as an environment variable or replace the placeholder.');
}

const fetchForecast = async () => {
  const params = {
    latitude: LATITUDE,
    longitude: LONGITUDE,
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'wind_gusts_10m_max',
      'cloud_cover_mean',
    ],
    models: 'gfs_hrrr',
    current: 'temperature_2m', // Requesting current temperature as well
    timezone: TIMEZONE,
    forecast_days: 1,
    wind_speed_unit: 'mph',
    temperature_unit: 'fahrenheit',
    precipitation_unit: 'inch',
  };
  const url = 'https://api.open-meteo.com/v1/forecast';

  try {
    console.log(`Fetching weather data for ${LATITUDE}, ${LONGITUDE} at ${new Date().toISOString()}`);
    const responses = await fetchWeatherApi(url, params);
    const response = responses[0]; // Process first location

    const utcOffsetSeconds = response.utcOffsetSeconds();
    const current = response.current()!;
    const daily = response.daily()!;

    const weatherData = {
      location: {
        latitude: response.latitude(),
        longitude: response.longitude(),
        timezone: response.timezone(),
        timezoneAbbreviation: response.timezoneAbbreviation(),
        utcOffsetSeconds: utcOffsetSeconds,
      },
      current: {
        time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000).toISOString(),
        temperature2m: current.variables(0)!.value(),
      },
      daily: {
        time: new Date((Number(daily.time()) + utcOffsetSeconds) * 1000).toISOString(), // Using the start time of the daily forecast period
        temperature2mMax: daily.variables(0)!.valuesArray()![0], // Assuming 1 forecast day, take the first value
        temperature2mMin: daily.variables(1)!.valuesArray()![0],
        precipitationProbabilityMax: daily.variables(2)!.valuesArray()![0],
        windGusts10mMax: daily.variables(3)!.valuesArray()![0],
        cloudCoverMean: daily.variables(4)!.valuesArray()![0],
      },
    };

    console.log('Weather data processed:');
    console.log(JSON.stringify(weatherData, null, 2));
    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
};

const sendToWebhook = async (data: any) => {
  if (!data) {
    console.log('No weather data to send.');
    return;
  }
  if (WEBHOOK_URL === 'YOUR_WEBHOOK_URL_HERE') {
    console.warn('Webhook URL is not configured. Skipping sending data.');
    return;
  }

  try {
    console.log(`Sending data to webhook: ${WEBHOOK_URL}`);
    const response = await axios.post(WEBHOOK_URL, data, {
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('Successfully sent data to webhook. Status:', response.status);
  } catch (error: any) {
    console.error('Error sending data to webhook:', error.isAxiosError ? error.message : error);
    if (error.response) {
        console.error('Webhook response data:', error.response.data);
        console.error('Webhook response status:', error.response.status);
        console.error('Webhook response headers:', error.response.headers);
    }
  }
};

const job = async () => {
  console.log('Running daily forecast job...');
  const weatherData = await fetchForecast();
  await sendToWebhook(weatherData);
  console.log('Daily forecast job finished.');
};

// Schedule the job to run at 7 AM every day based on the server's timezone.
// If your Docker container runs in UTC, 7 AM Chicago time (CDT, UTC-5) is 12:00 UTC.
// If it's CST (UTC-6), it's 13:00 UTC.
// For simplicity, this cron job runs at 7:00 AM server time.
// Adjust if your server/container timezone is different from target (America/Chicago).
// To run at 7 AM America/Chicago time, you might need to adjust the cron expression
// or ensure the container's timezone is set to America/Chicago.
// Cron pattern: minute hour day-of-month month day-of-week
// '0 7 * * *' means at 0 minutes past 7 AM, every day.

cron.schedule('0 7 * * *', job, {
  scheduled: true,
  timezone: TIMEZONE // Use the specified timezone for scheduling
});

console.log(`Daily forecast job scheduled to run at 7:00 AM ${TIMEZONE}.`);
console.log(`Webhook URL is configured to: ${WEBHOOK_URL}`);

// For initial testing, you can run the job once immediately:
// job();

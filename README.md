# Daily Weather Forecast Sender

This application fetches the daily weather forecast from the Open-Meteo API and sends it to a specified webhook URL. The task is scheduled to run daily at 7 AM (configurable timezone).

## Prerequisites

*   Docker installed on your system.
*   A webhook URL to receive the forecast data.

## Project Structure

```
daily_forecast/
├── src/
│   └── index.ts       # Main application logic
├── Dockerfile         # Docker configuration
├── package.json       # Project dependencies and scripts
├── tsconfig.json      # TypeScript compiler configuration
└── README.md          # This file
```

## Setup and Running with Docker

1.  **Clone the repository (if applicable) or ensure all files are in your project directory.**

2.  **Configure the Webhook URL:**
    The application expects the webhook URL to be provided via an environment variable `WEBHOOK_URL`.
    You can set this in a few ways:
    *   Modify the `Dockerfile` directly (not recommended for sensitive URLs in shared Dockerfiles):
        ```dockerfile
        ENV WEBHOOK_URL="https://your-actual-webhook-url.com/endpoint"
        ```
    *   Pass it during the `docker run` command (recommended):
        ```bash
        docker run -e WEBHOOK_URL="https://your-actual-webhook-url.com/endpoint" your-image-name
        ```
    *   Use a `.env` file with Docker Compose (if you choose to use it).

3.  **Build the Docker Image:**
    Navigate to the project's root directory (where the `Dockerfile` is located) and run:
    ```bash
    docker build -t daily-forecast-app .
    ```
    This will build the Docker image and tag it as `daily-forecast-app`.

4.  **Run the Docker Container:**
    Once the image is built, you can run it as a container:
    ```bash
    docker run -d --name daily-forecast-container -e WEBHOOK_URL="https://your-actual-webhook-url.com/endpoint" daily-forecast-app
    ```
    *   `-d`: Runs the container in detached mode (in the background).
    *   `--name daily-forecast-container`: Assigns a name to the container for easier management.
    *   `-e WEBHOOK_URL="..."`: Sets the environment variable for your webhook.

5.  **Check Logs (Optional):**
    To see the application logs (e.g., when the cron job runs or if there are errors):
    ```bash
    docker logs daily-forecast-container
    ```
    To follow the logs in real-time:
    ```bash
    docker logs -f daily-forecast-container
    ```

## Local Development (Without Docker)

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set Environment Variable:**
    ```bash
    export WEBHOOK_URL="https://your-actual-webhook-url.com/endpoint"
    ```

3.  **Compile TypeScript:**
    ```bash
    npm run build
    ```

4.  **Run the Application:**
    ```bash
    npm start
    ```
    Or, for development with automatic recompilation (using `ts-node`):
    ```bash
    npm run dev
    ```

## Configuration in `src/index.ts`

*   `LATITUDE`, `LONGITUDE`: Coordinates for the weather forecast.
*   `TIMEZONE`: Timezone for the forecast and cron job scheduling (e.g., `'America/Chicago'`).
*   `WEBHOOK_URL`: The URL to which the forecast data will be POSTed. It's recommended to set this via an environment variable.

The cron job is scheduled for `0 7 * * *` (7:00 AM) in the specified `TIMEZONE`.

## Notes

*   The Open-Meteo API usage in this script is based on the parameters you provided. Adjust `params` in `src/index.ts` if you need different weather variables or settings.
*   Error handling is included for fetching data and sending it to the webhook. Check container logs for any issues.
*   The `Dockerfile` uses a multi-stage build to keep the final image size smaller by not including development dependencies.
*   The `node-cron` library uses the server's system time by default. By specifying the `timezone` option in `cron.schedule`, it will interpret the cron string according to that timezone.
    Ensure your Docker container's system time or the `timezone` setting aligns with your desired 7 AM schedule.

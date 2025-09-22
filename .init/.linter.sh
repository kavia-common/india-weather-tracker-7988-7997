#!/bin/bash
cd /home/kavia/workspace/code-generation/india-weather-tracker-7988-7997/india_weather_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi


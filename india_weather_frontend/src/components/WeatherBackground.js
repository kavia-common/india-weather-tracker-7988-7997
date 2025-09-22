import React, { useEffect, useMemo } from 'react';

/**
 * PUBLIC_INTERFACE
 * WeatherBackground
 * Applies a dynamic background to the page based on the current weather condition or code.
 * Usage:
 * - Provide either `weatherCode` (Open-Meteo code) or `conditionText` (e.g., "Clear", "Overcast").
 * - Optionally pass `scope` = 'document' to apply to body/html instead of a wrapper element.
 *
 * Props:
 * - weatherCode?: number
 * - conditionText?: string
 * - scope?: 'document' | 'container' (default 'container')
 * - children?: React.ReactNode (when using container scope)
 */
export default function WeatherBackground({
  weatherCode,
  conditionText,
  scope = 'container',
  children,
}) {
  const theme = useMemo(
    () => pickBackgroundTheme(weatherCode, conditionText),
    [weatherCode, conditionText]
  );

  useEffect(() => {
    if (scope !== 'document') return;
    // Apply to html/body gradient classes via CSS variables to preserve Ocean Professional look.
    const root = document.documentElement;
    const body = document.body;

    const previous = {
      gradStart: root.style.getPropertyValue('--grad-start'),
      gradEnd: root.style.getPropertyValue('--grad-end'),
      pageBgImage: body.style.backgroundImage,
      pageBgSize: body.style.backgroundSize,
      pageBgPosition: body.style.backgroundPosition,
      pageBgAttachment: body.style.backgroundAttachment,
      pageBgBlendMode: body.style.backgroundBlendMode,
    };

    // Update gradient colors and optional imagery
    root.style.setProperty('--grad-start', theme.gradStart);
    root.style.setProperty('--grad-end', theme.gradEnd);

    if (theme.image) {
      body.style.backgroundImage = `${theme.image}, linear-gradient(180deg, ${theme.gradStart}, ${theme.gradEnd})`;
      body.style.backgroundSize = theme.imageSize || 'cover, auto';
      body.style.backgroundPosition = theme.imagePosition || 'center, center';
      body.style.backgroundAttachment = theme.imageAttachment || 'fixed, scroll';
      body.style.backgroundBlendMode = theme.imageBlendMode || 'multiply, normal';
    } else {
      body.style.backgroundImage = `linear-gradient(180deg, ${theme.gradStart}, ${theme.gradEnd})`;
      body.style.backgroundSize = '';
      body.style.backgroundPosition = '';
      body.style.backgroundAttachment = '';
      body.style.backgroundBlendMode = '';
    }

    return () => {
      // Cleanup restore previous
      root.style.setProperty('--grad-start', previous.gradStart || 'rgba(59,130,246,0.08)');
      root.style.setProperty('--grad-end', previous.gradEnd || 'rgba(249,250,251,1)');
      body.style.backgroundImage = previous.pageBgImage || '';
      body.style.backgroundSize = previous.pageBgSize || '';
      body.style.backgroundPosition = previous.pageBgPosition || '';
      body.style.backgroundAttachment = previous.pageBgAttachment || '';
      body.style.backgroundBlendMode = previous.pageBgBlendMode || '';
    };
  }, [scope, theme.gradStart, theme.gradEnd, theme.image, theme.imageSize, theme.imagePosition, theme.imageAttachment, theme.imageBlendMode]);

  if (scope === 'document') {
    return children || null;
  }

  // Container-scoped background wrapper
  const wrapperStyle = {
    backgroundImage: theme.image
      ? `${theme.image}, linear-gradient(180deg, ${theme.gradStart}, ${theme.gradEnd})`
      : `linear-gradient(180deg, ${theme.gradStart}, ${theme.gradEnd})`,
    backgroundSize: theme.image ? (theme.imageSize || 'cover, auto') : 'auto',
    backgroundPosition: theme.image ? (theme.imagePosition || 'center, center') : 'center',
    backgroundAttachment: theme.image ? (theme.imageAttachment || 'fixed, scroll') : 'scroll',
    backgroundBlendMode: theme.image ? (theme.imageBlendMode || 'multiply, normal') : 'normal',
    minHeight: '100%',
    width: '100%',
  };

  return <div style={wrapperStyle}>{children}</div>;
}

/**
 * PUBLIC_INTERFACE
 * pickBackgroundTheme
 * Selects a photographic "live sky" background and overlay settings that match the
 * current weather. Uses images located under /public/assets/backgrounds/live_skies/.
 * Ensures high readability with multiply/overlay blending and adaptive tints.
 */
export function pickBackgroundTheme(code, text) {
  const normalized = (text || '').toLowerCase();

  // Group codes based on Open-Meteo documentation
  const groups = {
    clear: new Set([0, 1]),
    cloudy: new Set([2, 3]),
    fog: new Set([45, 48]),
    drizzle: new Set([51, 53, 55, 56, 57]),
    rain: new Set([61, 63, 65, 66, 67, 80, 81, 82]),
    snow: new Set([71, 73, 75, 77, 85, 86]),
    thunder: new Set([95, 96, 99]),
  };

  let kind = 'clear';
  if (typeof code === 'number') {
    if (groups.clear.has(code)) kind = 'clear';
    else if (groups.cloudy.has(code)) kind = 'cloudy';
    else if (groups.fog.has(code)) kind = 'fog';
    else if (groups.drizzle.has(code)) kind = 'drizzle';
    else if (groups.rain.has(code)) kind = 'rain';
    else if (groups.snow.has(code)) kind = 'snow';
    else if (groups.thunder.has(code)) kind = 'thunder';
  } else if (normalized) {
    if (/\b(thunder|storm)\b/.test(normalized)) kind = 'thunder';
    else if (/\brain|shower|drizzle\b/.test(normalized)) kind = 'rain';
    else if (/\bsnow|sleet\b/.test(normalized)) kind = 'snow';
    else if (/\bfog|mist\b/.test(normalized)) kind = 'fog';
    else if (/\bovercast|cloud\b/.test(normalized)) kind = 'cloudy';
    else kind = 'clear';
  }

  // Time-of-day tinting for subtle realism (dawn/dusk warmer, night darker)
  const hour = new Date().getHours();
  const isNight = hour >= 20 || hour < 5;
  const isDawnDusk = (hour >= 5 && hour < 8) || (hour >= 17 && hour < 20);

  const base = {
    imageSize: 'cover, auto',
    imagePosition: 'center, center',
    imageAttachment: 'fixed, scroll',
  };

  // Base overlays for readability
  const overlays = {
    strongDark: { gradStart: 'rgba(2,6,23,0.55)', gradEnd: 'rgba(15,23,42,0.45)', imageBlendMode: 'multiply, normal' },
    dark: { gradStart: 'rgba(17,24,39,0.45)', gradEnd: 'rgba(17,24,39,0.25)', imageBlendMode: 'multiply, normal' },
    blue: { gradStart: 'rgba(29,78,216,0.35)', gradEnd: 'rgba(59,130,246,0.22)', imageBlendMode: 'multiply, normal' },
    rain: { gradStart: 'rgba(30,58,138,0.55)', gradEnd: 'rgba(2,6,23,0.35)', imageBlendMode: 'multiply, normal' },
    thunder: { gradStart: 'rgba(2,6,23,0.65)', gradEnd: 'rgba(30,27,75,0.55)', imageBlendMode: 'overlay, normal' },
    fog: { gradStart: 'rgba(17,24,39,0.40)', gradEnd: 'rgba(17,24,39,0.18)', imageBlendMode: 'multiply, normal' },
    snow: { gradStart: 'rgba(15,23,42,0.28)', gradEnd: 'rgba(241,245,249,0.30)', imageBlendMode: 'multiply, normal' },
  };

  // Dawn/dusk warmth
  const warmTint = isDawnDusk ? { gradStart: 'rgba(245,158,11,0.22)', gradEnd: 'rgba(59,130,246,0.20)', imageBlendMode: 'overlay, normal' } : null;
  // Night darkening
  const nightTint = isNight ? { gradStart: 'rgba(2,6,23,0.60)', gradEnd: 'rgba(2,6,23,0.40)', imageBlendMode: 'multiply, normal' } : null;

  const withTint = (overlay) => {
    if (isNight) {
      return { ...overlay, ...(nightTint || {}) };
    }
    if (isDawnDusk) {
      // Blend slightly warmer at edges while keeping readability
      return { ...overlay, gradStart: warmTint.gradStart, gradEnd: overlay.gradEnd, imageBlendMode: overlay.imageBlendMode };
    }
    return overlay;
  };

  // Map each kind to a live sky image (photo) in /assets/backgrounds/live_skies/
  switch (kind) {
    case 'cloudy':
      return {
        ...base,
        ...withTint(overlays.dark),
        image: 'url("/assets/backgrounds/live_skies/sky_cloudy_overcast.jpg")',
      };
    case 'fog':
      return {
        ...base,
        ...withTint(overlays.fog),
        image: 'url("/assets/backgrounds/live_skies/sky_fog_mist.jpg")',
      };
    case 'drizzle':
      return {
        ...base,
        ...withTint(overlays.rain),
        image: 'url("/assets/backgrounds/live_skies/sky_drizzle.jpg")',
      };
    case 'rain':
      return {
        ...base,
        ...withTint(overlays.rain),
        image: 'url("/assets/backgrounds/live_skies/sky_rain_showers.jpg")',
      };
    case 'snow':
      return {
        ...base,
        ...withTint(overlays.snow),
        image: 'url("/assets/backgrounds/live_skies/sky_snow.jpg")',
      };
    case 'thunder':
      return {
        ...base,
        ...withTint(overlays.thunder),
        image: 'url("/assets/backgrounds/live_skies/sky_thunderstorm.jpg")',
      };
    case 'clear':
    default:
      return {
        ...base,
        ...withTint(overlays.blue),
        image: 'url("/assets/backgrounds/live_skies/sky_clear_sunny.jpg")',
      };
  }
}

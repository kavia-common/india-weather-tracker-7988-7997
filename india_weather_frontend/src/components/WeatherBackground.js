import React, { useEffect } from 'react';

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
  const theme = pickBackgroundTheme(weatherCode, conditionText);

  useEffect(() => {
    if (scope !== 'document') return;
    // Apply to html/body gradient classes via CSS variables to preserve Ocean Professional look.
    const root = document.documentElement;
    const body = document.body;

    const previous = {
      bg: root.style.getPropertyValue('--bg'),
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
      body.style.backgroundBlendMode = theme.imageBlendMode || 'overlay, normal';
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
    backgroundBlendMode: theme.image ? (theme.imageBlendMode || 'overlay, normal') : 'normal',
    minHeight: '100%',
    width: '100%',
  };

  return <div style={wrapperStyle}>{children}</div>;
}

// PUBLIC_INTERFACE
export function pickBackgroundTheme(code, text) {
  /**
   * Returns a style descriptor for background selection:
   * {
   *   gradStart, gradEnd, image?, imageSize?, imagePosition?, imageAttachment?, imageBlendMode?
   * }
   */
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

  // Use modern gradients with royalty-free imagery from /public/assets/backgrounds.
  // We apply a semi-transparent dark overlay via backgroundBlendMode to ensure text readability.
  // Note: public assets are served from root as /assets/...
  switch (kind) {
    case 'cloudy':
      return {
        gradStart: 'rgba(17,24,39,0.40)', // dark overlay for contrast
        gradEnd: 'rgba(17,24,39,0.15)',
        image: 'url("/assets/backgrounds/cloudy.jpg")',
        imageSize: 'cover, auto',
        imagePosition: 'center, center',
        imageAttachment: 'fixed, scroll',
        imageBlendMode: 'multiply, normal',
      };
    case 'fog':
      return {
        gradStart: 'rgba(17,24,39,0.35)',
        gradEnd: 'rgba(17,24,39,0.15)',
        image: 'url("/assets/backgrounds/fog.jpg")',
        imageSize: 'cover, auto',
        imagePosition: 'center, center',
        imageAttachment: 'fixed, scroll',
        imageBlendMode: 'multiply, normal',
      };
    case 'drizzle':
      return {
        gradStart: 'rgba(37,99,235,0.35)', // blue tint for drizzle
        gradEnd: 'rgba(17,24,39,0.15)',
        image: 'url("/assets/backgrounds/rain.jpg")',
        imageSize: 'cover, auto',
        imagePosition: 'center, center',
        imageAttachment: 'fixed, scroll',
        imageBlendMode: 'overlay, normal',
      };
    case 'rain':
      return {
        gradStart: 'rgba(30,58,138,0.55)', // darker blue overlay
        gradEnd: 'rgba(2,6,23,0.35)',
        image: 'url("/assets/backgrounds/rain.jpg")',
        imageSize: 'cover, auto',
        imagePosition: 'center, center',
        imageAttachment: 'fixed, scroll',
        imageBlendMode: 'multiply, normal',
      };
    case 'snow':
      return {
        gradStart: 'rgba(15,23,42,0.30)',
        gradEnd: 'rgba(248,250,252,0.30)',
        image: 'url("/assets/backgrounds/snow.jpg")',
        imageSize: 'cover, auto',
        imagePosition: 'center, center',
        imageAttachment: 'fixed, scroll',
        imageBlendMode: 'multiply, normal',
      };
    case 'thunder':
      return {
        gradStart: 'rgba(2,6,23,0.65)',
        gradEnd: 'rgba(30,27,75,0.55)',
        image: 'url("/assets/backgrounds/thunder.jpg")',
        imageSize: 'cover, auto',
        imagePosition: 'center, center',
        imageAttachment: 'fixed, scroll',
        imageBlendMode: 'overlay, normal',
      };
    case 'clear':
    default:
      return {
        gradStart: 'rgba(29,78,216,0.30)', // blue overlay
        gradEnd: 'rgba(59,130,246,0.18)',
        image: 'url("/assets/backgrounds/sunny.jpg")',
        imageSize: 'cover, auto',
        imagePosition: 'center, center',
        imageAttachment: 'fixed, scroll',
        imageBlendMode: 'multiply, normal',
      };
  }
}

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`;
}

function trimLeadingSlash(value: string) {
  return value.startsWith('/') ? value.slice(1) : value;
}

export function joinBaseUrl(baseUrl: string, path: string) {
  return `${trimTrailingSlash(baseUrl)}${trimLeadingSlash(path)}`;
}

export function getManifestHref(baseUrl: string) {
  return joinBaseUrl(baseUrl, 'manifest.webmanifest');
}

export function getServiceWorkerHref(baseUrl: string) {
  return joinBaseUrl(baseUrl, 'sw.js');
}

export function canRegisterServiceWorker() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

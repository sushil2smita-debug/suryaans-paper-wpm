import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// KILL ALL SERVICE WORKERS — prevents stale cache on desktop browsers
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
      console.log("Service Worker unregistered:", registration);
    }
  });
  // Also clear all caches
  if ("caches" in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
        console.log("Cache cleared:", cacheName);
      });
    });
  }
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

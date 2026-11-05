/**
 * CloudNova API Configuration
 * Supports VITE_API_URL environment variable with automatic fallbacks:
 * - Production: Render backend (https://cloudnova-api.onrender.com)
 * - Development: Local backend (http://127.0.0.1:8000)
 */

const rawUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://cloudnova-api.onrender.com"
    : "http://127.0.0.1:8000");

export const API_BASE_URL = rawUrl.replace(/\/+$/, "");

export default API_BASE_URL;

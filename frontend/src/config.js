// The backend URL should be set via REACT_APP_API_URL environment variable
// For local development, it defaults to http://127.0.0.1:8000
// For production, set REACT_APP_API_URL to your deployed backend URL
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'; 
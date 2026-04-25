const RAW_API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");

export const buildApiUrl = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export { API_BASE_URL };

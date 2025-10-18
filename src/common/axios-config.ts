import axios from "axios";

// Create axios instance with default config
const apiClient = axios.create({
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token provider functions
let getAccessToken: (() => Promise<string | null>) | null = null;
let getIdToken: (() => Promise<string | null>) | null = null;

// Set token providers (from MSAL or any auth context)
export const setTokenProviders = (providers: {
  getAccessToken?: () => Promise<string | null>;
  getIdToken?: () => Promise<string | null>;
}) => {
  if (providers.getAccessToken) getAccessToken = providers.getAccessToken;
  if (providers.getIdToken) getIdToken = providers.getIdToken;
};

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
  
    const isUserMicroservice =
      config.url?.includes("/user") || config.url?.includes("/users");

    // Add appropriate token
    if (isUserMicroservice && getIdToken) {
      const idToken = await getIdToken();
      console.log(idToken,'Id token is this')
      if (idToken) {
        config.headers["X-User-IdToken"] = idToken;
        delete config.headers.Authorization;
      }
    } else if (getAccessToken) {
      const accessToken = await getAccessToken();
    console.log(accessToken,'access token')
      if (accessToken) {
          console.log(accessToken,'access token')
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized – redirecting to login...");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;

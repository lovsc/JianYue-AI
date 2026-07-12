import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = Boolean(localStorage.getItem('access_token'))
      localStorage.removeItem('access_token')
      localStorage.removeItem('current_user')
      if (hadToken) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
        if (window.location.pathname !== '/') window.location.replace('/')
      }
    }
    return Promise.reject(error)
  },
)

export default http

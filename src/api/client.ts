import axios from 'axios'

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : 'https://localhost:7292/api')

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

import http from './http'

export const register = (credentials) => http.post('/auth/register', credentials)
export const login = (credentials) => http.post('/auth/login', credentials)
export const getCurrentUser = () => http.get('/users/me')
export const updateProfile = (profile) => http.patch('/users/me', profile)
export const changePassword = (payload) => http.post('/users/me/password', payload)

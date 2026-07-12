import http from './http'

export const listSessions = () => http.get('/chat/sessions')
export const getSession = (id) => http.get(`/chat/sessions/${id}`)
export const createSession = (payload) => http.post('/chat/sessions', payload)
export const deleteSession = (id) => http.delete(`/chat/sessions/${id}`)

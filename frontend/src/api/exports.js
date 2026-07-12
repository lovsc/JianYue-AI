import http from './http'

export const listExports = () => http.get('/exports')
export const createExport = (payload) => http.post('/exports', payload)

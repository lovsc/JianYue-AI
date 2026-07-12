import http from './http'

export const listJobs = () => http.get('/jobs')
export const createJob = (payload) => http.post('/jobs', payload)
export const updateJob = (id, payload) => http.patch(`/jobs/${id}`, payload)
export const deleteJob = (id) => http.delete(`/jobs/${id}`)
export const listAnalyses = () => http.get('/analyses')
export const runAnalysis = (payload) => http.post('/analyses', payload, { timeout: 130000 })
export const getAnalysis = (id) => http.get(`/analyses/${id}`)
export const applySuggestion = (id, payload) => http.post(`/analyses/${id}/apply`, payload)

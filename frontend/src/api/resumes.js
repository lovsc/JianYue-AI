import http from './http'

export const listResumes = () => http.get('/resumes')
export const getResume = (id) => http.get(`/resumes/${id}`)
export const createResume = (payload) => http.post('/resumes', payload)
export const updateResume = (id, payload) => http.patch(`/resumes/${id}`, payload)
export const deleteResume = (id) => http.delete(`/resumes/${id}`)
export const listResumeVersions = (id) => http.get(`/resumes/${id}/versions`)
export const createResumeVersion = (id, payload) => http.post(`/resumes/${id}/versions`, payload)
export const restoreResumeVersion = (id, versionId, expectedRevision) =>
  http.post(`/resumes/${id}/versions/${versionId}/restore`, { expectedRevision })
export const getResumeVersion = (id, versionId) => http.get(`/resumes/${id}/versions/${versionId}`)

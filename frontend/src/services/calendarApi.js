import api from './api';

const calendarApi = {
  listEvents: (params = {}) => api.get('/calendar', { params }),
  getUpcoming: (limit = 10) => api.get('/calendar/upcoming', { params: { limit } }),
  getEvent: (id) => api.get(`/calendar/${id}`),
  createEvent: (payload) => api.post('/calendar', payload),
  createFromParticipant: (payload) => api.post('/calendar/from-participant', payload),
  updateEvent: (id, payload) => api.put(`/calendar/${id}`, payload),
  updateStatus: (id, status) => api.patch(`/calendar/${id}/status`, { status }),
  deleteEvent: (id) => api.delete(`/calendar/${id}`),
  rsvp: (id, response) => api.post(`/calendar/${id}/rsvp`, { response }),
  listTasks: (params = {}) => api.get('/tasks', { params }),
  createTask: (payload) => api.post('/tasks', payload),
  updateTask: (id, payload) => api.put(`/tasks/${id}`, payload),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
};

export default calendarApi;
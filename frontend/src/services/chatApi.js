import api from './api';

const chatApi = {
  getMessages: (connectionId, params = {}) =>
    api.get(`/chat/${connectionId}`, { params }),

  sendMessage: (connectionId, data) =>
    api.post(`/chat/${connectionId}`, data),

  markAsRead: (connectionId) =>
    api.patch(`/chat/${connectionId}/read`),

  getUnreadCount: () =>
    api.get('/chat/unread-count'),
};

export default chatApi;
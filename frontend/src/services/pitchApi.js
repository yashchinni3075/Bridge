import api from './api';

export const evaluatePitchDeck = async () => {
  const res = await api.post('/startups/evaluate-pitch', { pitchText: '', inputSource: 'PITCH_DECK' });
  return res.data;
};

export const uploadPitchDeck = async (file, onProgress) => {
  const data = new FormData();
  data.append('pitchDeck', file);
  const res = await api.post('/startups/pitch-deck', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  });
  return res.data;
};

export const getPitchEvaluations = async ({ page = 1, limit = 20 } = {}) => {
  const res = await api.get('/startups/pitch-evaluations', { params: { page, limit } });
  return res.data;
};
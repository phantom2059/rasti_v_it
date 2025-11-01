import axios from 'axios';

// Base URL для API (в будущем заменить на реальный)
const BASE_URL = 'http://localhost:8000/api';

// Создаем axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock функция загрузки файла (пока бэка нет)
export const uploadFile = async (file, onProgress) => {
  // Имитация загрузки и обработки (~30 секунд)
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      if (onProgress) {
        onProgress(progress);
      }
      if (progress >= 100) {
        clearInterval(interval);
        // Возвращаем mock результат
        resolve({
          success: true,
          id: `result-${Date.now()}`,
          message: 'Файл успешно обработан',
        });
      }
    }, 300); // 300ms на каждый 1% = 30 секунд всего
  });
};

// Mock функция получения результатов
export const getResults = async (id) => {
  // Имитация запроса к API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id,
        filename: 'exam_sample.csv',
        totalRecords: 150,
        averageScore: 1.7,
        distribution: {
          score1: 45,
          score2: 105,
        },
        records: Array.from({ length: 20 }, (_, i) => ({
          examId: `3373${871 + i}`,
          questionId: `3062${5752 + i}`,
          score: Math.random() > 0.3 ? 2 : 1,
          transcription: `Пример ответа студента ${i + 1}...`,
        })),
      });
    }, 500);
  });
};

// Mock функция получения истории
export const getHistory = async (userId) => {
  // В реальности это будет API запрос
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        history: [
          {
            id: 'sample-001',
            filename: 'exam_sample.csv',
            uploadedAt: new Date().toISOString(),
            status: 'completed',
            totalRecords: 150,
            averageScore: 1.7,
          },
        ],
      });
    }, 300);
  });
};

// Реальный API запрос (когда бэк будет готов)
export const uploadFileAPI = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const getResultsAPI = async (id) => {
  try {
    const response = await apiClient.get(`/results/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching results:', error);
    throw error;
  }
};

export const getHistoryAPI = async () => {
  try {
    const response = await apiClient.get('/history');
    return response.data;
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
};

export default apiClient;


import axios from 'axios';

// Base URL для API: используем относительный путь и прокси Vite
const BASE_URL = '/api';

// Создаем axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 86400000, // 24 часа для длительных операций (86400000 мс = 24 часа)
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
export const uploadFileAPI = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 86400000, // 24 часа
      onUploadProgress: (progressEvent) => {
        if (!onProgress || !progressEvent.total) return;
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
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
    const response = await apiClient.get(`/results/${id}`, {
      timeout: 86400000, // 24 часа
    });
    return response.data;
  } catch (error) {
    console.error(`[getResultsAPI] Ошибка получения результата ${id}:`, error.message);
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

// Глобальный счетчик активных поллингов для предотвращения дублей
const activePolling = new Map();

export const pollResultsAPI = async (id, { intervalMs = 3000, maxAttempts = 28800, onProgress } = {}) => {
  // Проверяем, не запущен ли уже поллинг для этого ID
  if (activePolling.has(id)) {
    console.warn(`[pollResultsAPI] Поллинг для ${id} уже запущен, игнорируем дубликат`);
    throw new Error('Поллинг уже запущен для этого ID');
  }

  activePolling.set(id, true);
  console.log(`[pollResultsAPI] Начало поллинга для ${id}, интервал: ${intervalMs}мс, максимум попыток: ${maxAttempts}`);
  
  let attempts = 0;
  let lastError = null;
  
  try {
    while (attempts < maxAttempts) {
      try {
        if (attempts % 10 === 0 && attempts > 0) {
          console.log(`[pollResultsAPI] ${id}: попытка ${attempts}/${maxAttempts} (${(attempts * intervalMs / 1000 / 60).toFixed(1)} минут прошло)`);
        }
        const data = await getResultsAPI(id);
      
        // Обработка прогресса на основе статуса
        if (onProgress) {
          if (data.status === 'queued') {
            onProgress(5); // Файл загружен, очередь
          } else if (data.status === 'processing') {
            // Если обрабатывается, предполагаем прогресс 20-90%
            // Будем увеличивать постепенно
            const baseProgress = 20 + Math.min(70, Math.floor(attempts / 10));
            onProgress(baseProgress);
          } else if (data.status === 'completed') {
            onProgress(100);
          }
        }
        
        if (data.status === 'completed') {
          // Убеждаемся, что результат действительно готов
          if (data.downloadUrl || data.totalRecords !== null) {
            console.log(`[pollResultsAPI] ${id}: результат готов после ${attempts} попыток`);
            activePolling.delete(id);
            return data;
          }
        }
        if (data.status === 'failed') {
          throw new Error('Обработка завершилась с ошибкой');
        }
        
        lastError = null; // Сбрасываем ошибку при успешном запросе
        await new Promise((r) => setTimeout(r, intervalMs));
        attempts += 1;
      } catch (error) {
        lastError = error;
        // Если это не критическая ошибка (например, временная проблема сети), продолжаем
        if (error.response && error.response.status >= 500) {
          // Серверная ошибка - продолжаем попытки
          console.warn(`[pollResultsAPI] Ошибка сервера (попытка ${attempts + 1}/${maxAttempts}):`, error.message);
          await new Promise((r) => setTimeout(r, intervalMs * 2)); // Удваиваем интервал при ошибке
          attempts += 1;
          continue;
        } else if (error.response && error.response.status === 404) {
          // Результат еще не создан - это нормально, продолжаем
          await new Promise((r) => setTimeout(r, intervalMs));
          attempts += 1;
          continue;
        } else {
          // Другая ошибка - пробуем еще раз, но не более нескольких раз подряд
          if (attempts < 10) {
            console.warn(`[pollResultsAPI] Временная ошибка (попытка ${attempts + 1}/${maxAttempts}):`, error.message);
            await new Promise((r) => setTimeout(r, intervalMs));
            attempts += 1;
            continue;
          }
        }
        // Если слишком много ошибок подряд или критическая ошибка
        throw error;
      }
    }
    
    // Если достигли максимума попыток, проверяем последний статус
    try {
      console.log(`[pollResultsAPI] ${id}: достигнут максимум попыток, финальная проверка...`);
      const finalData = await getResultsAPI(id);
      if (finalData.status === 'completed') {
        activePolling.delete(id);
        return finalData;
      }
    } catch (e) {
      console.warn(`[pollResultsAPI] ${id}: финальная проверка не удалась:`, e.message);
    }
    
    activePolling.delete(id);
    throw new Error(`Таймаут ожидания результата (${maxAttempts * intervalMs / 1000 / 60 / 60} часов)`);
  } finally {
    // Убеждаемся, что очищаем запись даже при ошибке
    activePolling.delete(id);
  }
};

export const getDownloadUrl = (id) => `${BASE_URL}/results/${id}/download`;

export default apiClient;


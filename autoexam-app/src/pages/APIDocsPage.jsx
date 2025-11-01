import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Code, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const APIDocsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Скопировано в буфер обмена');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const endpoints = [
    {
      method: 'POST',
      path: '/api/upload',
      description: 'Загрузка файла для обработки',
      request: `curl -X POST http://localhost:8000/api/upload \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@exam_data.csv"`,
      response: `{
  "success": true,
  "id": "result-1234567890",
  "message": "Файл успешно загружен и обрабатывается"
}`,
    },
    {
      method: 'GET',
      path: '/api/results/:id',
      description: 'Получение результатов обработки',
      request: `curl -X GET http://localhost:8000/api/results/result-1234567890`,
      response: `{
  "id": "result-1234567890",
  "filename": "exam_data.csv",
  "totalRecords": 150,
  "averageScore": 1.7,
  "distribution": {
    "score1": 45,
    "score2": 105
  },
  "records": [
    {
      "examId": "3373871",
      "questionId": "30625752",
      "score": 2,
      "transcription": "Ответ студента..."
    }
  ]
}`,
    },
    {
      method: 'GET',
      path: '/api/history',
      description: 'Получение истории обработок',
      request: `curl -X GET http://localhost:8000/api/history \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      response: `{
  "history": [
    {
      "id": "result-1234567890",
      "filename": "exam_data.csv",
      "uploadedAt": "2025-01-20T14:30:00Z",
      "status": "completed",
      "totalRecords": 150,
      "averageScore": 1.7
    }
  ]
}`,
    },
  ];

  const errorCodes = [
    { code: '200', description: 'Успешный запрос' },
    { code: '400', description: 'Неверный формат запроса или файла' },
    { code: '401', description: 'Не авторизован' },
    { code: '404', description: 'Ресурс не найден' },
    { code: '500', description: 'Внутренняя ошибка сервера' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-x-hidden flex flex-col"
    >
      {/* Фоновые круги */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-xl opacity-90 dark:opacity-50 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-orange-200 dark:bg-orange-900 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-xl opacity-90 dark:opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute top-20 left-20 w-56 sm:w-72 h-56 sm:h-72 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-xl opacity-90 dark:opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto max-w-5xl px-6 lg:px-8 xl:px-12 py-4 flex justify-between items-center">
          <button onClick={() => navigate("/")} className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">Σ</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">AutoExam</h1>
          </button>

          <nav className="hidden md:flex items-center space-x-4">
            <button onClick={() => navigate("/")} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Главная
            </button>
            <button onClick={() => navigate("/our-team")} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Наша команда
            </button>
            <button onClick={() => navigate("/about")} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              О проекте
            </button>
            {isAuthenticated ? (
              <button onClick={() => navigate("/profile")} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                {user?.name || 'Профиль'}
              </button>
            ) : (
              <button onClick={() => navigate("/login")} className="bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
                Войти
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* API Documentation */}
      <section className="relative z-10 px-6 lg:px-8 xl:px-12 py-12 flex-grow">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <div className="flex justify-center mb-4">
              <Code className="w-16 h-16 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              API Документация
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Интеграция AutoExam в ваши приложения
            </p>
          </motion.div>

          {/* Base URL */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Базовый URL
            </h2>
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg font-mono text-sm">
              <code className="text-blue-600 dark:text-blue-400">http://localhost:8000/api</code>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              * В продакшене используйте ваш доменный URL
            </p>
          </motion.div>

          {/* Endpoints */}
          <div className="space-y-6">
            {endpoints.map((endpoint, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * (index + 4) }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className={`px-3 py-1 rounded-md font-semibold text-sm ${
                    endpoint.method === 'GET'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-lg font-mono text-gray-800 dark:text-gray-200">
                    {endpoint.path}
                  </code>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {endpoint.description}
                </p>

                {/* Request */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                      Пример запроса:
                    </h4>
                    <button
                      onClick={() => copyToClipboard(endpoint.request, `req-${index}`)}
                      className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {copiedIndex === `req-${index}` ? (
                        <>
                          <Check className="w-4 h-4" />
                          Скопировано
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Копировать
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm text-green-400">
                      <code>{endpoint.request}</code>
                    </pre>
                  </div>
                </div>

                {/* Response */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                      Пример ответа:
                    </h4>
                    <button
                      onClick={() => copyToClipboard(endpoint.response, `res-${index}`)}
                      className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {copiedIndex === `res-${index}` ? (
                        <>
                          <Check className="w-4 h-4" />
                          Скопировано
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Копировать
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm text-blue-400">
                      <code>{endpoint.response}</code>
                    </pre>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Error Codes */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Коды ответов
            </h2>
            <div className="space-y-2">
              {errorCodes.map((error, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {error.code}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {error.description}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-800 dark:bg-gray-900 text-white py-12 px-6 lg:px-8 xl:px-12">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <button onClick={() => navigate("/")} className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">Σ</span>
              </div>
              <span className="text-lg font-semibold">AutoExam</span>
            </button>
            <nav className="flex items-center space-x-6">
              <button onClick={() => navigate("/faq")} className="text-gray-300 hover:text-white transition-colors">
                FAQ
              </button>
              <button onClick={() => navigate("/about")} className="text-gray-300 hover:text-white transition-colors">
                О проекте
              </button>
              <button onClick={() => navigate("/our-team")} className="text-gray-300 hover:text-white transition-colors">
                Наша команда
              </button>
            </nav>
            <div className="text-sm text-gray-400">
              © 2025 AutoExam
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default APIDocsPage;


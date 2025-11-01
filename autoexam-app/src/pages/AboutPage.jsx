import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AboutPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-x-hidden flex flex-col"
    >
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-xl opacity-90 dark:opacity-50 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-orange-200 dark:bg-orange-900 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-xl opacity-90 dark:opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute top-20 left-20 w-56 sm:w-72 h-56 sm:h-72 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-xl opacity-90 dark:opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      {/* Шапка */}
      <header className="relative z-10 bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto max-w-5xl px-6 lg:px-8 xl:px-12 py-4 flex justify-between items-center">
          <button onClick={() => navigate("/")} className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">Σ</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">AutoExam</h1>
          </button>

          <nav className="flex items-center space-x-4">
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

      {/* Заголовок */}
      <section className="relative z-10 pt-12 sm:pt-20 pb-12 px-6 lg:px-8 xl:px-12">
        <div className="container mx-auto max-w-5xl">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="relative"
          >
            {/* Градиентный бекграунд */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg opacity-80"></div>
            <div className="relative z-10 text-center py-12 sm:py-16 px-4 sm:px-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                О платформе
              </h1>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Окно — теперь на переднем плане, вне градиентного блока */}
      <section className="relative z-20 -mt-12 px-6 lg:px-8 xl:px-12">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-2 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-4 bg-transparent"></div>
              </div>
              <div className="flex space-x-1">
                <div className="w-4 h-4 bg-transparent"></div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-b-lg">
              <div className="grid grid-cols-5 gap-0">
                {[...Array(15)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-20 ${i % 2 === 0 ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} border border-gray-200 dark:border-gray-700`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Три поля с текстом */}
      <section className="relative z-10 py-12 sm:py-20 px-6 lg:px-8 xl:px-12 flex-grow">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8 sm:mb-12 text-center">
            Из чего состоит наше решение?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Бекенд */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 transition-all">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Backend</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Основа веб-сервиса: без бекенд-составляющей невозможен хост и запуск
              </p>
            </div>

            {/* ML */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 transition-all">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">ML</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Важнейшая часть решения - именно ML составляющая позволяет с высокой точностью выставить оценки участникам экзамена
              </p>
            </div>

            {/* Фронтенд */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 transition-all">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Frontend</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Отвечает за UI/UX - восприятие интерфейса пользователем. Ключевой показатель "успешного" сервиса - дружелюбный и понятный интерфейс
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Подвал */}
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

export default AboutPage;
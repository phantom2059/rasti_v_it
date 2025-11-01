import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

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
          </nav>
        </div>
      </header>

      {/* 404 Content */}
      <section className="relative z-10 flex items-center justify-center px-6 lg:px-8 xl:px-12 py-20 flex-grow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-9xl font-bold text-blue-600 dark:text-blue-400 mb-4">404</h1>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Страница не найдена
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              К сожалению, запрашиваемая страница не существует
            </p>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Home className="w-5 h-5" />
            На главную
          </motion.button>
        </motion.div>
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

export default NotFoundPage;


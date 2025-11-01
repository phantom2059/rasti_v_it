import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import FileUpload from '../components/FileUpload';
import { uploadFile } from '../services/api';
import mlImageLight from '../../images/ml_light.png';
import mlImageDark from '../../images/ml_dark.png';
import backendImageLight from '../../images/back_light.png';
import backendImageDark from '../../images/back_dark.png';
import frontendImageLight from '../../images/front_light.png';
import frontendImageDark from '../../images/front_dark.png';

const MainPage = () => {
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();

  const handleFileSelect = async (file) => {
    setIsProcessing(true);
    try {
      const result = await uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });
      
      toast.success('Файл успешно обработан!');
      setIsProcessing(false);
      setIsUploadModalVisible(false);
      setUploadProgress(0);
      
      // В будущем перенаправим на страницу результатов
      // navigate(`/results/${result.id}`);
    } catch (error) {
      toast.error('Ошибка при обработке файла');
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

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
      <header className={`relative z-10 bg-white dark:bg-gray-800 shadow-sm ${isUploadModalVisible ? 'blur-sm' : ''}`}>
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

          {/* Меню */}
          <button className="md:hidden text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Заголовок и кнопки */}
      <section className={`relative z-10 pt-8 sm:pt-16 pb-12 sm:pb-20 px-6 lg:px-8 xl:px-12 ${isUploadModalVisible ? 'blur-sm' : ''}`}>
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="lg:w-1/2 w-full">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                Автоматическая проверка экзамена
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-6 sm:mb-8">
                Сервис автопроверки экзамена по русскому языку для иностранных граждан
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsUploadModalVisible(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-900 shadow-lg transition-all"
                >
                  Быстрый старт
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/about")}
                  className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-md"
                >
                  Узнать больше
                </motion.button>
              </div>
            </div>
            <div className="lg:w-1/2 w-full">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
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
                      <div key={i} className={`h-20 ${i % 2 === 0 ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} border border-gray-200 dark:border-gray-600`}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Карточки */}
      <section className={`relative z-10 py-12 sm:py-20 px-6 lg:px-8 xl:px-12 flex-grow ${isUploadModalVisible ? 'blur-sm' : ''}`}>
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8 sm:mb-12 text-center">
            Как работает наше решение?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Карточка ML */}
            <motion.div
              whileHover={{ y: -10, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 transition-all cursor-pointer"
            >
              <div className="mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                <img 
                  src={theme === 'dark' ? mlImageDark : mlImageLight} 
                  alt="ML Solution" 
                  className="w-full h-48 object-contain rounded-lg" 
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">ML - решение</h3>
              <p className="text-gray-600 dark:text-gray-400">Модель машинного обучения, обученная на большом датасете, обеспечивает точную автоматическую проверку экзаменационных работ по русскому языку</p>
            </motion.div>

            {/* Карточка бекенд */}
            <motion.div
              whileHover={{ y: -10, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 transition-all cursor-pointer"
            >
              <div className="mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                <img 
                  src={theme === 'dark' ? backendImageDark : backendImageLight} 
                  alt="Backend" 
                  className="w-full h-48 object-contain rounded-lg" 
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Backend</h3>
              <p className="text-gray-600 dark:text-gray-400">Серверная часть обрабатывает запросы, управляет данными и интегрирует ML-модель для быстрой и безопасной проверки экзаменов</p>
            </motion.div>

            {/* Карточка фронтенд */}
            <motion.div
              whileHover={{ y: -10, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 transition-all cursor-pointer"
            >
              <div className="mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                <img 
                  src={theme === 'dark' ? frontendImageDark : frontendImageLight} 
                  alt="Frontend" 
                  className="w-full h-48 object-contain rounded-lg" 
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Frontend</h3>
              <p className="text-gray-600 dark:text-gray-400">Современный интуитивный интерфейс на React с плавными анимациями обеспечивает удобную работу с системой для всех пользователей</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Подвал */}
      <footer className={`relative z-10 bg-gray-800 dark:bg-gray-900 text-white py-12 px-6 lg:px-8 xl:px-12 ${isUploadModalVisible ? 'blur-sm' : ''}`}>
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

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={() => !isProcessing && setIsUploadModalVisible(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                  Загрузка файла
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Загрузите файл CSV с экзаменационными работами
                </p>
              </div>

              <FileUpload
                onFileSelect={handleFileSelect}
                isProcessing={isProcessing}
                progress={uploadProgress}
              />

              {!isProcessing && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsUploadModalVisible(false)}
                  className="mt-4 w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Отмена
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MainPage;
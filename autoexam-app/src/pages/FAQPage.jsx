import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FAQPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      question: 'Что такое AutoExam?',
      answer:
        'AutoExam - это автоматизированная система проверки экзаменов по русскому языку для иностранных граждан. Система использует машинное обучение для анализа ответов и выставления оценок.',
    },
    {
      question: 'Какие форматы файлов поддерживаются?',
      answer:
        'Система поддерживает файлы в форматах CSV, XLSX и XLS. Файл должен содержать корректную структуру с колонками: Id экзамена, Id вопроса, Текст вопроса, Транскрибация ответа и другие.',
    },
    {
      question: 'Как долго обрабатываются файлы?',
      answer:
        'Время обработки зависит от размера файла. В среднем, файл с 100-200 записями обрабатывается за 2-5 минут. Вы можете отслеживать прогресс обработки в реальном времени.',
    },
    {
      question: 'Как работает ML-модель?',
      answer:
        'Наша модель машинного обучения обучена на большом датасете экзаменационных ответов. Она анализирует транскрибацию устных ответов студентов, учитывая грамматику, полноту ответа, соответствие вопросу и другие критерии для выставления оценки от 0 до 2 баллов.',
    },
    {
      question: 'Можно ли использовать API?',
      answer:
        'Да! У нас есть REST API для интеграции с вашими системами. Документация доступна в разделе "API Документация". API позволяет загружать файлы, получать результаты и историю обработок программно.',
    },
    {
      question: 'Безопасны ли мои данные?',
      answer:
        'Абсолютно. Все данные передаются по защищенному HTTPS протоколу, хранятся в зашифрованном виде и доступны только авторизованным пользователям. Мы не передаем ваши данные третьим лицам.',
    },
    {
      question: 'Нужна ли регистрация?',
      answer:
        'Да, для использования системы необходимо зарегистрироваться. Это позволяет сохранять историю ваших обработок и обеспечивает безопасность данных. Регистрация занимает менее минуты.',
    },
    {
      question: 'Можно ли экспортировать результаты?',
      answer:
        'Да, после обработки вы можете экспортировать результаты в формате CSV для дальнейшего использования в других системах или для отчетности.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* FAQ Content */}
      <section className="relative z-10 px-6 lg:px-8 xl:px-12 py-12 flex-grow">
        <div className="container mx-auto max-w-4xl">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center"
          >
            Часто задаваемые вопросы
          </motion.h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Найдите ответы на популярные вопросы о работе с AutoExam
          </p>

          {/* Search */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по вопросам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </motion.div>

          {/* FAQs */}
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-left font-semibold text-gray-800 dark:text-gray-100">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
                      openIndex === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                Ничего не найдено по запросу "{searchQuery}"
              </p>
            </div>
          )}
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

export default FAQPage;


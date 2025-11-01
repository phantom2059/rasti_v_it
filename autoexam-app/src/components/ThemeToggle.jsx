import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={`relative w-16 h-8 rounded-full p-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
        isDark 
          ? 'bg-gradient-to-r from-indigo-600 to-purple-600' 
          : 'bg-gradient-to-r from-orange-400 to-yellow-400'
      }`}
      aria-label="Toggle theme"
    >
      <motion.div
        className="w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center"
        animate={{
          x: isDark ? 32 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-indigo-600" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-orange-500" />
        )}
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;


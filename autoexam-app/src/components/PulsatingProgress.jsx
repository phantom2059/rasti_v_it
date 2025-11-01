import React from 'react';
import { motion } from 'framer-motion';

const PulsatingProgress = ({ progress = 0, status = 'Обработка...' }) => {
  const dots = [0, 1, 2, 3, 4];

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="flex gap-3 mb-6">
        {dots.map((index) => (
          <motion.div
            key={index}
            className="w-4 h-4 bg-blue-600 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.2,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md mb-4">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">{progress}% завершено</p>
      </div>
    </div>
  );
};

export default PulsatingProgress;


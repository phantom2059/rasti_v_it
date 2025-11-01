import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import PulsatingProgress from './PulsatingProgress';

const FileUpload = ({ onFileSelect, isProcessing, progress }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [validation, setValidation] = useState({ isValid: true, message: '' });

  const validateFile = (file) => {
    // Проверка типа файла
    if (!file.name.endsWith('.csv')) {
      return {
        isValid: false,
        message: 'Пожалуйста, загрузите файл формата CSV'
      };
    }

    // Проверка размера (макс 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        message: 'Размер файла не должен превышать 50MB'
      };
    }

    return { isValid: true, message: '' };
  };

  const parseCSVPreview = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n').slice(0, 6); // Первые 6 строк (заголовок + 5 записей)
        const rows = lines.map(line => 
          line.split(';').map(cell => cell.trim())
        );
        resolve(rows);
      };
      
      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsText(file);
    });
  };

  const handleFile = async (file) => {
    const validationResult = validateFile(file);
    setValidation(validationResult);

    if (!validationResult.isValid) {
      toast.error(validationResult.message);
      return;
    }

    setSelectedFile(file);

    // Генерируем предпросмотр
    try {
      const previewData = await parseCSVPreview(file);
      setPreview(previewData);
      toast.success('Файл успешно загружен');
    } catch (error) {
      toast.error('Ошибка при чтении файла');
      setPreview(null);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    setValidation({ isValid: true, message: '' });
  };

  const handleUpload = () => {
    if (selectedFile && validation.isValid) {
      onFileSelect(selectedFile);
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      {!selectedFile && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }`}
        >
          <input
            type="file"
            id="file-upload"
            accept=".csv"
            onChange={handleChange}
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Перетащите файл сюда
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              или нажмите, чтобы выбрать файл
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Поддерживаемый формат: CSV (до 50MB)
            </p>
          </label>
        </motion.div>
      )}

      {/* File Preview */}
      <AnimatePresence>
        {selectedFile && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                    {selectedFile.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemove}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Validation Status */}
            <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
              validation.isValid
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
            }`}>
              {validation.isValid ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">
                {validation.isValid ? 'Файл успешно загружен' : validation.message}
              </span>
            </div>


            {/* Upload Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpload}
              disabled={!validation.isValid}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Обработать файл
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
          >
            <div className="text-center">
              <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                Обработка файла...
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Это может занять некоторое время
              </p>
              <PulsatingProgress progress={progress} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;


import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FiCheck, FiLoader, FiX } from 'react-icons/fi';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'loading' | 'success' | 'error';
  errorMessage?: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  status,
  errorMessage
}) => {
  const t = useTranslations();

  useEffect(() => {
    if (status === 'success') {
      // Автоматически закрываем через 5 секунд
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={status === 'loading' ? undefined : onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {status === 'loading' && t('modal.subscribing')}
            {status === 'success' && t('modal.success')}
            {status === 'error' && t('modal.error')}
          </h2>
          {status !== 'loading' && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'loading' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <FiLoader className="w-12 h-12 text-primary animate-spin" />
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('modal.processing')}
                </h3>
                <p className="text-gray-600">
                  {t('modal.pleaseWait')}
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <FiCheck className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-4 border-green-200 animate-ping"></div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('modal.thankYou')}
                </h3>
                <p className="text-gray-600">
                  {t('modal.subscriptionSuccess')}
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  {t('modal.autoClose')}
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <FiX className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('modal.somethingWentWrong')}
                </h3>
                <p className="text-gray-600">
                  {errorMessage || t('modal.tryAgain')}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors"
              >
                {t('modal.close')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 

import React from 'react';
import { Alert } from '../types';
import { BrainIcon } from '../constants';

interface ExplanationModalProps {
  alert: Alert | null;
  onClose: () => void;
  isLoading: boolean;
}

const ExplanationModal: React.FC<ExplanationModalProps> = ({ alert, onClose, isLoading }) => {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center mb-4">
          <BrainIcon className="w-8 h-8 mr-3 text-brand-primary"/>
          <h2 className="text-2xl font-semibold text-gray-800">Alert Explanation</h2>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          For alert: <span className="font-medium">{alert.message}</span>
        </p>
        <div className="bg-slate-50 p-4 rounded-md min-h-[150px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary"></div>
              <p className="ml-3 text-gray-600">Generating explanation...</p>
            </div>
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">{alert.explanation || "No explanation available."}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-brand-primary hover:bg-brand-secondary text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ExplanationModal;
    
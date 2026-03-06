import React from 'react';

const AddCertificateModal = ({
  isOpen,
  selectedSkill,
  certificateTitle,
  certificateLink,
  certificateProvider,
  setCertificateTitle,
  setCertificateLink,
  setCertificateProvider,
  onSave,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Add Certificate</h3>
              <p className="text-sm text-slate-600">
                {selectedSkill?.name || selectedSkill?.title || 'Skill'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <i className="fas fa-times text-xl" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Certificate Title *
            </label>
            <input
              type="text"
              value={certificateTitle}
              onChange={(e) => setCertificateTitle(e.target.value)}
              placeholder="e.g., React Developer Certification"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Storage Provider *
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setCertificateProvider('drive')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  certificateProvider === 'drive'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <i className="fab fa-google-drive text-2xl mb-1" />
                <p className="text-sm font-medium">Google Drive</p>
              </button>
              <button
                onClick={() => setCertificateProvider('dropbox')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  certificateProvider === 'dropbox'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <i className="fab fa-dropbox text-2xl mb-1" />
                <p className="text-sm font-medium">Dropbox</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Certificate Link *
            </label>
            <input
              type="url"
              value={certificateLink}
              onChange={(e) => setCertificateLink(e.target.value)}
              placeholder={
                certificateProvider === 'drive'
                  ? 'https://drive.google.com/...'
                  : 'https://www.dropbox.com/...'
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">
              Make sure the link is publicly accessible
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Add Certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCertificateModal;


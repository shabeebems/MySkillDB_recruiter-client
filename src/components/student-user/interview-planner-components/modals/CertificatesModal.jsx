import React from 'react';

const CertificatesModal = ({
  isOpen,
  selectedSkill,
  certificates,
  isLoading,
  onClose,
  onDelete,
}) => {
  if (!isOpen || !selectedSkill) return null;

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Certificates</h3>
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

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <i className="fas fa-spinner fa-spin text-3xl text-slate-400 mb-4" />
              <p className="text-slate-500">Loading certificates...</p>
            </div>
          ) : certificates && certificates.length > 0 ? (
            <div className="space-y-4">
              {certificates.map((cert) => (
                <div
                  key={cert._id}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <i
                          className={`fas ${
                            cert.storageProvider === 'google drive'
                              ? 'fa-google-drive'
                              : 'fa-dropbox'
                          } text-lg ${
                            cert.storageProvider === 'google drive'
                              ? 'text-blue-600'
                              : 'text-blue-500'
                          }`}
                        />
                        <h4 className="font-semibold text-slate-900">
                          {cert.title}
                        </h4>
                      </div>
                      <a
                        href={cert.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline break-all"
                      >
                        {cert.link}
                      </a>
                      <p className="text-xs text-slate-500 mt-2">
                        Added: {new Date(cert.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => onDelete(cert._id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <i className="fas fa-trash" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="fas fa-file-certificate text-5xl text-slate-300 mb-4" />
              <p className="text-slate-500">No certificates added yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificatesModal;


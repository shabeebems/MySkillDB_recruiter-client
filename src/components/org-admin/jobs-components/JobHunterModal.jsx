import React, { useState } from 'react';
import toast from 'react-hot-toast';

const JobHunterModal = ({ isOpen, onClose, onOpenParser }) => {
  const [userPortals, setUserPortals] = useState([
    { id: 1, name: 'My LinkedIn Search', url: 'https://www.linkedin.com/jobs/' }
  ]);
  const [showAddPortalForm, setShowAddPortalForm] = useState(false);
  const [newPortal, setNewPortal] = useState({ name: '', url: '' });

  const handleLaunch = (url) => {
    // Open portal in new browser tab
    window.open(url, '_blank', 'noopener,noreferrer');
    // Show job parser modal
    if (onOpenParser) {
      onOpenParser();
    }
    onClose();
  };

  const handleSaveNewPortal = (e) => {
    e.preventDefault();
    
    if (!newPortal.name.trim() || !newPortal.url.trim()) {
      toast.error('Please fill in both portal name and URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(newPortal.url);
    } catch (error) {
      toast.error('Please enter a valid URL');
      return;
    }

    const portalToAdd = {
      id: userPortals.length + 1,
      name: newPortal.name,
      url: newPortal.url
    };

    setUserPortals([...userPortals, portalToAdd]);
    setNewPortal({ name: '', url: '' });
    setShowAddPortalForm(false);
    toast.success('Portal saved successfully!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/10 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-search text-emerald-600 text-xl"></i>
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-bold text-white">Job Hunter</h2>
                <p className="text-sm text-emerald-100">Browse job portals and capture opportunities</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <i className="fas fa-times text-emerald-200 hover:text-white text-xl transition-colors"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Direct Paste Option */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <i className="fas fa-paste text-purple-600"></i>
              Quick Entry
            </h3>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 hover:border-purple-400 transition-all">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-clipboard text-white text-2xl"></i>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg mb-2">Paste Job Description Directly</h4>
                  <p className="text-sm text-slate-600 mb-4">
                    Already have a job description? Paste it directly into our AI parser without visiting external portals.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenParser) {
                        onOpenParser();
                      }
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
                  >
                    <i className="fas fa-magic"></i>
                    Open AI Parser
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* My Saved Portals */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <i className="fas fa-bookmark text-indigo-600"></i>
                My Saved Portals
              </h3>
              <button
                onClick={() => setShowAddPortalForm(!showAddPortalForm)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <i className={`fas ${showAddPortalForm ? 'fa-times' : 'fa-plus'}`}></i>
                {showAddPortalForm ? 'Cancel' : 'Add New'}
              </button>
            </div>

            {/* Add New Portal Form */}
            {showAddPortalForm && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-300 rounded-xl p-5 mb-4">
                <form onSubmit={handleSaveNewPortal} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Portal Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newPortal.name}
                      onChange={(e) => setNewPortal({ ...newPortal, name: e.target.value })}
                      placeholder="e.g., My Naukri Search"
                      className="w-full px-4 py-2.5 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Portal URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={newPortal.url}
                      onChange={(e) => setNewPortal({ ...newPortal, url: e.target.value })}
                      placeholder="https://www.example.com/jobs"
                      className="w-full px-4 py-2.5 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-slate-900"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-save"></i>
                    Save Portal
                  </button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userPortals.map((portal) => (
                <div key={portal.id} className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-5 hover:border-indigo-400 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-bookmark text-white text-lg"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 truncate mb-1">{portal.name}</h4>
                      <p className="text-xs text-slate-600 truncate">{portal.url}</p>
                    </div>
                    <button
                      onClick={() => handleLaunch(portal.url)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg flex items-center gap-2 flex-shrink-0"
                    >
                      <i className="fas fa-external-link-alt"></i>
                      Launch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg p-4">
            <div className="flex gap-3">
              <i className="fas fa-lightbulb text-emerald-600 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-emerald-900">💡 How to Use</p>
                <p className="text-sm text-emerald-700 mt-1">
                  <strong>Option 1:</strong> Use "Paste Job Description Directly" to quickly parse job text you already have.<br/>
                  <strong>Option 2:</strong> Click "Launch" on saved portals to browse jobs, then copy (Ctrl+A, Ctrl+C) and paste into the AI parser.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobHunterModal;


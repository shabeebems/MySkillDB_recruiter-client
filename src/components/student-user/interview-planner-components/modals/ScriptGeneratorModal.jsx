import React from 'react';

const ScriptGeneratorModal = ({
  isOpen,
  onClose,
  selectedSkill,
  scriptType,
  setScriptType,
  scriptIdea,
  setScriptIdea,
  videoLength,
  setVideoLength,
  onGenerate,
  isGenerating,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-white/10 backdrop-blur-md z-[9998]"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <i className="fas fa-video text-xl text-white text-opacity-30" />
              </div>
              <h2 className="text-xl font-bold">Generate Video Script</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-colors"
            >
              <i className="fas fa-times text-white text-opacity-30" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <p className="text-slate-600 text-sm">
                Creating teleprompter script for{' '}
                <span className="font-semibold text-slate-900">
                  {selectedSkill?.name || selectedSkill?.title || 'Skill'}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  What type of video? <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      scriptType === 'teaching'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="scriptType"
                      value="teaching"
                      checked={scriptType === 'teaching'}
                      onChange={(e) => setScriptType(e.target.value)}
                      className="mt-1 mr-2"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 text-sm mb-0.5">
                        📚 Teaching Material
                      </div>
                      <div className="text-xs text-slate-600">
                        Teach this skill to others
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      scriptType === 'linkedin_post'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="scriptType"
                      value="linkedin_post"
                      checked={scriptType === 'linkedin_post'}
                      onChange={(e) => setScriptType(e.target.value)}
                      className="mt-1 mr-2"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 text-sm mb-0.5">
                        💼 LinkedIn Journey
                      </div>
                      <div className="text-xs text-slate-600">
                        Share learning & challenges
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      scriptType === 'problem_solving'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="scriptType"
                      value="problem_solving"
                      checked={scriptType === 'problem_solving'}
                      onChange={(e) => setScriptType(e.target.value)}
                      className="mt-1 mr-2"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 text-sm mb-0.5">
                        🎯 Problem Solving
                      </div>
                      <div className="text-xs text-slate-600">
                        Showcase real solution
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {scriptType === 'teaching' && 'What do you want to teach?'}
                  {scriptType === 'linkedin_post' && 'What did you learn?'}
                  {scriptType === 'problem_solving' && 'What problem did you solve?'}
                  <span className="text-red-500"> *</span>
                </label>
                <textarea
                  value={scriptIdea}
                  onChange={(e) => setScriptIdea(e.target.value)}
                  placeholder={
                    scriptType === 'teaching'
                      ? 'e.g., I want to teach the fundamentals and show practical examples...'
                      : scriptType === 'linkedin_post'
                      ? 'e.g., I learned how to implement this feature, but struggled with debugging...'
                      : 'e.g., I used this skill to optimize our application performance by 50%...'
                  }
                  rows={8}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Video Length
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: '2-3', label: '2-3 mins', helper: 'Quick' },
                  { value: '5-7', label: '5-7 mins', helper: 'Standard' },
                  { value: '8-10', label: '8-10 mins', helper: 'Detailed' },
                ].map((length) => (
                  <button
                    key={length.value}
                    onClick={() => setVideoLength(length.value)}
                    className={`px-4 py-4 rounded-lg border-2 transition-all ${
                      videoLength === length.value
                        ? 'border-purple-600 bg-purple-50 text-purple-900'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-center">
                      <i
                        className={`fas fa-clock text-2xl mb-2 ${
                          videoLength === length.value
                            ? 'text-purple-600'
                            : 'text-slate-300'
                        }`}
                      />
                      <p className="text-sm font-semibold">{length.label}</p>
                      <p className="text-xs text-slate-500 mt-1">{length.helper}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 rounded-b-2xl flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-magic text-white text-opacity-80" />
                  Generate Script
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ScriptGeneratorModal;


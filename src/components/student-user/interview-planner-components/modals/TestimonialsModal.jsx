import React from 'react';

const TestimonialsModal = ({
  isOpen,
  selectedSkill,
  testimonials,
  isLoading,
  onClose,
}) => {
  if (!isOpen || !selectedSkill) return null;

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Testimonials</h3>
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
              <p className="text-slate-500">Loading testimonials...</p>
            </div>
          ) : testimonials && testimonials.length > 0 ? (
            <div className="space-y-4">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial._id}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-award text-amber-600 text-lg" />
                        <h4 className="font-semibold text-slate-900">
                          {testimonial.validatorName}
                        </h4>
                      </div>
                      <p className="text-sm text-slate-700 mb-1">
                        <span className="font-medium">Role:</span>{' '}
                        {testimonial.validatorRole}
                      </p>
                      <p className="text-sm text-slate-600 mb-2">
                        <span className="font-medium">Email:</span>{' '}
                        {testimonial.validatorEmail}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Added: {new Date(testimonial.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="fas fa-award text-5xl text-slate-300 mb-4" />
              <p className="text-slate-500">No testimonials added yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestimonialsModal;


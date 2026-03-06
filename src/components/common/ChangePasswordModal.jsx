import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { postRequest } from '../../api/apiRequests';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [modalError, setModalError] = useState('');
  
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setFieldErrors({});
      setModalError('');
      setIsSuccess(false);
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear errors when user starts typing
    if (fieldErrors[field] || modalError) {
      setFieldErrors({ ...fieldErrors, [field]: undefined });
      setModalError('');
    }
  };

  const validatePassword = (password) => {
    // At least 8 characters
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    // At least 1 digit
    if (!/\d/.test(password)) {
      return 'Password must contain at least 1 digit';
    }
    return null;
  };

  const validateForm = () => {
    const errors = {};

    // Old password validation
    if (!formData.oldPassword) {
      errors.oldPassword = 'Current password is required';
    }

    // New password validation
    if (!formData.newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      const passwordError = validatePassword(formData.newPassword);
      if (passwordError) {
        errors.newPassword = passwordError;
      }
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const handleChangePassword = async () => {
    // Clear previous errors
    setModalError('');
    setFieldErrors({});

    // Validate form and get errors
    const validationResult = validateForm();
    if (!validationResult.isValid) {
      // Show the first specific error message instead of generic message
      const firstError = Object.values(validationResult.errors)[0];
      setModalError(firstError);
      return;
    }

    setIsSaving(true);
    try {
      const passwordResponse = await postRequest('/users/me/change-password', {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });

      // Check response structure - handle both success and error responses
      if (passwordResponse?.data?.success === true) {
        // Success - show success state on button first
        setIsSaving(false);
        setIsSuccess(true);
        
        // Clear form data
        setFormData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setFieldErrors({});
        setModalError('');
        
        // Show toast message after showing success state
        setTimeout(() => {
          toast.success('Password changed successfully!', { duration: 2000 });
          
          // Close modal after showing success state and toast
          setTimeout(() => {
            onClose();
          }, 1500);
        }, 300);
      } else {
        // Password change failed - show error in modal
        const errorMsg = passwordResponse?.data?.message || passwordResponse?.data?.error || 'Password change failed. Please try again.';
        
        // Set field-specific errors based on error message
        const newFieldErrors = {};
        const msgLower = errorMsg.toLowerCase();
        if (msgLower.includes('old password') || msgLower.includes('current password') || msgLower.includes('incorrect')) {
          newFieldErrors.oldPassword = errorMsg;
        } else if (msgLower.includes('new password') || msgLower.includes('8 characters') || msgLower.includes('1 digit') || msgLower.includes('invalid format')) {
          newFieldErrors.newPassword = errorMsg;
        } else if (msgLower.includes('match') || msgLower.includes('confirm') || msgLower.includes('mismatch')) {
          newFieldErrors.confirmPassword = errorMsg;
        }
        
        setFieldErrors(newFieldErrors);
        setModalError(errorMsg);
        setIsSaving(false);
        setIsSuccess(false);
      }
    } catch (passwordError) {
      console.error('Error changing password:', passwordError);
      
      const passwordErrorData = passwordError?.response?.data;
      const errorMsg = passwordErrorData?.message || passwordErrorData?.error || passwordError?.message || 'Password change failed. Please try again.';
      
      // Set field-specific errors based on error message
      const newFieldErrors = {};
      const msgLower = errorMsg.toLowerCase();
      if (msgLower.includes('old password') || msgLower.includes('current password') || msgLower.includes('incorrect')) {
        newFieldErrors.oldPassword = errorMsg;
      } else if (msgLower.includes('new password') || msgLower.includes('8 characters') || msgLower.includes('1 digit') || msgLower.includes('invalid format') || msgLower.includes('must be different')) {
        newFieldErrors.newPassword = errorMsg;
      } else if (msgLower.includes('match') || msgLower.includes('confirm') || msgLower.includes('mismatch')) {
        newFieldErrors.confirmPassword = errorMsg;
      }
      
      setFieldErrors(newFieldErrors);
      setModalError(errorMsg);
      setIsSaving(false);
      setIsSuccess(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-white/10 backdrop-blur-md"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 md:p-6 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              <i className="fas fa-edit"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
              <p className="text-xs text-slate-500">Update your password</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <i className="fas fa-times text-slate-500"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-6">
          {/* Error Message Display */}
          {modalError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-red-600"></i>
                <p className="text-sm text-red-700 font-medium">{modalError}</p>
              </div>
            </div>
          )}
          
          <div className="space-y-5">
            {/* Old Password Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Current Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.oldPassword}
                onChange={(e) => handleFieldChange('oldPassword', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.oldPassword
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                placeholder="Enter your current password"
              />
              {fieldErrors.oldPassword && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <i className="fas fa-exclamation-circle"></i>
                  {fieldErrors.oldPassword}
                </p>
              )}
            </div>

            {/* Password Section */}
            <div className="pt-4 border-t border-slate-200">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-2">
                  <i className="fas fa-lock text-slate-500"></i>
                  New Password
                </h3>
                <p className="text-xs text-slate-500">Password must be at least 8 characters long and contain at least 1 digit</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => handleFieldChange('newPassword', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.newPassword
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                    placeholder="Enter new password (min. 8 characters, 1 digit)"
                  />
                  {fieldErrors.newPassword && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle"></i>
                      {fieldErrors.newPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.confirmPassword
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                    placeholder="Confirm new password"
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle"></i>
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 md:p-6 flex justify-end gap-3 rounded-b-xl">
          <button
            onClick={handleClose}
            disabled={isSaving || isSuccess}
            className="px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleChangePassword}
            disabled={isSaving || isSuccess}
            className={`px-6 py-2 rounded-lg font-semibold shadow-md transition-all disabled:cursor-not-allowed flex items-center gap-2 ${
              isSuccess
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                : isSaving
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white opacity-50'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white hover:shadow-lg'
            }`}
          >
            {isSuccess ? (
              <>
                <i className="fas fa-check-circle"></i>
                Password Changed Successfully!
              </>
            ) : isSaving ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Changing Password...
              </>
            ) : (
              <>
                <i className="fas fa-lock"></i>
                Change Password
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;


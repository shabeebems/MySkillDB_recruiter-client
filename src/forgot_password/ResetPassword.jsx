import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postRequest } from '../api/apiRequests';
import AuthPageLayout from '../components/common/auth/AuthPageLayout';
import AuthPageHeader from '../components/common/auth/AuthPageHeader';
import FormInput from '../components/common/auth/FormInput';
import SubmitButton from '../components/common/auth/SubmitButton';
import ErrorAlert from '../components/common/auth/ErrorAlert';
import SuccessState from '../components/common/auth/SuccessState';
import BackToLoginLink from '../components/common/auth/BackToLoginLink';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ password: '', confirmPassword: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({ password: '', confirmPassword: '' });
    
    const errors = { password: '', confirmPassword: '' };

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (errors.password || errors.confirmPassword) {
      setFieldErrors(errors);
      return;
    }

    try {
      setIsLoading(true);
      const response = await postRequest('/auth/reset-password', { 
        token, 
        newPassword: password 
      });
      
      if (response.data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setErrorMessage(response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      const msg = error.response?.data?.message || 'An error occurred. The link may have expired.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <AuthPageHeader
        icon="fas fa-key"
        title="Reset Password"
        description="Enter your new password below to secure your account."
      />
      
      {isSuccess ? (
        <SuccessState
          icon="fas fa-check-circle"
          title="All Set!"
          message={
            <>
              Your password has been successfully updated. <br/>
              Redirecting you to login...
            </>
          }
          actionText="Login Now"
          actionLink="/login"
        />
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <ErrorAlert message={errorMessage} />
            
            <FormInput
              id="new-password"
              name="password"
              type="password"
              label="New Password"
              icon="fas fa-lock"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              disabled={isLoading}
              onClearError={() => setFieldErrors(prev => ({ ...prev, password: '' }))}
            />
            
            <FormInput
              id="confirm-password"
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              icon="fas fa-lock"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={fieldErrors.confirmPassword}
              disabled={isLoading}
              onClearError={() => setFieldErrors(prev => ({ ...prev, confirmPassword: '' }))}
            />
          </div>

          <SubmitButton
            isLoading={isLoading}
            loadingText="Resetting Password..."
          >
            Reset Password
          </SubmitButton>
          
          <BackToLoginLink />
        </form>
      )}
    </AuthPageLayout>
  );
};

export default ResetPassword;

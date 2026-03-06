import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { postRequest } from '../api/apiRequests';
import AuthPageLayout from '../components/common/auth/AuthPageLayout';
import AuthPageHeader from '../components/common/auth/AuthPageHeader';
import FormInput from '../components/common/auth/FormInput';
import SubmitButton from '../components/common/auth/SubmitButton';
import ErrorAlert from '../components/common/auth/ErrorAlert';
import SuccessState from '../components/common/auth/SuccessState';
import BackToLoginLink from '../components/common/auth/BackToLoginLink';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '' });

  const validateEmail = (emailValue) => {
    if (!emailValue) {
      return 'Please enter your email address';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    const emailError = validateEmail(email);
    if (emailError) {
      setFieldErrors({ email: emailError });
      return;
    }
    
    setFieldErrors({ email: '' });

    try {
      setIsLoading(true);
      const response = await postRequest('/auth/forgot-password', { email });
      
      if (response.data.success) {
        setIsSent(true);
        toast.success(response.data.message);
      } else {
        setErrorMessage(response.data.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      const msg = error.response?.data?.message || 'An error occurred. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <AuthPageHeader
        icon="fas fa-lock"
        title="Forgot Password?"
        description="No worries! Enter your email and we'll send you reset instructions."
      />
      
      {isSent ? (
        <SuccessState
          icon="fas fa-envelope-open-text"
          title="Check your email"
          message={
            <>
              We've sent a password reset link to <br/>
              <span className="font-semibold text-slate-800">{email}</span>
            </>
          }
          actionText={
            <>
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Login
            </>
          }
          actionLink="/login"
        />
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <FormInput
            id="email-address"
            name="email"
            type="text"
            label="Email Address"
            icon="fas fa-envelope"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            disabled={isLoading}
            autoComplete="email"
            onClearError={() => setFieldErrors({ email: '' })}
          />

          <ErrorAlert message={errorMessage} />

          <SubmitButton
            isLoading={isLoading}
            loadingText="Sending Instructions..."
          >
            Send Reset Link
          </SubmitButton>
          
          <BackToLoginLink />
        </form>
      )}
    </AuthPageLayout>
  );
};

export default ForgotPassword;

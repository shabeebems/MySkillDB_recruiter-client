import React, { useEffect, useState } from 'react';
import { AddEditContactModal, ContactDetailModal, EmailTemplatesModal } from './index';


const ModalWrapper = ({ modalView, onClose, ...props }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (modalView) {
      // Trigger animation on mount with slight delay for smoother effect
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setIsAnimating(false);
      setIsClosing(false);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [modalView]);

  if (!modalView) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  // Determine max width based on modal type
  const getMaxWidth = () => {
    if (modalView === 'templates') return 'max-w-4xl';
    return 'max-w-2xl';
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity duration-300 ease-out ${
          isAnimating && !isClosing ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
      ></div>

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 pointer-events-none overflow-y-auto">
        <div className={`w-full ${getMaxWidth()} pointer-events-auto transition-all duration-300 ease-out ${
          isAnimating && !isClosing
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-[0.96] translate-y-2 sm:translate-y-4'
        }`}>
          {modalView === 'add' && (
            <AddEditContactModal
              isOpen={true}
              onClose={handleClose}
              formData={props.formData}
              setFormData={props.setFormData}
              onSubmit={props.onSubmit}
              fieldErrors={props.fieldErrors}
              showDesignation={props.showDesignation}
              title={props.modalTitle || "Add New Contact"}
            />
          )}
          
          {modalView === 'detail' && (
            <ContactDetailModal
              isOpen={true}
              onClose={handleClose}
              contact={props.selectedContact}
            />
          )}
          
          {modalView === 'templates' && (
            <EmailTemplatesModal
              isOpen={true}
              onClose={handleClose}
              templates={props.emailTemplates}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ModalWrapper;


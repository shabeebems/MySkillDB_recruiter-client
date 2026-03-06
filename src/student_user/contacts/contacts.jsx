import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getRequest, postRequest } from '../../api/apiRequests';
import StudentMenuNavigation from '../../components/student-user/student-menu-components/StudentMenuNavigation';
import LoaderOverlay from '../../components/common/loader/LoaderOverlay';
import { ContactTable, ModalWrapper } from '../../components/student-user/student-contacts-components';
import { mentorEmailTemplates as mentorTemplates, hrEmailTemplates as hrTemplates, founderEmailTemplates as founderTemplates } from '../../components/student-user/student-contacts-components/email-templates';

const Contacts = () => {
  const [currentPage, setCurrentPage] = useState('contact-main');
  const [isLoading, setIsLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [modalView, setModalView] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    organization: '',
    email: '',
    mobile: '',
    linkedin: '',
    note: ''
  });

  // Fetch all contacts from API
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoading(true);
        const response = await getRequest(`/contacts/all`);
        
        if (response.data?.success && response.data?.data) {
          const transformedContacts = response.data.data.map((contact) => ({
            id: contact._id || contact.id,
            name: contact.name || '',
            email: contact.email || '',
            mobile: contact.mobile || '',
            organization: contact.organization || '',
            organizationLink: contact.organizationLink || contact.companyLink || '',
            linkedin: contact.linkedin || '',
            note: contact.note || '',
            designation: contact.designation || '',
            createdAt: contact.createdAt,
            updatedAt: contact.updatedAt
          }));
          setContacts(transformedContacts);
        } else {
          setContacts([]);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
        const errorMessage = error.response?.data?.message || 
                            'Failed to load contacts';
        toast.error(errorMessage);
        setContacts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleAddContact = async () => {
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }
    
    if (!formData.designation) {
      toast.error('Designation is required');
      return;
    }
  
    try {
      // Prepare payload - clean empty strings
      const payload = {
        name: formData.name.trim(),
        designation: formData.designation,
        ...(formData.email?.trim() && { email: formData.email.trim() }),
        ...(formData.mobile?.trim() && { mobile: formData.mobile.trim() }),
        ...(formData.organization?.trim() && { organization: formData.organization.trim() }),
        ...(formData.linkedin?.trim() && { linkedin: formData.linkedin.trim() }),
        ...(formData.note?.trim() && { note: formData.note.trim() }),
      };

      // Add new contact
      await postRequest(`/contacts/`, payload);

      // Refresh contacts list
      const response = await getRequest(`/contacts/all`);
      if (response.data?.success && response.data?.data) {
        const transformedContacts = response.data.data.map((contact) => ({
          id: contact._id || contact.id,
          name: contact.name || '',
          email: contact.email || '',
          mobile: contact.mobile || '',
          organization: contact.organization || '',
          organizationLink: contact.organizationLink || contact.companyLink || '',
          linkedin: contact.linkedin || '',
          note: contact.note || '',
          designation: contact.designation || '',
          createdAt: contact.createdAt,
          updatedAt: contact.updatedAt
        }));
        setContacts(transformedContacts);
      }

      toast.success('Contact added successfully!');
      setFieldErrors({});
      closeModal();
    } catch (error) {
      console.error('Error adding contact:', error);
      
      // Handle validation errors
      const responseData = error.response?.data;
      
      if (Array.isArray(responseData?.errors)) {
        // Set field-specific errors
        const errors = {};
        responseData.errors.forEach((err) => {
          if (err.field) {
            errors[err.field] = err.message;
          }
        });
        setFieldErrors(errors);
      } else if (responseData?.message) {
        // Only show toast for non-validation errors
        toast.error(responseData.message);
        setFieldErrors({});
      } else {
        toast.error('Something went wrong. Please try again.');
        setFieldErrors({});
      }
    }
  };

  const handleViewDetail = (contact) => {
    setSelectedContact(contact);
    setModalView('detail');
  };

  const closeModal = () => {
    setModalView(null);
    setSelectedContact(null);
    setFieldErrors({});
    setFormData({
      name: '',
      designation: '',
      organization: '',
      email: '',
      mobile: '',
      linkedin: '',
      note: ''
    });
  };

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: undefined });
    }
  };

  // Combine all email templates with designation labels and unique IDs
  const allEmailTemplates = [
    ...mentorTemplates.map((template, index) => ({ 
      ...template, 
      id: `mentor-${template.id || index}`,
      designation: 'mentor', 
      designationLabel: 'Mentors' 
    })),
    ...hrTemplates.map((template, index) => ({ 
      ...template, 
      id: `hr-${template.id || index}`,
      designation: 'hr', 
      designationLabel: 'HR Managers' 
    })),
    ...founderTemplates.map((template, index) => ({ 
      ...template, 
      id: `founder-${template.id || index}`,
      designation: 'founder', 
      designationLabel: 'Founders' 
    }))
  ];


  return (
    <>
      <LoaderOverlay isVisible={isLoading} title="Contacts" subtitle="Loading your contacts..." />
      <StudentMenuNavigation currentPage={currentPage} onPageChange={handlePageChange} />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 lg:ml-72 pt-16 sm:pt-16 lg:pt-6">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-xl shadow-sm border-b border-slate-200/60 hidden lg:block">
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-black/5">
                <i className="fas fa-address-book text-white text-lg sm:text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight mb-1">All Contacts</h1>
                <p className="text-xs sm:text-sm text-neutral-500 font-medium">View and manage all your contacts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 sm:p-6">
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <button
              onClick={() => setModalView('add')}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl font-semibold text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg ring-1 ring-black/10 active:scale-[0.98] touch-manipulation"
            >
              <i className="fas fa-plus-circle text-xs sm:text-sm"></i>
              <span>Add New Contact</span>
            </button>
            
            <button
              onClick={() => setModalView('templates')}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg ring-1 ring-black/10 active:scale-[0.98] touch-manipulation"
            >
              <i className="fas fa-envelope text-xs sm:text-sm"></i>
              <span>Email Templates</span>
            </button>
          </div>

          {/* Contacts Table */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-sm ring-1 ring-black/5 overflow-hidden">
            <ContactTable
              contacts={contacts}
              onViewDetail={handleViewDetail}
            />
          </div>
        </div>
      </div>

      {/* Unified Modal */}
      <ModalWrapper
        modalView={modalView}
        onClose={closeModal}
        formData={formData}
        setFormData={handleFieldChange}
        onSubmit={handleAddContact}
        selectedContact={selectedContact}
        emailTemplates={allEmailTemplates}
        fieldErrors={fieldErrors}
        showDesignation={true}
        modalTitle="Add New Contact"
      />
    </>
  );
};

export default Contacts;


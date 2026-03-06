import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast, Toaster } from 'react-hot-toast';
import { putRequest } from '../../api/apiRequests';
import { setUser } from '../../redux/userSlice';
import OrgMenuNavigation from '../../components/org-admin/org-admin-menu_components/OrgMenuNavigation';
import LoaderOverlay from '../../components/common/loader/LoaderOverlay';
import ChangePasswordModal from '../../components/common/ChangePasswordModal';
import ImageCropper from '../../components/common/ImageCropper';
import ImageViewerModal from '../../components/common/profile/ImageViewerModal';

// Org Admin Specific Components
import OrgProfileHeader from '../../components/org-admin/profile/OrgProfileHeader';
import OrgProfileInfo from '../../components/org-admin/profile/OrgProfileInfo';
import OrgSecurityCard from '../../components/org-admin/profile/OrgSecurityCard';

const OrgAdminProfile = () => {
  const [currentPage, setCurrentPage] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  
  // Crop state
  const [imageSrc, setImageSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  
  const fileInputRef = useRef(null);
  
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Read file as data URL for cropper
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result);
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
      
      // Reset input value to allow selecting same file again if needed
      e.target.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob) => {
    setShowCropper(false);
    
    if (!croppedBlob) return;

    // Validate size (approx 2MB limit for final cropped image)
    if (croppedBlob.size > 2 * 1024 * 1024) {
      toast.error('Cropped image is too large. Please crop a smaller area or use a smaller image.');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      
      // Convert Blob to Base64 for upload
      const reader = new FileReader();
      reader.readAsDataURL(croppedBlob);
      reader.onloadend = async () => {
        try {
          const base64Image = reader.result;
          
          // Upload to backend
          const response = await putRequest('/users/me', { profilePicture: base64Image });
          
          if (response.data.success) {
            // Update Redux state with updated user data
            dispatch(setUser(response.data.data));
            toast.success('Profile photo updated successfully!');
          } else {
            toast.error(response.data.message || 'Failed to update profile photo');
          }
        } catch (error) {
           console.error('Error uploading photo:', error);
           toast.error(error.response?.data?.message || 'Failed to update profile photo');
        } finally {
          setIsUploadingPhoto(false);
        }
      };
    } catch (error) {
      console.error('Error handling photo upload:', error);
      toast.error('Failed to process image');
      setIsUploadingPhoto(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageSrc(null);
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900">
      <Toaster position="top-right" />
      <LoaderOverlay isVisible={isLoading} title="Profile" subtitle="Loading your profile..." />
      
      <OrgMenuNavigation currentPage={currentPage} onPageChange={handlePageChange} />
      
      <div className="lg:ml-72 min-h-screen flex flex-col pt-14 lg:pt-0">
        <OrgProfileHeader 
          user={user}
          onPhotoClick={handlePhotoClick}
          onViewImage={() => setIsImageViewerOpen(true)}
          onEditPassword={() => setIsEditModalOpen(true)}
          isUploading={isUploadingPhoto}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full pb-12 -mt-6 relative z-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column - Main Info */}
                <div className="lg:col-span-2">
                    <OrgProfileInfo user={user} />
                </div>

                {/* Right Column - Security */}
                <div>
                    <OrgSecurityCard 
                      role={user?.role} 
                      onUpdatePassword={() => setIsEditModalOpen(true)} 
                    />
                </div>
            </div>
        </main>
      </div>

      {/* Modals */}
      <ChangePasswordModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />

      {showCropper && imageSrc && (
        <ImageCropper
          imageSrc={imageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      <ImageViewerModal 
        isOpen={isImageViewerOpen} 
        imageSrc={user?.profilePicture} 
        onClose={() => setIsImageViewerOpen(false)} 
        altText={user?.name || 'Profile'}
      />
    </div>
  );
};

export default OrgAdminProfile;

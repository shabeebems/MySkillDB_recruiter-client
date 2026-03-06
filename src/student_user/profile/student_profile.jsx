import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { putRequest } from '../../api/apiRequests';
import { setUser } from '../../redux/userSlice';
import StudentMenuNavigation from '../../components/student-user/student-menu-components/StudentMenuNavigation';
import ChangePasswordModal from '../../components/common/ChangePasswordModal';
import ImageCropper from '../../components/common/ImageCropper';

// Reusable Components
import ProfileHeader from '../../components/common/profile/ProfileHeader';
import ProfileInfoCard from '../../components/common/profile/ProfileInfoCard';
import SecurityCard from '../../components/common/profile/SecurityCard';
import ImageViewerModal from '../../components/common/profile/ImageViewerModal';

const StudentProfile = () => {
  const [currentPage, setCurrentPage] = useState('profile');
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
    <>
      <StudentMenuNavigation currentPage={currentPage} onPageChange={handlePageChange} />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 lg:ml-72 pt-16 sm:pt-16 lg:pt-0">
        <ProfileHeader 
          user={user}
          onPhotoClick={handlePhotoClick}
          onViewImage={() => setIsImageViewerOpen(true)}
          onEditPassword={() => setIsEditModalOpen(true)}
          isUploading={isUploadingPhoto}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                
                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <ProfileInfoCard user={user} />
                </div>

                {/* Right Column - Security & Stats */}
                <div className="space-y-6">
                    <SecurityCard 
                      role={user?.role} 
                      onUpdatePassword={() => setIsEditModalOpen(true)} 
                    />
                </div>
            </div>
        </div>
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
    </>
  );
};

export default StudentProfile;

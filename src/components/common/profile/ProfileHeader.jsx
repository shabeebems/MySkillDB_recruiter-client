
const ProfileHeader = ({ 
  user, 
  onPhotoClick, 
  onViewImage, 
  onEditPassword, 
  isUploading,
  fileInputRef,
  onFileSelect
}) => {
  return (
    <div className="relative">
        {/* Simple colored background instead of cover photo style */}
        <div className="h-28 sm:h-36 lg:h-40 bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
            {/* Optional: Simple decorative elements if desired, or keep clean */}
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative -mt-16 sm:-mt-20 mb-6">
                <div className="flex flex-col md:flex-row items-end gap-5 sm:gap-6">
                    {/* Profile Photo */}
                    <div className="relative group mx-auto md:mx-0">
                        <div 
                            onClick={onViewImage}
                            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full p-1.5 bg-white shadow-lg cursor-pointer relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-300 ring-1 ring-black/10"
                        >
                            <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-100">
                                {user?.profilePicture ? (
                                    <img 
                                        src={user.profilePicture} 
                                        alt={user?.name || 'Profile'} 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-500 text-5xl font-bold">
                                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                )}
                                
                                {/* View Overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                    <i className="fas fa-expand text-white text-2xl drop-shadow-md"></i>
                                </div>

                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 backdrop-blur-sm">
                                        <i className="fas fa-circle-notch fa-spin text-white text-2xl"></i>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Camera/Edit Icon Badge */}
                        <div 
                            className="absolute bottom-2 right-2 md:right-4 w-9 h-9 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-lg border border-neutral-200 cursor-pointer hover:bg-indigo-600 hover:text-white transition-all duration-300 z-20 group/edit ring-1 ring-black/5" 
                            onClick={onPhotoClick}
                        >
                            <i className="fas fa-camera text-sm group-hover/edit:hidden"></i>
                            <i className="fas fa-pen text-sm hidden group-hover/edit:block"></i>
                        </div>
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={onFileSelect}
                            className="hidden"
                        />
                    </div>

                    {/* User Info Header */}
                    <div className="flex-1 text-center md:text-left pb-4">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-neutral-900 mb-2 tracking-tight">{user?.name || 'User Name'}</h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-neutral-600 rounded-full text-xs sm:text-sm font-medium border border-neutral-200/60 capitalize shadow-sm ring-1 ring-black/5">
                                <i className="fas fa-user-graduate mr-2 text-[10px] sm:text-xs text-indigo-500"></i>
                                {user?.role || 'User'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium border shadow-sm capitalize ring-1 ring-black/5 ${
                                user?.status === 'active' 
                                    ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60' 
                                    : 'bg-neutral-50 text-neutral-600 border-neutral-200/60'
                            }`}>
                                <span className={`w-2 h-2 inline-block rounded-full mr-2 ${
                                    user?.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}></span>
                                {user?.status || 'Active'}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-shrink-0 mb-4 md:mb-4 w-full md:w-auto px-4 md:px-0">
                        <button
                            onClick={onEditPassword}
                            className="w-full md:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:scale-[0.99] touch-manipulation flex items-center justify-center gap-2 ring-1 ring-black/10"
                        >
                            <i className="fas fa-lock text-sm"></i>
                            Change Password
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ProfileHeader;


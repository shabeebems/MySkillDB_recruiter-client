import React from 'react';

const OrgProfileHeader = ({ 
  user, 
  onPhotoClick, 
  onViewImage, 
  onEditPassword, 
  isUploading,
  fileInputRef,
  onFileSelect
}) => {
  return (
    <div className="relative mb-8">
      {/* Background Banner */}
      <div className="h-48 bg-gradient-to-r from-slate-100 to-slate-200 w-full absolute top-0 left-0 z-0"></div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-24">
        <div className="flex flex-col md:flex-row items-end gap-6">
          
          {/* Profile Photo */}
          <div className="relative group">
            <div 
              onClick={onViewImage}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-white shadow-lg cursor-pointer relative overflow-hidden ring-1 ring-slate-100/50"
            >
              <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-50">
                {user?.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user?.name || 'Profile'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-500 text-5xl font-medium">
                    {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <i className="fas fa-expand text-white text-lg drop-shadow-md"></i>
                </div>

                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 backdrop-blur-[1px]">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Edit Button */}
            <button
              onClick={onPhotoClick}
              className="absolute bottom-1 right-1 w-8 h-8 bg-white hover:bg-slate-50 text-slate-600 rounded-full flex items-center justify-center shadow-md border border-slate-200 transition-all duration-200 hover:scale-105 active:scale-95 outline-none focus:ring-2 focus:ring-blue-500/40"
              title="Change Photo"
            >
              <i className="fas fa-camera text-xs"></i>
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileSelect}
              className="hidden"
            />
          </div>

          {/* User Info */}
          <div className="flex-1 pb-2 text-center md:text-left">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">
              {user?.name || 'Organization Admin'}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4 md:mb-0">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Admin'}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                user?.status === 'active' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {user?.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Active'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pb-2 w-full md:w-auto">
            <button
              onClick={onEditPassword}
              className="w-full md:w-auto px-5 py-2.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl font-medium shadow-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <i className="fas fa-key text-slate-400 text-xs"></i>
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgProfileHeader;

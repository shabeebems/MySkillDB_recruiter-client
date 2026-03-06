
const ProfileInfoCard = ({ user }) => {
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-sm ring-1 ring-black/5 overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-neutral-200/60 bg-neutral-50/50 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 flex items-center gap-3 tracking-tight">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm shadow-sm ring-1 ring-black/5">
                    <i className="fas fa-id-card"></i>
                </div>
                Personal Information
            </h2>
        </div>
        
        <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 sm:gap-y-6">
                <div className="group">
                    <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 block group-hover:text-indigo-600 transition-colors duration-300">Full Name</label>
                    <div className="flex items-center gap-3 p-3.5 bg-neutral-50/60 rounded-xl border border-neutral-200/60 ring-1 ring-black/5 group-hover:border-indigo-200 group-hover:bg-indigo-50/30 transition-all duration-300">
                        <i className="fas fa-user text-neutral-400 text-sm group-hover:text-indigo-500 transition-colors"></i>
                        <span className="text-neutral-800 font-semibold">{user?.name || 'N/A'}</span>
                    </div>
                </div>

                <div className="group">
                    <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 block group-hover:text-indigo-600 transition-colors duration-300">Email Address</label>
                    <div className="flex items-center gap-3 p-3.5 bg-neutral-50/60 rounded-xl border border-neutral-200/60 ring-1 ring-black/5 group-hover:border-indigo-200 group-hover:bg-indigo-50/30 transition-all duration-300">
                        <i className="fas fa-envelope text-neutral-400 text-sm group-hover:text-indigo-500 transition-colors"></i>
                        <span className="text-neutral-800 font-semibold truncate">{user?.email || 'N/A'}</span>
                    </div>
                </div>

                <div className="group">
                    <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 block group-hover:text-indigo-600 transition-colors duration-300">Phone Number</label>
                    <div className="flex items-center gap-3 p-3.5 bg-neutral-50/60 rounded-xl border border-neutral-200/60 ring-1 ring-black/5 group-hover:border-indigo-200 group-hover:bg-indigo-50/30 transition-all duration-300">
                        <i className="fas fa-phone text-neutral-400 text-sm group-hover:text-indigo-500 transition-colors"></i>
                        <span className="text-neutral-800 font-semibold">{user?.mobile || 'Not Provided'}</span>
                    </div>
                </div>

                <div className="group">
                    <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 block group-hover:text-indigo-600 transition-colors duration-300">Location</label>
                    <div className="flex items-center gap-3 p-3.5 bg-neutral-50/60 rounded-xl border border-neutral-200/60 ring-1 ring-black/5 group-hover:border-indigo-200 group-hover:bg-indigo-50/30 transition-all duration-300">
                        <i className="fas fa-map-marker-alt text-neutral-400 text-sm group-hover:text-indigo-500 transition-colors"></i>
                        <span className="text-neutral-800 font-semibold">--</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ProfileInfoCard;


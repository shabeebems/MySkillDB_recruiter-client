
const SecurityCard = ({ role, onUpdatePassword }) => {
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-sm ring-1 ring-black/5 overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-neutral-200/60 bg-neutral-50/50 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 flex items-center gap-3 tracking-tight">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm shadow-sm ring-1 ring-black/5">
                    <i className="fas fa-shield-alt"></i>
                </div>
                Security
            </h2>
        </div>
        <div className="p-5 sm:p-6 space-y-5">
            <div>
                <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Account Role</label>
                <div className="p-3.5 bg-emerald-50/70 text-emerald-700 rounded-xl font-medium border border-emerald-200/50 ring-1 ring-black/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <i className="fas fa-user-shield"></i>
                        <span className="capitalize">{role || 'N/A'}</span>
                    </div>
                    <i className="fas fa-check-circle text-emerald-500"></i>
                </div>
            </div>
            
            <div>
                <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Password</label>
                <div className="flex items-center justify-between p-3.5 bg-neutral-50/60 rounded-xl border border-neutral-200/60 ring-1 ring-black/5 group hover:border-indigo-200 transition-colors">
                    <div className="flex items-center gap-3">
                        <i className="fas fa-key text-neutral-400 text-sm"></i>
                        <span className="text-neutral-500 font-mono text-lg tracking-widest">••••••••</span>
                    </div>
                    <button 
                        onClick={onUpdatePassword}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all ring-1 ring-indigo-200/60 active:scale-[0.98] touch-manipulation"
                    >
                        Update
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SecurityCard;


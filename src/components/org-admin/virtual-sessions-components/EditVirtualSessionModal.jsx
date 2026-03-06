import React, { useState, useEffect } from "react";

const EditVirtualSessionModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  session,
}) => {
  const [name, setName] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("weekly");

  useEffect(() => {
    if (session && isOpen) {
      setName(session.name || "");
      setMeetLink(session.meetLink || "");
      setDate(session.date ? String(session.date).slice(0, 10) : "");
      setTime(session.time || "");
      setIsRecurring(!!session.isRecurring);
      setFrequency(session.frequency || "weekly");
    }
  }, [session, isOpen]);

  const getMinDate = () => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t.toISOString().slice(0, 10);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name?.trim() || !date || !time) return;
    onSubmit({
      name: name.trim(),
      meetLink: meetLink.trim() || undefined,
      date,
      time,
      isRecurring,
      frequency: isRecurring ? frequency : undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-5 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-neutral-900">Edit Virtual Session</h3>
              <p className="text-sm text-neutral-600 mt-1">Update session details</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors p-2 hover:bg-neutral-100 rounded-lg"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Session name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g. Math Revision"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Meet link (optional)</label>
            <input
              type="url"
              value={meetLink}
              onChange={(e) => setMeetLink(e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="https://meet.google.com/..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                min={getMinDate()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="edit-recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="edit-recurring" className="text-sm font-medium text-neutral-700">Recurring session</label>
          </div>
          {isRecurring && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-neutral-700 font-medium rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
            >
              {isLoading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVirtualSessionModal;

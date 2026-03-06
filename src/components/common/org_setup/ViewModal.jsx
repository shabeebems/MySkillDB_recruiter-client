const ViewModal = ({
  isOpen,
  viewModalType,
  viewingItem,
  onClose,
  getEntityDisplayValue,
  onDelete
}) => {
  if (!isOpen) return null;

  // Function to detect if a line is a heading
  const isHeading = (line) => {
    const trimmedLine = line.trim();
    // Check if line ends with colon or is relatively short (< 50 chars) and looks like a title
    return (
      trimmedLine.endsWith(':') || 
      (trimmedLine.length < 50 && trimmedLine.length > 3 && 
       /^[A-Z]/.test(trimmedLine) && 
       !trimmedLine.includes('.') &&
       trimmedLine.split(' ').length <= 6)
    );
  };

  // Function to format lines with bullets or numbering
  const formatLineWithBulletOrNumber = (line) => {
    const trimmedLine = line.trim();
    
    // Match bullet points: -, *, •, ○ followed by text
    const bulletMatch = trimmedLine.match(/^([•○\-\*])\s+(.+)$/);
    if (bulletMatch) {
      const [, bullet, text] = bulletMatch;
      return (
        <span>
          <span className="text-slate-600">{bullet} </span>
          <span className="font-semibold text-slate-900">{text}</span>
        </span>
      );
    }
    
    // Match numbered lists: 1., 2., 1), 2), etc.
    const numberMatch = trimmedLine.match(/^(\d+[\.\)])\s+(.+)$/);
    if (numberMatch) {
      const [, number, text] = numberMatch;
      return (
        <span>
          <span className="text-slate-600">{number} </span>
          <span className="font-semibold text-slate-900">{text}</span>
        </span>
      );
    }
    
    return line;
  };

  // Function to render formatted description
  const renderDescription = (description) => {
    if (!description || description === '-') return <span className="text-slate-400">-</span>;
    
    return (
      <div className="space-y-1 text-left">
        {description.split('\n').map((line, index) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return null;
          
          if (isHeading(trimmedLine)) {
            return (
              <p key={index} className="font-bold text-slate-900 mt-2 first:mt-0">
                {trimmedLine}
              </p>
            );
          }
          
          return (
            <p key={index} className="text-slate-600 whitespace-pre-wrap">
              {formatLineWithBulletOrNumber(line)}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              View All {viewModalType.charAt(0).toUpperCase() + viewModalType.slice(1)}s
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th className="p-3 text-left font-semibold">Name</th>
                  <th className="p-3 text-left font-semibold">Description</th>
                  {viewModalType === 'subject' && (
                    <>
                      <th className="p-3 text-left font-semibold">Code</th>
                      <th className="p-3 text-left font-semibold">Department</th>
                    </>
                  )}
                  {onDelete && (
                    <th className="p-3 text-center font-semibold w-24">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {viewingItem && viewingItem.map((item, index) => (
                  <tr key={item._id || index} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="p-3 font-medium align-top">{item.name}</td>
                    <td className="p-3 align-top">{renderDescription(item.description)}</td>
                    {viewModalType === 'subject' && (
                      <>
                        <td className="p-3 text-slate-600 align-top">{item.code}</td>
                        <td className="p-3 text-slate-600 align-top">{getEntityDisplayValue(item, 'department')}</td>
                      </>
                    )}
                    {onDelete && (
                      <td className="p-3 align-top text-center">
                        <button
                          onClick={() => onDelete(item)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                          title="Delete"
                        >
                          <i className="fas fa-trash-alt"></i>
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {(!viewingItem || viewingItem.length === 0) && (
                  <tr>
                    <td colSpan={viewModalType === 'subject' ? (onDelete ? 5 : 4) : (onDelete ? 3 : 2)} className="text-center p-8 text-slate-500">
                      No {viewModalType}s found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewModal;
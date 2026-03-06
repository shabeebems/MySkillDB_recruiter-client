import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const LearningModuleReader = ({ isOpen, onClose, generatedModule, selectedSkill, selectedJob, isGenerating }) => {
  if (!isOpen) return null;

  // Handle print to PDF
  const handlePrintToPDF = () => {
    // Get the content to print
    const printContent = document.getElementById('learning-module-content');
    if (!printContent) {
      console.error('Print content not found');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Could not open print window');
      return;
    }

    // Write the HTML structure
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedSkill?.name || 'Learning Module'} - ${selectedJob?.title || ''}</title>
          <style>
            @page {
              margin: 1.5cm 2cm;
              size: A4 portrait;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1e293b;
              margin: 0;
              padding: 20px;
              background: white;
            }
            
            h1 {
              font-size: 2rem;
              font-weight: bold;
              color: #0f172a;
              margin-top: 1.5rem;
              margin-bottom: 1rem;
            }
            
            h2 {
              font-size: 1.5rem;
              font-weight: bold;
              color: #1d4ed8;
              margin-top: 2rem;
              margin-bottom: 1rem;
              padding-bottom: 0.5rem;
              border-bottom: 2px solid #dbeafe;
              page-break-after: avoid;
            }
            
            h3 {
              font-size: 1.25rem;
              font-weight: 600;
              color: #0f172a;
              margin-top: 1rem;
              margin-bottom: 0.5rem;
              page-break-after: avoid;
            }
            
            p {
              color: #334155;
              margin-bottom: 1rem;
              line-height: 1.75;
            }
            
            section {
              margin-bottom: 2.5rem;
              page-break-inside: auto;
            }
            
            .concept-box {
              background-color: #f8fafc;
              border-left: 4px solid #3b82f6;
              padding: 1.5rem;
              margin: 1rem 0;
              page-break-inside: avoid;
            }
            
            .concept-box h3 {
              margin-top: 0;
              padding-bottom: 0.5rem;
              border-bottom: 1px solid #cbd5e1;
            }
            
            ul, ol {
              margin-left: 1.5rem;
              margin-bottom: 1rem;
              color: #334155;
            }
            
            li {
              margin-bottom: 0.5rem;
              page-break-inside: avoid;
            }
            
            strong {
              font-weight: bold;
              color: #0f172a;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 1.5rem 0;
              page-break-inside: auto;
            }
            
            thead {
              display: table-header-group;
              background-color: #f8fafc;
            }
            
            th, td {
              border: 1px solid #e2e8f0;
              padding: 0.75rem;
              text-align: left;
            }
            
            th {
              font-weight: 600;
              color: #0f172a;
            }
            
            tr {
              page-break-inside: avoid;
            }
            
            blockquote {
              border-left: 4px solid #3b82f6;
              background-color: #eff6ff;
              padding: 1rem;
              margin: 1rem 0;
              font-style: italic;
              color: #334155;
            }
            
            code {
              background-color: #f1f5f9;
              color: #ec4899;
              padding: 0.125rem 0.375rem;
              border-radius: 0.25rem;
              font-family: 'Courier New', monospace;
              font-size: 0.875rem;
            }
            
            pre {
              background-color: #1e293b;
              color: #f1f5f9;
              padding: 1rem;
              border-radius: 0.5rem;
              overflow-x: auto;
              margin: 1rem 0;
            }
            
            pre code {
              background: none;
              color: inherit;
              padding: 0;
            }
            
            .header-section {
              border-bottom: 2px solid #cbd5e1;
              padding-bottom: 1.5rem;
              margin-bottom: 2.5rem;
            }
            
            .header-section h1 {
              margin-top: 0;
              font-size: 2.25rem;
            }
            
            .header-section p {
              color: #64748b;
              font-size: 1rem;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = function() {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };

  // Define custom styles for markdown elements
  const markdownComponents = {
    h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-4" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-xl font-bold text-slate-800 mt-5 mb-3" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-slate-800 mt-4 mb-2" {...props} />,
    p: ({node, children, ...props}) => {
      // Check if paragraph only contains a code/pre element
      const hasCodeBlock = React.Children.toArray(children).some(
        child => React.isValidElement(child) && (child.type === 'code' || child.type === 'pre')
      );
      
      // If it contains a code block, render as div instead of p to avoid nesting issues
      if (hasCodeBlock) {
        return <div className="mb-4" {...props}>{children}</div>;
      }
      
      return <p className="text-slate-700 mb-4 leading-relaxed" {...props}>{children}</p>;
    },
    ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 mb-4 text-slate-700" {...props} />,
    ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 mb-4 text-slate-700" {...props} />,
    li: ({node, ...props}) => <li className="mb-1 pl-1" {...props} />,
    blockquote: ({node, ...props}) => (
      <blockquote className="border-l-4 border-blue-500 bg-blue-50 p-4 my-4 italic text-slate-700 rounded-r" {...props} />
    ),
    table: ({node, ...props}) => (
      <div className="overflow-x-auto my-6 rounded-lg border border-slate-200 shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm text-left" {...props} />
      </div>
    ),
    thead: ({node, ...props}) => <thead className="bg-slate-50 font-semibold text-slate-900" {...props} />,
    tbody: ({node, ...props}) => <tbody className="divide-y divide-slate-200 bg-white" {...props} />,
    tr: ({node, ...props}) => <tr className="hover:bg-slate-50 transition-colors" {...props} />,
    th: ({node, ...props}) => <th className="px-4 py-3 whitespace-nowrap" {...props} />,
    td: ({node, ...props}) => <td className="px-4 py-3 align-top" {...props} />,
    strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
    a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
    code: ({node, inline, className, children, ...props}) => {
       if (inline) {
         return <code className="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
       }
       // For code blocks, return code wrapped in pre
       return (
         <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono">
           <code {...props}>{children}</code>
         </pre>
       );
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[#fafafa]">
      {/* Minimal top bar - TechCrunch style */}
      <header className="sticky top-0 z-10 bg-[#fafafa]/95 backdrop-blur border-b border-neutral-200 no-print">
        <div className="max-w-[720px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <i className="fas fa-arrow-left text-xs" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrintToPDF}
              disabled={isGenerating || !generatedModule}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 disabled:opacity-50 transition-colors"
              title="Print to PDF"
            >
              <i className="fas fa-file-pdf mr-1.5" />
              Export PDF
            </button>
          </div>
        </div>
      </header>

      {/* Article - blog layout */}
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div id="learning-module-content">
          {isGenerating ? (
            <div className="text-center py-24">
              <div className="w-12 h-12 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-6" />
              <h2 className="text-xl font-bold text-neutral-900 mb-2">Generating your module...</h2>
              <p className="text-neutral-500 text-sm">This will only take a moment.</p>
            </div>
          ) : generatedModule && (
            <>
              <h1 className="text-[2rem] sm:text-[2.5rem] font-bold text-neutral-900 leading-tight tracking-tight mb-3">
                {generatedModule.skillName}
              </h1>
              <p className="text-sm text-neutral-500 mb-8 pb-8 border-b border-neutral-200">
                Learning module · {generatedModule.jobContext}
              </p>

              <section className="mb-10">
                <h2 className="text-lg font-bold text-neutral-900 mb-4 tracking-tight">
                  1. Introduction
                </h2>
                <div className="text-[17px] leading-[1.7] text-neutral-700">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {generatedModule.introduction}
                  </ReactMarkdown>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-lg font-bold text-neutral-900 mb-4 tracking-tight">
                  2. Key Concepts
                </h2>
                <div className="space-y-8">
                  {generatedModule.keyConcepts.map((concept, index) => (
                    <div key={index} className="border-l-2 border-neutral-900 pl-6">
                      <h3 className="text-base font-bold text-neutral-900 mb-3">
                        {concept.title}
                      </h3>
                      <div className="text-[17px] leading-[1.7] text-neutral-700">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {concept.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-lg font-bold text-neutral-900 mb-4 tracking-tight">
                  3. Summary
                </h2>
                <ul className="space-y-3">
                  {generatedModule.summary.map((point, index) => (
                    <li key={index} className="flex gap-3 text-[17px] leading-[1.7] text-neutral-700 items-start">
                      <span className="text-neutral-400 mt-1.5">·</span>
                      <span>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                          p: ({ node, ...props }) => <span {...props} />,
                        }}>
                          {point}
                        </ReactMarkdown>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningModuleReader;


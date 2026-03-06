import React from 'react';

// Print styles for the CV Preview view (moved from job_cv.jsx)
const JobCVPreviewPrintStyles = () => (
  <style>{`
          @media print {
            @page {
              size: A4;
              margin: 5mm;
              /* Reduced margin on all sides; uncheck "Headers and footers" in print dialog to remove title, date, URL */
            }
            
            /* Show only the CV preview content when printing */
            body * {
              visibility: hidden !important;
            }
            .cv-print-area,
            .cv-print-area * {
              visibility: visible !important;
            }
            .cv-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 210mm !important;
              min-height: 297mm !important;
              height: auto !important;
              max-width: 210mm !important;
              margin: 0 !important;
              padding: 5mm !important;
              box-sizing: border-box !important;
              background: white !important;
              background-image: none !important;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: auto !important;
              background: white !important;
            }
            
            .page-break {
              page-break-before: always;
            }
            
            .avoid-break {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Prevent breaking inside paragraphs - keep at least 3 lines together */
            p {
              orphans: 3;
              widows: 3;
            }
            
            /* Section headers should stay with at least some content */
            h2 {
              page-break-after: avoid;
              orphans: 2;
              widows: 2;
            }
            
            /* Add padding to sections that might start on a new page */
            .cv-section {
              orphans: 2;
              widows: 2;
            }
            
            /* Add gap when section starts on a new page (after page break) */
            .cv-section + .cv-section {
              padding-top: 5mm;
            }
            
            /* Skills grid - try to keep together */
            .skills-grid {
              orphans: 2;
              widows: 2;
            }
            
            /* Individual skill cards should not break */
            .skill-card {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Work experience entries should not break */
            .work-experience-item {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Education entries should not break */
            .education-item {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Add gap for work experience and education items that start on new page */
            .work-experience-item:first-of-type,
            .education-item:first-of-type {
              margin-top: 0;
            }
            
            /* Hide only navigation and control buttons */
            nav, .no-print, button, .lg\\:hidden, .menu-button, header, .z-40, .z-50 {
              display: none !important;
            }
            
            /* Hide any leftover "Generated on" footer in print */
            .cv-generated-date,
            .cv-print-footer-date {
              display: none !important;
            }
            
            /* Hide MySkillDB footer in print/PDF */
            .cv-myskilldb-footer {
              display: none !important;
            }
            
            /* Remove side margin */
            .lg\\:ml-72 {
              margin-left: 0 !important;
            }
            
            /* Remove outer padding */
            .min-h-screen {
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
            }
            
            /* Center the CV properly */
            .max-w-4xl {
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* Add proper margins to CV container */
            .cv-container {
              padding: 0 !important;
              margin: 0 !important;
            }
            
            /* Remove overflow scroll for print */
            .overflow-x-auto {
              overflow: visible !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            
            /* CV content full width in print with minimal padding */
            .w-\\[210mm\\] {
              width: 100% !important;
              padding: 3mm !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            
            /* Ensure all text remains left-aligned */
            .text-center {
              text-align: left !important;
            }
            
            .justify-center {
              justify-content: flex-start !important;
            }
            
            .items-center {
              align-items: flex-start !important;
            }
            
            /* Preserve centering for contact line in templates 2 and 4 */
            .contact-line-center {
              text-align: center !important;
              justify-content: center !important;
            }
            
            .contact-line-center * {
              text-align: center !important;
            }
          }
        `}</style>
);

export default JobCVPreviewPrintStyles;



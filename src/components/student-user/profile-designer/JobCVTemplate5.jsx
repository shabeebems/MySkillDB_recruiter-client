import React from 'react';

// Template 5: Two-Column Layout with Sidebar (Professional Executive Style)
const JobCVTemplate5 = ({ cv }) => {
  if (!cv) return null;

  return (
    <div
      className="relative bg-white rounded-xl shadow-lg border border-slate-200 p-0 print:p-0 w-[210mm] mx-auto"
      style={{ minHeight: '297mm' }}
    >
      <div className="flex">
        {/* Left Sidebar - Dark Background */}
        <div className="w-1/3 bg-slate-800 text-white p-6 print:p-4">
          {/* Name & Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2 leading-tight text-left">
              {cv.profile.fullName}
            </h1>
            <p className="text-slate-300 text-sm font-medium text-left">
              {cv.job.title}
            </p>
          </div>

          {/* Contact Info */}
          <div className="mb-6 space-y-3">
            <div className="flex items-start gap-2">
              <i className="fas fa-map-marker-alt text-slate-400 mt-1 text-xs"></i>
              <span className="text-xs text-slate-300">{cv.profile.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-phone text-slate-400 text-xs"></i>
              <span className="text-xs text-slate-300">{cv.profile.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-envelope text-slate-400 text-xs"></i>
              <span className="text-xs text-slate-300 break-all">{cv.profile.email}</span>
            </div>
            {cv.profile.linkedin && (
              <div className="flex items-center gap-2">
                <i className="fab fa-linkedin text-slate-400 text-xs"></i>
                <a
                  href={`https://${cv.profile.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-300 hover:text-white"
                >
                  LinkedIn
                </a>
              </div>
            )}
            {cv.profile.github && (
              <div className="flex items-center gap-2">
                <i className="fab fa-github text-slate-400 text-xs"></i>
                <a
                  href={`https://${cv.profile.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-300 hover:text-white"
                >
                  GitHub
                </a>
              </div>
            )}
            {cv.profile.portfolio && (
              <div className="flex items-center gap-2">
                <i className="fas fa-globe text-slate-400 text-xs"></i>
                <a
                  href={`https://${cv.profile.portfolio}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-300 hover:text-white"
                >
                  Portfolio
                </a>
              </div>
            )}
          </div>

          {/* Education */}
          {cv.profile.education && cv.profile.education.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3 text-white border-b border-slate-600 pb-2 text-left">
                Education
              </h2>
              <div className="space-y-3">
                {cv.profile.education.map((edu) => (
                  <div key={edu.id} className="avoid-break">
                    <div className="flex justify-between items-start">
                      <div className="text-left">
                        <h3 className="text-xs font-semibold text-white mb-1">
                          {edu.degree}
                        </h3>
                        <p className="text-xs text-slate-300">{edu.institution}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">
                          {edu.startYear} - {edu.endYear}
                        </p>
                        {edu.gpa && (
                          <p className="text-xs text-slate-400">GPA: {edu.gpa}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificates */}
          {cv.profile.certificates && cv.profile.certificates.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3 text-white border-b border-slate-600 pb-2 text-left">
                Certificates
              </h2>
              <div className="space-y-3">
                {cv.profile.certificates.map((cert) => (
                  <div key={cert.id} className="avoid-break">
                    <div className="flex justify-between items-start">
                      <div className="text-left">
                        <h3 className="text-xs font-semibold text-white mb-1">
                          {cert.title}
                        </h3>
                        <p className="text-xs text-slate-300">{cert.issuer}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">{cert.year}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Content Area */}
        <div className="w-2/3 p-6 print:p-4 bg-white">
          {/* Professional Summary */}
          <div className="mb-6 cv-section avoid-break">
            <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-wide border-b-2 border-slate-800 pb-2 text-left">
              Professional Summary
            </h2>
            <p className="text-slate-700 leading-relaxed text-sm text-left">
              {cv.profile.aboutMe}
            </p>
          </div>

          {/* Work Experience */}
          {cv.profile.workExperience && cv.profile.workExperience.length > 0 && (
            <div className="mb-6 cv-section">
              <h2 className="text-lg font-bold text-slate-800 mb-4 uppercase tracking-wide border-b-2 border-slate-800 pb-2 text-left">
                Work Experience
              </h2>
              <div className="space-y-4">
                {cv.profile.workExperience.map((exp) => (
                  <div key={exp.id} className="work-experience-item avoid-break">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-left">
                        <h3 className="text-base font-bold text-slate-900 text-left">
                          {exp.title}
                        </h3>
                        <p className="text-sm font-semibold text-slate-700 text-left">
                          {exp.company}
                        </p>
                        {exp.location && (
                          <p className="text-xs text-slate-600 text-left">{exp.location}</p>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium whitespace-nowrap text-left">
                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                      </p>
                    </div>
                    {exp.description && (
                      <p className="text-sm text-slate-700 leading-relaxed mt-2 text-left">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {cv.profile.projects && cv.profile.projects.length > 0 && (
            <div className="mb-6 cv-section">
              <h2 className="text-lg font-bold text-slate-800 mb-4 uppercase tracking-wide border-b-2 border-slate-800 pb-2 text-left">
                Projects
              </h2>
              <div className="space-y-4">
                {cv.profile.projects.map((proj) => (
                  <div key={proj.id} className="work-experience-item avoid-break">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-left">
                        <h3 className="text-base font-bold text-slate-900 text-left">
                          {proj.title}
                        </h3>
                        <p className="text-sm font-semibold text-slate-700 text-left">
                          {proj.type}
                        </p>
                      </div>
                      <p className="text-xs text-slate-600 font-medium whitespace-nowrap text-left">
                        {proj.startDate} - {proj.endDate}
                      </p>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed mt-2 text-left">
                      {proj.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills - Grouped by Type */}
          <div className="mb-6 cv-section">
            <h2 className="text-lg font-bold text-slate-800 mb-4 uppercase tracking-wide border-b-2 border-slate-800 pb-2 text-left">
              Skills
            </h2>
            <div className="space-y-4">
              {['technical', 'tools', 'soft', 'other'].map((skillType) => {
                const skillsOfType = cv.skills.filter(skill => (skill.type || 'technical') === skillType);
                if (skillsOfType.length === 0) return null;
                
                const typeLabels = {
                  technical: 'Core Skills',
                  tools: 'Tools & Technologies',
                  soft: 'Soft Skills',
                  other: 'Other Skills'
                };
                
                // Join all skill names with commas
                const skillsList = skillsOfType.map(skill => skill.name).join(', ');
                
                return (
                  <div key={skillType} className="avoid-break text-left">
                    <h3 className="text-base font-bold text-slate-900 text-left">
                      {typeLabels[skillType]}
                    </h3>
                    <p className="text-sm font-semibold text-slate-700 text-left">
                      {skillsList}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MySkillDB at bottom right (print: fixed so appears on every page) */}
      <div className="cv-myskilldb-footer absolute bottom-0 right-0 text-xs text-slate-500 mt-4 pr-1">
        MySkillDB
      </div>
    </div>
  );
};

export default JobCVTemplate5;


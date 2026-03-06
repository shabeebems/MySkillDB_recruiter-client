import React from 'react';

// Template 8: Professional Grid Layout with Sections
const JobCVTemplate8 = ({ cv }) => {
  if (!cv) return null;

  return (
    <div
      className="relative bg-white rounded-xl shadow-lg border-2 border-slate-300 p-8 print:p-0 w-[210mm] mx-auto"
      style={{ minHeight: '297mm' }}
    >
      {/* Header with Border */}
      <div className="mb-8 pb-6 border-b-4 border-teal-600">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4 flex-1">
            {cv.profile.profilePicture && (
              <img
                src={cv.profile.profilePicture}
                alt={cv.profile.fullName}
                className="w-28 h-28 rounded-full object-cover border-4 border-teal-600 flex-shrink-0"
              />
            )}
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
                {cv.profile.fullName}
              </h1>
              <p className="text-2xl font-semibold text-teal-600 mb-4">
                {cv.job.title}
              </p>
            </div>
          </div>
          <div className="text-right text-sm text-slate-600 space-y-1">
            <p>{cv.profile.address}</p>
            <p>{cv.profile.phone}</p>
            <p className="break-all">{cv.profile.email}</p>
            <div className="flex gap-3 justify-end mt-2">
              {cv.profile.linkedin && (
                <a href={`https://${cv.profile.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700">
                  <i className="fab fa-linkedin"></i>
                </a>
              )}
              {cv.profile.github && (
                <a href={`https://${cv.profile.github}`} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700">
                  <i className="fab fa-github"></i>
                </a>
              )}
              {cv.profile.portfolio && (
                <a href={`https://${cv.profile.portfolio}`} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700">
                  <i className="fas fa-globe"></i>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      <div className="mb-6 cv-section avoid-break">
        <h2 className="text-lg font-bold text-white bg-teal-600 px-4 py-2 mb-3 uppercase tracking-wide">
          Professional Summary
        </h2>
        <p className="text-slate-700 leading-relaxed text-sm pl-2">
          {cv.profile.aboutMe}
        </p>
      </div>

      {/* Grid Layout: 2 Columns */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Skills Section */}
          <div className="cv-section">
            <h2 className="text-lg font-bold text-white bg-teal-600 px-4 py-2 mb-3 uppercase tracking-wide">
              Core Skills
            </h2>
            <div className="space-y-4 pl-2">
              {['technical', 'tools', 'soft', 'other'].map((skillType) => {
                const skillsOfType = cv.skills.filter(skill => (skill.type || 'technical') === skillType);
                if (skillsOfType.length === 0) return null;
                
                const typeLabels = {
                  technical: 'Technical Skills',
                  tools: 'Tools & Technologies',
                  soft: 'Soft Skills',
                  other: 'Other Skills'
                };
                
                return (
                  <div key={skillType} className="avoid-break">
                    <h3 className="text-sm font-bold text-slate-800 mb-2 border-b border-slate-300 pb-1">
                      {typeLabels[skillType]}
                    </h3>
                    <ul className="list-disc list-inside space-y-1">
                      {skillsOfType.map((skill) => (
                        <li key={skill.id} className="text-sm text-slate-700">
                          {skill.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Work Experience */}
          {cv.profile.workExperience && cv.profile.workExperience.length > 0 && (
            <div className="cv-section">
              <h2 className="text-lg font-bold text-white bg-teal-600 px-4 py-2 mb-3 uppercase tracking-wide">
                Professional Experience
              </h2>
              <div className="space-y-4 pl-2">
                {cv.profile.workExperience.map((exp) => (
                  <div key={exp.id} className="work-experience-item avoid-break border-l-4 border-teal-400 pl-3">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {exp.title}
                        </h3>
                        <p className="text-xs font-semibold text-teal-600">
                          {exp.company}
                        </p>
                      </div>
                      <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-xs text-slate-700 leading-relaxed mt-1">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education Section */}
          {cv.profile.education && cv.profile.education.length > 0 && (
            <div className="cv-section">
              <h2 className="text-lg font-bold text-white bg-teal-600 px-4 py-2 mb-3 uppercase tracking-wide">
                Education
              </h2>
              <div className="space-y-3 pl-2">
                {cv.profile.education.map((edu) => (
                  <div key={edu.id} className="avoid-break">
                    <h3 className="text-sm font-bold text-slate-900">
                      {edu.degree}
                    </h3>
                    <p className="text-xs text-slate-700 font-medium">{edu.institution}</p>
                    <p className="text-xs text-slate-600">
                      {edu.startYear} - {edu.endYear}
                      {edu.gpa && ` • GPA: ${edu.gpa}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Projects Section */}
      {cv.profile.projects && cv.profile.projects.length > 0 && (
        <div className="cv-section mt-6">
          <h2 className="text-lg font-bold text-white bg-teal-600 px-4 py-2 mb-3 uppercase tracking-wide">
            Projects
          </h2>
          <div className="space-y-4 pl-2">
            {cv.profile.projects.map((proj) => (
              <div key={proj.id} className="work-experience-item avoid-break border-l-4 border-teal-400 pl-3">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {proj.title}
                    </h3>
                    <p className="text-xs font-semibold text-teal-600">
                      {proj.type}
                    </p>
                  </div>
                  <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
                    {proj.startDate} - {proj.endDate}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed mt-1">
                  {proj.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificates Section */}
      {cv.profile.certificates && cv.profile.certificates.length > 0 && (
        <div className="cv-section mt-6">
          <h2 className="text-lg font-bold text-white bg-teal-600 px-4 py-2 mb-3 uppercase tracking-wide">
            Certificates
          </h2>
          <div className="space-y-3 pl-2">
            {cv.profile.certificates.map((cert) => (
              <div key={cert.id} className="avoid-break">
                <h3 className="text-sm font-bold text-slate-900">
                  {cert.title}
                </h3>
                <p className="text-xs text-slate-700 font-medium">{cert.issuer}</p>
                <p className="text-xs text-slate-600">{cert.year}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MySkillDB at bottom right (print: fixed so appears on every page) */}
      <div className="cv-myskilldb-footer absolute bottom-0 right-0 text-xs text-slate-500 mt-6 pr-1">
        MySkillDB
      </div>
    </div>
  );
};

export default JobCVTemplate8;


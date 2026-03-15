import React from 'react';

// Template 7: Card-Based Modern Layout
const JobCVTemplate7 = ({ cv }) => {
  if (!cv) return null;

  return (
    <div
      className="relative bg-gradient-to-br from-slate-50 to-white rounded-xl shadow-lg border border-slate-200 p-8 print:p-0 w-[210mm] mx-auto"
      style={{ minHeight: '297mm' }}
    >
      {/* Header Card */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg p-6 mb-6 shadow-md">
        <h1 className="text-3xl font-bold mb-2">{cv.profile.fullName}</h1>
        <p className="text-lg text-purple-100 mb-4">{cv.job.title}</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <span><i className="fas fa-map-marker-alt mr-2"></i>{cv.profile.address}</span>
          <span><i className="fas fa-phone mr-2"></i>{cv.profile.phone}</span>
          <span><i className="fas fa-envelope mr-2"></i>{cv.profile.email}</span>
          {cv.profile.linkedin && (
            <a href={`https://${cv.profile.linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:text-purple-200">
              <i className="fab fa-linkedin mr-2"></i>LinkedIn
            </a>
          )}
          {cv.profile.github && (
            <a href={`https://${cv.profile.github}`} target="_blank" rel="noopener noreferrer" className="hover:text-purple-200">
              <i className="fab fa-github mr-2"></i>GitHub
            </a>
          )}
        </div>
      </div>

      {/* Professional Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-6 cv-section avoid-break">
        <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          <i className="fas fa-user-circle text-purple-600"></i>
          Professional Summary
        </h2>
        <p className="text-slate-700 leading-relaxed text-sm">
          {cv.profile.aboutMe}
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Skills Card */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 cv-section">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <i className="fas fa-code text-purple-600"></i>
              Skills
            </h2>
            {['technical', 'tools', 'soft', 'other'].map((skillType) => {
              const skillsOfType = cv.skills.filter(skill => (skill.type || 'technical') === skillType);
              if (skillsOfType.length === 0) return null;
              
              const typeLabels = {
                technical: 'Technical',
                tools: 'Tools',
                soft: 'Soft Skills',
                other: 'Other'
              };
              
              return (
                <div key={skillType} className="mb-4 avoid-break">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    {typeLabels[skillType]}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skillsOfType.map((skill) => (
                      <span
                        key={skill.id}
                        className="bg-purple-50 text-purple-700 px-3 py-1 rounded-md text-xs font-medium border border-purple-200"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Work Experience Card */}
          {cv.profile.workExperience && cv.profile.workExperience.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 cv-section">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <i className="fas fa-briefcase text-purple-600"></i>
                Work Experience
              </h2>
              <div className="space-y-4">
                {cv.profile.workExperience.map((exp) => (
                  <div key={exp.id} className="work-experience-item avoid-break pb-4 border-b border-slate-100 last:border-0">
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      {exp.title}
                    </h3>
                    <p className="text-xs font-semibold text-purple-600 mb-1">
                      {exp.company}
                    </p>
                    <p className="text-xs text-slate-600 mb-2">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </p>
                    {exp.description && (
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education Card */}
          {cv.profile.education && cv.profile.education.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 cv-section">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <i className="fas fa-graduation-cap text-purple-600"></i>
                Education
              </h2>
              <div className="space-y-4">
                {cv.profile.education.map((edu) => (
                  <div key={edu.id} className="avoid-break border-l-4 border-purple-400 pl-3">
                    <h3 className="text-sm font-bold text-slate-900">
                      {edu.degree}
                    </h3>
                    <p className="text-xs text-slate-700 font-medium">{edu.institution}</p>
                    <p className="text-xs text-slate-600">
                      {edu.startYear} - {edu.endYear}
                    </p>
                    {edu.gpa && (
                      <p className="text-xs text-slate-600">GPA: {edu.gpa}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Projects Card */}
      {cv.profile.projects && cv.profile.projects.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-6 cv-section">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <i className="fas fa-project-diagram text-purple-600"></i>
            Projects
          </h2>
          <div className="space-y-4">
            {cv.profile.projects.map((proj) => (
              <div key={proj.id} className="work-experience-item avoid-break pb-4 border-b border-slate-100 last:border-0">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  {proj.title}
                </h3>
                <p className="text-xs font-semibold text-purple-600 mb-1">
                  {proj.type}
                </p>
                {(proj.startDate || proj.endDate) && (
                  <p className="text-xs text-slate-600 mb-2">
                    {proj.startDate} - {proj.endDate}
                  </p>
                )}
                <p className="text-xs text-slate-700 leading-relaxed">
                  {proj.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificates Card */}
      {cv.profile.certificates && cv.profile.certificates.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-6 cv-section">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <i className="fas fa-certificate text-purple-600"></i>
            Certificates
          </h2>
          <div className="space-y-4">
            {cv.profile.certificates.map((cert) => (
              <div key={cert.id} className="avoid-break border-l-4 border-purple-400 pl-3">
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

export default JobCVTemplate7;


import React from 'react';

// Template 2: Resume Style (similar to Shabeeb_Resume layout) – extracted from JobCV
const JobCVTemplate2 = ({ cv }) => {
  if (!cv) return null;

  return (
    <div
      className="relative bg-white rounded-xl shadow-lg border border-slate-200 p-8 print:p-0 w-[210mm] mx-auto"
      style={{ minHeight: '297mm' }}
    >
      {/* Header - Name, Role, Location & Contact */}
      <div className="mb-6 pb-4 border-b border-slate-300">
        <div className="flex items-start gap-4 mb-2">
          {cv.profile.profilePicture && (
            <img
              src={cv.profile.profilePicture}
              alt={cv.profile.fullName}
              className="w-24 h-24 rounded-full object-cover border-2 border-slate-300 flex-shrink-0"
            />
          )}
          <div className="flex-1">
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-1">
              {cv.profile.fullName}
            </h1>
            <p className="text-base lg:text-lg font-semibold text-slate-800">
              {cv.job.title}
              {cv.profile.address && (
                <span className="text-slate-600 font-normal">
                  {' '}
                  &nbsp;•&nbsp; {cv.profile.address}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="contact-line-center flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-slate-600 mt-2 text-center">
          {cv.profile.phone && <span>{cv.profile.phone}</span>}
          {cv.profile.email && (
            <>
              <span>•</span>
              <span>{cv.profile.email}</span>
            </>
          )}
          {cv.profile.linkedin && (
            <>
              <span>•</span>
              <a
                href={`https://${cv.profile.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-900 font-medium"
              >
                LinkedIn
              </a>
            </>
          )}
          {cv.profile.github && (
            <>
              <span>•</span>
              <a
                href={`https://${cv.profile.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-900 font-medium"
              >
                GitHub
              </a>
            </>
          )}
          {cv.profile.portfolio && (
            <>
              <span>•</span>
              <a
                href={`https://${cv.profile.portfolio}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-900 font-medium"
              >
                Portfolio
              </a>
            </>
          )}
        </div>
      </div>

      {/* Profile Summary */}
      <div className="mb-5 cv-section avoid-break">
        <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
          Profile Summary
        </h2>
        <div className="h-px bg-slate-300 my-2" />
        <p className="text-base text-slate-700 leading-relaxed text-left">
          {cv.profile.aboutMe}
        </p>
      </div>

      {/* Skills - Grouped by type */}
      {cv.skills && cv.skills.length > 0 && (
        <div className="mb-5 cv-section avoid-break">
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
              <div key={skillType} className="mb-4">
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                  {typeLabels[skillType]}
                </h2>
                <div className="h-px bg-slate-300 my-2" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 skills-grid">
                  {skillsOfType.map((skill) => (
                    <div
                      key={skill.id}
                      className="skill-card avoid-break flex items-baseline"
                    >
                      <span className="text-slate-900 mr-1.5 text-base">•</span>
                      <span className="text-sm text-slate-900">{skill.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Professional Experience */}
      {cv.profile.workExperience && cv.profile.workExperience.length > 0 && (
        <div className="mb-5 cv-section">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
            Professional Experience
          </h2>
          <div className="h-px bg-slate-300 my-2" />
          <div className="space-y-4">
            {cv.profile.workExperience.map((exp) => (
              <div key={exp.id} className="work-experience-item avoid-break">
                <div className="flex flex-row justify-between items-start mb-1">
                  <div className="text-left">
                    <h3 className="text-base font-semibold text-slate-900 text-left">
                      {exp.title}
                    </h3>
                    <p className="text-sm text-slate-700 font-medium text-left">
                      {exp.company}
                    </p>
                    {exp.location && (
                      <p className="text-sm text-slate-600 text-left">
                        {exp.location}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 whitespace-nowrap text-right">
                    {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                  </p>
                </div>
                {exp.description && (
                  <p className="text-sm text-slate-700 leading-relaxed text-left mt-1">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {cv.profile.education && cv.profile.education.length > 0 && (
        <div className="mb-5 cv-section">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
            Education
          </h2>
          <div className="h-px bg-slate-300 my-2" />
          <div className="space-y-3">
            {cv.profile.education.map((edu) => (
              <div key={edu.id} className="education-item avoid-break">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {edu.degree}
                    </h3>
                    <p className="text-sm text-slate-700">{edu.institution}</p>
                    {edu.location && (
                      <p className="text-sm text-slate-600">{edu.location}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-700">
                      {edu.startYear} - {edu.endYear}
                    </p>
                    {edu.gpa && (
                      <p className="text-sm text-slate-600">GPA: {edu.gpa}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {cv.profile.projects && cv.profile.projects.length > 0 && (
        <div className="mb-5 cv-section">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
            Projects
          </h2>
          <div className="h-px bg-slate-300 my-2" />
          <div className="space-y-4">
            {cv.profile.projects.map((proj) => (
              <div key={proj.id} className="work-experience-item avoid-break">
                <div className="flex flex-row justify-between items-start mb-1">
                  <div className="text-left">
                    <h3 className="text-base font-semibold text-slate-900 text-left">
                      {proj.title}
                    </h3>
                    <p className="text-sm text-slate-700 font-medium text-left">
                      {proj.type}
                    </p>
                  </div>
                  {(proj.startDate || proj.endDate) && (
                    <p className="text-sm text-slate-700 whitespace-nowrap text-right">
                      {proj.startDate} - {proj.endDate}
                    </p>
                  )}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed text-left mt-1">
                  {proj.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificates */}
      {cv.profile.certificates && cv.profile.certificates.length > 0 && (
        <div className="mb-5 cv-section">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
            Certificates
          </h2>
          <div className="h-px bg-slate-300 my-2" />
          <div className="space-y-3">
            {cv.profile.certificates.map((cert) => (
              <div key={cert.id} className="education-item avoid-break">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {cert.title}
                    </h3>
                    <p className="text-sm text-slate-700">{cert.issuer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-700">{cert.year}</p>
                  </div>
                </div>
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

export default JobCVTemplate2;



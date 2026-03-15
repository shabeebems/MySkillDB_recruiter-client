import React from 'react';

// Template 6: Timeline/Chronological Layout
const JobCVTemplate6 = ({ cv }) => {
  if (!cv) return null;

  return (
    <div
      className="relative bg-white rounded-xl shadow-lg border border-slate-200 p-8 print:p-0 w-[210mm] mx-auto"
      style={{ minHeight: '297mm' }}
    >
      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b-2 border-emerald-500">
        {cv.profile.profilePicture && (
          <div className="flex justify-center mb-4">
            <img
              src={cv.profile.profilePicture}
              alt={cv.profile.fullName}
              className="w-28 h-28 rounded-full object-cover border-4 border-emerald-500"
            />
          </div>
        )}
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          {cv.profile.fullName}
        </h1>
        <p className="text-xl text-emerald-600 font-semibold mb-4">
          {cv.job.title}
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600">
          <span><i className="fas fa-map-marker-alt mr-1"></i>{cv.profile.address}</span>
          <span><i className="fas fa-phone mr-1"></i>{cv.profile.phone}</span>
          <span><i className="fas fa-envelope mr-1"></i>{cv.profile.email}</span>
          {cv.profile.linkedin && (
            <a href={`https://${cv.profile.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700">
              <i className="fab fa-linkedin mr-1"></i>LinkedIn
            </a>
          )}
          {cv.profile.github && (
            <a href={`https://${cv.profile.github}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700">
              <i className="fab fa-github mr-1"></i>GitHub
            </a>
          )}
        </div>
      </div>

      {/* Professional Summary */}
      <div className="mb-8 cv-section avoid-break">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-1 h-8 bg-emerald-500"></div>
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wide">
            About Me
          </h2>
        </div>
        <p className="text-slate-700 leading-relaxed pl-4">
          {cv.profile.aboutMe}
        </p>
      </div>

      {/* Timeline: Work Experience */}
      {cv.profile.workExperience && cv.profile.workExperience.length > 0 && (
        <div className="mb-8 cv-section">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-emerald-500"></div>
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wide">
              Work Experience
            </h2>
          </div>
          <div className="relative pl-4 border-l-2 border-emerald-300 space-y-6">
            {cv.profile.workExperience.map((exp, index) => (
              <div key={exp.id} className="work-experience-item avoid-break relative">
                <div className="absolute -left-[9px] top-2 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                <div className="ml-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {exp.title}
                      </h3>
                      <p className="text-base font-semibold text-emerald-600">
                        {exp.company}
                      </p>
                      {exp.location && (
                        <p className="text-sm text-slate-600">{exp.location}</p>
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-600 bg-emerald-50 px-3 py-1 rounded-full">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  {exp.description && (
                    <p className="text-slate-700 leading-relaxed text-sm mt-2">
                      {exp.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills - Tag Style */}
      <div className="mb-8 cv-section">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-8 bg-emerald-500"></div>
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wide">
            Skills
          </h2>
        </div>
        <div className="pl-4 space-y-4">
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
                <h3 className="text-base font-semibold text-slate-800 mb-2">
                  {typeLabels[skillType]}
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {skillsOfType.map((skill) => (
                    <span
                      key={skill.id}
                      className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
                
                {/* Show certificates, videos, testimonials for each skill */}
                {skillsOfType.map((skill) => (
                  <div key={skill.id} className="ml-4 mb-3 text-sm">
                    {(skill.certificates && skill.certificates.length > 0) ||
                     (skill.videos && skill.videos.length > 0) ||
                     (skill.testimonials && skill.testimonials.filter(t => t.status === 'approved').length > 0) ? (
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="font-semibold text-slate-800 mb-2">{skill.name} - Achievements:</p>
                        {skill.certificates && skill.certificates.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-slate-600">Certificates: </span>
                            {skill.certificates.map((cert, idx) => (
                              <a
                                key={idx}
                                href={cert.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-emerald-600 hover:underline mr-2"
                              >
                                {cert.name || 'Certificate'}
                              </a>
                            ))}
                          </div>
                        )}
                        {skill.videos && skill.videos.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-slate-600">Videos: </span>
                            {skill.videos.map((video, idx) => (
                              <a
                                key={idx}
                                href={video.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-emerald-600 hover:underline mr-2"
                              >
                                {video.title || 'Video'}
                              </a>
                            ))}
                          </div>
                        )}
                        {skill.testimonials && skill.testimonials.filter(t => t.status === 'approved').length > 0 && (
                          <div>
                            {skill.testimonials
                              .filter(t => t.status === 'approved')
                              .map((testimonial, idx) => (
                                <div key={idx} className="text-xs text-slate-700 italic mb-1">
                                  "{testimonial.testimonialText}" — {testimonial.validatorName}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline: Education */}
      {cv.profile.education && cv.profile.education.length > 0 && (
        <div className="mb-6 cv-section">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-emerald-500"></div>
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wide">
              Education
            </h2>
          </div>
          <div className="relative pl-4 border-l-2 border-emerald-300 space-y-4">
            {cv.profile.education.map((edu) => (
              <div key={edu.id} className="education-item avoid-break relative">
                <div className="absolute -left-[9px] top-2 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                <div className="ml-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {edu.degree}
                      </h3>
                      <p className="text-sm font-semibold text-emerald-600">
                        {edu.institution}
                      </p>
                      {edu.location && (
                        <p className="text-xs text-slate-600">{edu.location}</p>
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-600 bg-emerald-50 px-3 py-1 rounded-full">
                      {edu.startYear} - {edu.endYear}
                    </span>
                  </div>
                  {edu.gpa && (
                    <p className="text-xs text-slate-600 mt-1">GPA: {edu.gpa}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline: Projects */}
      {cv.profile.projects && cv.profile.projects.length > 0 && (
        <div className="mb-8 cv-section">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-emerald-500"></div>
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wide">
              Projects
            </h2>
          </div>
          <div className="relative pl-4 border-l-2 border-emerald-300 space-y-6">
            {cv.profile.projects.map((proj, index) => (
              <div key={proj.id} className="work-experience-item avoid-break relative">
                <div className="absolute -left-[9px] top-2 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                <div className="ml-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {proj.title}
                      </h3>
                      <p className="text-base font-semibold text-emerald-600">
                        {proj.type}
                      </p>
                    </div>
                    {(proj.startDate || proj.endDate) && (
                      <span className="text-sm font-medium text-slate-600 bg-emerald-50 px-3 py-1 rounded-full">
                        {proj.startDate} - {proj.endDate}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 leading-relaxed text-sm mt-2">
                    {proj.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline: Certificates */}
      {cv.profile.certificates && cv.profile.certificates.length > 0 && (
        <div className="mb-6 cv-section">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-emerald-500"></div>
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wide">
              Certificates
            </h2>
          </div>
          <div className="relative pl-4 border-l-2 border-emerald-300 space-y-4">
            {cv.profile.certificates.map((cert) => (
              <div key={cert.id} className="education-item avoid-break relative">
                <div className="absolute -left-[9px] top-2 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                <div className="ml-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {cert.title}
                      </h3>
                      <p className="text-sm font-semibold text-emerald-600">
                        {cert.issuer}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-slate-600 bg-emerald-50 px-3 py-1 rounded-full">
                      {cert.year}
                    </span>
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

export default JobCVTemplate6;


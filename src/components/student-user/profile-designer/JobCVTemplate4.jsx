import React from 'react';

// Template 4: Minimalist (Very clean, minimal colors) – extracted from JobCV
const JobCVTemplate4 = ({ cv }) => {
  if (!cv) return null;

  return (
    <div
      className="relative bg-white rounded-xl shadow-lg border border-slate-200 p-8 print:p-0 w-[210mm] mx-auto"
      style={{ minHeight: '297mm' }}
    >
      {/* Header Section */}
      <div className="mb-8 pb-6 border-b border-slate-300">
        <div className="mb-4 flex items-start gap-4">
          {cv.profile.profilePicture && (
            <img
              src={cv.profile.profilePicture}
              alt={cv.profile.fullName}
              className="w-20 h-20 rounded-full object-cover border border-slate-300 flex-shrink-0"
            />
          )}
          <div className="flex-1">
            <h1 className="text-3xl lg:text-4xl font-light text-slate-900 mb-1 tracking-tight">
              {cv.profile.fullName}
            </h1>
            <p className="text-lg font-normal text-slate-600">
              {cv.job.title}
            </p>
          </div>
        </div>
        
        <div className="contact-line-center flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-600 text-center">
          <span>{cv.profile.address}</span>
          <span>•</span>
          <span>{cv.profile.phone}</span>
          <span>•</span>
          <span>{cv.profile.email}</span>
          {cv.profile.linkedin && (
            <>
              <span>•</span>
              <a
                href={`https://${cv.profile.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-slate-900"
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
                className="text-slate-600 hover:text-slate-900"
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
                className="text-slate-600 hover:text-slate-900"
              >
                Portfolio
              </a>
            </>
          )}
        </div>
      </div>

      {/* Professional Summary */}
      <div className="mb-6 cv-section avoid-break">
        <h2 className="text-sm font-normal text-slate-900 mb-2 uppercase tracking-widest text-slate-500">
          PROFESSIONAL SUMMARY
        </h2>
        <p className="text-slate-700 leading-relaxed text-left text-sm">
          {cv.profile.aboutMe}
        </p>
      </div>

      {/* Work Experience */}
      {cv.profile.workExperience && cv.profile.workExperience.length > 0 && (
        <div className="mb-6 cv-section">
          <h2 className="text-sm font-normal text-slate-900 mb-3 uppercase tracking-widest text-slate-500">
            WORK EXPERIENCE
          </h2>
          <div className="space-y-4">
            {cv.profile.workExperience.map((exp) => (
              <div key={exp.id} className="work-experience-item avoid-break">
                <div className="flex flex-row justify-between items-start mb-1">
                  <div className="text-left">
                    <h3 className="text-base font-medium text-slate-900 text-left">
                      {exp.title}
                    </h3>
                    <p className="text-slate-600 text-sm text-left">
                      {exp.company}
                    </p>
                    {exp.location && (
                      <p className="text-xs text-slate-500 text-left">
                        {exp.location}
                      </p>
                    )}
                  </div>
                  <p className="text-slate-600 text-sm whitespace-nowrap text-right">
                    {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                  </p>
                </div>
                {exp.description && (
                  <p className="text-slate-700 leading-relaxed text-left text-sm mt-1">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      <div className="mb-6 cv-section">
        <h2 className="text-sm font-normal text-slate-900 mb-3 uppercase tracking-widest text-slate-500">
          SKILLS
        </h2>
        
        {/* Group skills by type */}
        {['technical', 'tools', 'soft', 'other'].map((skillType) => {
          const skillsOfType = cv.skills.filter(skill => (skill.type || 'technical') === skillType);
          if (skillsOfType.length === 0) return null;
          
          const typeLabels = {
            technical: 'Technical Skills',
            tools: 'Tools & Technologies',
            soft: 'Soft Skills',
            other: 'Other Skills'
          };
          
          const showPercentage = skillType === 'technical' || skillType === 'tools';
          
          return (
            <div key={skillType} className="mb-4">
              <h3 className="text-xs font-medium text-slate-700 mb-2 uppercase tracking-wide">
                {typeLabels[skillType]}
              </h3>
              <div className="grid grid-cols-2 gap-2 skills-grid">
                {skillsOfType.map((skill) => (
                  <div
                    key={skill.id}
                    className="skill-card bg-white rounded p-2 border border-slate-200 avoid-break"
                  >
                    <div className="mb-1">
                      <h3 className="text-sm font-medium text-slate-900 mb-1">
                        {skill.name}
                      </h3>
                      {showPercentage && (
                        <div className="mb-1">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-xs text-slate-600">Score</span>
                            <span className="text-xs font-medium text-slate-700">
                              {skill.assessmentCompleted &&
                              skill.score !== null &&
                              skill.score !== undefined
                                ? skill.score.toFixed(1)
                                : '50.0'}
                              %
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-slate-600"
                              style={{
                                width: `${
                                  skill.assessmentCompleted &&
                                  skill.score !== null &&
                                  skill.score !== undefined
                                    ? skill.score
                                    : 50
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    {((skill.certificates && skill.certificates.length > 0) ||
                      (skill.videos && skill.videos.length > 0)) && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {skill.certificates &&
                          skill.certificates.length > 0 &&
                          skill.certificates[0].link && (
                            <a
                              href={skill.certificates[0].link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-slate-600 hover:text-slate-900 hover:underline font-normal flex items-center gap-1"
                            >
                              <i className="fas fa-certificate"></i> Certificate
                            </a>
                          )}
                        {skill.videos &&
                          skill.videos.length > 0 &&
                          skill.videos[0].link && (
                            <a
                              href={skill.videos[0].link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-slate-600 hover:text-slate-900 hover:underline font-normal flex items-center gap-1"
                            >
                              <i className="fab fa-youtube"></i> Video
                            </a>
                          )}
                      </div>
                    )}
                    {skill.testimonials &&
                      skill.testimonials.length > 0 &&
                      skill.testimonials.filter((t) => t.status === 'approved')
                        .length > 0 && (
                        <div className="mt-1 space-y-1">
                          {skill.testimonials
                            .filter((testimonial) => testimonial.status === 'approved')
                            .map((testimonial, index) => (
                              <div
                                key={testimonial.id || index}
                                className="pl-1.5 border-l border-slate-300 bg-slate-50 p-1.5"
                              >
                                <p className="text-xs font-medium text-slate-700 mb-0.5 flex items-center gap-1">
                                  <i className="fas fa-award text-xs"></i> Testimonial
                                </p>
                                <p className="text-xs text-slate-700 italic leading-tight mb-0.5">
                                  "{testimonial.testimonialText}"
                                </p>
                                <p className="text-xs text-slate-600">
                                  — {testimonial.validatorName},{' '}
                                  {testimonial.validatorRole}
                                </p>
                              </div>
                            ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Education */}
      <div className="mb-6 cv-section">
        <h2 className="text-sm font-normal text-slate-900 mb-3 uppercase tracking-widest text-slate-500">
          EDUCATION
        </h2>
        {cv.profile.education.map((edu) => (
          <div key={edu.id} className="education-item mb-3 avoid-break">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-slate-900">{edu.degree}</h3>
                <p className="text-slate-600 text-sm">{edu.institution}</p>
                {edu.location && (
                  <p className="text-xs text-slate-500">{edu.location}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-slate-600 text-sm">
                  {edu.startYear} - {edu.endYear}
                </p>
                {edu.gpa && (
                  <p className="text-xs text-slate-500">GPA: {edu.gpa}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Projects */}
      {cv.profile.projects && cv.profile.projects.length > 0 && (
        <div className="mb-6 cv-section">
          <h2 className="text-sm font-normal text-slate-900 mb-3 uppercase tracking-widest text-slate-500">
            PROJECTS
          </h2>
          <div className="space-y-4">
            {cv.profile.projects.map((proj) => (
              <div key={proj.id} className="work-experience-item avoid-break">
                <div className="flex flex-row justify-between items-start mb-1">
                  <div className="text-left">
                    <h3 className="text-base font-medium text-slate-900 text-left">
                      {proj.title}
                    </h3>
                    <p className="text-slate-600 text-sm text-left">
                      {proj.type}
                    </p>
                  </div>
                  {(proj.startDate || proj.endDate) && (
                    <p className="text-slate-600 text-sm whitespace-nowrap text-right">
                      {proj.startDate} - {proj.endDate}
                    </p>
                  )}
                </div>
                <p className="text-slate-700 leading-relaxed text-left text-sm mt-1">
                  {proj.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificates */}
      {cv.profile.certificates && cv.profile.certificates.length > 0 && (
        <div className="mb-6 cv-section">
          <h2 className="text-sm font-normal text-slate-900 mb-3 uppercase tracking-widest text-slate-500">
            CERTIFICATES
          </h2>
          <div className="space-y-3">
            {cv.profile.certificates.map((cert) => (
              <div key={cert.id} className="education-item mb-3 avoid-break">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-slate-900">{cert.title}</h3>
                    <p className="text-slate-600 text-sm">{cert.issuer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-600 text-sm">{cert.year}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MySkillDB at bottom right (print: fixed so appears on every page) */}
      <div className="cv-myskilldb-footer absolute bottom-0 right-0 text-xs text-slate-400 mt-8 pr-1">
        MySkillDB
      </div>
    </div>
  );
};

export default JobCVTemplate4;



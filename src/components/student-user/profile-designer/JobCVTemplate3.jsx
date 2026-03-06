import React from 'react';

// Template 3: Creative (Colorful, gradient header) – extracted from JobCV
const JobCVTemplate3 = ({ cv }) => {
  if (!cv) return null;

  return (
    <div
      className="relative bg-white rounded-xl shadow-lg border border-slate-200 p-8 print:p-0 w-[210mm] mx-auto"
      style={{ minHeight: '297mm' }}
    >
      {/* Header Section with Gradient */}
      <div className="mb-8 pb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg -mx-2">
        <div className="mb-4">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            {cv.profile.fullName}
          </h1>
          <p className="text-xl font-semibold text-blue-100">
            {cv.job.title}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-white">
            <i className="fas fa-map-marker-alt w-5"></i>
            <span className="text-sm">{cv.profile.address}</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <i className="fas fa-phone w-5"></i>
            <span className="text-sm">{cv.profile.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <i className="fas fa-envelope w-5"></i>
            <span className="text-sm">{cv.profile.email}</span>
          </div>
          {(cv.profile.linkedin || cv.profile.github || cv.profile.portfolio) && (
            <div className="flex items-center gap-2 text-white">
              <i className="fas fa-link w-5"></i>
              <div className="flex flex-wrap gap-3 text-sm">
                {cv.profile.linkedin && (
                  <a
                    href={`https://${cv.profile.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-blue-100 font-medium underline"
                  >
                    LinkedIn
                  </a>
                )}
                {cv.profile.github && (
                  <a
                    href={`https://${cv.profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-blue-100 font-medium underline"
                  >
                    GitHub
                  </a>
                )}
                {cv.profile.portfolio && (
                  <a
                    href={`https://${cv.profile.portfolio}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-blue-100 font-medium underline"
                  >
                    Portfolio
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Professional Summary */}
      <div className="mb-6 cv-section avoid-break">
        <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
          <i className="fas fa-user text-blue-600"></i>
          PROFESSIONAL SUMMARY
        </h2>
        <p className="text-slate-700 leading-relaxed text-left">
          {cv.profile.aboutMe}
        </p>
      </div>

      {/* Work Experience */}
      {cv.profile.workExperience && cv.profile.workExperience.length > 0 && (
        <div className="mb-6 cv-section">
          <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
            <i className="fas fa-briefcase text-blue-600"></i>
            WORK EXPERIENCE
          </h2>
          <div className="space-y-4">
            {cv.profile.workExperience.map((exp) => (
              <div
                key={exp.id}
                className="work-experience-item avoid-break bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600"
              >
                <div className="flex flex-row justify-between items-start mb-2">
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-slate-900 text-left">
                      {exp.title}
                    </h3>
                    <p className="text-slate-700 font-medium text-left">
                      {exp.company}
                    </p>
                    {exp.location && (
                      <p className="text-sm text-slate-600 text-left">
                        {exp.location}
                      </p>
                    )}
                  </div>
                  <p className="text-slate-700 font-medium whitespace-nowrap text-right">
                    {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                  </p>
                </div>
                {exp.description && (
                  <p className="text-slate-700 leading-relaxed text-left">
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
        <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
          <i className="fas fa-code text-blue-600"></i>
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
              <h3 className="text-base font-semibold text-slate-800 mb-2">
                {typeLabels[skillType]}
              </h3>
              <div className="grid grid-cols-2 gap-3 skills-grid">
                {skillsOfType.map((skill) => (
                  <div
                    key={skill.id}
                    className="skill-card bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200 shadow-sm avoid-break"
                  >
                    <div className="mb-2">
                      <h3 className="text-base font-bold text-slate-900 mb-1">
                        {skill.name}
                      </h3>
                      {showPercentage && (
                        <div className="mb-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-slate-700">
                              Average Assessment Score
                            </span>
                            <span className="text-xs font-bold text-blue-600">
                              {skill.assessmentCompleted &&
                              skill.score !== null &&
                              skill.score !== undefined
                                ? skill.score.toFixed(1)
                                : '50.0'}
                              %
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
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
                      <div className="flex flex-wrap gap-2 mt-2">
                        {skill.certificates &&
                          skill.certificates.length > 0 &&
                          skill.certificates[0].link && (
                            <a
                              href={skill.certificates[0].link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium flex items-center gap-1"
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
                              className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium flex items-center gap-1"
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
                        <div className="mt-2 space-y-2">
                          {skill.testimonials
                            .filter((testimonial) => testimonial.status === 'approved')
                            .map((testimonial, index) => (
                              <div
                                key={testimonial.id || index}
                                className="pl-2 border-l-2 border-blue-400 bg-blue-50 p-2 rounded-r"
                              >
                                <p className="text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1">
                                  <i className="fas fa-award text-xs"></i> Testimonial
                                </p>
                                <p className="text-xs text-slate-800 italic leading-snug mb-1">
                                  "{testimonial.testimonialText}"
                                </p>
                                <p className="text-xs font-medium text-slate-700">
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
        <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
          <i className="fas fa-graduation-cap text-blue-600"></i>
          EDUCATION
        </h2>
        {cv.profile.education.map((edu) => (
          <div
            key={edu.id}
            className="education-item mb-4 avoid-break bg-blue-50 rounded-lg p-3 border-l-4 border-blue-600"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900">{edu.degree}</h3>
                <p className="text-slate-700">{edu.institution}</p>
                {edu.location && (
                  <p className="text-sm text-slate-600">{edu.location}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-slate-700">
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

      {/* Projects */}
      {cv.profile.projects && cv.profile.projects.length > 0 && (
        <div className="mb-6 cv-section">
          <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
            <i className="fas fa-project-diagram text-blue-600"></i>
            PROJECTS
          </h2>
          <div className="space-y-4">
            {cv.profile.projects.map((proj) => (
              <div
                key={proj.id}
                className="work-experience-item avoid-break bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600"
              >
                <div className="flex flex-row justify-between items-start mb-2">
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-slate-900 text-left">
                      {proj.title}
                    </h3>
                    <p className="text-slate-700 font-medium text-left">
                      {proj.type}
                    </p>
                  </div>
                  <p className="text-slate-700 font-medium whitespace-nowrap text-right">
                    {proj.startDate} - {proj.endDate}
                  </p>
                </div>
                <p className="text-slate-700 leading-relaxed text-left">
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
          <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
            <i className="fas fa-certificate text-blue-600"></i>
            CERTIFICATES
          </h2>
          <div className="space-y-3">
            {cv.profile.certificates.map((cert) => (
              <div
                key={cert.id}
                className="education-item mb-4 avoid-break bg-blue-50 rounded-lg p-3 border-l-4 border-blue-600"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900">{cert.title}</h3>
                    <p className="text-slate-700">{cert.issuer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-700">{cert.year}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MySkillDB at bottom right (print: fixed so appears on every page) */}
      <div className="cv-myskilldb-footer absolute bottom-0 right-0 text-xs text-slate-500 mt-8 pr-1">
        MySkillDB
      </div>
    </div>
  );
};

export default JobCVTemplate3;



import React from 'react';

/**
 * Student job board: transform API jobs, format dates, render description.
 */

const DEFAULT_DEPARTMENT_ID = null;

export function formatJobFromApi(
  job,
  departmentId = DEFAULT_DEPARTMENT_ID,
  currentUserId = null
) {
  if (!job) return null;
  const createdBy = job.createdByStudentId;
  const isJobYouCreated = !!(
    createdBy &&
    currentUserId &&
    String(createdBy) === String(currentUserId)
  );
  return {
    _id: job._id,
    title: job.name || job.title,
    company: job.companyId?.name || job.companyName || job.company || 'Company',
    companyId: job.companyId?._id ?? job.companyId,
    companyLogo: job.companyLogo || '🏢',
    location: job.place || job.location || 'Location',
    workMode: job.workMode || 'Remote',
    jobType: job.jobType || 'Full-time',
    departmentId: job.departmentId || departmentId,
    postedDate: job.createdAt || job.postedDate || new Date().toISOString(),
    applicants: job.applicants ?? 0,
    description: job.description || '',
    requirements: job.requirements || [],
    skills: job.skills || [],
    salaryRange: job.salaryRange || 'Not specified',
    jobPostingLink: job.jobPostingLink || job.externalLink || '#',
    isActive: job.isActive !== false,
    createdByStudentId: createdBy ? String(createdBy) : null,
    isJobYouCreated,
  };
}

export function formatApplicationToJob(app, departmentId = DEFAULT_DEPARTMENT_ID) {
  if (!app?.jobId) return null;
  const job = app.jobId;
  return {
    _id: job._id,
    title: job.name || job.title,
    company: job.companyId?.name || job.companyName || job.company || 'Company',
    companyId: job.companyId?._id ?? job.companyId,
    companyLogo: job.companyLogo || '🏢',
    location: job.place || job.location || 'Location',
    workMode: job.workMode || 'Remote',
    jobType: job.jobType || 'Full-time',
    departmentId: job.departmentId || departmentId,
    postedDate: job.createdAt || job.postedDate || new Date().toISOString(),
    applicants: job.applicants ?? 0,
    description: job.description || '',
    requirements: job.requirements || [],
    skills: job.skills || [],
    salaryRange: job.salaryRange || 'Not specified',
    jobPostingLink: job.jobPostingLink || job.externalLink || '#',
    isActive: job.isActive !== false,
    applicationStatus: app.status,
    applicationId: app._id,
  };
}

export function getTimeSincePosted(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const posted = new Date(dateString);
  const diffInDays = Math.floor((now - posted) / (1000 * 60 * 60 * 24));
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return '1 day ago';
  return `${diffInDays} days ago`;
}

function isHeading(line) {
  const trimmed = line.trim();
  return (
    trimmed.endsWith(':') ||
    (trimmed.length < 50 &&
      trimmed.length > 3 &&
      /^[A-Z]/.test(trimmed) &&
      !trimmed.includes('.') &&
      trimmed.split(' ').length <= 6)
  );
}

export function renderJobDescription(description) {
  if (!description) return null;
  return description.split('\n').map((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return null;
    if (isHeading(trimmedLine)) {
      return (
        <p key={index} className="font-bold text-slate-900 mt-4 first:mt-0">
          {trimmedLine}
        </p>
      );
    }
    const bulletMatch = trimmedLine.match(/^([•○\-\*])\s+(.+)$/);
    const numberMatch = trimmedLine.match(/^(\d+[\.\)])\s+(.+)$/);
    if (bulletMatch) {
      const [, bullet, text] = bulletMatch;
      return (
        <p key={index} className="whitespace-pre-wrap flex items-start gap-2 pl-2 mb-1">
          <span className="font-bold text-slate-800 min-w-[12px]">{bullet}</span>
          <span className="font-semibold text-slate-800">{text}</span>
        </p>
      );
    }
    if (numberMatch) {
      const [, number, text] = numberMatch;
      return (
        <p key={index} className="whitespace-pre-wrap flex items-start gap-2 pl-2 mb-1">
          <span className="font-bold text-slate-800 min-w-[16px]">{number}</span>
          <span className="font-semibold text-slate-800">{text}</span>
        </p>
      );
    }
    return (
      <p key={index} className="whitespace-pre-wrap text-slate-700">
        {line}
      </p>
    );
  });
}

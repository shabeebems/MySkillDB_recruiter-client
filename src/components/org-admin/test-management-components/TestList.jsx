import React from 'react';
import TestCard from './TestCard';
import EmptyState from './EmptyState';

const TestList = ({ tests, type, onView, onEdit, onDelete, emptyMessage = 'No tests found' }) => {
  if (!tests || tests.length === 0) {
    return (
      <EmptyState
        icon="fa-clipboard-list"
        title={emptyMessage}
        description="Create your first test to get started"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tests.map((test) => (
        <TestCard
          key={test._id}
          test={test}
          type={type}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default TestList;


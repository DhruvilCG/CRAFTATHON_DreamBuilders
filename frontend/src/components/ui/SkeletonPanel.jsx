import React from 'react';

export default function SkeletonPanel({ className = '' }) {
  return (
    <div className={`skeleton ${className}`}>
      <div className="skeleton-line" style={{ width: '34%' }} />
      <div className="skeleton-line" style={{ width: '62%', height: '24px' }} />
    </div>
  );
}

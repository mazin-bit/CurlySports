// @ts-nocheck
import React from 'react';

const Pagination = ({ current, total, onPageChange }) => {
  if (total <= 1) return null;

  const getPages = () => {
    const pages = [];
    const showMax = 5;

    if (total <= showMax + 2) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (current >= total - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = total - 3; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(current - 1);
        pages.push(current);
        pages.push(current + 1);
        pages.push('...');
        pages.push(total);
      }
    }
    return pages;
  };

  return (
    <div className="pagination-pro">
      <button
        className="pager-nav-btn"
        disabled={current === 1}
        onClick={() => { onPageChange(current - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      >
        <span className="material-icons-round">chevron_left</span>
      </button>

      <div className="pager-list">
        {getPages().map((p, idx) => (
          p === '...' ? (
            <span key={`sep-${idx}`} className="pager-separator">...</span>
          ) : (
            <button
              key={p}
              className={`pager-item ${current === p ? 'active' : ''}`}
              onClick={() => { onPageChange(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              {p}
            </button>
          )
        ))}
      </div>

      <button
        className="pager-nav-btn"
        disabled={current === total}
        onClick={() => { onPageChange(current + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      >
        <span className="material-icons-round">chevron_right</span>
      </button>
    </div>
  );
};

export { Pagination };
export default Pagination;

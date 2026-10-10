import React from 'react';

/**
 * PrintDocument component for borderless CSS print (JavaScript)
 */
export function PrintDocument({ compositeImageUrl, copies }) {
  if (!compositeImageUrl) return null;

  const pages = Array.from({ length: Math.max(1, copies || 1) }, (_, i) => i);

  return (
    <div className="print-area">
      {pages.map((pageIndex) => (
        <div
          key={pageIndex}
          className="print-page"
          style={{
            width: '4in',
            height: '6in',
            overflow: 'hidden',
            pageBreakAfter: 'always',
            breakAfter: 'page',
            margin: 0,
            padding: 0,
          }}
        >
          <img
            src={compositeImageUrl}
            alt={`Print copy ${pageIndex + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>
      ))}
    </div>
  );
}

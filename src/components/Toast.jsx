import React from 'react';

export default function Toast({ message, visible }) {
  return (
    <div id="toast" className={visible ? 'show' : ''}>
      <span className="stamp paid">Saved</span>
      <div className="toast-text" dangerouslySetInnerHTML={{ __html: message }} />
    </div>
  );
}

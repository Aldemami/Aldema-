// Always import the default React alongside any named hooks. Trident's MFE
// federation initializes the shared `react` module via the default-import
// code path; pure named-only imports resolve to null at runtime.
import React, { useState } from 'react';

export default function BusinessSupportHub() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ width: '100vw', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Hello from Z2H 👋</h1>
      <p>Edit <code>src/index.tsx</code> and the page will hot-reload.</p>
      <button
        onClick={() => setCount(c => c + 1)}
        style={{ padding: '8px 16px', fontSize: 16, cursor: 'pointer' }}
      >
        Clicked {count} times
      </button>
    </div>
  );
}

// ─── CHANGE [design] NEW FILE ─────────────────────────────────────────────────
// WAS:    `const AuthContext = createContext(null)` lived inside AuthContext.jsx.
// NOW:    The context object lives here, on its own.
// WHY:    AuthContext.jsx (the provider) and useAuth.js (the hook) both need this SAME object.
//         Putting it in its own plain .js file lets both import it, while AuthContext.jsx
//         exports only a component — which is what Vite's Fast Refresh requires.
// ─────────────────────────────────────────────────────────────────────────────
import { createContext } from 'react';

export const AuthContext = createContext(null);

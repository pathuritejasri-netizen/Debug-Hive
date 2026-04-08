(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/context/auth-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [teams, setTeams] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const refreshUser = async ()=>{
        try {
            const response = await fetch('/api/user/me');
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                setTeams(data.teams);
                setError(null);
            } else {
                setUser(null);
                setTeams([]);
            }
        } catch (err) {
            console.error('Failed to refresh user:', err);
            setUser(null);
            setTeams([]);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            refreshUser().finally({
                "AuthProvider.useEffect": ()=>setLoading(false)
            }["AuthProvider.useEffect"]);
        }
    }["AuthProvider.useEffect"], []);
    const login = async (email, password)=>{
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Login failed');
            }
            await refreshUser();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed';
            setError(message);
            throw err;
        } finally{
            setLoading(false);
        }
    };
    const loginWithGithub = async (githubProfileUrl, email)=>{
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/auth/github-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    githubProfileUrl,
                    email
                })
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'GitHub login failed');
            }
            await refreshUser();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'GitHub login failed';
            setError(message);
            throw err;
        } finally{
            setLoading(false);
        }
    };
    const register = async (email, name, password)=>{
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    name,
                    password
                })
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Registration failed');
            }
            await refreshUser();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Registration failed';
            setError(message);
            throw err;
        } finally{
            setLoading(false);
        }
    };
    const logout = async ()=>{
        try {
            await fetch('/api/auth/logout', {
                method: 'POST'
            });
            setUser(null);
            setTeams([]);
        } catch (err) {
            console.error('Logout error:', err);
        }
    };
    const createTeam = async (name)=>{
        const response = await fetch('/api/teams', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name
            })
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to create team');
        }
        const team = await response.json();
        setTeams([
            ...teams,
            team
        ]);
        return team;
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            teams,
            loading,
            error,
            login,
            loginWithGithub,
            register,
            logout,
            createTeam,
            refreshUser
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/app/context/auth-context.tsx",
        lineNumber: 166,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "Y9kJHxZIn9Y2MKn7qScw6OiUvJ8=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=app_context_auth-context_tsx_0.j-44b._.js.map
import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

export const AuthContext = createContext({});

const client = axios.create({
    baseURL: `${server}/api/v1/users`
})

const getAuthConfig = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
    }
})

export const AuthProvider = ({ children }) => {
    const authContext = useContext(AuthContext);

    const [userData, setUserData] = useState(() => {
        const saved = localStorage.getItem("userData");
        return saved ? JSON.parse(saved) : authContext;
    });

    useEffect(() => {
        if (userData && Object.keys(userData).length > 0) {
            localStorage.setItem("userData", JSON.stringify(userData));
        }
    }, [userData]);

    const router = useNavigate();
    const interceptorIdRef = useRef(null);

    useEffect(() => {
        if (interceptorIdRef.current === null) {
            interceptorIdRef.current = client.interceptors.response.use(
                (response) => response,
                (error) => {
                    if (error.response?.status === 401) {
                        localStorage.removeItem("token");
                        localStorage.removeItem("userData");
                        router("/auth");
                    }
                    return Promise.reject(error);
                }
            );
        }
        return () => {
            if (interceptorIdRef.current !== null) {
                client.interceptors.response.eject(interceptorIdRef.current);
                interceptorIdRef.current = null;
            }
        };
    }, [router]);

    const handleRegister = useCallback(async (name, username, password, email, turnstileToken) => {
        try {
            let request = await client.post("/register", {
                name: name,
                username: username,
                password: password,
                email: email,
                turnstileToken: turnstileToken
            })

            if (request.status === httpStatus.CREATED) {
                return request.data.message;
            }
        } catch (err) {
            throw err;
        }
    }, [])

    const handleLogin = useCallback(async (username, password, turnstileToken) => {
        try {
            let request = await client.post("/login", {
                username: username,
                password: password,
                turnstileToken: turnstileToken
            });

            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                setUserData(request.data.user);
                
                const redirectPath = localStorage.getItem("redirectPath");
                console.log("Found redirect path:", redirectPath);
                
                if (redirectPath && redirectPath !== "/auth" && redirectPath !== "/") {
                    localStorage.removeItem("redirectPath");
                    router(redirectPath);
                } else {
                    router("/home");
                }
            }
        } catch (err) {
            throw err;
        }
    }, [router])

    const getUserData = useCallback(async () => {
        try {
            let request = await client.get("/get_user_data", getAuthConfig());
            return request.data
        } catch (err) {
            throw err;
        }
    }, [])

    const updateProfile = useCallback(async (profileData) => {
        try {
            let request = await client.post("/update_profile", profileData, getAuthConfig());
            return request.data;
        } catch (err) {
            throw err;
        }
    }, [])

    // Helper functions for meeting history
    const getHistoryKey = useCallback(() => {
        if (!userData?._id) return null;
        return `meetingHistory_${userData._id}`;
    }, [userData?._id]);

    const cleanOldHistory = useCallback((history) => {
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        return history.filter(item => (now - item.timestamp) < twentyFourHours);
    }, []);

    const getHistoryOfUser = useCallback(async () => {
        const key = getHistoryKey();
        if (!key) return [];
        
        let history = JSON.parse(localStorage.getItem(key) || "[]");
        history = cleanOldHistory(history);
        localStorage.setItem(key, JSON.stringify(history));
        return history;
    }, [cleanOldHistory, getHistoryKey]);

    const addToUserHistory = useCallback(async (meetingCode, scheduledAt = null) => {
        const key = getHistoryKey();
        if (!key) return;
        
        let history = JSON.parse(localStorage.getItem(key) || "[]");
        history = cleanOldHistory(history);
        
        // Add new meeting
        history.unshift({
            id: Date.now().toString(),
            meeting_code: meetingCode,
            scheduled_at: scheduledAt,
            timestamp: Date.now()
        });
        
        localStorage.setItem(key, JSON.stringify(history));
    }, [cleanOldHistory, getHistoryKey]);

    const deleteFromHistory = useCallback(async (meetingId) => {
        const key = getHistoryKey();
        if (!key) return;
        
        let history = JSON.parse(localStorage.getItem(key) || "[]");
        history = history.filter(item => item.id !== meetingId);
        localStorage.setItem(key, JSON.stringify(history));
    }, [getHistoryKey]);

    const deleteAllHistory = useCallback(async () => {
        const key = getHistoryKey();
        if (!key) return;
        localStorage.removeItem(key);
    }, [getHistoryKey]);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    const data = await getUserData();
                    setUserData(data);
                } catch (err) {
                    localStorage.removeItem("token");
                }
            }
        };
        checkAuth();
    }, [getUserData]);

    const data = {
        userData, setUserData, addToUserHistory, getHistoryOfUser, handleRegister, handleLogin, getUserData, updateProfile, deleteFromHistory, deleteAllHistory
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )
}

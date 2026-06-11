import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";


export const AuthContext = createContext({});

const client = axios.create({
    baseURL: `${server}/api/v1/users`
})


export const AuthProvider = ({ children }) => {

    const authContext = useContext(AuthContext);


    const [userData, setUserData] = useState(() => {
        const saved = localStorage.getItem("userData");
        return saved ? JSON.parse(saved) : authContext;
    });

    // Update localStorage whenever userData changes
    useEffect(() => {
        if (userData && Object.keys(userData).length > 0) {
            localStorage.setItem("userData", JSON.stringify(userData));
        }
    }, [userData]);


    const router = useNavigate();

    const handleRegister = useCallback(async (name, username, password, email) => {
        try {
            let request = await client.post("/register", {
                name: name,
                username: username,
                password: password,
                email: email
            })


            if (request.status === httpStatus.CREATED) {
                // Return success and let component handle auto-login if needed
                return request.data.message;
            }
        } catch (err) {
            throw err;
        }
    }, [])

    const handleLogin = useCallback(async (username, password) => {
        try {
            let request = await client.post("/login", {
                username: username,
                password: password
            });

            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                setUserData(request.data.user);
                
                // CRITICAL: Check for redirect path from withAuth
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

    const getHistoryOfUser = useCallback(async () => {
        try {
            let request = await client.get("/get_all_activity", {
                params: {
                    token: localStorage.getItem("token")
                }
            });
            return request.data
        } catch
         (err) {
            throw err;
        }
    }, [])

    const addToUserHistory = useCallback(async (meetingCode, scheduledAt = null) => {
        try {
            let request = await client.post("/add_to_activity", {
                token: localStorage.getItem("token"),
                meeting_code: meetingCode,
                scheduled_at: scheduledAt
            });
            return request
        } catch (e) {
            throw e;
        }
    }, [])

    const getUserData = useCallback(async () => {
        try {
            let request = await client.get("/get_user_data", {
                params: {
                    token: localStorage.getItem("token")
                }
            });
            return request.data
        } catch (err) {
            throw err;
        }
    }, [])

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

    const updateProfile = useCallback(async (profileData) => {
        try {
            let request = await client.post("/update_profile", {
                token: localStorage.getItem("token"),
                ...profileData
            });
            return request.data;
        } catch (err) {
            throw err;
        }
    }, [])


    const data = {
        userData, setUserData, addToUserHistory, getHistoryOfUser, handleRegister, handleLogin, getUserData, updateProfile
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )

}

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom"
import axios from "axios"
import server from "../environment"

const withAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        const router = useNavigate();
        const [validated, setValidated] = useState(false);

        const validateToken = useCallback(async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                localStorage.setItem("redirectPath", window.location.pathname);
                router("/auth");
                return;
            }
            try {
                await axios.get(`${server}/api/v1/users/get_user_data`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setValidated(true);
            } catch (err) {
                localStorage.removeItem("token");
                localStorage.removeItem("userData");
                localStorage.setItem("redirectPath", window.location.pathname);
                router("/auth");
            }
        }, [router]);

        useEffect(() => {
            validateToken();
        }, [validateToken])

        if (!validated) {
            return (
                <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            );
        }

        return <WrappedComponent {...props} />
    }

    return AuthComponent;
}

export default withAuth;
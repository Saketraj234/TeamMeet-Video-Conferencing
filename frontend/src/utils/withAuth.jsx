import { useEffect } from "react";
import { useNavigate } from "react-router-dom"

const withAuth = (WrappedComponent ) => {
    const AuthComponent = (props) => {
        const router = useNavigate();

        const isAuthenticated = () => {
            if(localStorage.getItem("token")) {
                return true;
            } 
            return false;
        }

        useEffect(() => {
            if(!isAuthenticated()) {
                // Save current path to redirect back after login
                localStorage.setItem("redirectPath", window.location.pathname);
                router("/auth")
            }
        }, [router])

        if (!isAuthenticated()) {
            return null; // Don't render component if not authenticated
        }

        return <WrappedComponent {...props} />
    }

    return AuthComponent;
}

export default withAuth;
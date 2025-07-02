import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function withAuth(WrappedComponent) {
  return function AuthComponent(props) {
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
      } else {
        setChecking(false);
      }
    }, [navigate]);

    if (checking) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <div className="text-xl font-semibold text-gray-700">
            Checking authentication...
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

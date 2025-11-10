import { LoginForm } from "@/components/login-form";
import { useLocation } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();

  const handleLogin = (username: string, password: string) => {
    console.log("Login:", username, password);
    setLocation("/");
  };

  return <LoginForm onLogin={handleLogin} />;
}

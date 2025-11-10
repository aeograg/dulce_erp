import { LoginForm } from "../login-form";

export default function LoginFormExample() {
  return (
    <LoginForm
      onLogin={(username, password) => {
        console.log("Login attempt:", username, password);
      }}
    />
  );
}

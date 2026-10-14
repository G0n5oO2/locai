// ログインの画面
import { AuthShell } from "@/app/ui/auth-shell";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <AuthShell title="ログイン">
      <LoginForm />
    </AuthShell>
  );
}

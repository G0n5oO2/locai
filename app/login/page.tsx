// ログインの画面
import { AuthShell } from "@/app/ui/auth-shell";
import { EntranceBackdrop } from "@/app/ui/entrance-backdrop";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <AuthShell title="ログイン">
      {/* 入口の画面の背景（空と、ふわふわ浮かぶ野菜） */}
      <EntranceBackdrop />
      <div className="card p-5">
        <LoginForm />
      </div>
    </AuthShell>
  );
}

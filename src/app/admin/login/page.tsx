import { LoginForm } from "@/app/admin/login/LoginForm";

export const metadata = { title: "Admin sign in" };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-line bg-noir-elevated/80 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <span className="font-display text-2xl tracking-[0.25em] text-gold">
            ELIJAYS
          </span>
          <p className="mt-2 text-sm text-ivory-muted">Admin sign in</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

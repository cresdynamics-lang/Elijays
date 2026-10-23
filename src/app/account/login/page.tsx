import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/auth/customer";
import { LoginForm } from "@/app/account/login/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your ELIJAYS account.",
};

export default async function AccountLoginPage() {
  const customer = await getCustomerSession();
  if (customer) redirect("/account");

  return (
    <div className="atmosphere min-h-screen px-5 pb-28 pt-16 md:px-8">
      <div className="mx-auto max-w-lg">
        <p className="eyebrow">Account</p>
        <h1 className="display mt-4 text-5xl">Sign in</h1>
        <p className="whisper mt-5 text-xl">
          Your wardrobe, orders and fittings — kept for you.
        </p>
        <LoginForm />
        <p className="mt-8 text-sm text-ivory/55">
          New to ELIJAYS?{" "}
          <Link href="/account/register" className="text-gold">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

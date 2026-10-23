import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/auth/customer";
import { RegisterForm } from "@/app/account/register/RegisterForm";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your personal ELIJAYS account.",
};

export default async function AccountRegisterPage() {
  const customer = await getCustomerSession();
  if (customer) redirect("/account");

  return (
    <div className="atmosphere min-h-screen px-5 pb-28 pt-16 md:px-8">
      <div className="mx-auto max-w-lg">
        <p className="eyebrow">Account</p>
        <h1 className="display mt-4 text-5xl">Create your account</h1>
        <p className="whisper mt-5 text-xl">
          A personal ELIJAYS account for orders, likes and the house.
        </p>
        <RegisterForm />
        <p className="mt-8 text-sm text-ivory/55">
          Already have an account?{" "}
          <Link href="/account/login" className="text-gold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

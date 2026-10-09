import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDict } from "@/lib/i18n";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/matches");

  const dict = await getDict();
  return <LoginForm dict={dict.login} />;
}

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDict } from "@/lib/i18n";
import { getAllowedDomains } from "@/lib/domain";
import { RegisterForm } from "@/components/RegisterForm";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/matches");

  const dict = await getDict();
  const allowedDomains = getAllowedDomains();
  return <RegisterForm dict={dict.register} allowedDomains={allowedDomains} />;
}

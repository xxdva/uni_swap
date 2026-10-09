import { getDict } from "@/lib/i18n";
import { getAllowedDomains } from "@/lib/domain";
import { RegisterForm } from "@/components/RegisterForm";

export default async function RegisterPage() {
  const dict = await getDict();
  const allowedDomains = getAllowedDomains();
  return <RegisterForm dict={dict.register} allowedDomains={allowedDomains} />;
}

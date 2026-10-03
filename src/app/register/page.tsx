import { getDict } from "@/lib/i18n";
import { RegisterForm } from "@/components/RegisterForm";

export default async function RegisterPage() {
  const dict = await getDict();
  return <RegisterForm dict={dict.register} />;
}

import { requireUser } from "@/lib/authz";
import { participantForUser } from "@/lib/queries";
import { PageHeading } from "@/components/page-heading";
import { RegistrationForm } from "@/components/forms/registration-form";
export default async function RegisterPage() {
  const user = await requireUser("/register");
  const participant = await participantForUser(user.id);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeading
        eyebrow="REGISTRATION"
        title={participant ? "编辑报名资料" : "完成参赛报名"}
        description="报名资料将用于身份核验；只有你主动授权的字段会出现在公开个人池。"
      />
      <RegistrationForm participant={participant} email={user.email ?? ""} />
    </div>
  );
}

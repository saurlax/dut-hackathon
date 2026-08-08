import { requireUser } from "@/lib/authz";
import { participantForUser } from "@/lib/queries";
import { PageHeading } from "@/components/page-heading";
import { RegistrationForm } from "@/components/forms/registration-form";
import { Reveal } from "@/components/animation/reveal";
export default async function RegisterPage() {
  const user = await requireUser("/register");
  const participant = await participantForUser(user.id);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeading
        eyebrow="REGISTRATION"
        title={participant ? "编辑报名资料" : "完成参赛报名"}
        description="报名资料将用于身份核验；保存或修改后需要管理员审核，只有审核通过且获得授权的资料才会公开。"
      />
      <Reveal>
        <RegistrationForm participant={participant} email={user.email ?? ""} />
      </Reveal>
    </div>
  );
}

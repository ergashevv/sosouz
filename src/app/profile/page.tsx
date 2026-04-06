import { redirect } from "next/navigation";
import ProfilePanel from "@/components/ProfilePanel";
import { getCurrentSessionUser } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await getCurrentSessionUser();
  if (!user) {
    redirect("/login?next=/profile");
  }

  return (
    <ProfilePanel
      user={{
        firstName: user.firstName,
        lastName: user.lastName,
        phoneE164: user.phoneE164,
        phoneCountry: user.phoneCountry,
      }}
    />
  );
}

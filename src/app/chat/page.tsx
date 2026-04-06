import { redirect } from "next/navigation";
import ChatWorkspace from "@/components/ChatWorkspace";
import { getCurrentSessionUser } from "@/lib/auth";

export default async function ChatPage() {
  const user = await getCurrentSessionUser();
  if (!user) {
    redirect("/login?next=/chat");
  }

  return (
    <ChatWorkspace
      user={{
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneCountry: user.phoneCountry,
      }}
    />
  );
}

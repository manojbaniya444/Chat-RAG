import { UserProfile } from "@clerk/nextjs";

export default function UserProfilePage() {
  return (
    <div>
      <UserProfile path="/user-profile" />
    </div>
  );
}

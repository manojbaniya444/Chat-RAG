import { auth, currentUser } from "@clerk/nextjs/server";
import { useDebugValue } from "react";

export default async function UserDetail() {
  const authUser = await auth();
  const userData = await currentUser();

  console.log(authUser);
  console.log(userData);

  return <h1>user data in console</h1>;
}

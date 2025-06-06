import { useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

export const UserDataPage = () => {
  const [count, setCount] = useState(0);

  const { isLoaded, userId, sessionId, getToken } = useAuth();

  // const {isLoaded, isSignedIn, user} = useUser()

  if (!isLoaded || !userId) {
    return <h1>Login please</h1>;
  }

  return (
    <div>
      <p>Coount: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increase</button>
    </div>
  );
};

"use client";
import { createClient } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function Login() {
  const router = useRouter();

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN") {
      // User is signed in, check and update User table
      const user = session.user;

      console.log(user);

      // Check if the user already exists in the auth.users table
      const { data: existingUser } = await supabase
        .from("auth.users")
        .select("*")
        .eq("id", user.id);

      // If the user doesn't exist, insert a new record
      if (!existingUser || existingUser.length === 0) {
        const { data, error } = await supabase.from("auth.users").insert([
          {
            user_id: user.id,
            username: user.user_metadata.username,
            email: user.email,
          },
        ]);

        if (error) {
          console.error("Error inserting user:", error);
        } else {
          console.log("User inserted:", data);
        }
      }

      // Redirect to the success page or perform additional logic
      router.push("/success");
    }
  });

  return (
    <div className="bg-gray-900 overflow-y-hidden flex-col items-center justify-center h-screen">
      <div className="max-w-2xl min-h-screen mx-auto ">
        <div className="">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="dark"
            providers={["discord"]}
          />
        </div>
      </div>
    </div>
  );
}

export default Login;

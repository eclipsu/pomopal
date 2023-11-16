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
  supabase.auth.onAuthStateChange(async (event) => {
    if (event == "SIGNED_IN") {
      //   router.push("/success");
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

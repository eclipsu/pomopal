import NextAuth from "next-auth";
import { SupabaseAdapter } from "@auth/supabase-adapter";

export default NextAuth({
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  }),
});

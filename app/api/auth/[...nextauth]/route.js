import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {},
      async authorize(credentials) {
        try {
          await connectDB();
          
          // 1. Find user by email
          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            throw new Error("No user found with this email.");
          }

          // 2. Check if password matches
          const isValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValid) {
            throw new Error("Incorrect password.");
          }

          // 3. Return user info (this gets passed to the JWT callback)
          return { 
              id: user._id.toString(), 
              name: user.name, 
              email: user.email, 
              role: user.role 
          };
        } catch (error) {
          throw new Error(error.message);
        }
      },
    }),
  ],
  callbacks: {
    // Add the "role" to the token
    async jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    // Add the "role" to the active session so the frontend can see it
    async session({ session, token }) {
      if (session?.user) session.user.role = token.role;
      return session;
    },
  },
  pages: { signIn: "/" }, // If something goes wrong, go back to home page
});

export { handler as GET, handler as POST };
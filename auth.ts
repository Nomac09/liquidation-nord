import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/lib/schemas/User'

// JWT session strategy throughout — simpler and consistent for both
// providers than pulling in a full database adapter. Both Credentials and
// Google sign-ins resolve to the same `User` collection (matched by
// email), so an account is always a single record regardless of how
// someone signs in.
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email || '').toLowerCase().trim()
        const password = String(credentials?.password || '')
        if (!email || !password) return null

        await connectDB()
        const user = await User.findOne({ email })
        if (!user?.passwordHash) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        return { id: String(user._id), email: user.email, name: user.name || undefined }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return true
      const email = user.email?.toLowerCase().trim()
      if (!email) return false

      await connectDB()
      const existing = await User.findOne({ email })
      if (!existing) {
        await User.create({ email, name: user.name || '', image: user.image || '' })
      }
      return true
    },
    async jwt({ token, user }) {
      // `user` is only present on the sign-in request itself — look up our
      // own record so the token carries our stable Mongo _id, not the
      // provider's.
      const email = (user?.email || token.email)?.toString().toLowerCase()
      if (user && email) {
        await connectDB()
        const dbUser = await User.findOne({ email })
        if (dbUser) {
          token.uid = String(dbUser._id)
          token.name = dbUser.name || token.name
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        session.user.id = token.uid as string
      }
      return session
    },
  },
})

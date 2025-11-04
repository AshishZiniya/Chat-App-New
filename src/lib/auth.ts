/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextAuthOptions, Session, User } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import axios from 'axios'

export interface CustomUser extends User {
  accessToken: string;
  refreshToken: string;
  username: string;
}

export interface CustomSession extends Omit<Session, 'user'> {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    image?: string | null;
  };
}

export interface CustomJWT extends JWT {
  accessToken: string;
  refreshToken: string;
  username: string;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {},
      async authorize(credentials: any) {
        const { username, password } = credentials
        try {
          if (username && password) {
            const response = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
              { username, password },
            )
            const userData = response.data
            // Return user object in NextAuth format
            return {
              id: userData.sub || userData.id,
              name: userData.username,
              email: userData.email,
              username: userData.username,
              accessToken: userData.accessToken || userData,
              refreshToken: userData.refreshToken,
            }
          }
        } catch (error: any) {
          throw new Error(
            error.response?.data.ErrorMessage || error.ErrorMessage,
          )
        }
        return null
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
      async redirect({ baseUrl }: any) {
          return `${baseUrl}`
      },
      async jwt({ token, trigger, user, session }: any) {

          if (trigger === 'update' && session?.user) {
              token.user = session.user
          }
          if (user) {
              token.accessToken = user.accessToken
              token.refreshToken = user.refreshToken
              token.username = user.username || user.name
              token.name = user.name
              token.email = user.email
              token.sub = user.id
          }

          // If we have an accessToken but no username, try to decode it
          if (token.accessToken && !token.username) {
              try {
                  // Use a simple base64 decode for JWT payload
                  const payload = token.accessToken.split('.')[1];
                  const decoded = JSON.parse(atob(payload));
                  if (decoded?.username) {
                      token.username = decoded.username;
                      token.name = decoded.username;
                      token.sub = decoded.sub;
                  }
              } catch {
              }
          }

          return token
      },
      async session({ session, token }: any) {
          if (token) {
              session.accessToken = token.accessToken
              session.refreshToken = token.refreshToken
              session.user = {
                  id: token.sub || token.user?.id,
                  name: token.username || token.name,
                  email: token.email,
              }
          }
          return session
      },
  },
}

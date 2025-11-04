"use client"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import LoginPage from '@/app/(auth)/login/Logintemplate'

export default function page() {
    const router = useRouter()
    const { data: session } = useSession()
    useEffect(() => {
        if (session) router.push('/Chat')
    }, [session, router])
  return (
    <LoginPage />
  )
}

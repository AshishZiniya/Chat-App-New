"use client"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import ChatApp from '@/components/ChatApp'

export default function page() {
    const router = useRouter()
    const { data: session } = useSession()

    useEffect(() => {
        if (!session) router.push('/')
    }, [session, router])

    if (!session) {
        return <div>Loading...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <ChatApp token={(session as any)?.accessToken || ''} onLogout={() => {
                // Clear session and redirect
                router.push('/');
            }} />
        </div>
    )
}

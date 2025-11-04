'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { FaSignOutAlt } from 'react-icons/fa';

export default function UserMenu() {
    const [username, setUsername] = useState<string | null>(null);
    const router = useRouter();
    const { data: session } = useSession();

    useEffect(() => {
        if (session?.user?.name) {
            setUsername(session.user.name);
        } else {
            setUsername(null);
        }
    }, [session]);
    const handleLogout = async () => {
        // Sign out from NextAuth
        await signOut({ callbackUrl: '/', redirect: false });
    };

    if (!username) return null;

    return (
        <div className="relative inline-flex text-left">
            <button className="flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-semibold text-sm shadow-sm">
                    {username.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-gray-700">
                    {username}
                </span>
            </button>
            <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors duration-150"
            >
                <FaSignOutAlt className="w-4 h-4" />
                Sign out
            </button>
        </div>
    );
}

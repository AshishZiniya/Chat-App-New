import type { Metadata } from 'next';
import Header from '@/components/Chat/Navbar';

export const metadata: Metadata = {
    title: 'Chat App',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="app-shell">
            <Header />

            <main className="app-main w-full">{children}</main>
        </div>
    );
}

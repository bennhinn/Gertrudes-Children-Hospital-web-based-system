import Link from 'next/link'

export default function ReceptionistLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Desktop Sidebar */}
            <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r bg-white lg:block">
                <div className="flex h-16 items-center gap-2 border-b px-6">
                    <span className="text-2xl">🏥</span>
                    <span className="font-bold text-slate-800">GCH Reception</span>
                </div>
                <nav className="space-y-1 p-4">
                    <Link
                        href="/receptionist"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
                    >
                        <span>📊</span>
                        <span>Dashboard</span>
                    </Link>
                    <Link
                        href="/receptionist/check-in"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
                    >
                        <span>📱</span>
                        <span>Check-In</span>
                    </Link>
                    <Link
                        href="/receptionist/queue"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
                    >
                        <span>📋</span>
                        <span>Queue</span>
                    </Link>
                    <Link
                        href="/receptionist/appointments"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
                    >
                        <span>📅</span>
                        <span>Appointments</span>
                    </Link>
                    <Link
                        href="/receptionist/messages"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
                    >
                        <span>💬</span>
                        <span>Messages</span>
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64">
                <div className="p-4 lg:p-6">{children}</div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white lg:hidden">
                <div className="grid grid-cols-5">
                    <Link
                        href="/receptionist"
                        className="flex flex-col items-center gap-1 py-3 text-xs text-slate-600"
                    >
                        <span className="text-xl">📊</span>
                        <span>Home</span>
                    </Link>
                    <Link
                        href="/receptionist/check-in"
                        className="flex flex-col items-center gap-1 py-3 text-xs text-slate-600"
                    >
                        <span className="text-xl">📱</span>
                        <span>Check-In</span>
                    </Link>
                    <Link
                        href="/receptionist/queue"
                        className="flex flex-col items-center gap-1 py-3 text-xs text-slate-600"
                    >
                        <span className="text-xl">📋</span>
                        <span>Queue</span>
                    </Link>
                    <Link
                        href="/receptionist/appointments"
                        className="flex flex-col items-center gap-1 py-3 text-xs text-slate-600"
                    >
                        <span className="text-xl">📅</span>
                        <span>Appts</span>
                    </Link>
                    <Link
                        href="/receptionist/messages"
                        className="flex flex-col items-center gap-1 py-3 text-xs text-slate-600"
                    >
                        <span className="text-xl">💬</span>
                        <span>Messages</span>
                    </Link>
                </div>
            </nav>
        </div>
    )
}

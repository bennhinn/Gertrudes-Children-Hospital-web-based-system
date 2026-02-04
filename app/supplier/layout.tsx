'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Pill, Package, BarChart3, LogOut, Truck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; companyName: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const menuItems = [
    { name: 'Dashboard', href: '/supplier', icon: LayoutDashboard },
    { name: 'Medications', href: '/supplier/medications', icon: Pill },
    { name: 'Orders', href: '/supplier/orders', icon: Package },
    { name: 'Analytics', href: '/supplier/analytics', icon: BarChart3 },
  ];

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user: authUser }, error } = await supabase.auth.getUser();

      if (!authUser || error) {
        router.push('/login');
        return;
      }

      // Check if user has supplier role
      const role = authUser.app_metadata?.role || authUser.user_metadata?.role;
      if (role !== 'supplier' && role !== 'admin') {
        router.push('/login');
        return;
      }

      // Try to get supplier company info (optional - don't block if not found)
      let companyName = 'Supplier';
      try {
        const { data: supplier } = await supabase
          .from('suppliers')
          .select('company_name')
          .eq('user_id', authUser.id)
          .single();

        if (supplier?.company_name) {
          companyName = supplier.company_name;
        }
      } catch {
        // Supplier record might not exist yet, that's okay
      }

      setUser({
        fullName: authUser.user_metadata?.full_name || 'Supplier',
        companyName: companyName,
      });
      setLoading(false);
    }

    checkAuth();
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50">
        <div className="text-center">
          <div className="relative mx-auto mb-6 h-16 w-16">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 opacity-20 blur-xl animate-pulse"></div>
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg">
              <Truck className="h-8 w-8 text-white animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-1.5 w-32 mx-auto rounded-full bg-teal-100 overflow-hidden">
              <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 animate-[loading_1s_ease-in-out_infinite]"></div>
            </div>
            <p className="text-sm text-slate-500 font-medium">Loading Supplier Portal...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-teal-100 bg-white/80 backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col">
          {/* Logo Section */}
          <div className="flex h-16 items-center gap-3 border-b border-teal-100 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-200">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Supplier Portal</p>
              <p className="text-xs text-slate-500">GCH PharmaSupply</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1.5 p-4">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Menu</p>
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 shadow-lg shadow-teal-200'
                    : 'hover:bg-teal-50'
                    }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`transition-all duration-200 ${isActive ? 'h-6 w-6 text-white' : 'h-5 w-5 text-slate-600 group-hover:text-teal-700 group-hover:scale-110'}`} />
                  <span className={`flex-1 ${isActive ? 'text-white font-bold text-base' : 'text-slate-600 text-sm font-medium group-hover:text-teal-700'}`}>{item.name}</span>
                  {isActive && (
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="border-t border-teal-100 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-teal-200 bg-white/95 backdrop-blur-xl shadow-sm lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-md">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">Supplier</p>
              <p className="text-[11px] text-slate-500">GCH Portal</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 pb-24 px-4 lg:pl-72 lg:pt-0 lg:pb-8 lg:px-8">
        <div className="lg:py-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-teal-200 bg-white/95 backdrop-blur-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="grid grid-cols-4 py-2 px-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center gap-1 py-2 rounded-lg transition-all duration-200 ${isActive
                  ? 'text-teal-600'
                  : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {isActive && (
                  <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600"></span>
                )}
                <Icon className={`h-5 w-5 transition-transform ${isActive && 'scale-110'}`} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-teal-600' : 'text-slate-500'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Pill, Package, Truck, LogOut } from 'lucide-react';

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', href: '/supplier', icon: LayoutDashboard },
    { name: 'Medication Catalog', href: '/supplier/medications', icon: Pill },
    { name: 'Supply Orders', href: '/supplier/orders', icon: Package },
    { name: 'Analytics', href: '/supplier/analytics', icon: Truck },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-teal-900 text-white hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-teal-100">PharmaSupply</h1>
          <p className="text-xs text-teal-400 mt-1">Supplier Portal</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-teal-700 text-white shadow-lg' 
                    : 'text-teal-100 hover:bg-teal-800'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-teal-800">
          <button className="flex items-center gap-3 text-teal-200 hover:text-white w-full px-4 py-2">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
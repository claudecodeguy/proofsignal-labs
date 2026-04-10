import Sidebar from "@/components/admin/Sidebar";

// Dashboard layout with sidebar — applies to all admin pages except /admin/login
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-56 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

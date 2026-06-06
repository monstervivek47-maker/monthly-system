import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Receipt, Calendar, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: ReactNode }) {
  const { logout, isLoggedIn } = useAuth();
  const [location, setLocation] = useLocation();

  if (!isLoggedIn) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-border flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm">
            <Receipt size={18} />
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight">Monthly Voucher</span>
        </div>

        <nav className="flex-1 px-4 flex flex-col gap-2">
          <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${location === '/dashboard' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} data-testid="nav-dashboard">
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Link href="/monthly" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${location === '/monthly' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} data-testid="nav-monthly">
            <Calendar size={18} />
            Monthly Voucher
          </Link>
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={handleLogout} data-testid="button-logout">
            <LogOut size={18} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}

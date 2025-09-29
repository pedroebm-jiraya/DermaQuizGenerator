import { Link, useLocation } from "wouter";
import logoPath from "@assets/Dermaquizlogo_1759149920053.png";

export default function AppHeader() {
  const [location] = useLocation();
  
  const navItems = [
    { href: "/", label: "Início", active: location === "/" },
    { href: "/", label: "Simulados", active: location === "/" },
    { href: "/analytics", label: "Histórico", active: location === "/analytics" },
  ];

  return (
    <header className="bg-white border-b border-border shadow-sm" data-testid="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center">
                <img src={logoPath} alt="DermaQuiz Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary" data-testid="text-app-title">DermaQuiz</h1>
                <p className="text-xs text-muted-foreground" data-testid="text-app-subtitle">
                  Simulados de Dermatologia
                </p>
              </div>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item, index) => (
              <Link
                key={`${item.href}-${index}`}
                href={item.href}
                data-testid={`nav-link-${item.label.toLowerCase()}`}
              >
                <span
                  className={`transition-colors font-medium ${
                    item.active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center space-x-4">
            <Link href="/admin" data-testid="link-admin">
              <div className="w-2 h-2 bg-muted-foreground/30 rounded-full hover:bg-primary/50 transition-colors cursor-pointer" 
                   title="Área Administrativa">
              </div>
            </Link>
            
            <button className="md:hidden" data-testid="button-mobile-menu">
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

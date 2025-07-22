import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Globe, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Beranda" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/api-docs", label: "API Docs" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const NavLink = ({ path, label, mobile = false }: { path: string; label: string; mobile?: boolean }) => (
    <Link href={path}>
      <Button
        variant="ghost"
        className={cn(
          "text-gray-300 hover:text-white transition-colors",
          isActive(path) && "text-primary",
          mobile && "w-full justify-start"
        )}
        onClick={() => mobile && setIsOpen(false)}
      >
        {label}
      </Button>
    </Link>
  );

  return (
    <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <Globe className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold text-white">Domku</h1>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <NavLink key={item.path} path={item.path} label={item.label} />
            ))}
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6 text-gray-400" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-gray-800 border-gray-700">
                <div className="flex items-center space-x-3 mb-6">
                  <Globe className="h-6 w-6 text-primary" />
                  <span className="text-lg font-semibold text-white">Domku</span>
                </div>
                <div className="flex flex-col space-y-2">
                  {navItems.map((item) => (
                    <NavLink key={item.path} path={item.path} label={item.label} mobile />
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

import { Link } from "wouter";
import { Globe, Github, Mail, Twitter } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 border-t border-gray-700 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Globe className="h-8 w-8 text-primary" />
              <h3 className="text-xl font-bold text-white">Domku</h3>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Platform manajemen subdomain yang terintegrasi dengan Cloudflare. 
              Kelola subdomain Anda dengan mudah, cepat, dan aman.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-gray-400 hover:text-primary transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-6 w-6" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-6 w-6" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-primary transition-colors"
                aria-label="Email"
              >
                <Mail className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Fitur</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">
                  Manajemen Subdomain
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="hover:text-primary transition-colors">
                  API Publik
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Integrasi Cloudflare
                </a>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">
                  Analisis DNS
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Dukungan</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/api-docs" className="hover:text-primary transition-colors">
                  Dokumentasi
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Bantuan
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Kontak
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © {currentYear} Domku. Dibuat dengan ❤️ untuk komunitas developer Indonesia.
          </p>
        </div>
      </div>
    </footer>
  );
}

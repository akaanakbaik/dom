import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Globe, 
  PlusCircle, 
  Edit, 
  TrendingUp, 
  Shield, 
  Code, 
  Cloud,
  ArrowRight,
  Rocket,
  CheckCircle
} from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: <PlusCircle className="h-10 w-10 text-primary" />,
      title: "Buat Subdomain",
      description: "Buat subdomain baru dengan mudah menggunakan record A, CNAME, dan AAAA. Maksimal 5 subdomain per sesi."
    },
    {
      icon: <Edit className="h-10 w-10 text-emerald-500" />,
      title: "Edit & Kelola",
      description: "Edit dan hapus subdomain yang sudah ada. Sistem validasi otomatis melindungi dari duplikasi."
    },
    {
      icon: <TrendingUp className="h-10 w-10 text-amber-500" />,
      title: "Analisis Lengkap",
      description: "Pantau subdomain yang dibuat dengan analisis waktu pembuatan, tipe record, dan status aktif."
    },
    {
      icon: <Shield className="h-10 w-10 text-red-500" />,
      title: "Perlindungan Keamanan",
      description: "Sistem blokir otomatis untuk nama subdomain yang sensitif seperti admin, api, mail, dan lainnya."
    },
    {
      icon: <Code className="h-10 w-10 text-purple-500" />,
      title: "API Publik",
      description: "Akses API publik tanpa autentikasi untuk integrasi dengan aplikasi lain. Dokumentasi lengkap tersedia."
    },
    {
      icon: <Cloud className="h-10 w-10 text-blue-500" />,
      title: "Integrasi Cloudflare",
      description: "Terintegrasi langsung dengan Cloudflare API untuk pengelolaan DNS yang cepat dan andal."
    }
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Globe className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Kelola Subdomain dengan <span className="text-primary">Mudah</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Domku adalah platform yang memungkinkan Anda mengelola subdomain dari domain utama dengan integrasi langsung ke Cloudflare. Buat, edit, dan hapus subdomain dalam hitungan detik.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="text-lg font-semibold">
                  <Rocket className="mr-2 h-5 w-5" />
                  Mulai Sekarang
                </Button>
              </Link>
              <Link href="/api-docs">
                <Button variant="outline" size="lg" className="text-lg font-semibold">
                  <Code className="mr-2 h-5 w-5" />
                  Lihat API
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Fitur Unggulan</h2>
            <p className="text-xl text-gray-300">Solusi lengkap untuk manajemen subdomain profesional</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gray-900 border-gray-700 hover:border-primary transition-colors">
                <CardContent className="p-8">
                  <div className="mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Siap Memulai?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Bergabunglah dengan ribuan pengguna yang telah mempercayai Domku untuk mengelola subdomain mereka.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="text-xl font-semibold px-10 py-4">
              <ArrowRight className="mr-3 h-6 w-6" />
              Masuk ke Dashboard
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

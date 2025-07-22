import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Info, 
  Code, 
  Terminal, 
  AlertTriangle,
  CheckCircle,
  XCircle 
} from "lucide-react";

export default function ApiDocs() {
  const baseUrl = window.location.origin;

  return (
    <div className="animate-fade-in min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dokumentasi API</h1>
          <p className="text-gray-300">Panduan lengkap untuk menggunakan API publik Domku</p>
        </div>

        {/* API Overview */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Info className="mr-3 h-6 w-6 text-blue-500" />
              Informasi Umum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-gray-400 w-24">Base URL:</span>
                  <code className="bg-gray-900 px-3 py-1 rounded text-primary">{baseUrl}</code>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 w-24">Format:</span>
                  <Badge className="bg-emerald-900 text-emerald-300">JSON</Badge>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 w-24">Auth:</span>
                  <Badge className="bg-amber-900 text-amber-300">Tidak Diperlukan</Badge>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-gray-400 w-24">Rate Limit:</span>
                  <Badge className="bg-red-900 text-red-300">5 request/IP/session</Badge>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 w-24">HTTPS:</span>
                  <Badge className="bg-emerald-900 text-emerald-300">Wajib</Badge>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 w-24">CORS:</span>
                  <Badge className="bg-emerald-900 text-emerald-300">Enabled</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Endpoint */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Code className="mr-3 h-6 w-6 text-emerald-500" />
              POST /api/create
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-300">Endpoint untuk membuat subdomain baru secara programatis</p>

            {/* Request */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Request Body</h3>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <pre className="text-sm text-gray-300 overflow-x-auto">
{`{
  "name": "blog",
  "type": "A",
  "target": "192.168.1.100"
}`}
                </pre>
              </div>
            </div>

            {/* Parameters */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Parameter</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-700 rounded-lg">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="text-left text-gray-300 py-3 px-4 border-b border-gray-700">Field</th>
                      <th className="text-left text-gray-300 py-3 px-4 border-b border-gray-700">Type</th>
                      <th className="text-left text-gray-300 py-3 px-4 border-b border-gray-700">Required</th>
                      <th className="text-left text-gray-300 py-3 px-4 border-b border-gray-700">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-700">
                      <td className="py-3 px-4 text-primary font-mono">name</td>
                      <td className="py-3 px-4 text-gray-300">string</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-emerald-900 text-emerald-300">Ya</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-300">Nama subdomain (tanpa domain utama)</td>
                    </tr>
                    <tr className="border-b border-gray-700">
                      <td className="py-3 px-4 text-primary font-mono">type</td>
                      <td className="py-3 px-4 text-gray-300">string</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-emerald-900 text-emerald-300">Ya</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-300">Tipe record (A, CNAME, AAAA)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-primary font-mono">target</td>
                      <td className="py-3 px-4 text-gray-300">string</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-emerald-900 text-emerald-300">Ya</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-300">Target IP atau domain untuk record</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Response */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Response</h3>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <pre className="text-sm text-gray-300 overflow-x-auto">
{`{
  "success": true,
  "message": "Subdomain berhasil dibuat",
  "data": {
    "id": "rec_1234567890",
    "name": "blog.domain.com",
    "type": "A",
    "target": "192.168.1.100",
    "status": "active",
    "created": "2024-11-15T14:30:00Z"
  }
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* cURL Examples */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Terminal className="mr-3 h-6 w-6 text-amber-500" />
              Contoh cURL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* A Record Example */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Membuat A Record</h3>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <pre className="text-sm text-gray-300 overflow-x-auto">
{`curl -X POST ${baseUrl}/api/create \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "blog",
    "type": "A",
    "target": "192.168.1.100"
  }'`}
                </pre>
              </div>
            </div>

            {/* CNAME Record Example */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Membuat CNAME Record</h3>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <pre className="text-sm text-gray-300 overflow-x-auto">
{`curl -X POST ${baseUrl}/api/create \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "app",
    "type": "CNAME",
    "target": "app.herokuapp.com"
  }'`}
                </pre>
              </div>
            </div>

            {/* AAAA Record Example */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Membuat AAAA Record</h3>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <pre className="text-sm text-gray-300 overflow-x-auto">
{`curl -X POST ${baseUrl}/api/create \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "ipv6",
    "type": "AAAA",
    "target": "2001:db8::1"
  }'`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Responses */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <AlertTriangle className="mr-3 h-6 w-6 text-red-500" />
              Error Responses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-red-400 mb-2 flex items-center">
                <XCircle className="mr-2 h-4 w-4" />
                400 - Bad Request
              </h3>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <pre className="text-sm text-gray-300">
{`{
  "success": false,
  "message": "Nama subdomain tidak valid",
  "error": "INVALID_SUBDOMAIN_NAME"
}`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-base font-medium text-red-400 mb-2 flex items-center">
                <XCircle className="mr-2 h-4 w-4" />
                429 - Rate Limit Exceeded
              </h3>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <pre className="text-sm text-gray-300">
{`{
  "success": false,
  "message": "Batas maksimal 5 subdomain per sesi telah tercapai",
  "error": "RATE_LIMIT_EXCEEDED"
}`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-base font-medium text-red-400 mb-2 flex items-center">
                <XCircle className="mr-2 h-4 w-4" />
                409 - Conflict
              </h3>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <pre className="text-sm text-gray-300">
{`{
  "success": false,
  "message": "Subdomain sudah ada",
  "error": "SUBDOMAIN_EXISTS"
}`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-base font-medium text-red-400 mb-2 flex items-center">
                <XCircle className="mr-2 h-4 w-4" />
                403 - Forbidden
              </h3>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <pre className="text-sm text-gray-300">
{`{
  "success": false,
  "message": "Nama subdomain dilarang",
  "error": "FORBIDDEN_SUBDOMAIN"
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

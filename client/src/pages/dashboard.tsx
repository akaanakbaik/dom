import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SubdomainForm from "../components/subdomain-form";
import SubdomainList from "../components/subdomain-list";
import { CheckCircle, PlusCircle, RefreshCw, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Subdomain } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  
  const { data: subdomainsData, refetch, isLoading } = useQuery<{
    success: boolean;
    data: Subdomain[];
    count: number;
  }>({
    queryKey: ['/api/subdomains'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const subdomains = subdomainsData?.data || [];
  const subdomainCount = subdomainsData?.count || 0;

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Data berhasil diperbarui",
        description: "Daftar subdomain telah disegarkan",
      });
    } catch (error) {
      toast({
        title: "Gagal memperbarui data",
        description: "Terjadi kesalahan saat menyegarkan data",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(subdomains, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `domku-subdomains-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Data berhasil diekspor",
      description: "File JSON telah diunduh",
    });
  };

  return (
    <div className="animate-fade-in min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Dashboard Subdomain</h1>
              <p className="text-gray-300">Kelola subdomain Anda dengan mudah dan aman</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="px-4 py-2">
                  <span className="text-gray-400 text-sm">Subdomain Aktif: </span>
                  <span className="text-primary font-semibold">{subdomainCount}</span>
                  <span className="text-gray-400">/5</span>
                </CardContent>
              </Card>
              <Badge className="bg-emerald-900 text-emerald-300 border-emerald-700">
                <CheckCircle className="mr-2 h-4 w-4" />
                Status: Aktif
              </Badge>
            </div>
          </div>
        </div>

        {/* Create Subdomain Form */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <PlusCircle className="mr-3 h-6 w-6 text-primary" />
              Buat Subdomain Baru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SubdomainForm 
              onSuccess={() => refetch()}
              subdomainCount={subdomainCount}
            />
          </CardContent>
        </Card>

        {/* Subdomain List */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <CardTitle className="flex items-center text-white">
                <CheckCircle className="mr-3 h-6 w-6 text-emerald-500" />
                Subdomain Anda
              </CardTitle>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExport}
                  disabled={subdomains.length === 0}
                  className="bg-amber-600 hover:bg-amber-700 border-amber-600 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SubdomainList 
              subdomains={subdomains}
              onUpdate={() => refetch()}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Subdomain } from "@shared/schema";
import { 
  Edit, 
  Trash2, 
  TrendingUp, 
  Calendar, 
  Target,
  Globe,
  Loader2,
  Save,
  X
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface SubdomainListProps {
  subdomains: Subdomain[];
  onUpdate: () => void;
  isLoading: boolean;
}

export default function SubdomainList({ subdomains, onUpdate, isLoading }: SubdomainListProps) {
  const [editingSubdomain, setEditingSubdomain] = useState<Subdomain | null>(null);
  const [deletingSubdomain, setDeletingSubdomain] = useState<Subdomain | null>(null);
  const [editTarget, setEditTarget] = useState("");
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: ({ id, target }: { id: number; target: string }) => 
      apiRequest("PUT", `/api/subdomains/${id}`, { target }),
    onSuccess: async (response) => {
      const result = await response.json();
      toast({
        title: "Subdomain berhasil diperbarui",
        description: result.message,
      });
      setEditingSubdomain(null);
      setEditTarget("");
      onUpdate();
    },
    onError: async (error: any) => {
      try {
        const response = await error;
        const result = await response.json();
        toast({
          title: "Gagal memperbarui subdomain",
          description: result.message || "Terjadi kesalahan",
          variant: "destructive",
        });
      } catch {
        toast({
          title: "Gagal memperbarui subdomain",
          description: "Terjadi kesalahan yang tidak diketahui",
          variant: "destructive",
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/subdomains/${id}`),
    onSuccess: async (response) => {
      const result = await response.json();
      toast({
        title: "Subdomain berhasil dihapus",
        description: result.message,
      });
      setDeletingSubdomain(null);
      onUpdate();
    },
    onError: async (error: any) => {
      try {
        const response = await error;
        const result = await response.json();
        toast({
          title: "Gagal menghapus subdomain",
          description: result.message || "Terjadi kesalahan",
          variant: "destructive",
        });
      } catch {
        toast({
          title: "Gagal menghapus subdomain",
          description: "Terjadi kesalahan yang tidak diketahui",
          variant: "destructive",
        });
      }
    },
  });

  const handleEdit = (subdomain: Subdomain) => {
    setEditingSubdomain(subdomain);
    setEditTarget(subdomain.target);
  };

  const handleSaveEdit = () => {
    if (editingSubdomain && editTarget.trim()) {
      updateMutation.mutate({
        id: editingSubdomain.id,
        target: editTarget.trim(),
      });
    }
  };

  const handleDelete = (subdomain: Subdomain) => {
    setDeletingSubdomain(subdomain);
  };

  const confirmDelete = () => {
    if (deletingSubdomain) {
      deleteMutation.mutate(deletingSubdomain.id);
    }
  };

  const getRecordTypeBadgeColor = (type: string) => {
    switch (type) {
      case "A":
        return "bg-primary/10 text-primary border-primary/20";
      case "CNAME":
        return "bg-emerald-600/10 text-emerald-400 border-emerald-600/20";
      case "AAAA":
        return "bg-purple-600/10 text-purple-400 border-purple-600/20";
      default:
        return "bg-gray-600/10 text-gray-400 border-gray-600/20";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-600/10 text-emerald-400 border-emerald-600/20";
      case "pending":
        return "bg-amber-600/10 text-amber-400 border-amber-600/20";
      default:
        return "bg-red-600/10 text-red-400 border-red-600/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Aktif";
      case "pending":
        return "Pending";
      default:
        return "Tidak Aktif";
    }
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), "d MMM yyyy, HH:mm", { locale: localeId });
  };

  const getDomainName = (name: string) => {
    return `${name}.domku.my.id`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-400">Memuat data subdomain...</span>
      </div>
    );
  }

  if (subdomains.length === 0) {
    return (
      <div className="text-center py-12">
        <Globe className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-400 mb-2">Belum Ada Subdomain</h3>
        <p className="text-gray-500 mb-6">Buat subdomain pertama Anda untuk memulai.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {subdomains.map((subdomain) => (
          <Card key={subdomain.id} className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {getDomainName(subdomain.name)}
                    </h3>
                    <Badge className={getRecordTypeBadgeColor(subdomain.type)}>
                      {subdomain.type}
                    </Badge>
                    <Badge className={getStatusBadgeColor(subdomain.status)}>
                      {getStatusLabel(subdomain.status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div className="flex items-center">
                      <Target className="h-4 w-4 text-gray-500 mr-2" />
                      <span>{subdomain.target}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                      <span>Dibuat: {formatDate(subdomain.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 lg:mt-0 flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(subdomain)}
                    className="text-amber-500 hover:bg-amber-900/20"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(subdomain)}
                    className="text-red-500 hover:bg-red-900/20"
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-500 hover:bg-blue-900/20"
                    title="Analisis"
                  >
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingSubdomain} onOpenChange={() => setEditingSubdomain(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Edit Subdomain</DialogTitle>
            <DialogDescription className="text-gray-400">
              Ubah target/value untuk subdomain {editingSubdomain && getDomainName(editingSubdomain.name)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Target/Value
              </label>
              <Input
                value={editTarget}
                onChange={(e) => setEditTarget(e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
                placeholder="Masukkan target baru"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingSubdomain(null)}
              className="border-gray-600 text-gray-300 hover:border-gray-500"
            >
              <X className="mr-2 h-4 w-4" />
              Batal
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending || !editTarget.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingSubdomain} onOpenChange={() => setDeletingSubdomain(null)}>
        <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Subdomain</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Apakah Anda yakin ingin menghapus subdomain {deletingSubdomain && getDomainName(deletingSubdomain.name)}? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

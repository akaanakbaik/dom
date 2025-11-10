import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { insertSubdomainSchema, type InsertSubdomain } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Plus, X, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { BLOCKED_SUBDOMAINS } from "../lib/constants";

interface SubdomainFormProps {
  onSuccess: () => void;
  subdomainCount: number;
}

interface AvailabilityResponse {
  success: boolean;
  available: boolean;
  reason?: string;
  message: string;
}

export default function SubdomainForm({ onSuccess, subdomainCount }: SubdomainFormProps) {
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    available: boolean | null;
    message: string;
  }>({ available: null, message: "" });

  const { toast } = useToast();
  
  const form = useForm<InsertSubdomain>({
    resolver: zodResolver(insertSubdomainSchema),
    defaultValues: {
      name: "",
      type: "A",
      target: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertSubdomain) => 
      apiRequest("POST", "/api/create", data),
    onSuccess: async (response) => {
      const result = await response.json();
      toast({
        title: "Subdomain berhasil dibuat",
        description: result.message,
      });
      form.reset();
      setAvailabilityStatus({ available: null, message: "" });
      onSuccess();
    },
    onError: async (error: any) => {
      try {
        const response = await error;
        const result = await response.json();
        toast({
          title: "Gagal membuat subdomain",
          description: result.message || "Terjadi kesalahan",
          variant: "destructive",
        });
      } catch {
        toast({
          title: "Gagal membuat subdomain",
          description: "Terjadi kesalahan yang tidak diketahui",
          variant: "destructive",
        });
      }
    },
  });

  const checkAvailability = async (name: string) => {
    if (!name || name.length < 1) {
      setAvailabilityStatus({ available: null, message: "" });
      return;
    }

    setIsCheckingAvailability(true);
    
    try {
      const response = await apiRequest("POST", "/api/check-availability", { name });
      const result: AvailabilityResponse = await response.json();
      
      setAvailabilityStatus({
        available: result.available,
        message: result.message,
      });
    } catch (error) {
      setAvailabilityStatus({
        available: null,
        message: "Gagal memeriksa ketersediaan",
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Debounced availability checking
  useEffect(() => {
    const name = form.watch("name");
    const timeoutId = setTimeout(() => {
      if (name) {
        checkAvailability(name);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [form.watch("name")]);

  const onSubmit = (data: InsertSubdomain) => {
    if (subdomainCount >= 5) {
      toast({
        title: "Batas maksimal tercapai",
        description: "Anda sudah mencapai batas maksimal 5 subdomain per sesi",
        variant: "destructive",
      });
      return;
    }

    if (availabilityStatus.available === false) {
      toast({
        title: "Subdomain tidak tersedia",
        description: availabilityStatus.message,
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(data);
  };

  const getAvailabilityIcon = () => {
    if (isCheckingAvailability) {
      return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />;
    }
    
    if (availabilityStatus.available === true) {
      return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    }
    
    if (availabilityStatus.available === false) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    
    return null;
  };

  const isSubmitDisabled = 
    createMutation.isPending || 
    subdomainCount >= 5 || 
    availabilityStatus.available === false ||
    isCheckingAvailability;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Nama Subdomain</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="contoh"
                      className="bg-gray-900 border-gray-600 text-white placeholder-gray-400 focus:border-primary pr-12"
                      {...field}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {getAvailabilityIcon()}
                    </div>
                  </div>
                </FormControl>
                <FormDescription className="text-gray-400">
                  Hanya huruf, angka, titik, dan tanda strip (-) yang diperbolehkan
                  {field.value && <span className="block text-emerald-400 font-medium mt-1">{field.value}.domku.my.id</span>}
                </FormDescription>
                {availabilityStatus.message && (
                  <p className={`text-xs ${
                    availabilityStatus.available === true ? 'text-emerald-400' : 
                    availabilityStatus.available === false ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {availabilityStatus.message}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Tipe Record</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-gray-900 border-gray-600 text-white focus:border-primary">
                      <SelectValue placeholder="Pilih tipe record" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-900 border-gray-600">
                    <SelectItem value="A" className="text-white focus:bg-gray-700">A Record</SelectItem>
                    <SelectItem value="CNAME" className="text-white focus:bg-gray-700">CNAME Record</SelectItem>
                    <SelectItem value="AAAA" className="text-white focus:bg-gray-700">AAAA Record</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="target"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Target/Value</FormLabel>
                <FormControl>
                  <Input
                    placeholder="192.168.1.1 atau example.com"
                    className="bg-gray-900 border-gray-600 text-white placeholder-gray-400 focus:border-primary"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            className="border-gray-600 text-gray-300 hover:border-gray-500"
            onClick={() => {
              form.reset();
              setAvailabilityStatus({ available: null, message: "" });
            }}
          >
            <X className="mr-2 h-4 w-4" />
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isSubmitDisabled}
            className="bg-primary hover:bg-primary/90"
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Buat Subdomain
          </Button>
        </div>
      </form>
    </Form>
  );
}

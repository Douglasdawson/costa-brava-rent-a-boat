import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Trash2, Camera, Eye } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface GalleryPhoto {
  id: string;
  imageUrl: string;
  caption: string | null;
  customerName: string;
  boatName: string | null;
  isApproved: boolean;
  createdAt: string;
  approvedAt: string | null;
}

interface GalleryManagementProps {
  adminToken: string;
}

export function GalleryManagement({ adminToken }: GalleryManagementProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const { toast } = useToast();

  const headers = {
    Authorization: `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  };

  const { data: photos = [], isLoading } = useQuery<GalleryPhoto[]>({
    queryKey: ["/api/admin/gallery"],
    queryFn: async () => {
      const res = await fetch("/api/admin/gallery", { headers });
      if (!res.ok) throw new Error("Error fetching photos");
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/gallery/${id}/approve`, {
        method: "PATCH",
        headers,
      });
      if (!res.ok) throw new Error("Error approving photo");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery"] });
      toast({ title: "Foto aprobada" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/gallery/${id}/reject`, {
        method: "PATCH",
        headers,
      });
      if (!res.ok) throw new Error("Error rejecting photo");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery"] });
      toast({ title: "Foto rechazada" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Error deleting photo");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery"] });
      toast({ title: "Foto eliminada" });
    },
  });

  const filteredPhotos = photos.filter((photo) => {
    if (filter === "pending") return !photo.isApproved;
    if (filter === "approved") return photo.isApproved;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Galeria de Fotos
        </h2>
        <div className="flex gap-2">
          {(["pending", "approved", "all"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "pending" ? "Pendientes" : f === "approved" ? "Aprobadas" : "Todas"}
              {f === "pending" && (
                <Badge variant="secondary" className="ml-2">
                  {photos.filter((p) => !p.isApproved).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : filteredPhotos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No hay fotos {filter === "pending" ? "pendientes" : filter === "approved" ? "aprobadas" : ""}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <div className="relative">
                <img
                  src={photo.imageUrl}
                  alt={photo.caption || `Photo by ${photo.customerName}`}
                  className="w-full h-48 object-cover"
                />
                <Badge
                  className="absolute top-2 right-2"
                  variant={photo.isApproved ? "default" : "secondary"}
                >
                  {photo.isApproved ? "Aprobada" : "Pendiente"}
                </Badge>
              </div>
              <CardContent className="p-3">
                <p className="font-medium text-sm">{photo.customerName}</p>
                {photo.boatName && (
                  <p className="text-xs text-gray-500">{photo.boatName}</p>
                )}
                {photo.caption && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{photo.caption}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(photo.createdAt).toLocaleDateString("es-ES")}
                </p>
                <div className="flex gap-2 mt-3">
                  {!photo.isApproved && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-green-600"
                      onClick={() => approveMutation.mutate(photo.id)}
                      disabled={approveMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Aprobar
                    </Button>
                  )}
                  {photo.isApproved && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => rejectMutation.mutate(photo.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Rechazar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500"
                    onClick={() => deleteMutation.mutate(photo.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

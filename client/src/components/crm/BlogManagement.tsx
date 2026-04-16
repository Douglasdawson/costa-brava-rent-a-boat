import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Search,
  Eye,
  EyeOff,
  FileText,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { BlogPost } from "@shared/schema";

interface BlogManagementProps {
  adminToken: string;
}

interface BlogFormData {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  author: string;
  featuredImage: string;
  metaDescription: string;
  tags: string;
  isPublished: boolean;
}

const EMPTY_FORM: BlogFormData = {
  title: "",
  slug: "",
  category: "",
  excerpt: "",
  content: "",
  author: "Costa Brava Rent a Boat",
  featuredImage: "",
  metaDescription: "",
  tags: "",
  isPublished: false,
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function BlogManagement({ adminToken }: BlogManagementProps) {
  const { toast } = useToast();
  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogFormData>(EMPTY_FORM);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  // Fetch blog posts
  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/admin/blog"],
    queryFn: async () => {
      const res = await fetch("/api/admin/blog", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al cargar entradas del blog");
      return res.json();
    },
  });

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(posts.map((p) => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [posts]);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        !searchQuery ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || post.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchQuery, categoryFilter]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al crear entrada");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      toast({ title: "Entrada creada correctamente" });
      resetAndGoToList();
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al actualizar entrada");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      toast({ title: "Entrada actualizada correctamente" });
      resetAndGoToList();
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al eliminar entrada");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      toast({ title: "Entrada eliminada" });
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
      setDeleteTarget(null);
    },
  });

  // Toggle publish mutation
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isPublished,
          ...(isPublished ? { publishedAt: new Date().toISOString() } : {}),
        }),
      });
      if (!res.ok) throw new Error("Error al cambiar estado");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  function resetAndGoToList() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setSlugManuallyEdited(false);
    setView("list");
  }

  function openCreateForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setSlugManuallyEdited(false);
    setView("form");
  }

  function openEditForm(post: BlogPost) {
    setForm({
      title: post.title,
      slug: post.slug,
      category: post.category,
      excerpt: post.excerpt || "",
      content: post.content,
      author: post.author,
      featuredImage: post.featuredImage || "",
      metaDescription: post.metaDescription || "",
      tags: post.tags?.join(", ") || "",
      isPublished: post.isPublished,
    });
    setEditingId(post.id);
    setSlugManuallyEdited(true);
    setView("form");
  }

  function handleTitleChange(title: string) {
    setForm((prev) => ({
      ...prev,
      title,
      ...(!slugManuallyEdited ? { slug: generateSlug(title) } : {}),
    }));
  }

  function handleSubmit() {
    const payload: Record<string, unknown> = {
      title: form.title,
      slug: form.slug,
      category: form.category,
      excerpt: form.excerpt || undefined,
      content: form.content,
      author: form.author,
      featuredImage: form.featuredImage || undefined,
      metaDescription: form.metaDescription || undefined,
      tags: form.tags
        ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : undefined,
      isPublished: form.isPublished,
      ...(form.isPublished ? { publishedAt: new Date().toISOString() } : {}),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // === LIST VIEW ===
  if (view === "list") {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold font-heading">Blog</h2>
            <p className="text-sm text-muted-foreground">
              {posts.length} {posts.length === 1 ? "entrada" : "entradas"} en total
            </p>
          </div>
          <Button onClick={openCreateForm}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva entrada
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              {posts.length === 0
                ? "No hay entradas en el blog"
                : "No se encontraron resultados"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead className="hidden md:table-cell">Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="font-medium line-clamp-1">{post.title}</div>
                      <div className="text-xs text-muted-foreground md:hidden">{post.category}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{post.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() =>
                          togglePublishMutation.mutate({
                            id: post.id,
                            isPublished: !post.isPublished,
                          })
                        }
                        title={post.isPublished ? "Cambiar a borrador" : "Publicar"}
                      >
                        {post.isPublished ? (
                          <Badge className="bg-green-600 hover:bg-green-700 cursor-pointer">
                            <Eye className="w-3 h-3 mr-1" />
                            Publicado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="cursor-pointer">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Borrador
                          </Badge>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {post.createdAt
                        ? format(new Date(post.createdAt), "dd MMM yyyy", { locale: es })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {post.isPublished && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                            title="Ver en web"
                            aria-label="View on website"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditForm(post)}
                          title="Editar"
                          aria-label="Edit post"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget({ id: post.id, title: post.title })}
                          title="Eliminar"
                          aria-label="Delete post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar entrada</AlertDialogTitle>
              <AlertDialogDescription>
                Vas a eliminar "{deleteTarget?.title}". Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // === FORM VIEW ===
  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={resetAndGoToList} aria-label="Back to list">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-xl font-bold font-heading">
          {editingId ? "Editar entrada" : "Nueva entrada"}
        </h2>
      </div>

      <div className="grid gap-4">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Título del artículo (min. 10 caracteres)"
          />
        </div>

        {/* Slug */}
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={form.slug}
            onChange={(e) => {
              setSlugManuallyEdited(true);
              setForm((prev) => ({ ...prev, slug: e.target.value }));
            }}
            placeholder="url-amigable-del-articulo"
          />
          <p className="text-xs text-muted-foreground">/blog/{form.slug || "..."}</p>
        </div>

        {/* Category + Author */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="category">Categoría *</Label>
            <Select
              value={form.category}
              onValueChange={(val) => {
                if (val === "__custom__") return;
                setForm((prev) => ({ ...prev, category: val }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="O escribe una nueva categoría..."
              value={!categories.includes(form.category) ? form.category : ""}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="author">Autor</Label>
            <Input
              id="author"
              value={form.author}
              onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
            />
          </div>
        </div>

        {/* Excerpt */}
        <div className="space-y-1.5">
          <Label htmlFor="excerpt">Resumen / Excerpt</Label>
          <Textarea
            id="excerpt"
            value={form.excerpt}
            onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
            placeholder="Breve descripción para las tarjetas de preview"
            rows={2}
          />
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <Label htmlFor="content">Contenido (Markdown) *</Label>
          <Textarea
            id="content"
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            placeholder="Escribe el contenido del artículo en Markdown..."
            rows={16}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Soporta Markdown: **negrita**, *cursiva*, ## títulos, [enlaces](url), ![imágenes](url)
          </p>
        </div>

        {/* Featured Image */}
        <div className="space-y-1.5">
          <Label htmlFor="featuredImage">Imagen destacada (URL)</Label>
          <Input
            id="featuredImage"
            value={form.featuredImage}
            onChange={(e) => setForm((prev) => ({ ...prev, featuredImage: e.target.value }))}
            placeholder="https://..."
          />
        </div>

        {/* Meta description */}
        <div className="space-y-1.5">
          <Label htmlFor="metaDescription">Meta Description (SEO)</Label>
          <Input
            id="metaDescription"
            value={form.metaDescription}
            onChange={(e) => setForm((prev) => ({ ...prev, metaDescription: e.target.value }))}
            placeholder="Descripción para motores de búsqueda"
            maxLength={160}
          />
          <p className="text-xs text-muted-foreground text-right">
            {form.metaDescription.length}/160
          </p>
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <Label htmlFor="tags">Tags (separados por comas)</Label>
          <Input
            id="tags"
            value={form.tags}
            onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
            placeholder="barcos, costa brava, alquiler, excursiones"
          />
        </div>

        {/* Published checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="isPublished"
            checked={form.isPublished}
            onCheckedChange={(checked) =>
              setForm((prev) => ({ ...prev, isPublished: checked === true }))
            }
          />
          <Label htmlFor="isPublished" className="cursor-pointer">
            Publicar entrada
          </Label>
        </div>

        {/* Actions */}
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <Button variant="outline" onClick={resetAndGoToList}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving
                ? "Guardando..."
                : editingId
                  ? "Guardar cambios"
                  : "Crear entrada"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

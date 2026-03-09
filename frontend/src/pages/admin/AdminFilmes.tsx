import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useSessions } from "@/hooks/useSessions";

export default function AdminFilmes() {
  const { sessions, isLoading } = useSessions();

  return (
    <AdminLayout title="FILMES">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar filmes..."
                className="w-[300px] pl-9"
              />
            </div>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Filme
          </Button>
        </div>

        {/* Movies Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Carregando filmes...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Nenhum filme cadastrado</p>
            </div>
          ) : (
            sessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{session.movieTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">Sala: {session.room}</p>
                    <p className="text-muted-foreground">
                      Assentos: {session.availableSeats}/{session.totalSeats}
                    </p>
                    <p className="font-semibold">
                      R$ {(session.priceInCents / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Armchair } from "lucide-react";

export default function AdminSalas() {
  return (
    <AdminLayout title="SALAS">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Gerenciar Salas</h2>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Sala
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { id: 1, name: "Sala 1", capacity: 100, type: "2D" },
            { id: 2, name: "Sala 2", capacity: 150, type: "3D" },
            { id: 3, name: "Sala 3", capacity: 80, type: "IMAX" },
          ].map((room) => (
            <Card key={room.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Armchair className="h-5 w-5" />
                  {room.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Capacidade:</span>
                  <span className="font-semibold">{room.capacity} assentos</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-semibold">{room.type}</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    Editar Layout
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Configurar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

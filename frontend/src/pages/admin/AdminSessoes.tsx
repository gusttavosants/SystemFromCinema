import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar, Clock, MapPin, Users } from "lucide-react";
import { useSessions } from "@/hooks/useSessions";

export default function AdminSessoes() {
  const { sessions, isLoading } = useSessions();

  return (
    <AdminLayout title="SESSÕES">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Gerenciar Sessões</h2>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Sessão
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando sessões...</p>
          </div>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Nenhuma sessão cadastrada</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <Card key={session.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg">{session.movieTitle}</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {session.room}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(session.showTime).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(session.showTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {session.availableSeats} / {session.totalSeats} disponíveis
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-lg font-bold">R$ {(session.priceInCents / 100).toFixed(2)}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive">
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

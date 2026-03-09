import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function AdminConfig() {
  return (
    <AdminLayout title="CONFIGURAÇÕES">
      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Cinema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cinema-name">Nome do Cinema</Label>
              <Input id="cinema-name" defaultValue="CineStar" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cinema-address">Endereço</Label>
              <Input id="cinema-address" defaultValue="Rua das Flores, 123" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cinema-phone">Telefone</Label>
              <Input id="cinema-phone" defaultValue="(11) 3333-3333" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cinema-email">Email</Label>
              <Input id="cinema-email" type="email" defaultValue="contato@cinestar.com" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações de Reserva</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reservation-time">Tempo de Expiração da Reserva (segundos)</Label>
              <Input id="reservation-time" type="number" defaultValue="30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-seats">Máximo de Assentos por Compra</Label>
              <Input id="max-seats" type="number" defaultValue="10" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email de Confirmação</Label>
                <p className="text-sm text-muted-foreground">Enviar email após confirmação de compra</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS de Lembrete</Label>
                <p className="text-sm text-muted-foreground">Enviar SMS 1 hora antes da sessão</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações Push</Label>
                <p className="text-sm text-muted-foreground">Enviar notificações sobre promoções</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancelar</Button>
          <Button>Salvar Configurações</Button>
        </div>
      </div>
    </AdminLayout>
  );
}

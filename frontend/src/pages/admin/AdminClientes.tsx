import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone } from "lucide-react";

export default function AdminClientes() {
  return (
    <AdminLayout title="CLIENTES">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              className="pl-9"
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[
                { name: "João Silva", email: "joao@email.com", phone: "(11) 99999-9999", purchases: 12 },
                { name: "Maria Santos", email: "maria@email.com", phone: "(11) 98888-8888", purchases: 8 },
                { name: "Pedro Oliveira", email: "pedro@email.com", phone: "(11) 97777-7777", purchases: 15 },
                { name: "Ana Costa", email: "ana@email.com", phone: "(11) 96666-6666", purchases: 5 },
              ].map((client, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <p className="font-medium">{client.name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Compras</p>
                    <p className="text-lg font-semibold">{client.purchases}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

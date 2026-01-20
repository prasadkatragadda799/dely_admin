import { useQuery } from '@tanstack/react-query';
import { MapPin, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminDeliveryAPI } from '@/lib/api';

export default function DeliveryTracking() {
  const { data, isLoading } = useQuery({
    queryKey: ['delivery-tracking-persons'],
    queryFn: async () => {
      const resp = await adminDeliveryAPI.getDeliveryPersons({ page: 1, limit: 200, is_online: true });
      return resp.data;
    },
    refetchInterval: 10000, // every 10s
  });

  const persons = data?.items || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Delivery Tracking</h1>
        <p className="text-muted-foreground">Live delivery personnel status (map view can be added next)</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Online Delivery Persons
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : persons.length === 0 ? (
            <div className="text-muted-foreground">No online delivery persons</div>
          ) : (
            <div className="space-y-3">
              {persons.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-muted-foreground">{p.phone}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-muted-foreground">
                      {p.currentLatitude ?? p.current_latitude ? '📍 location available' : 'no location'}
                    </div>
                    <div className="text-muted-foreground">
                      active: {p.activeOrders ?? p.active_orders ?? 0} • available:{' '}
                      {(p.isAvailable ?? p.is_available) ? 'yes' : 'no'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


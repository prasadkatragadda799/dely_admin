import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Loader2, Navigation, ExternalLink, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { adminDeliveryAPI } from '@/lib/api';

function openGoogleMaps(lat: number, lng: number, name: string) {
  window.open(
    `https://www.google.com/maps?q=${lat},${lng}&z=15&label=${encodeURIComponent(name)}`,
    '_blank',
    'noopener,noreferrer',
  );
}

function openAllOnMap(persons: any[]) {
  const withLoc = persons.filter(
    p => (p.currentLatitude ?? p.current_latitude) && (p.currentLongitude ?? p.current_longitude),
  );
  if (!withLoc.length) return;
  if (withLoc.length === 1) {
    const p = withLoc[0];
    openGoogleMaps(
      Number(p.currentLatitude ?? p.current_latitude),
      Number(p.currentLongitude ?? p.current_longitude),
      p.name,
    );
    return;
  }
  // Multiple persons: use Google Maps directions with all as waypoints
  const coords = withLoc
    .map(p => `${p.currentLatitude ?? p.current_latitude},${p.currentLongitude ?? p.current_longitude}`)
    .join('/');
  window.open(`https://www.google.com/maps/dir/${coords}`, '_blank', 'noopener,noreferrer');
}

export default function DeliveryTracking() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['delivery-tracking-persons'],
    queryFn: async () => {
      const resp = await adminDeliveryAPI.getDeliveryPersons({ page: 1, limit: 200, is_online: true });
      return resp.data;
    },
    refetchInterval: 10000,
  });

  const persons: any[] = data?.items || [];
  const withLocation = persons.filter(
    p => (p.currentLatitude ?? p.current_latitude) && (p.currentLongitude ?? p.current_longitude),
  );

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Delivery Tracking</h1>
          <p className="text-muted-foreground">
            Live GPS locations — {persons.length} online{lastUpdated ? `, updated ${lastUpdated}` : ''}
          </p>
        </div>
        {withLocation.length > 0 && (
          <Button variant="outline" onClick={() => openAllOnMap(persons)}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View All on Google Maps
          </Button>
        )}
      </div>

      {/* Map embed: if any person selected, show iframe */}
      {selectedId && (() => {
        const p = persons.find(x => x.id === selectedId);
        const lat = p ? Number(p.currentLatitude ?? p.current_latitude) : null;
        const lng = p ? Number(p.currentLongitude ?? p.current_longitude) : null;
        if (!lat || !lng) return null;
        return (
          <Card className="shadow-card">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Navigation className="h-4 w-4 text-primary" />
                {p.name} — Live Location
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>Close</Button>
            </CardHeader>
            <CardContent className="p-0">
              <iframe
                title={`Map for ${p.name}`}
                width="100%"
                height="380"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`}
              />
              <div className="px-4 py-3 flex justify-end">
                <Button size="sm" onClick={() => openGoogleMaps(lat, lng, p.name)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Google Maps
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Online Delivery Persons
            <Badge variant="outline" className="ml-2">{persons.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : persons.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
              <WifiOff className="h-8 w-8" />
              <p>No delivery persons currently online</p>
            </div>
          ) : (
            <div className="space-y-3">
              {persons.map((p: any) => {
                const lat = p.currentLatitude ?? p.current_latitude;
                const lng = p.currentLongitude ?? p.current_longitude;
                const hasLoc = Boolean(lat && lng);
                const isSelected = selectedId === p.id;
                const isAvailable = p.isAvailable ?? p.is_available;
                const activeOrders = p.activeOrders ?? p.active_orders ?? 0;

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between border rounded-lg p-4 transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'hover:bg-secondary/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                          {p.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{p.name}</div>
                        <div className="text-sm text-muted-foreground">{p.phone}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={isAvailable ? 'delivered' : 'pending'} className="text-[10px] px-1.5 py-0">
                            {isAvailable ? 'Available' : 'Busy'}
                          </Badge>
                          {activeOrders > 0 && (
                            <span className="text-xs text-muted-foreground">{activeOrders} active order{activeOrders !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasLoc ? (
                        <>
                          <div className="text-right text-xs text-muted-foreground mr-1">
                            <div className="flex items-center gap-1 text-emerald-600 font-medium">
                              <Wifi className="h-3 w-3" /> GPS Active
                            </div>
                            <div>{Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}</div>
                          </div>
                          <Button
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedId(isSelected ? null : p.id)}
                          >
                            <MapPin className="h-4 w-4 mr-1" />
                            {isSelected ? 'Hide Map' : 'Show Map'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openGoogleMaps(Number(lat), Number(lng), p.name)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <WifiOff className="h-3 w-3" /> No GPS
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

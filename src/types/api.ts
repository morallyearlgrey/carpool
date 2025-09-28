// API response types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  vehicleInfo?: {
    seatsAvailable?: number;
    make?: string;
    model?: string;
    year?: string;
  };
}

export interface Location {
  lat: number;
  long: number;
}

export interface Request {
  _id: string;
  requestSender: User | string;
  requestReceiver?: User | string;
  beginLocation: Location;
  finalLocation: Location;
  date: Date;
  startTime: string;
  finalTime: string;
  status?: "pending" | "accepted" | "rejected" | "cancelled";
}

export interface Rider {
  user: User | string;
  request: {
    _id: string;
    startTime: string;
    finalTime: string;
    status: string;
  };
  orderPickUp: number;
}

export interface Ride {
  _id: string;
  driver: string;
  riders: Rider[];
  date: Date;
  startTime: string;
  finalTime: string;
  beginLocation: Location;
  finalLocation: Location;
  requestedRiders: string[];
  maxRiders: number;
  beginAddress?: string;
  finalAddress?: string;
}

export interface RouteInfo {
  start: { latLng: google.maps.LatLng; address: string };
  end: { latLng: google.maps.LatLng; address: string };
}

export interface MapComponentProps {
  onRouteSelected?: (route: RouteInfo, durationSeconds?: number) => void;
}
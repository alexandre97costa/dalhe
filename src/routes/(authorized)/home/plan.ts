interface RecentLaptimeItem {
  // Lap time record identifier
  id: string;
  createdAt: Date;

  // Racer info
  racer: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };

  // Laptime data
  laptime: string; // Formatted as MM:SS.mmm
  differenceToFirstMs: number; // Milliseconds difference to 1st place on this track
  
  // Vehicle info
  car: {
    id: string;
    make: string;
    model: string;
    year?: number;
  };

  // Track info
  track: {
    id: string;
    name: string;
  };

  // Track conditions
  conditions: TrackCondition[];
}

type TrackCondition = 'wet' | 'dry' | 'night' | 'snow' | 'fog' | 'rain';
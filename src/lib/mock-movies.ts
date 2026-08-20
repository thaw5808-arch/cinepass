export type MockMovie = {
  slug: string;
  title: string;
  genres: string[];
  durationMins: number;
  rating: number;
  ageRating: string;
  language: string;
  posterUrl: string;
  backdropUrl: string;
  synopsis: string;
};

export const NOW_SHOWING: MockMovie[] = [
  {
    slug: "avatar-seed-bearer",
    title: "Avatar: The Seed Bearer",
    genres: ["Sci-Fi", "Adventure"],
    durationMins: 162,
    rating: 8.5,
    ageRating: "PG-13",
    language: "English",
    posterUrl: "https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=600&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=1600&q=80",
    synopsis: "The Sully family faces a new threat that pulls them beyond the reefs of Pandora.",
  },
  {
    slug: "midnight-heist",
    title: "The Midnight Heist",
    genres: ["Action", "Thriller"],
    durationMins: 128,
    rating: 7.8,
    ageRating: "R",
    language: "English",
    posterUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&q=80",
    synopsis: "Six strangers, one vault, and twelve minutes before the doors seal for good.",
  },
  {
    slug: "paper-lanterns",
    title: "Paper Lanterns",
    genres: ["Drama", "Romance"],
    durationMins: 114,
    rating: 8.1,
    ageRating: "PG",
    language: "Thai",
    posterUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1600&q=80",
    synopsis: "A festival of floating lights becomes the backdrop for a decade-late reunion.",
  },
  {
    slug: "iron-horizon",
    title: "Iron Horizon",
    genres: ["Sci-Fi", "Action"],
    durationMins: 141,
    rating: 7.4,
    ageRating: "PG-13",
    language: "English",
    posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1600&q=80",
    synopsis: "Earth's last shipyard races to launch before the horizon fleet arrives.",
  },
];

export const COMING_SOON: MockMovie[] = [
  {
    slug: "glass-orchard",
    title: "The Glass Orchard",
    genres: ["Fantasy"],
    durationMins: 132,
    rating: 0,
    ageRating: "PG-13",
    language: "English",
    posterUrl: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=600&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=1600&q=80",
    synopsis: "An orchard that only blooms once a century hides a door between worlds.",
  },
];

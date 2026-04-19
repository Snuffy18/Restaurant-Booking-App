export type PriceTier = '£' | '££' | '£££';

export type Restaurant = {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  cuisine: string[];
  price: PriceTier;
  vibes: string[];
  address: string;
  distanceKm: number;
  closingTime: string;
  openNow: boolean;
  availabilityTonight: number | null;
  fullTonight: boolean;
  about: string;
  menu: { category: string; items: { name: string; price: string }[] }[];
  reviews: { id: string; author: string; text: string; rating: number }[];
  hours: { day: string; hours: string }[];
  phone: string;
  facilities: string[];
};

export type TableOffer = {
  id: string;
  name: string;
  seats: number;
  vibes: string[];
  taken: boolean;
  aiRecommended?: boolean;
  whyReason?: string;
};

export type Booking = {
  id: string;
  ref: string;
  restaurantId: string;
  restaurantName: string;
  image: string;
  address: string;
  date: string;
  time: string;
  guests: number;
  tableName: string;
  specialRequests?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  reminderText?: string;
};

export const MOCK_USER = {
  firstName: 'Alex',
  email: 'alex@example.com',
};

export const RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'Trattoria Mimo',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    rating: 4.8,
    reviewCount: 326,
    cuisine: ['Italian'],
    price: '££',
    vibes: ['Romantic', 'Cosy'],
    address: '14 Mercer Street, London',
    distanceKm: 0.4,
    closingTime: '23:00',
    openNow: true,
    availabilityTonight: 3,
    fullTonight: false,
    about:
      'Neighbourhood Italian with handmade pasta, low lighting, and an intimate terrace. Perfect for date nights and slow evenings.',
    menu: [
      {
        category: 'Starters',
        items: [
          { name: 'Burrata & roasted tomatoes', price: '£9' },
          { name: 'Arancini trio', price: '£8' },
        ],
      },
      {
        category: 'Mains',
        items: [
          { name: 'Tagliatelle al ragù', price: '£16' },
          { name: 'Sea bass, lemon butter', price: '£22' },
        ],
      },
    ],
    reviews: [
      { id: 'r1', author: 'Sam K.', text: 'Faultless service — felt special without being fussy.', rating: 5 },
      { id: 'r2', author: 'Priya M.', text: 'Romantic corner table by the window. Pasta was incredible.', rating: 5 },
    ],
    hours: [
      { day: 'Mon – Thu', hours: '12:00 – 23:00' },
      { day: 'Fri – Sat', hours: '12:00 – 00:00' },
      { day: 'Sun', hours: '12:00 – 22:00' },
    ],
    phone: '+44 20 7123 4567',
    facilities: ['Outdoor seating', 'Wheelchair accessible', 'Reservations'],
  },
  {
    id: '2',
    name: 'Sakura Omakase',
    image: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800&q=80',
    rating: 4.9,
    reviewCount: 188,
    cuisine: ['Japanese'],
    price: '£££',
    vibes: ['Business', 'Quiet'],
    address: '88 Fleet Lane, London',
    distanceKm: 1.1,
    closingTime: '22:30',
    openNow: true,
    availabilityTonight: 1,
    fullTonight: false,
    about: 'Chef-led omakase with seasonal fish flown in twice weekly.',
    menu: [
      {
        category: 'Omakase',
        items: [
          { name: '12-course seasonal', price: '£95' },
          { name: 'Sake pairing', price: '£45' },
        ],
      },
    ],
    reviews: [{ id: 'r3', author: 'Leo T.', text: 'Worth every penny — calm, precise, delicious.', rating: 5 }],
    hours: [{ day: 'Tue – Sun', hours: '18:00 – 22:30' }],
    phone: '+44 20 7988 1020',
    facilities: ['Private dining', 'Vegan options'],
  },
  {
    id: '3',
    name: 'Harbour Grill',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
    rating: 4.5,
    reviewCount: 512,
    cuisine: ['Mediterranean'],
    price: '££',
    vibes: ['Outdoor', 'Lively'],
    address: '2 Riverside Walk, London',
    distanceKm: 2.0,
    closingTime: '23:30',
    openNow: true,
    availabilityTonight: null,
    fullTonight: true,
    about: 'Grilled seafood and mezze with a lively terrace overlooking the water.',
    menu: [
      {
        category: 'Grill',
        items: [
          { name: 'Whole sea bream', price: '£24' },
          { name: 'Lamb kofte', price: '£18' },
        ],
      },
    ],
    reviews: [{ id: 'r4', author: 'Nina R.', text: 'Book ahead — terrace fills fast on warm nights.', rating: 4 }],
    hours: [{ day: 'Daily', hours: '11:30 – 23:30' }],
    phone: '+44 20 7450 8890',
    facilities: ['Outdoor seating', 'Family friendly'],
  },
  {
    id: '4',
    name: 'Bistro Lumière',
    image: 'https://images.unsplash.com/photo-1550966871-b3be01aeef58?w=800&q=80',
    rating: 4.7,
    reviewCount: 240,
    cuisine: ['French'],
    price: '££',
    vibes: ['Romantic', 'Casual'],
    address: '9 Charlotte St, London',
    distanceKm: 0.8,
    closingTime: '22:00',
    openNow: false,
    availabilityTonight: 5,
    fullTonight: false,
    about: 'Classic French comfort with a relaxed brunch menu on weekends.',
    menu: [
      {
        category: 'Dinner',
        items: [
          { name: 'Steak frites', price: '£21' },
          { name: 'Ratatouille tart', price: '£14' },
        ],
      },
    ],
    reviews: [{ id: 'r5', author: 'Chris P.', text: 'Cosy and unpretentious — great wine list.', rating: 5 }],
    hours: [{ day: 'Wed – Mon', hours: '12:00 – 22:00' }],
    phone: '+44 20 7330 2211',
    facilities: ['Brunch', 'Wine bar'],
  },
];

export function getRestaurant(id: string): Restaurant | undefined {
  return RESTAURANTS.find((r) => r.id === id);
}

export function tablesForRestaurant(restaurantId: string): TableOffer[] {
  const base: TableOffer[] = [
    {
      id: `${restaurantId}-t1`,
      name: 'Window table 4',
      seats: 2,
      vibes: ['Romantic', 'Quiet'],
      taken: false,
      aiRecommended: true,
      whyReason:
        'Matches your romantic preference, quieter corner, and best natural light for this evening.',
    },
    {
      id: `${restaurantId}-t2`,
      name: 'Garden booth 2',
      seats: 4,
      vibes: ['Family', 'Outdoor'],
      taken: false,
    },
    {
      id: `${restaurantId}-t3`,
      name: 'Chef’s counter',
      seats: 2,
      vibes: ['Lively'],
      taken: true,
    },
    {
      id: `${restaurantId}-t4`,
      name: 'High table 7',
      seats: 2,
      vibes: ['Casual'],
      taken: false,
    },
  ];
  return base;
}

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    ref: '#TRM-48291',
    restaurantId: '1',
    restaurantName: 'Trattoria Mimo',
    image: RESTAURANTS[0].image,
    address: RESTAURANTS[0].address,
    date: 'Fri 23 May',
    time: '19:30',
    guests: 2,
    tableName: 'Window table 4',
    specialRequests: 'Birthday — small dessert candle if possible.',
    status: 'upcoming',
    reminderText: 'Reminder set · 2 hours before · Free cancel until 21 May',
  },
  {
    id: 'b2',
    ref: '#SKR-11203',
    restaurantId: '2',
    restaurantName: 'Sakura Omakase',
    image: RESTAURANTS[1].image,
    address: RESTAURANTS[1].address,
    date: 'Sat 10 May',
    time: '18:00',
    guests: 2,
    tableName: 'Counter seats',
    status: 'completed',
  },
  {
    id: 'b3',
    ref: '#HRB-99211',
    restaurantId: '3',
    restaurantName: 'Harbour Grill',
    image: RESTAURANTS[2].image,
    address: RESTAURANTS[2].address,
    date: 'Sun 4 May',
    time: '13:00',
    guests: 4,
    tableName: 'Terrace 3',
    status: 'cancelled',
  },
];

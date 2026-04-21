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
  /** Four short vibe labels for the grid (2×2), ~2–3 words each. */
  vibeDescriptions: string[];
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
    id: '3d4e90dc-c02b-40c0-88d9-6cb806b5055f',
    name: 'Trattoria Mimo',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    rating: 4.8,
    reviewCount: 341,
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
      'Neighbourhood Italian with handmade pasta, low lighting, and an intimate terrace. The kitchen rolls fresh dough every morning; sauces simmer slowly and the wine list leans Italian with a few natural bottles for the curious. Perfect for date nights, small celebrations, and slow evenings that drift into a second glass.',
    vibeDescriptions: [
      'Soft romantic glow',
      'Fresh handmade pasta',
      'Intimate terrace nights',
      'Curated wine picks',
    ],
    menu: [
      {
        category: 'Starters',
        items: [
          { name: 'Burrata & roasted tomatoes', price: '£9' },
          { name: 'Arancini trio', price: '£8' },
          { name: 'Carpaccio di manzo, rocket & parmesan', price: '£12' },
          { name: 'Grilled artichokes, lemon & mint', price: '£7' },
          { name: 'Focaccia, rosemary & olive oil', price: '£4' },
        ],
      },
      {
        category: 'Pasta',
        items: [
          { name: 'Tagliatelle al ragù', price: '£16' },
          { name: 'Cacio e pepe', price: '£14' },
          { name: 'Lobster linguine', price: '£26' },
          { name: 'Pumpkin ravioli, sage butter', price: '£15' },
        ],
      },
      {
        category: 'Secondi',
        items: [
          { name: 'Sea bass, lemon butter', price: '£22' },
          { name: 'Chicken saltimbocca, marsala jus', price: '£19' },
          { name: 'Aubergine parmigiana (v)', price: '£14' },
        ],
      },
      {
        category: 'Dolci',
        items: [
          { name: 'Tiramisù', price: '£7' },
          { name: 'Panna cotta, seasonal compote', price: '£7' },
          { name: 'Affogato', price: '£6' },
        ],
      },
      {
        category: 'Drinks',
        items: [
          { name: 'House red / white (175ml)', price: '£6' },
          { name: 'Negroni', price: '£10' },
          { name: 'Aperol spritz', price: '£9' },
          { name: 'San Pellegrino 750ml', price: '£5' },
        ],
      },
    ],
    reviews: [
      { id: 'r1', author: 'Sam K.', text: 'Faultless service — felt special without being fussy.', rating: 5 },
      { id: 'r2', author: 'Priya M.', text: 'Romantic corner table by the window. Pasta was incredible.', rating: 5 },
      { id: 'r1b', author: 'Jordan L.', text: 'We lingered for hours over antipasti and red wine. Will be back.', rating: 4 },
      { id: 'r1c', author: 'Elena V.', text: 'Cosy without feeling cramped. The burrata alone is worth the trip.', rating: 5 },
      { id: 'r1d', author: 'Marcus H.', text: 'Cacio e pepe was silky and peppery in all the right ways. Book the terrace if you can.', rating: 5 },
      { id: 'r1e', author: 'Aisha N.', text: 'Great for a midweek treat. Portions are honest and staff know the wine list well.', rating: 4 },
      { id: 'r1f', author: 'Tomás R.', text: 'Took parents here—they loved the aubergine parm and the relaxed pace.', rating: 5 },
      { id: 'r1g', author: 'Bea C.', text: 'Slightly noisy on a Friday but the food made up for it. Tiramisù textbook good.', rating: 4 },
    ],
    hours: [
      { day: 'Mon – Thu', hours: '12:00 – 23:00' },
      { day: 'Fri – Sat', hours: '12:00 – 00:00' },
      { day: 'Sun', hours: '12:00 – 22:00' },
    ],
    phone: '+44 20 7123 4567',
    facilities: [
      'Outdoor seating',
      'Wheelchair accessible',
      'Reservations',
      'Private dining (8–14)',
      'Vegetarian menu',
      'Dogs welcome on terrace',
    ],
  },
  {
    id: '2',
    name: 'Sakura Omakase',
    image: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800&q=80',
    rating: 4.9,
    reviewCount: 201,
    cuisine: ['Japanese'],
    price: '£££',
    vibes: ['Business', 'Quiet'],
    address: '88 Fleet Lane, London',
    distanceKm: 1.1,
    closingTime: '22:30',
    openNow: true,
    availabilityTonight: 1,
    fullTonight: false,
    about:
      'Chef-led omakase with seasonal fish flown in twice weekly. The counter seats just ten guests per service; pacing is deliberate and the team speaks softly through each course. Expect edomae-style nigiri, seasonal pickles, and a short list of rare sakes chosen to match the fish.',
    vibeDescriptions: [
      'Quiet chef counter',
      'Seasonal fish flown',
      'Hushed focused room',
      'Guided sake pairing',
    ],
    menu: [
      {
        category: 'Omakase',
        items: [
          { name: '12-course seasonal', price: '£95' },
          { name: '15-course kaiseki extension', price: '£125' },
          { name: 'Sake pairing', price: '£45' },
          { name: 'Premium sake flight', price: '£65' },
        ],
      },
      {
        category: 'À la carte (early seating only)',
        items: [
          { name: 'Chef’s sashimi moriawase', price: '£38' },
          { name: 'Chawanmushi, crab & yuzu', price: '£14' },
          { name: 'Wagyu hand roll', price: '£22' },
        ],
      },
      {
        category: 'Zero-proof',
        items: [
          { name: 'Seasonal tea pairing', price: '£22' },
          { name: 'Yuzu spritz', price: '£6' },
        ],
      },
    ],
    reviews: [
      { id: 'r3', author: 'Leo T.', text: 'Worth every penny — calm, precise, delicious.', rating: 5 },
      { id: 'r3b', author: 'Amir S.', text: 'Every course was explained with care. Left full but not heavy.', rating: 5 },
      { id: 'r3c', author: 'Hannah W.', text: 'Book early—seats are limited and demand is real.', rating: 4 },
      { id: 'r3d', author: 'Tom R.', text: 'Best omakase I have tried in the city this year.', rating: 5 },
      { id: 'r3e', author: 'Yuki F.', text: 'Fish quality is outstanding. The chef’s knife work is hypnotic to watch.', rating: 5 },
      { id: 'r3f', author: 'Greg P.', text: 'If you splurge on one meal this quarter, make it this. Sake pairing elevated every bite.', rating: 5 },
      { id: 'r3g', author: 'Ines M.', text: 'Intimate and quiet—not a place for loud groups. Perfect for a special anniversary.', rating: 5 },
      { id: 'r3h', author: 'Kwame D.', text: 'Chawanmushi was silken. One course had a touch too much salt for me but overall exceptional.', rating: 4 },
    ],
    hours: [
      { day: 'Tue – Thu', hours: '18:00 – 22:30' },
      { day: 'Fri – Sat', hours: '17:30 – 23:00' },
      { day: 'Sun', hours: '18:00 – 22:00' },
    ],
    phone: '+44 20 7988 1020',
    facilities: [
      'Private dining',
      'Vegan options (48h notice)',
      'Counter seating',
      'Chef’s table',
      'Allergy-aware kitchen',
      'Jacket appreciated',
    ],
  },
  {
    id: '3',
    name: 'Harbour Grill',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
    rating: 4.5,
    reviewCount: 528,
    cuisine: ['Mediterranean'],
    price: '££',
    vibes: ['Outdoor', 'Lively'],
    address: '2 Riverside Walk, London',
    distanceKm: 2.0,
    closingTime: '23:30',
    openNow: true,
    availabilityTonight: null,
    fullTonight: true,
    about:
      'Grilled seafood and mezze with a lively terrace overlooking the water. The kitchen works a charcoal grill for whole fish and skewers, while cold mezze and salads come out fast for sharing. Weekends draw a holiday crowd; weekdays are easier for walk-ins at the bar.',
    vibeDescriptions: [
      'Sunset terrace buzz',
      'Mezze and grill',
      'Lively holiday mood',
      'Groups welcome here',
    ],
    menu: [
      {
        category: 'Mezze',
        items: [
          { name: 'Mixed mezze for two', price: '£22' },
          { name: 'Whipped feta, honey & dukkah', price: '£8' },
          { name: 'Grilled halloumi, chilli jam', price: '£9' },
          { name: 'Marinated olives & pickles', price: '£5' },
        ],
      },
      {
        category: 'Grill',
        items: [
          { name: 'Whole sea bream', price: '£24' },
          { name: 'Lamb kofte', price: '£18' },
          { name: 'Harissa prawns, charred lemon', price: '£16' },
          { name: 'Half chicken, toum & flatbread', price: '£17' },
        ],
      },
      {
        category: 'Salads & sides',
        items: [
          { name: 'Tomato & peach panzanella', price: '£10' },
          { name: 'Charred broccoli, tahini', price: '£7' },
          { name: 'Hand-cut chips, aioli', price: '£5' },
        ],
      },
      {
        category: 'Dessert',
        items: [
          { name: 'Baklava ice cream sandwich', price: '£8' },
          { name: 'Orange blossom panna cotta', price: '£7' },
        ],
      },
      {
        category: 'Drinks',
        items: [
          { name: 'Aperitivo spritz', price: '£9' },
          { name: 'Greek lager', price: '£5' },
          { name: 'Assyrtiko by the glass', price: '£8' },
        ],
      },
    ],
    reviews: [
      { id: 'r4', author: 'Nina R.', text: 'Book ahead — terrace fills fast on warm nights.', rating: 4 },
      { id: 'r4b', author: 'Oliver P.', text: 'Sea bream was perfectly cooked. Mezze platter is huge—come hungry.', rating: 5 },
      { id: 'r4c', author: 'Sofia M.', text: 'Lively and loud in a good way. Great for groups.', rating: 4 },
      { id: 'r4d', author: 'Dan K.', text: 'Sunset over the water with a cold drink—hard to beat.', rating: 5 },
      { id: 'r4e', author: 'Freya L.', text: 'Kofte had a lovely char. Service kept up even when the terrace was packed.', rating: 4 },
      { id: 'r4f', author: 'Ben T.', text: 'Kids loved the flatbread and chips. We’ll be regulars in summer.', rating: 5 },
      { id: 'r4g', author: 'Clara J.', text: 'Harissa prawns were spicy and sweet—order extra bread to mop the juices.', rating: 5 },
      { id: 'r4h', author: 'Vikram S.', text: 'Slightly long wait for drinks but food arrived quickly once we ordered.', rating: 4 },
    ],
    hours: [
      { day: 'Mon – Thu', hours: '11:30 – 23:00' },
      { day: 'Fri – Sat', hours: '11:30 – 23:30' },
      { day: 'Sun', hours: '11:30 – 22:30' },
    ],
    phone: '+44 20 7450 8890',
    facilities: [
      'Outdoor seating',
      'Family friendly',
      'Large groups',
      'Riverside views',
      'Bar seating',
      'Gluten-free options',
    ],
  },
  {
    id: '4',
    name: 'Bistro Lumière',
    image: 'https://images.unsplash.com/photo-1550966871-b3be01aeef58?w=800&q=80',
    rating: 4.7,
    reviewCount: 255,
    cuisine: ['French'],
    price: '££',
    vibes: ['Romantic', 'Casual'],
    address: '9 Charlotte St, London',
    distanceKm: 0.8,
    closingTime: '22:00',
    openNow: false,
    availabilityTonight: 5,
    fullTonight: false,
    about:
      'Classic French comfort with a relaxed brunch menu on weekends. The room is all bentwood chairs, low lamps, and chalked specials. Evenings lean bistro—steak, frites, and a rotating tart—while mornings bring viennoiserie, shakshuka, and proper filter coffee.',
    vibeDescriptions: [
      'Parisian bistro charm',
      'Lazy weekend brunch',
      'Classic comfort plates',
      'Easy wine picks',
    ],
    menu: [
      {
        category: 'Dinner',
        items: [
          { name: 'Steak frites, béarnaise', price: '£21' },
          { name: 'Ratatouille tart, goat’s cheese', price: '£14' },
          { name: 'Duck confit, lentils', price: '£23' },
          { name: 'Moules marinières, frites', price: '£18' },
          { name: 'Soup du jour & baguette', price: '£8' },
        ],
      },
      {
        category: 'Brunch (Sat – Sun)',
        items: [
          { name: 'Croque monsieur', price: '£12' },
          { name: 'Eggs Florentine', price: '£11' },
          { name: 'Shakshuka, sourdough', price: '£10' },
          { name: 'Pain perdu, berries', price: '£9' },
        ],
      },
      {
        category: 'Dessert',
        items: [
          { name: 'Crème brûlée', price: '£7' },
          { name: 'Chocolate pot de crème', price: '£7' },
          { name: 'Cheese selection', price: '£12' },
        ],
      },
      {
        category: 'Wine & apéro',
        items: [
          { name: 'Glass of house Loire', price: '£7' },
          { name: 'Kir royal', price: '£9' },
          { name: 'Pastis', price: '£6' },
        ],
      },
    ],
    reviews: [
      { id: 'r5', author: 'Chris P.', text: 'Cosy and unpretentious — great wine list.', rating: 5 },
      { id: 'r5b', author: 'Mei L.', text: 'Brunch croque was rich and perfect with coffee. Queues on Sunday though.', rating: 4 },
      { id: 'r5c', author: 'James F.', text: 'Feels like a neighbourhood secret even though it sits on a busy street.', rating: 5 },
      { id: 'r5d', author: 'Rosa T.', text: 'We shared steak frites and left happy. Portions are generous.', rating: 4 },
      { id: 'r5e', author: 'Antoine D.', text: 'Moules were plump and the broth was drinkable. Exactly what I wanted on a rainy night.', rating: 5 },
      { id: 'r5f', author: 'Lily K.', text: 'Crème brûlée had the perfect crack. Staff remembered our wine from last visit.', rating: 5 },
      { id: 'r5g', author: 'Noah B.', text: 'Sunday brunch queue moved faster than expected. Shakshuka had a good kick.', rating: 4 },
      { id: 'r5h', author: 'Imogen S.', text: 'Duck confit skin was crisp, meat fell off the bone. Will return for the cheese board.', rating: 5 },
    ],
    hours: [
      { day: 'Wed – Fri', hours: '12:00 – 22:00' },
      { day: 'Sat', hours: '10:00 – 22:30' },
      { day: 'Sun', hours: '10:00 – 21:30' },
      { day: 'Mon', hours: '12:00 – 22:00' },
    ],
    phone: '+44 20 7330 2211',
    facilities: [
      'Brunch',
      'Wine bar',
      'Walk-ins welcome',
      'Vegetarian friendly',
      'Counter seats',
      'Credit cards',
    ],
  },
  {
    id: '5',
    name: 'Smoky Finch BBQ',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
    rating: 4.6,
    reviewCount: 389,
    cuisine: ['American'],
    price: '££',
    vibes: ['Lively', 'Casual'],
    address: '61 Shoreditch High St, London',
    distanceKm: 1.6,
    closingTime: '23:00',
    openNow: true,
    availabilityTonight: 4,
    fullTonight: false,
    about:
      'Low-and-slow barbecue spot with house rubs, smoky brisket, and big sharing platters. Expect upbeat playlists, generous portions, and comfort sides that make this ideal for groups.',
    vibeDescriptions: [
      'Low and slow smoke',
      'Big sharing platters',
      'Loud happy room',
      'Bourbon cocktail list',
    ],
    menu: [
      {
        category: 'Pit classics',
        items: [
          { name: '12h smoked brisket', price: '£19' },
          { name: 'Sticky pork ribs (half rack)', price: '£16' },
          { name: 'Pulled pork bun', price: '£12' },
        ],
      },
      {
        category: 'Sides',
        items: [
          { name: 'Mac and cheese', price: '£6' },
          { name: 'Cornbread with honey butter', price: '£5' },
          { name: 'Pickled slaw', price: '£4' },
        ],
      },
      {
        category: 'Drinks',
        items: [
          { name: 'Smoked old fashioned', price: '£11' },
          { name: 'Craft IPA', price: '£6' },
        ],
      },
    ],
    reviews: [
      { id: 'r6a', author: 'Milo J.', text: 'Brisket was tender and smoky with perfect bark.', rating: 5 },
      { id: 'r6b', author: 'Eva P.', text: 'Great for groups. Ribs fell off the bone.', rating: 5 },
      { id: 'r6c', author: 'Connor W.', text: 'Music is loud but fun. Portions are huge.', rating: 4 },
      { id: 'r6d', author: 'Rita D.', text: 'Mac and cheese side is criminally good.', rating: 5 },
    ],
    hours: [
      { day: 'Mon – Thu', hours: '12:00 – 22:30' },
      { day: 'Fri – Sat', hours: '12:00 – 23:00' },
      { day: 'Sun', hours: '12:00 – 21:30' },
    ],
    phone: '+44 20 7091 1190',
    facilities: ['Group tables', 'Takeaway', 'Kids menu', 'Step-free entrance'],
  },
  {
    id: '6',
    name: 'Casa Verde Tapas',
    image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80',
    rating: 4.7,
    reviewCount: 274,
    cuisine: ['Spanish'],
    price: '££',
    vibes: ['Romantic', 'Outdoor'],
    address: '27 Neal’s Yard, London',
    distanceKm: 0.9,
    closingTime: '22:45',
    openNow: true,
    availabilityTonight: 2,
    fullTonight: false,
    about:
      'Intimate tapas bar with tiled walls, warm lighting, and a leafy courtyard terrace. The menu focuses on seasonal small plates, sherry pairings, and house-made desserts.',
    vibeDescriptions: [
      'Warm tiled interiors',
      'Seasonal small plates',
      'Courtyard terrace seats',
      'Sherry flight pairings',
    ],
    menu: [
      {
        category: 'Tapas',
        items: [
          { name: 'Patatas bravas', price: '£7' },
          { name: 'Garlic prawns', price: '£11' },
          { name: 'Iberico croquetas', price: '£8' },
          { name: 'Padron peppers', price: '£6' },
        ],
      },
      {
        category: 'From the grill',
        items: [
          { name: 'Octopus, paprika oil', price: '£15' },
          { name: 'Chorizo al vino', price: '£10' },
        ],
      },
      {
        category: 'Sweet',
        items: [
          { name: 'Basque cheesecake', price: '£7' },
          { name: 'Churros, dark chocolate', price: '£6' },
        ],
      },
    ],
    reviews: [
      { id: 'r7a', author: 'Nadia S.', text: 'Perfect date-night spot with great sherry suggestions.', rating: 5 },
      { id: 'r7b', author: 'Alex T.', text: 'Tapas came out quickly and everything was well seasoned.', rating: 4 },
      { id: 'r7c', author: 'Luca M.', text: 'Courtyard tables are lovely in the evening.', rating: 5 },
      { id: 'r7d', author: 'Pri M.', text: 'Cheesecake was excellent. Book ahead on weekends.', rating: 5 },
    ],
    hours: [
      { day: 'Tue – Thu', hours: '12:00 – 22:00' },
      { day: 'Fri – Sat', hours: '12:00 – 22:45' },
      { day: 'Sun', hours: '12:00 – 21:00' },
    ],
    phone: '+44 20 7312 4430',
    facilities: ['Outdoor seating', 'Vegetarian options', 'Dog friendly terrace'],
  },
  {
    id: '7',
    name: 'Cedar & Mint',
    image: 'https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=800&q=80',
    rating: 4.4,
    reviewCount: 198,
    cuisine: ['Middle Eastern'],
    price: '£',
    vibes: ['Family', 'Casual'],
    address: '103 Edgware Road, London',
    distanceKm: 2.4,
    closingTime: '23:15',
    openNow: false,
    availabilityTonight: null,
    fullTonight: true,
    about:
      'Neighborhood favorite for charcoal skewers, fresh flatbreads, and bright mezze. Friendly service and hearty portions make it a reliable option for family dinners and late meals.',
    vibeDescriptions: [
      'Charcoal grill aromas',
      'Fresh daily flatbread',
      'Family style sharing',
      'Late evening service',
    ],
    menu: [
      {
        category: 'Mezze',
        items: [
          { name: 'Hummus with warm pita', price: '£6' },
          { name: 'Baba ghanoush', price: '£6' },
          { name: 'Falafel plate', price: '£8' },
        ],
      },
      {
        category: 'Mains',
        items: [
          { name: 'Mixed grill for one', price: '£17' },
          { name: 'Chicken shawarma wrap', price: '£10' },
          { name: 'Lentil rice bowl', price: '£9' },
        ],
      },
      {
        category: 'Drinks',
        items: [
          { name: 'Mint lemonade', price: '£4' },
          { name: 'Cardamom tea', price: '£3' },
        ],
      },
    ],
    reviews: [
      { id: 'r8a', author: 'Farah K.', text: 'Very good value and super fresh flatbread.', rating: 5 },
      { id: 'r8b', author: 'James L.', text: 'Mixed grill is generous and nicely charred.', rating: 4 },
      { id: 'r8c', author: 'Sara A.', text: 'Great option after work when many places are closed.', rating: 4 },
      { id: 'r8d', author: 'Ibrahim H.', text: 'Friendly team and quick service even when busy.', rating: 5 },
    ],
    hours: [
      { day: 'Mon – Thu', hours: '12:00 – 22:45' },
      { day: 'Fri – Sat', hours: '12:00 – 23:15' },
      { day: 'Sun', hours: '13:00 – 22:00' },
    ],
    phone: '+44 20 7706 8891',
    facilities: ['Halal menu', 'Family friendly', 'Late-night dining', 'Delivery'],
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

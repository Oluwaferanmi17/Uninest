export const NIGERIAN_UNIVERSITIES = [
  "University of Lagos (UNILAG)",
  "University of Ibadan (UI)",
  "Obafemi Awolowo University (OAU)",
  "Federal University of Technology Akure (FUTA)",
  "University of Benin (UNIBEN)",
  "University of Nigeria Nsukka (UNN)",
  "Ahmadu Bello University (ABU)",
  "University of Ilorin (UNILORIN)",
  "Lagos State University (LASU)",
  "Covenant University",
  "Babcock University",
  "University of Port Harcourt (UNIPORT)",
  "Federal University of Technology Owerri (FUTO)",
  "Nnamdi Azikiwe University (UNIZIK)",
  "University of Calabar (UNICAL)",
  "Federal University Oye-Ekiti (FUOYE)",
  "Ekiti State University (EKSU)",
  "Osun State University (UNIOSUN)",
  "Olabisi Onabanjo University (OOU)",
  "Ladoke Akintola University of Technology (LAUTECH)",
] as const;

export const PROPERTY_TYPES = [
  { value: "SELF_CON", label: "Self Contain" },
  { value: "ROOM_AND_PARLOUR", label: "Room & Parlour" },
  { value: "FLAT", label: "Flat" },
  { value: "HOSTEL", label: "Hostel" },
  { value: "SHARED_ROOM", label: "Shared Room" },
] as const;

export const AMENITIES = [
  { id: "wifi", label: "WiFi", icon: "FiWifi" },
  { id: "water", label: "Water Supply", icon: "FiDroplet" },
  { id: "security", label: "24/7 Security", icon: "FiShield" },
  { id: "power", label: "Generator/Power", icon: "FiZap" },
  { id: "parking", label: "Parking", icon: "FiTruck" },
  { id: "kitchen", label: "Kitchen", icon: "FiCoffee" },
  { id: "ac", label: "Air Conditioning", icon: "FiWind" },
  { id: "desk", label: "Study Desk", icon: "FiBook" },
  { id: "wardrobe", label: "Wardrobe", icon: "FiBox" },
  { id: "laundry", label: "Laundry Service", icon: "FiRefreshCw" },
] as const;

export const PRICE_RANGES = [
  { min: 0, max: 100000, label: "Under ₦100,000" },
  { min: 100000, max: 200000, label: "₦100,000 - ₦200,000" },
  { min: 200000, max: 350000, label: "₦200,000 - ₦350,000" },
  { min: 350000, max: 500000, label: "₦350,000 - ₦500,000" },
  { min: 500000, max: Infinity, label: "Above ₦500,000" },
] as const;

export const SEMESTERS = [
  "2024/2025 First Semester",
  "2024/2025 Second Semester",
  "2025/2026 First Semester",
  "2025/2026 Second Semester",
] as const;

export const NAV_LINKS = {
  student: [
    { href: "/listings", label: "Find Housing" },
    { href: "/student/bookings", label: "My Bookings" },
    { href: "/chat", label: "Messages" },
    { href: "/student/profile", label: "Profile" },
  ],
  host: [
    { href: "/host/dashboard", label: "Dashboard" },
    { href: "/host/listings", label: "My Listings" },
    { href: "/host/bookings", label: "Bookings" },
    { href: "/chat", label: "Messages" },
    { href: "/host/profile", label: "Profile" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin" },
    { label: "Users", href: "/admin/users" },
    { label: "Listings", href: "/admin/listings" },
  ],
  guest: [
    { href: "/listings", label: "Browse Listings" },
    { href: "/login", label: "Login" },
    { href: "/register", label: "Sign Up" },
  ],
} as const;

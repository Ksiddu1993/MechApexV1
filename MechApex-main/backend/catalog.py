"""Indian vehicle catalog with common brands and models.
Used for the vehicle-type dropdown in job cards."""

TWO_WHEELERS = {
    "Hero": ["Splendor Plus", "HF Deluxe", "Passion Pro", "Glamour", "Xtreme 160R", "Xpulse 200", "Destini 125"],
    "Honda": ["Activa 6G", "Activa 125", "Shine", "SP 125", "Dio", "Unicorn", "Hornet 2.0", "CB350"],
    "Bajaj": ["Pulsar 150", "Pulsar 125", "Pulsar N160", "Pulsar NS200", "Platina 100", "CT 110", "Chetak", "Avenger 220"],
    "TVS": ["Jupiter 125", "Ntorq 125", "Apache RTR 160", "Apache RTR 200", "Raider 125", "XL100", "Star City Plus"],
    "Yamaha": ["FZ-S", "FZ-X", "MT-15", "R15 V4", "Fascino 125", "Ray ZR 125"],
    "Suzuki": ["Access 125", "Burgman Street 125", "Gixxer", "Gixxer SF 250", "Avenis 125"],
    "Royal Enfield": ["Classic 350", "Bullet 350", "Meteor 350", "Hunter 350", "Himalayan", "Continental GT 650", "Interceptor 650"],
    "KTM": ["Duke 200", "Duke 250", "Duke 390", "RC 200", "RC 390", "Adventure 390"],
    "Ola Electric": ["S1 Pro", "S1 Air", "S1 X"],
    "Ather": ["450X", "450S", "Rizta"],
    "Kawasaki": ["Ninja 300", "Ninja 400", "Z650", "Versys 650"],
    "Jawa": ["42", "Perak", "Yezdi Roadster", "Yezdi Scrambler"],
}

FOUR_WHEELERS = {
    "Maruti Suzuki": ["Swift", "Baleno", "WagonR", "Alto K10", "Alto 800", "Dzire", "Ertiga", "XL6", "Brezza", "Grand Vitara", "S-Presso", "Ciaz", "Fronx", "Jimny"],
    "Hyundai": ["Grand i10 Nios", "Aura", "i20", "Venue", "Creta", "Verna", "Alcazar", "Tucson", "Exter"],
    "Tata": ["Nexon", "Punch", "Tiago", "Tigor", "Altroz", "Harrier", "Safari", "Nexon EV", "Punch EV", "Tigor EV"],
    "Mahindra": ["Thar", "Scorpio Classic", "Scorpio-N", "XUV700", "XUV3XO", "XUV400 EV", "Bolero", "Bolero Neo", "Marazzo"],
    "Honda": ["Amaze", "City", "Elevate", "City Hybrid"],
    "Toyota": ["Innova Crysta", "Innova Hycross", "Fortuner", "Urban Cruiser Hyryder", "Glanza", "Rumion", "Camry", "Vellfire"],
    "Kia": ["Sonet", "Seltos", "Carens", "Carnival", "EV6"],
    "Volkswagen": ["Virtus", "Taigun", "Tiguan"],
    "Skoda": ["Slavia", "Kushaq", "Kodiaq", "Superb"],
    "Renault": ["Kwid", "Kiger", "Triber"],
    "Nissan": ["Magnite"],
    "MG": ["Astor", "Hector", "Hector Plus", "Gloster", "ZS EV", "Comet EV"],
    "Jeep": ["Compass", "Meridian", "Wrangler"],
    "Ford": ["EcoSport", "Endeavour", "Figo"],
    "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLC", "GLE"],
    "BMW": ["3 Series", "5 Series", "X1", "X3", "X5", "X7"],
    "Audi": ["A4", "A6", "Q3", "Q5", "Q7"],
}

FUEL_TYPES = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid", "LPG"]

# Common service items with default INR prices — the mechanic can override.
DEFAULT_SERVICES_TWO_WHEELER = [
    {"name": "General Service", "category": "service", "price": 500},
    {"name": "Engine Oil Change", "category": "service", "price": 400},
    {"name": "Oil Filter", "category": "part", "price": 150},
    {"name": "Air Filter", "category": "part", "price": 200},
    {"name": "Brake Pads (Front)", "category": "part", "price": 350},
    {"name": "Brake Pads (Rear)", "category": "part", "price": 300},
    {"name": "Chain Sprocket Set", "category": "part", "price": 1200},
    {"name": "Spark Plug", "category": "part", "price": 250},
    {"name": "Battery", "category": "part", "price": 1800},
    {"name": "Clutch Plate", "category": "part", "price": 950},
    {"name": "Wheel Alignment", "category": "service", "price": 150},
    {"name": "Wash & Polish", "category": "wash", "price": 200},
    {"name": "Deep Cleaning Wash", "category": "wash", "price": 400},
]

DEFAULT_SERVICES_FOUR_WHEELER = [
    {"name": "General Service", "category": "service", "price": 1500},
    {"name": "Engine Oil Change", "category": "service", "price": 2500},
    {"name": "Oil Filter", "category": "part", "price": 400},
    {"name": "Air Filter", "category": "part", "price": 600},
    {"name": "Cabin Filter", "category": "part", "price": 550},
    {"name": "Brake Pads (Front)", "category": "part", "price": 2500},
    {"name": "Brake Pads (Rear)", "category": "part", "price": 2200},
    {"name": "Brake Fluid", "category": "part", "price": 350},
    {"name": "Coolant Top-up", "category": "service", "price": 500},
    {"name": "Battery", "category": "part", "price": 5500},
    {"name": "Wheel Alignment", "category": "service", "price": 500},
    {"name": "Wheel Balancing", "category": "service", "price": 400},
    {"name": "Clutch Overhaul", "category": "service", "price": 8500},
    {"name": "AC Gas Refill", "category": "service", "price": 1800},
    {"name": "Exterior Wash", "category": "wash", "price": 300},
    {"name": "Interior Detailing", "category": "wash", "price": 1200},
    {"name": "Full Body Polish", "category": "wash", "price": 2500},
]

STANDARD_CHECKLIST = [
    {"key": "brakes", "label": "Brakes"},
    {"key": "fluids", "label": "Fluids (Oil, Coolant)"},
    {"key": "tires", "label": "Tires & Air Pressure"},
    {"key": "battery", "label": "Battery"},
    {"key": "lights", "label": "Lights & Indicators"},
    {"key": "belts", "label": "Belts & Hoses"},
    {"key": "chain", "label": "Chain / Drive System"},
    {"key": "wipers", "label": "Wipers & Washers"},
]

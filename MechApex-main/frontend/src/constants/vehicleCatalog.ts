export type VehicleClass = 'four_wheeler' | 'two_wheeler';

export const INDIAN_FOUR_WHEELERS: Record<string, string[]> = {
  'Maruti Suzuki': [
    'Swift', 'Baleno', 'Brezza', 'WagonR', 'Dzire', 'Ertiga', 'Alto K10',
    'Grand Vitara', 'Fronx', 'Ciaz', 'XL6', 'Jimny', 'Ignis', 'S-Presso', 'Celerio', 'Eeco'
  ],
  'Hyundai': [
    'Creta', 'Venue', 'i20', 'Verna', 'Grand i10 Nios', 'Aura', 'Alcazar',
    'Exter', 'Tucson', 'Kona Electric', 'Ioniq 5'
  ],
  'Tata Motors': [
    'Nexon', 'Punch', 'Harrier', 'Safari', 'Tiago', 'Tigor', 'Altroz',
    'Curvv', 'Nexon EV', 'Tiago EV', 'Punch EV', 'Tigor EV'
  ],
  'Mahindra': [
    'Thar', 'Scorpio-N', 'XUV700', 'Bolero', 'XUV3X0', 'Thar Roxx',
    'Scorpio Classic', 'XUV400', 'Bolero Neo', 'Marazzo'
  ],
  'Toyota': [
    'Innova Crysta', 'Innova Hycross', 'Fortuner', 'Urban Cruiser Hyryder',
    'Glanza', 'Hilux', 'Camry', 'Vellfire', 'Rumion'
  ],
  'Honda': [
    'City', 'Amaze', 'Elevate', 'WR-V', 'Jazz', 'Civic'
  ],
  'Kia': [
    'Seltos', 'Sonet', 'Carens', 'EV6', 'Carnival'
  ],
  'Volkswagen': [
    'Virtus', 'Taigun', 'Tiguan', 'Polo', 'Vento'
  ],
  'Skoda': [
    'Slavia', 'Kushaq', 'Kodiaq', 'Octavia', 'Superb'
  ],
  'Renault': [
    'Kwid', 'Triber', 'Kiger', 'Duster'
  ],
  'MG Motor': [
    'Hector', 'Astor', 'ZS EV', 'Comet EV', 'Gloster'
  ],
  'Nissan': [
    'Magnite', 'Kicks'
  ],
  'BMW': ['3 Series', '5 Series', 'X1', 'X3', 'X5', 'i4'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE', 'A-Class'],
  'Audi': ['A4', 'A6', 'Q3', 'Q5', 'Q7'],
  'Others': ['Custom Model'],
};

export const INDIAN_TWO_WHEELERS: Record<string, string[]> = {
  'Hero MotoCorp': [
    'Splendor Plus', 'HF Deluxe', 'Passion Pro', 'Glamour', 'Xpulse 200 4V',
    'Mavrick 440', 'Pleasure Plus', 'Xoom 110', 'Destini 125', 'Xtrem 160R'
  ],
  'Honda 2W': [
    'Activa 6G', 'Shine 125', 'Dio', 'Unicorn 160', 'SP 125', 'Hornet 2.0',
    'CB350', 'CB350RS', 'Activa 125', 'CB200X'
  ],
  'TVS': [
    'Jupiter 110', 'Jupiter 125', 'Apache RTR 160', 'Apache RTR 200',
    'Raider 125', 'Ntorq 125', 'XL100', 'Ronin 225', 'iQube EV', 'Apache RR 310'
  ],
  'Bajaj': [
    'Pulsar 150', 'Pulsar NS200', 'Pulsar N250', 'Platina 110',
    'Freedom 125 (CNG)', 'Chetak EV', 'Dominar 400', 'Avenger 220', 'CT 110X'
  ],
  'Royal Enfield': [
    'Classic 350', 'Hunter 350', 'Bullet 350', 'Meteor 350', 'Himalayan 450',
    'Continental GT 650', 'Interceptor 650', 'Super Meteor 650', 'Shotgun 650'
  ],
  'Yamaha': [
    'FZ-S FI', 'MT-15 V2', 'YZF R15 V4', 'RayZR 125', 'Aerox 155', 'Fascino 125', 'FZ-X'
  ],
  'Suzuki 2W': [
    'Access 125', 'Burgman Street', 'Gixxer SF 150', 'Gixxer 250', 'V-Strom SX'
  ],
  'Ather Energy': ['450X', '450S', 'Rizta'],
  'Ola Electric': ['S1 Pro', 'S1 X', 'S1 Air'],
  'KTM': ['Duke 200', 'Duke 390', 'RC 200', 'Adventure 390'],
  'Java / Yezdi': ['Jawa 350', 'Yezdi Roadster', 'Yezdi Adventure'],
  'Vespa / Aprilia': ['Vespa VXI', 'Aprilia SR 160', 'Aprilia RS 457'],
  'Others': ['Custom Model'],
};

export const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'EV (Electric)', 'Hybrid'];

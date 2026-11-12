export type BinType = 'INORGANIC' | 'ORGANIC' | 'OTHER';

export type BinLidStatus = 'CLOSED' | 'OPENING' | 'CLOSING' | 'DONE' | 'ERROR';

export interface BinDefinition {
  type: BinType;
  title: string;
  subTitle: string;
  pin: string;
  command: string;
  colorScheme: {
    bgLight: string;
    border: string;
    borderActive: string;
    text: string;
    accent: string;
    badge: string;
    badgeActive: string;
    shadowActive: string;
  };
  description: string;
  examples: string[];
}

export const BIN_ORDER: BinType[] = ['INORGANIC', 'ORGANIC', 'OTHER'];

export const BIN_CONFIGS: Record<BinType, BinDefinition> = {
  INORGANIC: {
    type: 'INORGANIC',
    title: 'RÁC VÔ CƠ',
    subTitle: 'Có thể tái chế',
    pin: 'Chân P0',
    command: 'INORGANIC',
    colorScheme: {
      bgLight: 'bg-sky-50/70',
      border: 'border-sky-200',
      borderActive: 'border-sky-500 ring-4 ring-sky-400/30',
      text: 'text-sky-800',
      accent: 'bg-sky-600',
      badge: 'bg-sky-100 text-sky-800',
      badgeActive: 'bg-sky-600 text-white',
      shadowActive: 'shadow-lg shadow-sky-500/20',
    },
    description: 'Chai nhựa, lon nhôm, giấy báo, bìa carton, kim loại, thủy tinh. Servo P0 mở 180°, giữ 3s, đóng về 0°.',
    examples: ['Chai nhựa PET', 'Lon nước ngọt', 'Bìa carton', 'Vỏ lon'],
  },
  ORGANIC: {
    type: 'ORGANIC',
    title: 'RÁC HỮU CƠ',
    subTitle: 'Phân hủy sinh học',
    pin: 'Chân P1',
    command: 'ORGANIC',
    colorScheme: {
      bgLight: 'bg-emerald-50/70',
      border: 'border-emerald-200',
      borderActive: 'border-emerald-500 ring-4 ring-emerald-400/30',
      text: 'text-emerald-800',
      accent: 'bg-emerald-600',
      badge: 'bg-emerald-100 text-emerald-800',
      badgeActive: 'bg-emerald-600 text-white',
      shadowActive: 'shadow-lg shadow-emerald-500/20',
    },
    description: 'Thức ăn thừa, vỏ trái cây, rau củ quả, lá cây khô, bã trà, cà phê. Servo P1 mở 180°, giữ 3s, đóng về 0°.',
    examples: ['Vỏ chuối', 'Thức ăn thừa', 'Rau củ', 'Lá cây'],
  },
  OTHER: {
    type: 'OTHER',
    title: 'RÁC CÒN LẠI',
    subTitle: 'Không thể tái chế',
    pin: 'Chân P2',
    command: 'OTHER',
    colorScheme: {
      bgLight: 'bg-amber-50/70',
      border: 'border-amber-200',
      borderActive: 'border-amber-500 ring-4 ring-amber-400/30',
      text: 'text-amber-800',
      accent: 'bg-amber-600',
      badge: 'bg-amber-100 text-amber-800',
      badgeActive: 'bg-amber-600 text-white',
      shadowActive: 'shadow-lg shadow-amber-500/20',
    },
    description: 'Túi nilon bẩn, hộp xốp, tã giấy, khẩu trang, gốm sứ vỡ, rác nguy hại. Servo P2 mở 180°, giữ 3s, đóng về 0°.',
    examples: ['Túi nilon', 'Hộp xốp bẩn', 'Khẩu trang', 'Bút bi hỏng'],
  },
};

export interface ClassMappingConfig {
  [modelClassName: string]: BinType | 'IGNORE';
}

export interface SerialLogEntry {
  id: string;
  timestamp: string;
  type: 'tx' | 'rx' | 'info' | 'error';
  text: string;
}

export type ServoState = 'IDLE' | 'BUSY' | 'DONE';

export interface DetectionResult {
  className: string;
  confidence: number;
  mappedBin: BinType | null;
  isValid: boolean; // >= 85%
  timestamp: number;
}

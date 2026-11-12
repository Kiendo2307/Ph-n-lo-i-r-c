import { BinType, ClassMappingConfig, DetectionResult } from '../types/bin';

export const LOCAL_STORAGE_MODEL_KEY = 'ai_smart_bin_model_url';
export const LOCAL_STORAGE_MAPPING_KEY = 'ai_smart_bin_class_mappings';

// Default sample model
export const SAMPLE_MODEL_URL = 'https://teachablemachine.withgoogle.com/models/G4Kmx8un8/';

export function inferBinFromLabel(label: string): BinType | 'IGNORE' {
  const clean = label.trim().toLowerCase();

  // 1. Inorganic patterns (Rác vô cơ - P0)
  if (
    clean.includes('inorganic') ||
    clean.includes('vô cơ') ||
    clean.includes('vo co') ||
    clean.includes('recycle') ||
    clean.includes('tái chế') ||
    clean.includes('tai che') ||
    clean.includes('plastic') ||
    clean.includes('chai') ||
    clean.includes('lon') ||
    clean.includes('nhựa') ||
    clean.includes('nhua') ||
    clean.includes('kim loại') ||
    clean.includes('giấy') ||
    clean.includes('paper') ||
    clean.includes('can') ||
    clean.includes('bottle')
  ) {
    return 'INORGANIC';
  }

  // 2. Organic patterns (Rác hữu cơ - P1)
  if (
    clean.includes('organic') ||
    clean.includes('hữu cơ') ||
    clean.includes('huu co') ||
    clean.includes('biodegradable') ||
    clean.includes('compost') ||
    clean.includes('rau') ||
    clean.includes('thức ăn') ||
    clean.includes('thuc an') ||
    clean.includes('vỏ') ||
    clean.includes('la cay') ||
    clean.includes('lá cây') ||
    clean.includes('food')
  ) {
    return 'ORGANIC';
  }

  // 3. Other patterns (Trường hợp còn lại - P2)
  if (
    clean.includes('other') ||
    clean.includes('còn lại') ||
    clean.includes('con lai') ||
    clean.includes('khác') ||
    clean.includes('khac') ||
    clean.includes('residual') ||
    clean.includes('nilon') ||
    clean.includes('xốp') ||
    clean.includes('trash') ||
    clean.includes('rác khác') ||
    clean.includes('rac khac')
  ) {
    return 'OTHER';
  }

  // 4. Default numbered classes: Class 1 -> INORGANIC (P0), Class 2 -> ORGANIC (P1), Class 3 -> OTHER (P2)
  if (clean.includes('class 1') || clean.includes('lớp 1') || clean.includes('lop 1')) {
    return 'INORGANIC';
  }
  if (clean.includes('class 2') || clean.includes('lớp 2') || clean.includes('lop 2')) {
    return 'ORGANIC';
  }
  if (clean.includes('class 3') || clean.includes('lớp 3') || clean.includes('lop 3')) {
    return 'OTHER';
  }

  return 'OTHER';
}

export function buildDefaultMappings(labels: string[]): ClassMappingConfig {
  const mappings: ClassMappingConfig = {};
  const fallbackList: BinType[] = ['INORGANIC', 'ORGANIC', 'OTHER'];

  labels.forEach((label, idx) => {
    const inferred = inferBinFromLabel(label);
    if (inferred) {
      mappings[label] = inferred;
    } else {
      mappings[label] = fallbackList[idx % 3];
    }
  });
  return mappings;
}

export function evaluatePrediction(
  topPrediction: { className: string; probability: number },
  mappings: ClassMappingConfig,
  minConfidence = 0.85
): DetectionResult {
  const confidence = topPrediction.probability;
  const mapped = mappings[topPrediction.className] || inferBinFromLabel(topPrediction.className);
  const isValid = confidence >= minConfidence && mapped !== 'IGNORE';

  return {
    className: topPrediction.className,
    confidence,
    mappedBin: isValid ? (mapped as BinType) : null,
    isValid,
    timestamp: Date.now(),
  };
}

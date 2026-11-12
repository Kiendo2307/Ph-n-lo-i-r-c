import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { ModelConfig } from './components/ModelConfig';
import { CameraSection } from './components/CameraSection';
import { BinCards } from './components/BinCards';
import { SerialControl } from './components/SerialControl';
import { MicrobitGuideModal } from './components/MicrobitGuideModal';
import { CustomMobileNet } from '@teachablemachine/image';
import {
  loadTeachableModel,
  normalizeModelUrl,
  TMClassPrediction,
} from './services/teachableMachine';
import {
  buildDefaultMappings,
  evaluatePrediction,
  LOCAL_STORAGE_MAPPING_KEY,
  LOCAL_STORAGE_MODEL_KEY,
  SAMPLE_MODEL_URL,
} from './services/classifier';
import {
  SerialManager,
  SerialStatus,
} from './services/serialManager';
import {
  BinType,
  BinLidStatus,
  BIN_CONFIGS,
  ClassMappingConfig,
  DetectionResult,
  SerialLogEntry,
  ServoState,
} from './types/bin';

export default function App() {
  // Model state
  const [modelUrl, setModelUrl] = useState<string>('');
  const [model, setModel] = useState<CustomMobileNet | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(false);
  const [modelLoadStatus, setModelLoadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [modelErrorMessage, setModelErrorMessage] = useState<string | null>(null);
  const [detectedClasses, setDetectedClasses] = useState<string[]>([]);
  const [classMappings, setClassMappings] = useState<ClassMappingConfig>({});

  // Detection & Bin state
  const [currentResult, setCurrentResult] = useState<DetectionResult | null>(null);
  const [activeBin, setActiveBin] = useState<BinType | null>(null);
  const [activeServoBin, setActiveServoBin] = useState<BinType | null>(null);
  const [isServoBusy, setIsServoBusy] = useState<boolean>(false);

  // Independent Lid status for each of the 3 bins: Inorganic (P0), Organic (P1), Other (P2)
  const [binLidStatuses, setBinLidStatuses] = useState<Record<BinType, BinLidStatus>>({
    INORGANIC: 'CLOSED',
    ORGANIC: 'CLOSED',
    OTHER: 'CLOSED',
  });

  // Micro:bit Web Serial state
  const [serialStatus, setSerialStatus] = useState<SerialStatus>('DISCONNECTED');
  const [servoState, setServoState] = useState<ServoState>('IDLE');
  const [serialLogs, setSerialLogs] = useState<SerialLogEntry[]>([]);
  const [isSerialSupported, setIsSerialSupported] = useState(true);
  const [isPermissionsPolicyBlocked, setIsPermissionsPolicyBlocked] = useState(false);
  const [serialErrorMessage, setSerialErrorMessage] = useState<string | null>(null);

  // UI state
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Serial manager reference & Timers
  const serialManagerRef = useRef<SerialManager | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeServoBinRef = useRef<BinType | null>(null);

  // Keep ref in sync
  useEffect(() => {
    activeServoBinRef.current = activeServoBin;
  }, [activeServoBin]);

  // Initialize Serial Manager
  useEffect(() => {
    const manager = new SerialManager({
      onStatusChange: (status, error) => {
        setSerialStatus(status);
        setSerialErrorMessage(error || null);
        setIsPermissionsPolicyBlocked(manager.getIsPermissionsPolicyBlocked());
      },
      onLog: (entry) => {
        setSerialLogs((prev) => [...prev.slice(-150), entry]);
      },
      onServoStateChange: (state) => {
        setServoState(state);
        const currentTarget = activeServoBinRef.current;

        if (state === 'BUSY' && currentTarget) {
          setBinLidStatuses((prev) => ({
            ...prev,
            [currentTarget]: 'OPENING',
          }));
        } else if (state === 'DONE') {
          // Clear 6-second timeout timer on receipt of DONE
          if (timeoutTimerRef.current) {
            clearTimeout(timeoutTimerRef.current);
            timeoutTimerRef.current = null;
          }

          if (currentTarget) {
            setBinLidStatuses((prev) => ({
              ...prev,
              [currentTarget]: 'DONE',
            }));

            // Auto-return lid to closed after 2.5s
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            closeTimerRef.current = setTimeout(() => {
              setBinLidStatuses((prev) => ({
                ...prev,
                [currentTarget]: 'CLOSED',
              }));
            }, 2500);
          }

          setIsServoBusy(false);
        }
      },
    });

    serialManagerRef.current = manager;
    setIsSerialSupported(manager.isSupported());

    // Restore model URL (prioritizing the requested model G4Kmx8un8)
    const storedUrl = localStorage.getItem(LOCAL_STORAGE_MODEL_KEY);
    const activeUrl = (!storedUrl || storedUrl.includes('oW5F2m9U8')) ? SAMPLE_MODEL_URL : storedUrl;
    setModelUrl(activeUrl);
    localStorage.setItem(LOCAL_STORAGE_MODEL_KEY, activeUrl);

    try {
      const savedMappings = localStorage.getItem(LOCAL_STORAGE_MAPPING_KEY);
      if (savedMappings) {
        setClassMappings(JSON.parse(savedMappings));
      }
    } catch {
      // Ignore
    }

    // Auto-load model on mount
    if (activeUrl) {
      handleLoadModel(activeUrl);
    }

    return () => {
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      manager.disconnect();
      manager.destroy();
    };
  }, []);

  // Handle Model Loading
  const handleLoadModel = async (urlToLoad: string) => {
    const normalized = normalizeModelUrl(urlToLoad);
    if (!normalized) {
      setModelErrorMessage('Vui lòng nhập đường link mô hình Teachable Machine hợp lệ!');
      setModelLoadStatus('error');
      return;
    }

    setIsLoadingModel(true);
    setModelLoadStatus('loading');
    setModelErrorMessage(null);

    try {
      const loaded = await loadTeachableModel(normalized);
      setModel(loaded.model);
      setDetectedClasses(loaded.labels);

      // Auto-build or update mappings
      const defaultMap = buildDefaultMappings(loaded.labels);
      const mergedMap: ClassMappingConfig = { ...defaultMap };

      // Preserve existing mapping choices if class exists
      const savedMappings = localStorage.getItem(LOCAL_STORAGE_MAPPING_KEY);
      if (savedMappings) {
        try {
          const parsed = JSON.parse(savedMappings);
          Object.keys(parsed).forEach((key) => {
            if (loaded.labels.includes(key)) {
              mergedMap[key] = parsed[key];
            }
          });
        } catch {
          // ignore
        }
      }

      setClassMappings(mergedMap);
      localStorage.setItem(LOCAL_STORAGE_MAPPING_KEY, JSON.stringify(mergedMap));
      localStorage.setItem(LOCAL_STORAGE_MODEL_KEY, normalized);

      setModelLoadStatus('success');
    } catch (err: unknown) {
      console.error('Lỗi tải mô hình:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setModelErrorMessage(msg);
      setModelLoadStatus('error');
    } finally {
      setIsLoadingModel(false);
    }
  };

  // Update specific class mapping
  const handleUpdateMapping = (className: string, bin: BinType | 'IGNORE') => {
    const updated = {
      ...classMappings,
      [className]: bin,
    };
    setClassMappings(updated);
    localStorage.setItem(LOCAL_STORAGE_MAPPING_KEY, JSON.stringify(updated));
  };

  // Connect Web Serial USB
  const handleConnectSerial = async () => {
    if (serialManagerRef.current) {
      setSerialErrorMessage(null);
      setIsPermissionsPolicyBlocked(false);
      await serialManagerRef.current.connect();
      setIsPermissionsPolicyBlocked(serialManagerRef.current.getIsPermissionsPolicyBlocked());
    }
  };

  // Disconnect Web Serial USB
  const handleDisconnectSerial = async () => {
    if (serialManagerRef.current) {
      await serialManagerRef.current.disconnect();
      setIsPermissionsPolicyBlocked(false);
      setIsServoBusy(false);
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    }
  };

  // Trigger independent servo with 6-second timeout safety rule
  const triggerServo = async (targetBin: BinType) => {
    if (isServoBusy) {
      serialManagerRef.current?.log(
        'info',
        `[ĐIỀU KHIỂN] Servo đang bận xử lý nắp khác. Bỏ qua lệnh ${targetBin} để không điều khiển cùng lúc.`
      );
      return false;
    }

    setIsServoBusy(true);
    setActiveServoBin(targetBin);
    setActiveBin(targetBin);

    // Clear any previous timers
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    // Update target bin to OPENING, others to CLOSED
    setBinLidStatuses((prev) => ({
      ...prev,
      [targetBin]: 'OPENING',
    }));

    // Send Serial command: INORGANIC\n, ORGANIC\n, or OTHER\n
    if (serialManagerRef.current && serialStatus === 'CONNECTED') {
      await serialManagerRef.current.sendCommand(targetBin, targetBin);
    }

    // 6-second timeout safety rule:
    // "Nếu không nhận được DONE sau 6 giây, hiển thị cảnh báo lỗi nhưng không khóa camera và nhận diện AI."
    timeoutTimerRef.current = setTimeout(() => {
      setBinLidStatuses((prev) => {
        if (prev[targetBin] !== 'DONE' && prev[targetBin] !== 'CLOSED') {
          return { ...prev, [targetBin]: 'ERROR' };
        }
        return prev;
      });
      setIsServoBusy(false);
      serialManagerRef.current?.log(
        'error',
        `[CẢNH BÁO] Quá 6 giây chưa nhận được phản hồi DONE từ micro:bit (Servo ${targetBin} - ${BIN_CONFIGS[targetBin].pin})! Đã mở khóa nhận diện tiếp theo.`
      );
    }, 6000);

    return true;
  };

  // Test individual servo via Web Serial
  const handleTestServo = async (command: BinType) => {
    if (isServoBusy) {
      alert('Một servo khác đang hoạt động. Vui lòng đợi hoàn tất trước khi thử tiếp!');
      return;
    }
    await triggerServo(command);
  };

  // Clear serial log terminal
  const handleClearLogs = () => {
    setSerialLogs([]);
  };

  // Detection handler: Never blocks camera or AI inference
  // "Cho phép chụp ảnh và nhận diện vật tiếp theo trong khi servo đang xử lý."
  const handleDetect = useCallback(async (predictions: TMClassPrediction[]): Promise<DetectionResult | null> => {
    if (!predictions || predictions.length === 0) return null;

    // Find top prediction
    const sorted = [...predictions].sort((a, b) => b.probability - a.probability);
    const top = sorted[0];

    // Evaluate result against >= 85% rule
    const evaluated = evaluatePrediction(top, classMappings, 0.85);
    setCurrentResult(evaluated);

    if (evaluated.isValid && evaluated.mappedBin) {
      setActiveBin(evaluated.mappedBin);

      // Only send command if no servo is currently active
      if (!isServoBusy) {
        await triggerServo(evaluated.mappedBin);
      } else {
        serialManagerRef.current?.log(
          'info',
          `[AI] Nhận diện: ${evaluated.mappedBin} (${(evaluated.confidence * 100).toFixed(1)}%). Servo trước đang bận nên chưa gửi lệnh mới.`
        );
      }
    } else {
      // Under 85%: Unidentified! Do NOT send servo command
      setActiveBin(null);
    }

    return evaluated;
  }, [classMappings, isServoBusy]);

  // Reset detection state for next item
  const handleResetDetection = () => {
    setCurrentResult(null);
    setActiveBin(null);
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header */}
      <Header
        onOpenGuide={() => setIsGuideOpen(true)}
        isModelReady={modelLoadStatus === 'success'}
        serialStatus={serialStatus}
      />

      {/* Main Single-Page Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">
        {/* Row 1: Teachable Machine Model Configuration */}
        <ModelConfig
          modelUrl={modelUrl}
          setModelUrl={setModelUrl}
          onLoadModel={handleLoadModel}
          isLoading={isLoadingModel}
          loadStatus={modelLoadStatus}
          errorMessage={modelErrorMessage}
          detectedClasses={detectedClasses}
          classMappings={classMappings}
          onUpdateMapping={handleUpdateMapping}
        />

        {/* Row 2: Camera Viewport (Most prominent area) */}
        <CameraSection
          model={model}
          isModelReady={modelLoadStatus === 'success'}
          onDetect={handleDetect}
          currentResult={currentResult}
          onResetDetection={handleResetDetection}
          servoBusy={isServoBusy}
          servoState={servoState}
          isSerialConnected={serialStatus === 'CONNECTED'}
          activeBin={activeBin}
        />

        {/* Row 3: Three Waste Bin Cards with independent lid status */}
        <BinCards
          activeBin={activeBin}
          binLidStatuses={binLidStatuses}
          isSerialConnected={serialStatus === 'CONNECTED'}
        />

        {/* Row 4: Micro:bit Web Serial USB Connection & Diagnostics */}
        <SerialControl
          serialStatus={serialStatus}
          servoState={servoState}
          serialLogs={serialLogs}
          onConnect={handleConnectSerial}
          onDisconnect={handleDisconnectSerial}
          onTestServo={handleTestServo}
          onClearLogs={handleClearLogs}
          isSupported={isSerialSupported}
          isPermissionsPolicyBlocked={isPermissionsPolicyBlocked}
          errorMessage={serialErrorMessage}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">AI SMART BIN</span>
            <span>•</span>
            <span>STEM AI & Robotics Education (3 Servo P0, P1, P2)</span>
          </div>
          <div>
            <span>Xử lý trực tiếp trên trình duyệt bằng TensorFlow.js & Teachable Machine</span>
          </div>
        </div>
      </footer>

      {/* Micro:bit Firmware Guide Modal */}
      <MicrobitGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Scan,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  Video,
  Sparkles,
} from 'lucide-react';
import { BinType, DetectionResult, ServoState } from '../types/bin';
import { CustomMobileNet } from '@teachablemachine/image';
import { TMClassPrediction } from '../services/teachableMachine';

interface CameraSectionProps {
  model: CustomMobileNet | null;
  isModelReady: boolean;
  onDetect: (prediction: TMClassPrediction[]) => Promise<DetectionResult | null>;
  currentResult: DetectionResult | null;
  onResetDetection: () => void;
  servoBusy: boolean;
  servoState: ServoState;
  isSerialConnected: boolean;
  activeBin: BinType | null;
}

export const CameraSection: React.FC<CameraSectionProps> = ({
  model,
  isModelReady,
  onDetect,
  currentResult,
  onResetDetection,
  servoBusy,
  servoState,
  isSerialConnected,
  activeBin,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [hasCycleFinished, setHasCycleFinished] = useState(false);

  // List available video devices
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = deviceList.filter((d) => d.kind === 'videoinput');
      setDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch {
      // Ignore
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  // Start Camera
  const startCamera = async (deviceId?: string) => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: deviceId ? undefined : 'environment',
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setIsCameraOn(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      await refreshDevices();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setCameraError(`Không thể mở camera: ${errorMsg}. Vui lòng cho phép quyền truy cập camera trên trình duyệt.`);
      setIsCameraOn(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  // Handle device change
  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (isCameraOn) {
      startCamera(deviceId);
    }
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Execute AI Prediction on the current camera frame
  const handlePerformDetection = async () => {
    if (!model || !isModelReady) {
      alert('Vui lòng tải mô hình AI trước khi nhận diện!');
      return;
    }
    if (!isCameraOn || !videoRef.current) {
      alert('Vui lòng bật camera trước khi nhận diện!');
      return;
    }
    // Cho phép chụp ảnh và nhận diện vật tiếp theo trong khi servo đang xử lý
    setIsAnalyzing(true);
    setHasCycleFinished(false);

    try {
      // Predict using Teachable Machine model directly on video element
      const predictions: TMClassPrediction[] = await model.predict(videoRef.current);
      await onDetect(predictions);
      setHasCycleFinished(true);
    } catch (err: unknown) {
      console.error('Lỗi nhận diện:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle reset for next item
  const handleResetForNext = () => {
    onResetDetection();
    setHasCycleFinished(false);
  };

  const canDetect = isCameraOn && isModelReady && !isAnalyzing;

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Khu vực Camera & Nhận diện AI
            </h2>
            <p className="text-xs text-slate-500">
              Đặt rác trước ống kính để hệ thống AI phân tích và phân loại
            </p>
          </div>
        </div>

        {/* Camera Controls & Device Selector */}
        <div className="flex items-center flex-wrap gap-2">
          {devices.length > 1 && (
            <div className="flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDeviceId}
                onChange={(e) => handleDeviceChange(e.target.value)}
                disabled={!isCameraOn}
                aria-label="Chọn thiết bị camera"
                className="text-xs font-medium px-2 py-1 rounded border border-slate-200 bg-slate-50 text-slate-700 max-w-[150px] truncate"
              >
                {devices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isCameraOn ? (
            <button
              onClick={() => startCamera(selectedDeviceId)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Bật camera</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Tắt camera</span>
            </button>
          )}
        </div>
      </div>

      {/* Camera Video Viewport (Prominent) */}
      <div className="relative aspect-4/3 sm:aspect-16/10 w-full bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border-2 border-slate-800 shadow-inner">
        {/* Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isCameraOn ? 'opacity-100' : 'opacity-0 hidden'
          }`}
        />

        {/* Placeholder when camera is OFF */}
        {!isCameraOn && (
          <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 shadow-md">
              <CameraOff className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">Camera đang tắt</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Nhấn nút &quot;Bật camera&quot; ở trên để truyền hình ảnh trực tiếp vào mô hình nhận diện Teachable Machine.
              </p>
            </div>
            <button
              onClick={() => startCamera(selectedDeviceId)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Bật camera ngay</span>
            </button>
          </div>
        )}

        {/* Scanning Reticle & Overlay when Camera is ON */}
        {isCameraOn && (
          <>
            {/* Corner Markers */}
            <div className="absolute inset-4 pointer-events-none border border-white/20 rounded-lg">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br" />
            </div>

            {/* Live Camera Tag */}
            <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium border border-white/10 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE FEED</span>
            </div>

            {/* In-viewport Analysis Status */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-2xs flex flex-col items-center justify-center text-white pointer-events-none z-10">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin mb-2" />
                <span className="text-sm font-bold tracking-wide">ĐANG PHÂN TÍCH HÌNH ẢNH...</span>
                <span className="text-xs text-emerald-200">Trích xuất đặc trưng & đối chiếu nhãn</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Camera Error Message */}
      {cameraError && (
        <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Detection Actions Bar */}
      <div className="mt-4 pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Main Action Buttons */}
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <button
            onClick={handlePerformDetection}
            disabled={!canDetect}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-bold transition-all shadow-md shadow-emerald-600/20 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang phân tích...</span>
              </>
            ) : currentResult ? (
              <>
                <Scan className="w-4 h-4" />
                <span>Nhận diện vật tiếp theo</span>
              </>
            ) : (
              <>
                <Scan className="w-4 h-4" />
                <span>Nhận diện ngay</span>
              </>
            )}
          </button>

          {currentResult && (
            <button
              onClick={handleResetForNext}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors cursor-pointer border border-slate-300"
              title="Đặt lại khung nhận diện"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span>Đặt lại</span>
            </button>
          )}

          {/* Quick status message */}
          {!isModelReady && (
            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-md border border-amber-200 font-medium">
              ⚠️ Cần tải mô hình trước
            </span>
          )}
          {isModelReady && !isCameraOn && (
            <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-md font-medium">
              📷 Cần bật camera trước
            </span>
          )}
          {servoBusy && (
            <span className="text-xs text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded-md border border-blue-200 font-medium animate-pulse">
              ⚙️ Servo đang xử lý nắp. Camera vẫn nhận diện bình thường!
            </span>
          )}
          {!servoBusy && servoState === 'DONE' && isSerialConnected && (
            <span className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-200 font-semibold">
              ✓ micro:bit đã hoàn tất (DONE) – Sẵn sàng gửi lệnh tiếp!
            </span>
          )}
        </div>

        {/* Micro:bit status badge */}
        <div className="text-xs text-slate-500 flex items-center gap-1.5 justify-end">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Ngưỡng kích hoạt: <strong>≥ 85%</strong></span>
        </div>
      </div>

      {/* Detection Results Card */}
      {currentResult && (
        <div className="mt-4 p-4 rounded-xl border bg-slate-50 border-slate-200 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Result Label */}
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl text-white ${
                  currentResult.isValid
                    ? activeBin === 'INORGANIC'
                      ? 'bg-sky-600'
                      : activeBin === 'ORGANIC'
                      ? 'bg-emerald-600'
                      : 'bg-amber-600'
                    : 'bg-slate-500'
                }`}
              >
                {currentResult.isValid ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <HelpCircle className="w-6 h-6" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Kết quả nhận diện:
                  </span>
                  {currentResult.isValid ? (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                      HỢP LỆ (≥ 85%)
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                      KHÔNG XÁC ĐỊNH (&lt; 85%)
                    </span>
                  )}
                </div>

                <div className="text-lg font-black text-slate-900 mt-0.5">
                  {currentResult.isValid ? (
                    <span>
                      {currentResult.mappedBin === 'INORGANIC' && 'RÁC VÔ CƠ (Chai nhựa, lon nhôm, tái chế) – Servo P0'}
                      {currentResult.mappedBin === 'ORGANIC' && 'RÁC HỮU CƠ (Lá cây, vỏ rau củ, thức ăn) – Servo P1'}
                      {currentResult.mappedBin === 'OTHER' && 'TRƯỜNG HỢP CÒN LẠI (Túi nilon, hộp xốp) – Servo P2'}
                    </span>
                  ) : (
                    <span className="text-slate-600 font-semibold">
                      Không xác định loại rác (Độ tin cậy &lt; 85%)
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500 mt-0.5">
                  Lớp mô hình AI: <span className="font-mono font-medium text-slate-800">&quot;{currentResult.className}&quot;</span>
                  {currentResult.isValid && (
                    <span className="ml-2 font-semibold text-slate-700">
                      ➔ Lệnh: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono font-bold text-slate-900">{currentResult.mappedBin}</code>
                      {' '}(Chân {currentResult.mappedBin === 'INORGANIC' ? 'P0' : currentResult.mappedBin === 'ORGANIC' ? 'P1' : 'P2'})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Confidence bar */}
            <div className="w-full sm:w-48 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500 font-medium">Độ tin cậy AI</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {(currentResult.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentResult.isValid
                      ? currentResult.confidence > 0.95
                        ? 'bg-emerald-500'
                        : 'bg-emerald-600'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, currentResult.confidence * 100))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>0%</span>
                <span className="text-slate-600 font-semibold">Ngưỡng 85%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Micro:bit Hardware Notice */}
          {!isSerialConnected && currentResult.isValid && (
            <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>
                💡 Chưa kết nối micro:bit qua USB. AI vẫn hoạt động độc lập để bạn kiểm tra mô hình!
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                Lệnh chưa gửi qua USB
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

import React, { useRef, useEffect, useState } from 'react';
import {
  Usb,
  Power,
  PowerOff,
  Terminal,
  Send,
  Trash2,
  AlertCircle,
  Radio,
  ExternalLink,
  AlertTriangle,
  Unplug,
  ShieldAlert,
} from 'lucide-react';
import { SerialStatus } from '../services/serialManager';
import { SerialLogEntry, ServoState } from '../types/bin';

interface SerialControlProps {
  serialStatus: SerialStatus;
  servoState: ServoState;
  serialLogs: SerialLogEntry[];
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onTestServo: (command: 'ORGANIC' | 'INORGANIC' | 'OTHER') => Promise<void>;
  onClearLogs: () => void;
  isSupported: boolean;
  isPermissionsPolicyBlocked: boolean;
  errorMessage?: string | null;
}

export const SerialControl: React.FC<SerialControlProps> = ({
  serialStatus,
  servoState,
  serialLogs,
  onConnect,
  onDisconnect,
  onTestServo,
  onClearLogs,
  isSupported,
  isPermissionsPolicyBlocked,
  errorMessage,
}) => {
  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const [standaloneUrl, setStandaloneUrl] = useState<string>('');
  const [isInIframe, setIsInIframe] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStandaloneUrl(window.location.href);
      try {
        setIsInIframe(window.self !== window.top);
      } catch {
        setIsInIframe(true);
      }
    }
  }, []);

  // Auto-scroll logs to bottom when new logs arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [serialLogs]);

  const isConnected = serialStatus === 'CONNECTED';
  const isConnecting = serialStatus === 'CONNECTING';
  const isLost = serialStatus === 'LOST';
  const isError = serialStatus === 'ERROR';

  // Render status badge text & styling
  const renderStatusInfo = () => {
    switch (serialStatus) {
      case 'CONNECTED':
        return {
          label: 'Đã kết nối',
          sub: 'Baud rate: 115200 bps qua cổng USB',
          color: 'text-emerald-700',
          dot: 'bg-emerald-500 ring-4 ring-emerald-200',
        };
      case 'CONNECTING':
        return {
          label: 'Đang kết nối...',
          sub: 'Đang mở hộp thoại chọn cổng USB micro:bit',
          color: 'text-amber-700',
          dot: 'bg-amber-500 ring-4 ring-amber-200 animate-pulse',
        };
      case 'LOST':
        return {
          label: 'Mất kết nối',
          sub: 'Cáp USB micro:bit đã bị rút hoặc mất nguồn',
          color: 'text-rose-700',
          dot: 'bg-rose-500 ring-4 ring-rose-200 animate-ping',
        };
      case 'ERROR':
        return {
          label: isPermissionsPolicyBlocked ? 'Quyền bị chặn bởi iframe' : 'Lỗi kết nối',
          sub: errorMessage || 'Lỗi khi khởi tạo cổng Serial',
          color: 'text-rose-700',
          dot: 'bg-rose-500',
        };
      case 'DISCONNECTED':
      default:
        return {
          label: 'Chưa kết nối',
          sub: 'Nhấn nút để chọn cổng USB micro:bit',
          color: 'text-slate-600',
          dot: 'bg-slate-300',
        };
    }
  };

  const statusInfo = renderStatusInfo();

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
            <Usb className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Kết nối phần cứng micro:bit (Web Serial USB)
            </h2>
            <p className="text-xs text-slate-500">
              Giao tiếp 115200 baud với vi điều khiển BBC micro:bit qua cáp USB
            </p>
          </div>
        </div>

        {/* Connection & Standalone Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {isInIframe && (
            <a
              href={standaloneUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition-colors shadow-2xs"
              title="Mở tab trình duyệt độc lập để vượt qua giới hạn permissions policy của iframe"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              <span>Mở tab độc lập</span>
            </a>
          )}

          {!isConnected ? (
            <button
              onClick={onConnect}
              disabled={isConnecting || !isSupported}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:cursor-not-allowed"
            >
              <Power className="w-4 h-4" />
              <span>{isConnecting ? 'Đang kết nối...' : 'Kết nối micro:bit'}</span>
            </button>
          ) : (
            <button
              onClick={onDisconnect}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <PowerOff className="w-4 h-4" />
              <span>Ngắt kết nối</span>
            </button>
          )}
        </div>
      </div>

      {/* Permissions Policy Error Banner */}
      {isPermissionsPolicyBlocked && (
        <div className="mb-4 p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs space-y-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-amber-950">
                Trình duyệt chặn Web Serial trong khung nhúng (iframe) của Google AI Studio
              </p>
              <p className="text-amber-800 leading-relaxed">
                Lỗi <code className="bg-amber-200/80 px-1 py-0.5 rounded font-mono text-[11px]">Access to the feature &quot;serial&quot; is disallowed by permissions policy</code> xảy ra do chính sách bảo mật của trình duyệt cấm truy cập phần cứng USB trực tiếp từ khung nhúng (cross-origin iframe).
              </p>
              <p className="font-semibold text-amber-900">
                👉 Giải pháp: Mở ứng dụng trên một tab trình duyệt độc lập (Top-level Document). Khi đó, quyền Serial hoạt động 100% bình thường!
              </p>
            </div>
          </div>

          <div className="pt-1 flex items-center gap-3">
            <a
              href={standaloneUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Mở ứng dụng ở tab độc lập mới (Khuyên dùng)</span>
            </a>
          </div>
        </div>
      )}

      {/* Unexpected Disconnection Banner (Mất kết nối) */}
      {isLost && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Unplug className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Mất kết nối:</strong> Thiết bị micro:bit đã bị rút cáp USB. Vui lòng cắm lại cáp và nhấn &quot;Kết nối micro:bit&quot;.
            </span>
          </div>
          <button
            onClick={onConnect}
            className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 cursor-pointer"
          >
            Kết nối lại
          </button>
        </div>
      )}

      {/* Browser Support Warning */}
      {!isSupported && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Trình duyệt chưa hỗ trợ Web Serial API</p>
            <p className="mt-0.5">
              Để kết nối trực tiếp với micro:bit qua cáp USB, vui lòng mở ứng dụng này trên trình duyệt <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong> hoặc <strong>Opera</strong> trên máy tính.
            </p>
          </div>
        </div>
      )}

      {/* Connection & Servo State Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Status Card: 4 States */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Radio
              className={`w-5 h-5 ${
                isConnected
                  ? 'text-emerald-600 animate-pulse'
                  : isConnecting
                  ? 'text-amber-500 animate-spin'
                  : isLost
                  ? 'text-rose-600 animate-bounce'
                  : 'text-slate-400'
              }`}
            />
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Trạng thái kết nối micro:bit
              </span>
              <span className={`text-sm font-bold ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">{statusInfo.sub}</p>
            </div>
          </div>
          <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${statusInfo.dot}`} />
        </div>

        {/* Servo Response Tracker */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Phản hồi điều khiển servo
            </span>
            <span className="text-sm font-bold text-slate-900">
              {servoState === 'BUSY' ? (
                <span className="text-blue-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  ĐANG MỞ NẮP (BUSY)
                </span>
              ) : servoState === 'DONE' ? (
                <span className="text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  ĐÃ HOÀN TẤT CHU TRÌNH (DONE)
                </span>
              ) : (
                <span className="text-slate-700">SẴN SÀNG (IDLE)</span>
              )}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chờ nhận chuỗi <code className="font-mono bg-slate-200 px-1 rounded">DONE\n</code> trước khi cho phép lượt tiếp theo
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-500 font-mono">
            Baud: 115200
          </div>
        </div>
      </div>

      {/* Manual Hardware Test Buttons */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-blue-600" />
            Kiểm tra độc lập 3 servo (Gửi lệnh kèm ký tự \n):
          </span>
          <span className="text-[11px] text-slate-500">
            {isConnected ? 'Gửi trực tiếp qua cổng USB' : 'Cần kết nối USB để gửi'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Test Inorganic P0 */}
          <button
            onClick={() => onTestServo('INORGANIC')}
            disabled={!isConnected || servoState === 'BUSY'}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 disabled:opacity-50 text-sky-900 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:cursor-not-allowed text-left"
          >
            <div>
              <div className="font-bold">Kiểm tra servo vô cơ</div>
              <div className="text-[10px] font-normal text-sky-700">Chân P0 • Gửi: INORGANIC\n</div>
            </div>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-sky-200/80">P0</span>
          </button>

          {/* Test Organic P1 */}
          <button
            onClick={() => onTestServo('ORGANIC')}
            disabled={!isConnected || servoState === 'BUSY'}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-900 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:cursor-not-allowed text-left"
          >
            <div>
              <div className="font-bold">Kiểm tra servo hữu cơ</div>
              <div className="text-[10px] font-normal text-emerald-700">Chân P1 • Gửi: ORGANIC\n</div>
            </div>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-emerald-200/80">P1</span>
          </button>

          {/* Test Other P2 */}
          <button
            onClick={() => onTestServo('OTHER')}
            disabled={!isConnected || servoState === 'BUSY'}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-900 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:cursor-not-allowed text-left"
          >
            <div>
              <div className="font-bold">Kiểm tra servo còn lại</div>
              <div className="text-[10px] font-normal text-amber-700">Chân P2 • Gửi: OTHER\n</div>
            </div>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-amber-200/80">P2</span>
          </button>
        </div>
      </div>

      {/* Serial Command Log Terminal */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-600" />
            Nhật ký giao tiếp nối tiếp (Serial Terminal Log):
          </span>
          <button
            onClick={onClearLogs}
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Xóa nhật ký</span>
          </button>
        </div>

        <div
          ref={logContainerRef}
          className="bg-slate-950 text-slate-200 font-mono text-[11px] p-3 rounded-lg h-36 overflow-y-auto space-y-1 border border-slate-800"
        >
          {serialLogs.length === 0 ? (
            <div className="text-slate-500 italic text-center py-6">
              Chưa có dữ liệu nối tiếp. Khi kết nối hoặc gửi lệnh, nhật ký TX / RX sẽ xuất hiện tại đây...
            </div>
          ) : (
            serialLogs.map((log) => {
              let color = 'text-slate-300';
              if (log.type === 'tx') color = 'text-emerald-400 font-semibold';
              if (log.type === 'rx') color = 'text-sky-300 font-semibold';
              if (log.type === 'error') color = 'text-rose-400 font-semibold';
              if (log.type === 'info') color = 'text-slate-400';

              return (
                <div key={log.id} className="leading-tight flex items-start gap-2">
                  <span className="text-slate-600 shrink-0 font-mono">[{log.timestamp}]</span>
                  <span className={color}>{log.text}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

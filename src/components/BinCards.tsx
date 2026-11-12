import React from 'react';
import { Leaf, Recycle, Trash2, Cpu, CheckCircle2, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { BinType, BIN_CONFIGS, BIN_ORDER, BinLidStatus } from '../types/bin';

interface BinCardsProps {
  activeBin: BinType | null;
  binLidStatuses: Record<BinType, BinLidStatus>;
  isSerialConnected: boolean;
}

export const BinCards: React.FC<BinCardsProps> = ({
  activeBin,
  binLidStatuses,
  isSerialConnected,
}) => {
  const getBinIcon = (type: BinType) => {
    switch (type) {
      case 'INORGANIC':
        return <Recycle className="w-6 h-6" />;
      case 'ORGANIC':
        return <Leaf className="w-6 h-6" />;
      case 'OTHER':
        return <Trash2 className="w-6 h-6" />;
    }
  };

  const renderLidStatusBadge = (status: BinLidStatus, isActive: boolean) => {
    switch (status) {
      case 'OPENING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold text-blue-700 bg-blue-100 border border-blue-300 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Đang mở (180°)
          </span>
        );
      case 'CLOSING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold text-amber-700 bg-amber-100 border border-amber-300 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Đang đóng (0°)
          </span>
        );
      case 'DONE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Hoàn tất (DONE)
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold text-rose-700 bg-rose-100 border border-rose-300 animate-bounce">
            <AlertTriangle className="w-3.5 h-3.5" />
            Lỗi (Quá 6s)
          </span>
        );
      case 'CLOSED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200">
            Đóng nắp (0°)
          </span>
        );
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span>Khu vực 3 thùng rác thông minh</span>
          <span className="text-xs font-normal text-slate-500">
            (Điều khiển 3 servo P0, P1, P2 độc lập qua micro:bit)
          </span>
        </h2>
        {activeBin && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 self-start sm:self-auto">
            Nhóm được nhận diện: <strong>{BIN_CONFIGS[activeBin].title} ({BIN_CONFIGS[activeBin].pin})</strong>
          </span>
        )}
      </div>

      {/* 3 Equal Width Cards Grid in requested order: Inorganic (P0), Organic (P1), Other (P2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BIN_ORDER.map((type) => {
          const config = BIN_CONFIGS[type];
          const isActive = activeBin === type;
          const status = binLidStatuses[type] || 'CLOSED';

          return (
            <div
              key={type}
              className={`relative rounded-xl border-2 p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between ${
                config.colorScheme.bgLight
              } ${
                isActive
                  ? `${config.colorScheme.borderActive} ${config.colorScheme.shadowActive} scale-[1.02] bg-white`
                  : `${config.colorScheme.border} opacity-85 hover:opacity-100 hover:border-slate-300`
              }`}
            >
              {/* Active Glow Badge on Top */}
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold shadow-sm ${config.colorScheme.badgeActive}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    ĐÃ CHỌN THÙNG NÀY
                  </span>
                </div>
              )}

              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm ${config.colorScheme.accent}`}
                  >
                    {getBinIcon(type)}
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-900 font-mono text-xs font-black shadow-2xs">
                      {config.pin}
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Lệnh: <span className="font-bold text-slate-800">{config.command}</span>
                    </div>
                  </div>
                </div>

                {/* Title & Subtitle */}
                <h3 className={`text-lg font-black tracking-tight ${config.colorScheme.text}`}>
                  {config.title}
                </h3>
                <p className="text-xs font-semibold text-slate-600 mb-2">
                  {config.subTitle} – Servo {config.pin}
                </p>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  {config.description}
                </p>

                {/* Examples */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {config.examples.map((item) => (
                    <span
                      key={item}
                      className="px-2 py-0.5 rounded text-[11px] bg-white/90 border border-slate-200 text-slate-600 font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer: Servo & Physical Lid Status */}
              <div className="pt-3 border-t border-slate-200/80 mt-auto">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-slate-400" />
                    Trạng thái nắp:
                  </span>

                  <div>
                    {renderLidStatusBadge(status, isActive)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

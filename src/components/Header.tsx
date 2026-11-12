import React from 'react';
import { Cpu, Sparkles, BookOpen } from 'lucide-react';
import { SerialStatus } from '../services/serialManager';

interface HeaderProps {
  onOpenGuide: () => void;
  isModelReady: boolean;
  serialStatus: SerialStatus;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenGuide,
  isModelReady,
  serialStatus,
}) => {
  const getSerialStatusText = () => {
    switch (serialStatus) {
      case 'CONNECTED':
        return 'Đã kết nối USB';
      case 'CONNECTING':
        return 'Đang kết nối...';
      case 'LOST':
        return 'Mất kết nối';
      case 'ERROR':
        return 'Lỗi kết nối';
      case 'DISCONNECTED':
      default:
        return 'Chưa kết nối';
    }
  };

  const getSerialDotClass = () => {
    switch (serialStatus) {
      case 'CONNECTED':
        return 'bg-blue-500 animate-pulse';
      case 'CONNECTING':
        return 'bg-amber-500 animate-pulse';
      case 'LOST':
        return 'bg-rose-500 animate-ping';
      case 'ERROR':
        return 'bg-rose-500';
      case 'DISCONNECTED':
      default:
        return 'bg-slate-300';
    }
  };

  return (
    <header className="border-b border-emerald-100 bg-white/95 backdrop-blur-sm sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand & Titles */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                AI SMART BIN
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                STEM AI
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Thùng rác thông minh phân loại bằng trí tuệ nhân tạo
            </p>
          </div>
        </div>

        {/* Status Indicators & Guide Button */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* AI Status */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-slate-50 border-slate-200 text-slate-700">
            <span
              className={`w-2 h-2 rounded-full ${
                isModelReady ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`}
            />
            <span>AI: {isModelReady ? 'Đã tải mô hình' : 'Chưa tải'}</span>
          </div>

          {/* Hardware Status */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-slate-50 border-slate-200 text-slate-700">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            <span className={`w-2 h-2 rounded-full ${getSerialDotClass()}`} />
            <span>micro:bit: {getSerialStatusText()}</span>
          </div>

          {/* Guide Button */}
          <button
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
            title="Xem hướng dẫn nạp code micro:bit"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
            <span>Mã nguồn micro:bit</span>
          </button>
        </div>
      </div>
    </header>
  );
};

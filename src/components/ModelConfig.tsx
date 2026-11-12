import React, { useState } from 'react';
import {
  Brain,
  CheckCircle2,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { BinType, ClassMappingConfig } from '../types/bin';

interface ModelConfigProps {
  modelUrl: string;
  setModelUrl: (url: string) => void;
  onLoadModel: (url: string) => Promise<void>;
  isLoading: boolean;
  loadStatus: 'idle' | 'loading' | 'success' | 'error';
  errorMessage: string | null;
  detectedClasses: string[];
  classMappings: ClassMappingConfig;
  onUpdateMapping: (className: string, bin: BinType | 'IGNORE') => void;
}

export const ModelConfig: React.FC<ModelConfigProps> = ({
  modelUrl,
  setModelUrl,
  onLoadModel,
  isLoading,
  loadStatus,
  errorMessage,
  detectedClasses,
  classMappings,
  onUpdateMapping,
}) => {
  const [showMappingModal, setShowMappingModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modelUrl.trim()) {
      onLoadModel(modelUrl.trim());
    }
  };

  // Sample working public Teachable Machine models for quick testing
  const sampleModels = [
    {
      title: 'Mô hình phân loại rác AI Smart Bin (Vô cơ/Tái chế & Hữu cơ)',
      url: 'https://teachablemachine.withgoogle.com/models/kHV7yLdnV/',
    },
    {
      title: 'Mô hình chuẩn mở rộng (Organic / Inorganic / Other)',
      url: 'https://teachablemachine.withgoogle.com/models/oW5F2m9U8/',
    },
  ];

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      {/* Title */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Cấu hình mô hình AI</h2>
            <p className="text-xs text-slate-500">
              Nhập liên kết mô hình Teachable Machine Image Model (Google)
            </p>
          </div>
        </div>

        {detectedClasses.length > 0 && (
          <button
            type="button"
            onClick={() => setShowMappingModal(!showMappingModal)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Ánh xạ lớp ({detectedClasses.length})</span>
          </button>
        )}
      </div>

      {/* URL Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="model-url-input"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Teachable Machine Model URL
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                id="model-url-input"
                type="text"
                value={modelUrl}
                onChange={(e) => setModelUrl(e.target.value)}
                placeholder="Dán đường link mô hình tại đây (ví dụ: https://teachablemachine.withgoogle.com/models/G4Kmx8un8/)"
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-50 font-mono text-xs sm:text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !modelUrl.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-semibold transition-colors shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tải mô hình...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Tải mô hình AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Sample Links helper */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-0.5">
          <span className="font-medium text-slate-600">Thử nhanh mẫu:</span>
          {sampleModels.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setModelUrl(sample.url);
                onLoadModel(sample.url);
              }}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-xs border border-slate-200 transition-colors"
            >
              Mẫu {idx + 1}
            </button>
          ))}
          <a
            href="https://teachablemachine.withgoogle.com/train/image"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-700 hover:underline ml-auto"
          >
            <span>Tạo mô hình mới</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </form>

      {/* Status Banner */}
      <div className="mt-3">
        {loadStatus === 'loading' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs sm:text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
            <span>Đang tải model.json và metadata.json từ máy chủ Teachable Machine...</span>
          </div>
        )}

        {loadStatus === 'success' && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tải mô hình AI thành công!</span>
              </div>
              <span className="text-xs px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded font-medium">
                {detectedClasses.length} lớp nhận diện
              </span>
            </div>

            {/* Class Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs font-medium text-emerald-800">Danh sách các lớp:</span>
              {detectedClasses.map((label) => {
                const mapped = classMappings[label];
                let badgeColor = 'bg-slate-100 text-slate-800 border-slate-300';
                if (mapped === 'ORGANIC') badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                if (mapped === 'INORGANIC') badgeColor = 'bg-sky-100 text-sky-800 border-sky-300';
                if (mapped === 'OTHER') badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';

                return (
                  <span
                    key={label}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}
                  >
                    <span>{label}</span>
                    <span className="text-[10px] opacity-75 font-normal">
                      ➔ {mapped === 'ORGANIC' ? 'Hữu cơ' : mapped === 'INORGANIC' ? 'Vô cơ' : mapped === 'OTHER' ? 'Còn lại' : 'Bỏ qua'}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {loadStatus === 'error' && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Tải mô hình thất bại</p>
              <p className="text-xs text-rose-700">{errorMessage || 'Không thể tải model. Vui lòng kiểm tra lại đường link Teachable Machine.'}</p>
              <p className="text-[11px] text-rose-600">
                Gợi ý: Link phải có dạng <code className="font-mono bg-rose-100 px-1 py-0.5 rounded">https://teachablemachine.withgoogle.com/models/XXXXXXXX/</code>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mapping Configuration Panel (Expandable) */}
      {showMappingModal && detectedClasses.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tùy chỉnh ánh xạ tên lớp mô hình ➔ Ngăn rác
              </h3>
              <p className="text-xs text-slate-500">
                Nếu mô hình Teachable Machine của bạn đặt tên lớp khác (ví dụ: &quot;Chai nhựa&quot;, &quot;Vỏ chuối&quot;), hãy chọn ngăn rác tương ứng.
              </p>
            </div>
            <button
              onClick={() => setShowMappingModal(false)}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              Đóng
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {detectedClasses.map((cls) => (
              <div
                key={cls}
                className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 truncate" title={cls}>
                    {cls}
                  </span>
                  <span className="text-[10px] text-slate-400">Tên lớp mô hình</span>
                </div>
                <select
                  value={classMappings[cls] || 'OTHER'}
                  onChange={(e) => onUpdateMapping(cls, e.target.value as BinType | 'IGNORE')}
                  aria-label={`Ánh xạ cho lớp ${cls}`}
                  className="w-full text-xs font-medium px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="INORGANIC">➔ RÁC VÔ CƠ (P0 / INORGANIC)</option>
                  <option value="ORGANIC">➔ RÁC HỮU CƠ (P1 / ORGANIC)</option>
                  <option value="OTHER">➔ TRƯỜNG HỢP CÒN LẠI (P2 / OTHER)</option>
                  <option value="IGNORE">🚫 Bỏ qua lớp này (Không gửi lệnh)</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

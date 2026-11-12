import React, { useState } from 'react';
import { X, Copy, Check, Code, ExternalLink, Cpu } from 'lucide-react';

interface MicrobitGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MicrobitGuideModal: React.FC<MicrobitGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedPython, setCopiedPython] = useState(false);
  const [copiedMakeCode, setCopiedMakeCode] = useState(false);

  if (!isOpen) return null;

  const pythonCode = `# MicroPython cho micro:bit V1/V2 - AI SMART BIN (P0: Vô cơ, P1: Hữu cơ, P2: Còn lại)
from microbit import *

# Khởi tạo cổng Serial baudrate 115200 (USB)
uart.init(baudrate=115200)

display.show(Image.HAPPY)
sleep(500)
display.clear()

def open_servo(pin_index):
    uart.write("BUSY\\n")
    display.show(Image.ARROW_N)
    
    # Góc mở nắp: 180 độ theo yêu cầu (chu kỳ xung ~2.4ms - 2.5ms)
    # Tùy loại servo SG90: 25 = 0 độ, 75 = 90 độ, 125 = 180 độ
    if pin_index == 0:
        pin0.set_analog_period(20)
        pin0.write_analog(125) # Mở nắp P0: RÁC VÔ CƠ 180 độ
    elif pin_index == 1:
        pin1.set_analog_period(20)
        pin1.write_analog(125) # Mở nắp P1: RÁC HỮU CƠ 180 độ
    elif pin_index == 2:
        pin2.set_analog_period(20)
        pin2.write_analog(125) # Mở nắp P2: RÁC CÒN LẠI 180 độ

    # Giữ nắp mở trong 3 giây
    sleep(3000)

    # Đóng nắp về 0 độ
    if pin_index == 0:
        pin0.write_analog(25)
    elif pin_index == 1:
        pin1.write_analog(25)
    elif pin_index == 2:
        pin2.write_analog(25)

    display.show(Image.YES)
    sleep(300)
    display.clear()

    # Báo hoàn tất chu trình cho Web app
    uart.write("DONE\\n")

while True:
    if uart.any():
        cmd = uart.readline()
        if cmd:
            text = str(cmd, 'utf-8').strip().upper()
            if text == "INORGANIC":
                open_servo(0)  # P0: Vô cơ
            elif text == "ORGANIC":
                open_servo(1)  # P1: Hữu cơ
            elif text == "OTHER":
                open_servo(2)  # P2: Còn lại
    sleep(20)
`;

  const makeCodeJS = `// Microsoft MakeCode JavaScript / Blocks cho micro:bit
// Mở https://makecode.microbit.org dán mã này vào tab JavaScript
// Ánh xạ: P0 = INORGANIC (Vô cơ), P1 = ORGANIC (Hữu cơ), P2 = OTHER (Còn lại)

serial.redirect(
    SerialPin.USB_TX,
    SerialPin.USB_RX,
    BaudRate.BaudRate115200
)
basic.showIcon(IconNames.Happy)

function openLid(pinIndex: number) {
    serial.writeString("BUSY\\n")
    basic.showIcon(IconNames.ArrowNorth)
    
    // Mở nắp servo 180 độ
    if (pinIndex == 0) {
        pins.servoWritePin(AnalogPin.P0, 180) // P0: Rác Vô Cơ
    } else if (pinIndex == 1) {
        pins.servoWritePin(AnalogPin.P1, 180) // P1: Rác Hữu Cơ
    } else if (pinIndex == 2) {
        pins.servoWritePin(AnalogPin.P2, 180) // P2: Rác Còn Lại
    }

    // Giữ nắp mở trong 3 giây (3000ms)
    basic.pause(3000)

    // Đóng nắp về 0 độ
    if (pinIndex == 0) {
        pins.servoWritePin(AnalogPin.P0, 0)
    } else if (pinIndex == 1) {
        pins.servoWritePin(AnalogPin.P1, 0)
    } else if (pinIndex == 2) {
        pins.servoWritePin(AnalogPin.P2, 0)
    }

    basic.showIcon(IconNames.Yes)
    basic.pause(300)
    basic.clearScreen()

    // Báo hoàn tất chu trình
    serial.writeString("DONE\\n")
}

serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    let raw = serial.readString().trim()
    if (raw == "INORGANIC") {
        openLid(0) // P0: Rác Vô Cơ
    } else if (raw == "ORGANIC") {
        openLid(1) // P1: Rác Hữu Cơ
    } else if (raw == "OTHER") {
        openLid(2) // P2: Rác Còn Lại
    }
})
`;

  const handleCopyPython = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopiedPython(true);
    setTimeout(() => setCopiedPython(false), 2000);
  };

  const handleCopyMakeCode = () => {
    navigator.clipboard.writeText(makeCodeJS);
    setCopiedMakeCode(true);
    setTimeout(() => setCopiedMakeCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Mã nguồn nạp micro:bit (Firmware)
              </h3>
              <p className="text-xs text-slate-500">
                Baud 115200: P0 (INORGANIC), P1 (ORGANIC), P2 (OTHER) – Mở 180°, giữ 3s, đóng 0°
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Hardware Connection Pinout */}
          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200">
            <h4 className="font-bold text-emerald-950 text-xs uppercase tracking-wider mb-2">
              Sơ đồ đấu nối dây 3 servo (P0, P1, P2)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-sky-300 shadow-2xs">
                <span className="font-black text-sky-800 block text-sm">P0: RÁC VÔ CƠ</span>
                <span className="text-slate-600 text-xs block mt-0.5">Lệnh: <code>INORGANIC</code></span>
                <span className="text-slate-500 text-[11px] block mt-1">Dây tín hiệu cam servo ➔ Pin P0</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-emerald-300 shadow-2xs">
                <span className="font-black text-emerald-800 block text-sm">P1: RÁC HỮU CƠ</span>
                <span className="text-slate-600 text-xs block mt-0.5">Lệnh: <code>ORGANIC</code></span>
                <span className="text-slate-500 text-[11px] block mt-1">Dây tín hiệu cam servo ➔ Pin P1</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-amber-300 shadow-2xs">
                <span className="font-black text-amber-800 block text-sm">P2: RÁC CÒN LẠI</span>
                <span className="text-slate-600 text-xs block mt-0.5">Lệnh: <code>OTHER</code></span>
                <span className="text-slate-500 text-[11px] block mt-1">Dây tín hiệu cam servo ➔ Pin P2</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2.5">
              * Nguồn 3 servo: Dây đỏ nối nguồn 5V ngoài (hoặc 3V pin micro:bit nếu servo nhỏ), dây nâu nối chung Mass GND với micro:bit.
            </p>
          </div>

          {/* MakeCode Code Block */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <Code className="w-4 h-4 text-emerald-600" />
                <span>Cách 1: Microsoft MakeCode (Blocks / JavaScript - Khuyên dùng)</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://makecode.microbit.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>Mở MakeCode</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={handleCopyMakeCode}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-300 transition-colors cursor-pointer"
                >
                  {copiedMakeCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <pre className="bg-slate-950 text-slate-200 p-3.5 rounded-xl font-mono text-xs overflow-x-auto max-h-52 border border-slate-800">
              {makeCodeJS}
            </pre>
          </div>

          {/* MicroPython Code Block */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <Code className="w-4 h-4 text-emerald-600" />
                <span>Cách 2: Python (MicroPython)</span>
              </div>
              <button
                onClick={handleCopyPython}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-300 transition-colors cursor-pointer"
              >
                {copiedPython ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-slate-950 text-slate-200 p-3.5 rounded-xl font-mono text-xs overflow-x-auto max-h-52 border border-slate-800">
              {pythonCode}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};

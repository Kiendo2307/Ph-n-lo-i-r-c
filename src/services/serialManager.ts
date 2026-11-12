import { SerialPort, SerialConnectionEvent } from '../types/serial';
import { BinType, SerialLogEntry, ServoState } from '../types/bin';

export type SerialStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'LOST' | 'ERROR';

export interface SerialManagerListeners {
  onStatusChange?: (status: SerialStatus, error?: string) => void;
  onLog?: (entry: SerialLogEntry) => void;
  onServoStateChange?: (state: ServoState, bin?: BinType) => void;
}

export class SerialManager {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private status: SerialStatus = 'DISCONNECTED';
  private keepReading = false;
  private listeners: SerialManagerListeners = {};
  private currentActiveBin: BinType | null = null;
  private servoState: ServoState = 'IDLE';
  private lineBuffer = '';
  private isPermissionsPolicyBlocked = false;
  private disconnectListener: ((event: SerialConnectionEvent) => void) | null = null;

  constructor(listeners: SerialManagerListeners = {}) {
    this.listeners = listeners;
    this.setupGlobalDisconnectListener();
  }

  public setListeners(listeners: SerialManagerListeners) {
    this.listeners = listeners;
  }

  /**
   * Check if browser supports Web Serial API
   */
  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator && !!navigator.serial;
  }

  /**
   * Check if running in an embedded iframe (like Google AI Studio preview)
   */
  public isInsideIframe(): boolean {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      return true;
    }
  }

  /**
   * Check if permissions policy explicitly disallows serial
   */
  public isSerialAllowedByPolicy(): boolean {
    if (typeof document === 'undefined') return true;
    try {
      if (document.permissionsPolicy?.allowsFeature) {
        return document.permissionsPolicy.allowsFeature('serial');
      }
      if (document.featurePolicy?.allowsFeature) {
        return document.featurePolicy.allowsFeature('serial');
      }
    } catch {
      // Fallback
    }
    return true;
  }

  public getIsPermissionsPolicyBlocked(): boolean {
    return this.isPermissionsPolicyBlocked;
  }

  public getStatus(): SerialStatus {
    return this.status;
  }

  public getServoState(): ServoState {
    return this.servoState;
  }

  public getCurrentActiveBin(): BinType | null {
    return this.currentActiveBin;
  }

  public log(type: SerialLogEntry['type'], text: string) {
    this.addLog(type, text);
  }

  private addLog(type: SerialLogEntry['type'], text: string) {
    const entry: SerialLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
      type,
      text,
    };
    this.listeners.onLog?.(entry);
  }

  private setStatus(status: SerialStatus, error?: string) {
    this.status = status;
    this.listeners.onStatusChange?.(status, error);
  }

  private setServoState(state: ServoState, bin?: BinType) {
    this.servoState = state;
    if (bin !== undefined) {
      this.currentActiveBin = bin;
    }
    this.listeners.onServoStateChange?.(state, this.currentActiveBin || undefined);
  }

  /**
   * Listen to hardware USB disconnect events
   */
  private setupGlobalDisconnectListener() {
    if (typeof navigator !== 'undefined' && navigator.serial?.addEventListener) {
      this.disconnectListener = (event: SerialConnectionEvent) => {
        if (this.port && (event.port === this.port || !event.port)) {
          this.handleUnexpectedDisconnect('Thiết bị micro:bit đã bị rút cáp USB.');
        }
      };
      navigator.serial.addEventListener('disconnect', this.disconnectListener);
    }
  }

  /**
   * Handle unexpected device removal (cable unplugged)
   */
  private handleUnexpectedDisconnect(reason: string) {
    this.keepReading = false;
    this.cleanupReader();
    this.port = null;
    this.setStatus('LOST', reason);
    this.setServoState('IDLE');
    this.currentActiveBin = null;
    this.addLog('error', `❌ MẤT KẾT NỐI: ${reason}`);
  }

  /**
   * Clean up open reader safely without locking the port
   */
  private async cleanupReader() {
    if (this.reader) {
      try {
        await this.reader.cancel().catch(() => {});
        this.reader.releaseLock();
      } catch {
        // ignore
      }
      this.reader = null;
    }
  }

  /**
   * Connect to micro:bit via Web Serial USB
   */
  public async connect(): Promise<boolean> {
    // 1. Check browser support
    if (!this.isSupported()) {
      const err = 'Trình duyệt không hỗ trợ Web Serial API. Vui lòng mở bằng Google Chrome hoặc Microsoft Edge.';
      this.setStatus('ERROR', err);
      this.addLog('error', err);
      return false;
    }

    try {
      this.setStatus('CONNECTING');
      this.addLog('info', 'Đang mở hộp thoại chọn cổng USB micro:bit...');

      // 2. Request port directly on user action
      this.port = await navigator.serial!.requestPort();

      // 3. Open port with 115200 baud
      await this.port.open({ baudRate: 115200 });

      this.isPermissionsPolicyBlocked = false;
      this.lineBuffer = '';
      this.setStatus('CONNECTED');
      this.addLog('info', '✓ Đã kết nối micro:bit thành công qua cổng USB (Baud rate: 115200)!');

      // 4. Start continuous reading loop immediately after opening port
      this.keepReading = true;
      this.startReadingLoop();

      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      // Check specifically for permissions policy error inside iframes
      if (
        errorMsg.toLowerCase().includes('permissions policy') ||
        errorMsg.toLowerCase().includes('disallowed by permissions policy') ||
        errorMsg.toLowerCase().includes('securityerror')
      ) {
        this.isPermissionsPolicyBlocked = true;
        const policyErr = 'Quyền "serial" bị chặn bởi Permissions Policy trong khung nhúng (iframe) của Google AI Studio.';
        this.setStatus('ERROR', policyErr);
        this.addLog(
          'error',
          '⚠️ Lỗi Permissions Policy: Trình duyệt chặn cổng Serial trong khung nhúng iframe. Vui lòng nhấn "Mở ứng dụng ở tab độc lập" để kết nối USB trực tiếp!'
        );
        return false;
      }

      // Check if user cancelled the USB prompt
      if (
        errorMsg.includes('No port selected') ||
        errorMsg.includes('cancelled') ||
        errorMsg.includes('canceled')
      ) {
        this.setStatus('DISCONNECTED');
        this.addLog('info', 'Người dùng đã hủy chọn cổng USB.');
        return false;
      }

      // Other hardware or port busy errors
      this.setStatus('ERROR', `Lỗi kết nối: ${errorMsg}`);
      this.addLog('error', `Lỗi kết nối USB: ${errorMsg}`);
      return false;
    }
  }

  /**
   * Disconnect from micro:bit cleanly
   */
  public async disconnect(): Promise<void> {
    this.keepReading = false;

    try {
      await this.cleanupReader();

      if (this.port) {
        await this.port.close().catch(() => {});
        this.port = null;
      }

      this.setStatus('DISCONNECTED');
      this.setServoState('IDLE');
      this.currentActiveBin = null;
      this.lineBuffer = '';
      this.addLog('info', 'Đã ngắt kết nối micro:bit an toàn.');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.addLog('error', `Lỗi khi đóng cổng: ${errorMsg}`);
      this.setStatus('DISCONNECTED');
    }
  }

  /**
   * Send command to micro:bit with \n termination
   */
  public async sendCommand(command: string, targetBin?: BinType): Promise<boolean> {
    if (this.status !== 'CONNECTED' || !this.port) {
      this.addLog('error', `Không thể gửi "${command}": Chưa kết nối micro:bit!`);
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const cleanCmd = command.trim();
      // Ensure newline \n is always appended
      const payload = cleanCmd + '\n';
      const data = encoder.encode(payload);

      if (!this.port.writable) {
        throw new Error('Cổng không có quyền ghi (writable stream null)');
      }

      const writer = this.port.writable.getWriter();
      await writer.write(data);
      writer.releaseLock();

      // Log format: [SERIAL TX] COMMAND
      this.addLog('tx', `[SERIAL TX] ${cleanCmd}`);
      if (targetBin) {
        this.currentActiveBin = targetBin;
      }
      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (
        errorMsg.includes('device has been lost') ||
        errorMsg.includes('disconnected') ||
        errorMsg.includes('NetworkError')
      ) {
        this.handleUnexpectedDisconnect('Mất kết nối khi đang gửi lệnh (Cáp USB bị rút).');
      } else {
        this.addLog('error', `Lỗi gửi lệnh "${command.trim()}": ${errorMsg}`);
      }
      return false;
    }
  }

  /**
   * Continuously read data from micro:bit throughout the connection
   * Creates exactly one reader for the stream and maintains reading.
   */
  private async startReadingLoop() {
    if (!this.port || !this.port.readable) {
      return;
    }

    // Prevent creating multiple readers if one is already active
    if (this.reader) {
      return;
    }

    const textDecoder = new TextDecoder();
    this.keepReading = true;

    try {
      this.reader = this.port.readable.getReader();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.addLog('error', `Không thể tạo luồng đọc (getReader): ${msg}`);
      return;
    }

    try {
      while (this.keepReading && this.port && this.reader) {
        try {
          const { value, done } = await this.reader.read();
          if (done) {
            // Stream was closed by the host or device
            break;
          }
          if (value && value.length > 0) {
            const chunk = textDecoder.decode(value, { stream: true });
            this.handleIncomingChunk(chunk);
          }
        } catch (readErr: unknown) {
          if (!this.keepReading) break;
          const msg = readErr instanceof Error ? readErr.message : String(readErr);

          // Detect device unplugged
          if (
            msg.includes('device has been lost') ||
            msg.includes('disconnected') ||
            msg.includes('NetworkError')
          ) {
            this.handleUnexpectedDisconnect('Mất kết nối với micro:bit (Đã rút cáp USB).');
            break;
          }

          // Non-fatal read warning (e.g. transient noise)
          this.addLog('info', `Cảnh báo luồng đọc Serial: ${msg}`);
        }
      }
    } finally {
      // Release lock cleanly when loop exits
      if (this.reader) {
        try {
          this.reader.releaseLock();
        } catch {
          // ignore
        }
        this.reader = null;
      }
    }
  }

  /**
   * Parse incoming micro:bit responses with full chunk accumulation,
   * handling \r\n, \n, and \r, with immediate recognition of BUSY and DONE.
   */
  private handleIncomingChunk(chunk: string) {
    if (!chunk) return;

    // Normalize all carriage returns to \n
    const normalized = chunk.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    this.lineBuffer += normalized;

    // If buffer contains complete lines terminated with \n
    if (this.lineBuffer.includes('\n')) {
      const parts = this.lineBuffer.split('\n');
      // The last element is the remaining incomplete line fragment
      this.lineBuffer = parts.pop() || '';

      for (const rawLine of parts) {
        const line = rawLine.trim();
        if (!line) continue;
        this.processLine(line);
      }
    }

    // Fallback: If sender sent BUSY or DONE without trailing \n
    const trimmed = this.lineBuffer.trim().toUpperCase();
    if (trimmed === 'DONE' || trimmed === 'BUSY') {
      this.processLine(this.lineBuffer.trim());
      this.lineBuffer = '';
    }
  }

  /**
   * Process a single received line from micro:bit
   */
  private processLine(line: string) {
    // 1. Log every received raw line: [SERIAL RX] DATA
    this.addLog('rx', `[SERIAL RX] ${line}`);

    const upper = line.toUpperCase();

    // 2. Handle BUSY
    if (upper === 'BUSY' || upper.includes('BUSY')) {
      this.setServoState('BUSY');
      this.addLog('info', 'Micro:bit đang điều khiển servo');
    }

    // 3. Handle DONE
    else if (upper === 'DONE' || upper.includes('DONE')) {
      this.setServoState('DONE');
      this.addLog('info', 'Micro:bit đã hoàn tất');
    }
  }

  public resetServoState() {
    this.setServoState('IDLE');
    this.currentActiveBin = null;
  }

  public destroy() {
    this.keepReading = false;
    if (this.disconnectListener && typeof navigator !== 'undefined' && navigator.serial?.removeEventListener) {
      navigator.serial.removeEventListener('disconnect', this.disconnectListener);
    }
  }
}

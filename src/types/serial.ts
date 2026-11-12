// Web Serial API types declaration
export interface SerialPortFilter {
  usbVendorId?: number;
  usbProductId?: number;
}

export interface SerialPortRequestOptions {
  filters?: SerialPortFilter[];
}

export interface SerialOptions {
  baudRate: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
  bufferSize?: number;
  flowControl?: 'none' | 'hardware';
}

export interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

export interface SerialPort {
  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  getInfo(): SerialPortInfo;
  addEventListener(type: 'disconnect', listener: (event: Event) => void): void;
  removeEventListener(type: 'disconnect', listener: (event: Event) => void): void;
}

export interface SerialConnectionEvent extends Event {
  port: SerialPort;
}

declare global {
  interface Navigator {
    serial?: {
      requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
      getPorts(): Promise<SerialPort[]>;
      addEventListener(
        type: 'connect' | 'disconnect',
        listener: (event: SerialConnectionEvent) => void
      ): void;
      removeEventListener(
        type: 'connect' | 'disconnect',
        listener: (event: SerialConnectionEvent) => void
      ): void;
    };
  }

  interface Document {
    permissionsPolicy?: {
      allowsFeature(feature: string): boolean;
    };
    featurePolicy?: {
      allowsFeature(feature: string): boolean;
    };
  }
}

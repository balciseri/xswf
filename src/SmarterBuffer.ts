import { SmartBuffer, SmartBufferOptions } from 'smart-buffer';
import { IRect } from './Types';

export default class SmarterBuffer extends SmartBuffer {
  public static fromBuffer(buff: Buffer, encoding?: BufferEncoding): SmarterBuffer {
    return new this({ buff, encoding });
  }

  private lastByteCache: number;
  private lastByteCacheOffset: number;
  private lastByteCacheBitOffset: number;

  constructor(options?: SmartBufferOptions) {
    super(options);
  }

  public readRect(): IRect {
    const nBits: number = this.readUBits(5);
    const xMin: number = this.readBits(nBits);
    const xMax: number = this.readBits(nBits);
    const yMin: number = this.readBits(nBits);
    const yMax: number = this.readBits(nBits);
    return { nBits, xMin, xMax, yMin, yMax };
  }

  public readFixed(size: 16 | 32 = 32): number {
    let before: number;
    let after: number;

    switch (size) {
      case 16:
        after = this.readUInt8();
        before = this.readUInt8();
        return before + (after / 256);
      case 32:
      default:
        after = this.readUInt16LE();
        before = this.readUInt16LE();
        return before + (after / 65536);
    }
  }

  public readUBits(n: number): number {
    let r = 0;
    while (n > 0) {
      if (this.lastByteCache == null || this.lastByteCacheBitOffset === 8 ||
          this.lastByteCacheOffset < this.readOffset - 1) {
        this.lastByteCacheOffset = this.readOffset;
        this.lastByteCache = this.readUInt8();
        this.lastByteCacheBitOffset = 0;
      }
      const bitsInCache = 8 - this.lastByteCacheBitOffset;
      const x = Math.min(bitsInCache, n);
      r = (r << x) | ((this.lastByteCache >> (bitsInCache - x)) & (Math.pow(2, x) - 1));
      this.lastByteCacheBitOffset += x;
      n -= x;
    }
    return r;
  }

  public readBits(n: number): number {
    let value = this.readUBits(n);
    const sign = (value >> (n - 1)) & 0x1;
    if (sign === 1) {
      value = value | (0xffffffff << n);
    }
    return value;
  }

/*   public readEncodedU32(pos: any): number {
    let result: number = pos[0];
    if (!(result & 0x00000080)) {
      pos++;
      return result;
    }
    result = (result & 0x0000007f) | pos[1] << 7;
    if (!(result & 0x00004000)) {
      pos += 2;
      return result;
    }
    result = (result & 0x00003fff) | pos[2] << 14;
    if (!(result & 0x00200000)) {
      pos += 3;
      return result;
    }
    result = (result & 0x001fffff) | pos[3] << 21;
    if (!(result & 0x10000000)) {
      pos += 4;
      return result;
    }
    result = (result & 0x0fffffff) | pos[4] << 28;
    pos += 5;
    return result;
  } */
}

import { Transform } from 'node:stream';

export function createLineTransformer(onLine: (line: string) => void): Transform {
  let buffer = '';

  return new Transform({
    transform(chunk: Buffer, encoding, callback) {
      const text = chunk.toString();
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        if (char === '\n') {
          if (buffer.trim()) {
            onLine(buffer);
          }
          buffer = '';
        } else if (char === '\r') {
          if (buffer.trim()) {
            onLine(buffer);
          }
          buffer = '';
        } else {
          buffer += char;
        }
      }
      
      callback();
    },

    flush(callback) {
      if (buffer.trim()) {
        onLine(buffer);
      }
      callback();
    }
  });
}
// Minimal event emitter (mitt-style), ported from nine-ca's emitter usage.
const handlers = new Map();

const emitter = {
  on(type, handler) {
    if (!handlers.has(type)) handlers.set(type, new Set());
    handlers.get(type).add(handler);
    return () => emitter.off(type, handler);
  },
  off(type, handler) {
    handlers.get(type)?.delete(handler);
  },
  emit(type, payload) {
    handlers.get(type)?.forEach((handler) => handler(payload));
  },
};

export default emitter;

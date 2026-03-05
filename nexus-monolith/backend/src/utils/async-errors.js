/**
 * Manual implementation of express-async-errors
 * Patches Express Layer to automatically catch errors in async handlers
 */
const Layer = require('express/lib/router/layer');

Object.defineProperty(Layer.prototype, "handle", {
  enumerable: true,
  get: function() { return this.__handle; },
  set: function(fn) {
    if (fn) {
        fn = wrap(fn);
    }
    this.__handle = fn;
  }
});

function wrap(fn) {
  const newFn = function(req, res, next) {
      if (next === undefined && req !== undefined && res !== undefined) {
         // This is a normal middleware/route handler: (req, res, next)
         // But wait, express calls it with (req, res, next) or (err, req, res, next)
         // We only want to patch standard handlers, error handlers are different.
      }
      
      try {
          // Verify if it returns a promise
          const ret = fn.apply(this, arguments);
          if (ret && ret.catch && typeof ret.catch === 'function') {
            return ret.catch(err => {
                // If the function signature has 3 args (req, res, next), the last one is next
                const next = arguments[arguments.length - 1];
                if (typeof next === 'function') next(err);
            });
          }
          return ret;
      } catch (err) {
          const next = arguments[arguments.length - 1];
          if (typeof next === 'function') next(err);
      }
  };
  
  // Copy properties like .length to preserve arity logic in Express
  Object.defineProperty(newFn, 'length', { value: fn.length });
  
  return newFn;
}

console.log('✅ Express Async Errors Patched (Local)');

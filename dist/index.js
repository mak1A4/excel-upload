// node_modules/.pnpm/component-register@0.8.7/node_modules/component-register/dist/component-register.js
function cloneProps(props) {
  const propKeys = Object.keys(props);
  return propKeys.reduce((memo2, k) => {
    const prop = props[k];
    memo2[k] = Object.assign({}, prop);
    if (isObject(prop.value) && !isFunction(prop.value) && !Array.isArray(prop.value)) memo2[k].value = Object.assign({}, prop.value);
    if (Array.isArray(prop.value)) memo2[k].value = prop.value.slice(0);
    return memo2;
  }, {});
}
function normalizePropDefs(props) {
  if (!props) return {};
  const propKeys = Object.keys(props);
  return propKeys.reduce((memo2, k) => {
    const v = props[k];
    memo2[k] = !(isObject(v) && "value" in v) ? {
      value: v
    } : v;
    memo2[k].attribute || (memo2[k].attribute = toAttribute(k));
    memo2[k].parse = "parse" in memo2[k] ? memo2[k].parse : typeof memo2[k].value !== "string";
    return memo2;
  }, {});
}
function propValues(props) {
  const propKeys = Object.keys(props);
  return propKeys.reduce((memo2, k) => {
    memo2[k] = props[k].value;
    return memo2;
  }, {});
}
function initializeProps(element, propDefinition) {
  const props = cloneProps(propDefinition), propKeys = Object.keys(propDefinition);
  propKeys.forEach((key) => {
    const prop = props[key], attr = element.getAttribute(prop.attribute), value = element[key];
    if (attr != null) prop.value = prop.parse ? parseAttributeValue(attr) : attr;
    if (value != null) prop.value = Array.isArray(value) ? value.slice(0) : value;
    prop.reflect && reflect(element, prop.attribute, prop.value, !!prop.parse);
    Object.defineProperty(element, key, {
      get() {
        return prop.value;
      },
      set(val) {
        const oldValue = prop.value;
        prop.value = val;
        prop.reflect && reflect(this, prop.attribute, prop.value, !!prop.parse);
        for (let i = 0, l = this.__propertyChangedCallbacks.length; i < l; i++) {
          this.__propertyChangedCallbacks[i](key, val, oldValue);
        }
      },
      enumerable: true,
      configurable: true
    });
  });
  return props;
}
function parseAttributeValue(value) {
  if (!value) return;
  try {
    return JSON.parse(value);
  } catch (err) {
    return value;
  }
}
function reflect(node, attribute, value, parse) {
  if (value == null || value === false) return node.removeAttribute(attribute);
  let reflect2 = parse ? JSON.stringify(value) : value;
  node.__updating[attribute] = true;
  if (reflect2 === "true") reflect2 = "";
  node.setAttribute(attribute, reflect2);
  Promise.resolve().then(() => delete node.__updating[attribute]);
}
function toAttribute(propName) {
  return propName.replace(/\.?([A-Z]+)/g, (x, y) => "-" + y.toLowerCase()).replace("_", "-").replace(/^-/, "");
}
function isObject(obj) {
  return obj != null && (typeof obj === "object" || typeof obj === "function");
}
function isFunction(val) {
  return Object.prototype.toString.call(val) === "[object Function]";
}
function isConstructor(f) {
  return typeof f === "function" && f.toString().indexOf("class") === 0;
}
var currentElement;
function createElementType(BaseElement, propDefinition) {
  const propKeys = Object.keys(propDefinition);
  return class CustomElement extends BaseElement {
    static get observedAttributes() {
      return propKeys.map((k) => propDefinition[k].attribute);
    }
    constructor() {
      super();
      this.__initialized = false;
      this.__released = false;
      this.__releaseCallbacks = [];
      this.__propertyChangedCallbacks = [];
      this.__updating = {};
      this.props = {};
    }
    connectedCallback() {
      if (this.__initialized) return;
      this.__releaseCallbacks = [];
      this.__propertyChangedCallbacks = [];
      this.__updating = {};
      this.props = initializeProps(this, propDefinition);
      const props = propValues(this.props), ComponentType = this.Component, outerElement = currentElement;
      try {
        currentElement = this;
        this.__initialized = true;
        if (isConstructor(ComponentType)) new ComponentType(props, {
          element: this
        });
        else ComponentType(props, {
          element: this
        });
      } finally {
        currentElement = outerElement;
      }
    }
    async disconnectedCallback() {
      await Promise.resolve();
      if (this.isConnected) return;
      this.__propertyChangedCallbacks.length = 0;
      let callback = null;
      while (callback = this.__releaseCallbacks.pop()) callback(this);
      delete this.__initialized;
      this.__released = true;
    }
    attributeChangedCallback(name, oldVal, newVal) {
      if (!this.__initialized) return;
      if (this.__updating[name]) return;
      name = this.lookupProp(name);
      if (name in propDefinition) {
        if (newVal == null && !this[name]) return;
        this[name] = propDefinition[name].parse ? parseAttributeValue(newVal) : newVal;
      }
    }
    lookupProp(attrName) {
      if (!propDefinition) return;
      return propKeys.find((k) => attrName === k || attrName === propDefinition[k].attribute);
    }
    get renderRoot() {
      return this.shadowRoot || this.attachShadow({
        mode: "open"
      });
    }
    addReleaseCallback(fn) {
      this.__releaseCallbacks.push(fn);
    }
    addPropertyChangedCallback(fn) {
      this.__propertyChangedCallbacks.push(fn);
    }
  };
}
var EC = Symbol("element-context");
function register(tag, props = {}, options = {}) {
  const {
    BaseElement = HTMLElement,
    extension,
    customElements = window.customElements
  } = options;
  return (ComponentType) => {
    if (!tag) throw new Error("tag is required to register a Component");
    let ElementType = customElements.get(tag);
    if (ElementType) {
      ElementType.prototype.Component = ComponentType;
      return ElementType;
    }
    ElementType = createElementType(BaseElement, normalizePropDefs(props));
    ElementType.prototype.Component = ComponentType;
    ElementType.prototype.registeredTag = tag;
    customElements.define(tag, ElementType, extension);
    return ElementType;
  };
}

// node_modules/.pnpm/solid-js@1.9.6/node_modules/solid-js/dist/solid.js
var sharedConfig = {
  context: void 0,
  registry: void 0,
  effects: void 0,
  done: false,
  getContextId() {
    return getContextId(this.context.count);
  },
  getNextContextId() {
    return getContextId(this.context.count++);
  }
};
function getContextId(count) {
  const num = String(count), len = num.length - 1;
  return sharedConfig.context.id + (len ? String.fromCharCode(96 + len) : "") + num;
}
function setHydrateContext(context) {
  sharedConfig.context = context;
}
function nextHydrateContext() {
  return {
    ...sharedConfig.context,
    id: sharedConfig.getNextContextId(),
    count: 0
  };
}
var IS_DEV = false;
var equalFn = (a, b) => a === b;
var $PROXY = Symbol("solid-proxy");
var SUPPORTS_PROXY = typeof Proxy === "function";
var $TRACK = Symbol("solid-track");
var $DEVCOMP = Symbol("solid-dev-component");
var signalOptions = {
  equals: equalFn
};
var ERROR = null;
var runEffects = runQueue;
var STALE = 1;
var PENDING = 2;
var UNOWNED = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
var Owner = null;
var Transition = null;
var Scheduler = null;
var ExternalSourceConfig = null;
var Listener = null;
var Updates = null;
var Effects = null;
var ExecCount = 0;
function createRoot(fn, detachedOwner) {
  const listener = Listener, owner = Owner, unowned = fn.length === 0, current = detachedOwner === void 0 ? owner : detachedOwner, root = unowned ? UNOWNED : {
    owned: null,
    cleanups: null,
    context: current ? current.context : null,
    owner: current
  }, updateFn = unowned ? fn : () => fn(() => untrack(() => cleanNode(root)));
  Owner = root;
  Listener = null;
  try {
    return runUpdates(updateFn, true);
  } finally {
    Listener = listener;
    Owner = owner;
  }
}
function createSignal(value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const s = {
    value,
    observers: null,
    observerSlots: null,
    comparator: options.equals || void 0
  };
  const setter = (value2) => {
    if (typeof value2 === "function") {
      if (Transition && Transition.running && Transition.sources.has(s)) value2 = value2(s.tValue);
      else value2 = value2(s.value);
    }
    return writeSignal(s, value2);
  };
  return [readSignal.bind(s), setter];
}
function createRenderEffect(fn, value, options) {
  const c = createComputation(fn, value, false, STALE);
  if (Scheduler && Transition && Transition.running) Updates.push(c);
  else updateComputation(c);
}
function createEffect(fn, value, options) {
  runEffects = runUserEffects;
  const c = createComputation(fn, value, false, STALE), s = SuspenseContext && useContext(SuspenseContext);
  if (s) c.suspense = s;
  if (!options || !options.render) c.user = true;
  Effects ? Effects.push(c) : updateComputation(c);
}
function createMemo(fn, value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const c = createComputation(fn, value, true, 0);
  c.observers = null;
  c.observerSlots = null;
  c.comparator = options.equals || void 0;
  if (Scheduler && Transition && Transition.running) {
    c.tState = STALE;
    Updates.push(c);
  } else updateComputation(c);
  return readSignal.bind(c);
}
function untrack(fn) {
  if (!ExternalSourceConfig && Listener === null) return fn();
  const listener = Listener;
  Listener = null;
  try {
    if (ExternalSourceConfig) return ExternalSourceConfig.untrack(fn);
    return fn();
  } finally {
    Listener = listener;
  }
}
function onMount(fn) {
  createEffect(() => untrack(fn));
}
function onCleanup(fn) {
  if (Owner === null) ;
  else if (Owner.cleanups === null) Owner.cleanups = [fn];
  else Owner.cleanups.push(fn);
  return fn;
}
function startTransition(fn) {
  if (Transition && Transition.running) {
    fn();
    return Transition.done;
  }
  const l = Listener;
  const o = Owner;
  return Promise.resolve().then(() => {
    Listener = l;
    Owner = o;
    let t;
    if (Scheduler || SuspenseContext) {
      t = Transition || (Transition = {
        sources: /* @__PURE__ */ new Set(),
        effects: [],
        promises: /* @__PURE__ */ new Set(),
        disposed: /* @__PURE__ */ new Set(),
        queue: /* @__PURE__ */ new Set(),
        running: true
      });
      t.done || (t.done = new Promise((res) => t.resolve = res));
      t.running = true;
    }
    runUpdates(fn, false);
    Listener = Owner = null;
    return t ? t.done : void 0;
  });
}
var [transPending, setTransPending] = /* @__PURE__ */ createSignal(false);
function useContext(context) {
  let value;
  return Owner && Owner.context && (value = Owner.context[context.id]) !== void 0 ? value : context.defaultValue;
}
var SuspenseContext;
function readSignal() {
  const runningTransition = Transition && Transition.running;
  if (this.sources && (runningTransition ? this.tState : this.state)) {
    if ((runningTransition ? this.tState : this.state) === STALE) updateComputation(this);
    else {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(this), false);
      Updates = updates;
    }
  }
  if (Listener) {
    const sSlot = this.observers ? this.observers.length : 0;
    if (!Listener.sources) {
      Listener.sources = [this];
      Listener.sourceSlots = [sSlot];
    } else {
      Listener.sources.push(this);
      Listener.sourceSlots.push(sSlot);
    }
    if (!this.observers) {
      this.observers = [Listener];
      this.observerSlots = [Listener.sources.length - 1];
    } else {
      this.observers.push(Listener);
      this.observerSlots.push(Listener.sources.length - 1);
    }
  }
  if (runningTransition && Transition.sources.has(this)) return this.tValue;
  return this.value;
}
function writeSignal(node, value, isComp) {
  let current = Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value;
  if (!node.comparator || !node.comparator(current, value)) {
    if (Transition) {
      const TransitionRunning = Transition.running;
      if (TransitionRunning || !isComp && Transition.sources.has(node)) {
        Transition.sources.add(node);
        node.tValue = value;
      }
      if (!TransitionRunning) node.value = value;
    } else node.value = value;
    if (node.observers && node.observers.length) {
      runUpdates(() => {
        for (let i = 0; i < node.observers.length; i += 1) {
          const o = node.observers[i];
          const TransitionRunning = Transition && Transition.running;
          if (TransitionRunning && Transition.disposed.has(o)) continue;
          if (TransitionRunning ? !o.tState : !o.state) {
            if (o.pure) Updates.push(o);
            else Effects.push(o);
            if (o.observers) markDownstream(o);
          }
          if (!TransitionRunning) o.state = STALE;
          else o.tState = STALE;
        }
        if (Updates.length > 1e6) {
          Updates = [];
          if (IS_DEV) ;
          throw new Error();
        }
      }, false);
    }
  }
  return value;
}
function updateComputation(node) {
  if (!node.fn) return;
  cleanNode(node);
  const time = ExecCount;
  runComputation(
    node,
    Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value,
    time
  );
  if (Transition && !Transition.running && Transition.sources.has(node)) {
    queueMicrotask(() => {
      runUpdates(() => {
        Transition && (Transition.running = true);
        Listener = Owner = node;
        runComputation(node, node.tValue, time);
        Listener = Owner = null;
      }, false);
    });
  }
}
function runComputation(node, value, time) {
  let nextValue;
  const owner = Owner, listener = Listener;
  Listener = Owner = node;
  try {
    nextValue = node.fn(value);
  } catch (err) {
    if (node.pure) {
      if (Transition && Transition.running) {
        node.tState = STALE;
        node.tOwned && node.tOwned.forEach(cleanNode);
        node.tOwned = void 0;
      } else {
        node.state = STALE;
        node.owned && node.owned.forEach(cleanNode);
        node.owned = null;
      }
    }
    node.updatedAt = time + 1;
    return handleError(err);
  } finally {
    Listener = listener;
    Owner = owner;
  }
  if (!node.updatedAt || node.updatedAt <= time) {
    if (node.updatedAt != null && "observers" in node) {
      writeSignal(node, nextValue, true);
    } else if (Transition && Transition.running && node.pure) {
      Transition.sources.add(node);
      node.tValue = nextValue;
    } else node.value = nextValue;
    node.updatedAt = time;
  }
}
function createComputation(fn, init, pure, state = STALE, options) {
  const c = {
    fn,
    state,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: init,
    owner: Owner,
    context: Owner ? Owner.context : null,
    pure
  };
  if (Transition && Transition.running) {
    c.state = 0;
    c.tState = state;
  }
  if (Owner === null) ;
  else if (Owner !== UNOWNED) {
    if (Transition && Transition.running && Owner.pure) {
      if (!Owner.tOwned) Owner.tOwned = [c];
      else Owner.tOwned.push(c);
    } else {
      if (!Owner.owned) Owner.owned = [c];
      else Owner.owned.push(c);
    }
  }
  if (ExternalSourceConfig && c.fn) {
    const [track, trigger] = createSignal(void 0, {
      equals: false
    });
    const ordinary = ExternalSourceConfig.factory(c.fn, trigger);
    onCleanup(() => ordinary.dispose());
    const triggerInTransition = () => startTransition(trigger).then(() => inTransition.dispose());
    const inTransition = ExternalSourceConfig.factory(c.fn, triggerInTransition);
    c.fn = (x) => {
      track();
      return Transition && Transition.running ? inTransition.track(x) : ordinary.track(x);
    };
  }
  return c;
}
function runTop(node) {
  const runningTransition = Transition && Transition.running;
  if ((runningTransition ? node.tState : node.state) === 0) return;
  if ((runningTransition ? node.tState : node.state) === PENDING) return lookUpstream(node);
  if (node.suspense && untrack(node.suspense.inFallback)) return node.suspense.effects.push(node);
  const ancestors = [node];
  while ((node = node.owner) && (!node.updatedAt || node.updatedAt < ExecCount)) {
    if (runningTransition && Transition.disposed.has(node)) return;
    if (runningTransition ? node.tState : node.state) ancestors.push(node);
  }
  for (let i = ancestors.length - 1; i >= 0; i--) {
    node = ancestors[i];
    if (runningTransition) {
      let top = node, prev = ancestors[i + 1];
      while ((top = top.owner) && top !== prev) {
        if (Transition.disposed.has(top)) return;
      }
    }
    if ((runningTransition ? node.tState : node.state) === STALE) {
      updateComputation(node);
    } else if ((runningTransition ? node.tState : node.state) === PENDING) {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(node, ancestors[0]), false);
      Updates = updates;
    }
  }
}
function runUpdates(fn, init) {
  if (Updates) return fn();
  let wait = false;
  if (!init) Updates = [];
  if (Effects) wait = true;
  else Effects = [];
  ExecCount++;
  try {
    const res = fn();
    completeUpdates(wait);
    return res;
  } catch (err) {
    if (!wait) Effects = null;
    Updates = null;
    handleError(err);
  }
}
function completeUpdates(wait) {
  if (Updates) {
    if (Scheduler && Transition && Transition.running) scheduleQueue(Updates);
    else runQueue(Updates);
    Updates = null;
  }
  if (wait) return;
  let res;
  if (Transition) {
    if (!Transition.promises.size && !Transition.queue.size) {
      const sources = Transition.sources;
      const disposed = Transition.disposed;
      Effects.push.apply(Effects, Transition.effects);
      res = Transition.resolve;
      for (const e2 of Effects) {
        "tState" in e2 && (e2.state = e2.tState);
        delete e2.tState;
      }
      Transition = null;
      runUpdates(() => {
        for (const d of disposed) cleanNode(d);
        for (const v of sources) {
          v.value = v.tValue;
          if (v.owned) {
            for (let i = 0, len = v.owned.length; i < len; i++) cleanNode(v.owned[i]);
          }
          if (v.tOwned) v.owned = v.tOwned;
          delete v.tValue;
          delete v.tOwned;
          v.tState = 0;
        }
        setTransPending(false);
      }, false);
    } else if (Transition.running) {
      Transition.running = false;
      Transition.effects.push.apply(Transition.effects, Effects);
      Effects = null;
      setTransPending(true);
      return;
    }
  }
  const e = Effects;
  Effects = null;
  if (e.length) runUpdates(() => runEffects(e), false);
  if (res) res();
}
function runQueue(queue) {
  for (let i = 0; i < queue.length; i++) runTop(queue[i]);
}
function scheduleQueue(queue) {
  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    const tasks = Transition.queue;
    if (!tasks.has(item)) {
      tasks.add(item);
      Scheduler(() => {
        tasks.delete(item);
        runUpdates(() => {
          Transition.running = true;
          runTop(item);
        }, false);
        Transition && (Transition.running = false);
      });
    }
  }
}
function runUserEffects(queue) {
  let i, userLength = 0;
  for (i = 0; i < queue.length; i++) {
    const e = queue[i];
    if (!e.user) runTop(e);
    else queue[userLength++] = e;
  }
  if (sharedConfig.context) {
    if (sharedConfig.count) {
      sharedConfig.effects || (sharedConfig.effects = []);
      sharedConfig.effects.push(...queue.slice(0, userLength));
      return;
    }
    setHydrateContext();
  }
  if (sharedConfig.effects && (sharedConfig.done || !sharedConfig.count)) {
    queue = [...sharedConfig.effects, ...queue];
    userLength += sharedConfig.effects.length;
    delete sharedConfig.effects;
  }
  for (i = 0; i < userLength; i++) runTop(queue[i]);
}
function lookUpstream(node, ignore) {
  const runningTransition = Transition && Transition.running;
  if (runningTransition) node.tState = 0;
  else node.state = 0;
  for (let i = 0; i < node.sources.length; i += 1) {
    const source = node.sources[i];
    if (source.sources) {
      const state = runningTransition ? source.tState : source.state;
      if (state === STALE) {
        if (source !== ignore && (!source.updatedAt || source.updatedAt < ExecCount))
          runTop(source);
      } else if (state === PENDING) lookUpstream(source, ignore);
    }
  }
}
function markDownstream(node) {
  const runningTransition = Transition && Transition.running;
  for (let i = 0; i < node.observers.length; i += 1) {
    const o = node.observers[i];
    if (runningTransition ? !o.tState : !o.state) {
      if (runningTransition) o.tState = PENDING;
      else o.state = PENDING;
      if (o.pure) Updates.push(o);
      else Effects.push(o);
      o.observers && markDownstream(o);
    }
  }
}
function cleanNode(node) {
  let i;
  if (node.sources) {
    while (node.sources.length) {
      const source = node.sources.pop(), index = node.sourceSlots.pop(), obs = source.observers;
      if (obs && obs.length) {
        const n = obs.pop(), s = source.observerSlots.pop();
        if (index < obs.length) {
          n.sourceSlots[s] = index;
          obs[index] = n;
          source.observerSlots[index] = s;
        }
      }
    }
  }
  if (node.tOwned) {
    for (i = node.tOwned.length - 1; i >= 0; i--) cleanNode(node.tOwned[i]);
    delete node.tOwned;
  }
  if (Transition && Transition.running && node.pure) {
    reset(node, true);
  } else if (node.owned) {
    for (i = node.owned.length - 1; i >= 0; i--) cleanNode(node.owned[i]);
    node.owned = null;
  }
  if (node.cleanups) {
    for (i = node.cleanups.length - 1; i >= 0; i--) node.cleanups[i]();
    node.cleanups = null;
  }
  if (Transition && Transition.running) node.tState = 0;
  else node.state = 0;
}
function reset(node, top) {
  if (!top) {
    node.tState = 0;
    Transition.disposed.add(node);
  }
  if (node.owned) {
    for (let i = 0; i < node.owned.length; i++) reset(node.owned[i]);
  }
}
function castError(err) {
  if (err instanceof Error) return err;
  return new Error(typeof err === "string" ? err : "Unknown error", {
    cause: err
  });
}
function runErrors(err, fns, owner) {
  try {
    for (const f of fns) f(err);
  } catch (e) {
    handleError(e, owner && owner.owner || null);
  }
}
function handleError(err, owner = Owner) {
  const fns = ERROR && owner && owner.context && owner.context[ERROR];
  const error = castError(err);
  if (!fns) throw error;
  if (Effects)
    Effects.push({
      fn() {
        runErrors(error, fns, owner);
      },
      state: STALE
    });
  else runErrors(error, fns, owner);
}
var FALLBACK = Symbol("fallback");
function dispose(d) {
  for (let i = 0; i < d.length; i++) d[i]();
}
function mapArray(list, mapFn, options = {}) {
  let items = [], mapped = [], disposers = [], len = 0, indexes = mapFn.length > 1 ? [] : null;
  onCleanup(() => dispose(disposers));
  return () => {
    let newItems = list() || [], newLen = newItems.length, i, j;
    newItems[$TRACK];
    return untrack(() => {
      let newIndices, newIndicesNext, temp, tempdisposers, tempIndexes, start, end, newEnd, item;
      if (newLen === 0) {
        if (len !== 0) {
          dispose(disposers);
          disposers = [];
          items = [];
          mapped = [];
          len = 0;
          indexes && (indexes = []);
        }
        if (options.fallback) {
          items = [FALLBACK];
          mapped[0] = createRoot((disposer) => {
            disposers[0] = disposer;
            return options.fallback();
          });
          len = 1;
        }
      } else if (len === 0) {
        mapped = new Array(newLen);
        for (j = 0; j < newLen; j++) {
          items[j] = newItems[j];
          mapped[j] = createRoot(mapper);
        }
        len = newLen;
      } else {
        temp = new Array(newLen);
        tempdisposers = new Array(newLen);
        indexes && (tempIndexes = new Array(newLen));
        for (start = 0, end = Math.min(len, newLen); start < end && items[start] === newItems[start]; start++) ;
        for (end = len - 1, newEnd = newLen - 1; end >= start && newEnd >= start && items[end] === newItems[newEnd]; end--, newEnd--) {
          temp[newEnd] = mapped[end];
          tempdisposers[newEnd] = disposers[end];
          indexes && (tempIndexes[newEnd] = indexes[end]);
        }
        newIndices = /* @__PURE__ */ new Map();
        newIndicesNext = new Array(newEnd + 1);
        for (j = newEnd; j >= start; j--) {
          item = newItems[j];
          i = newIndices.get(item);
          newIndicesNext[j] = i === void 0 ? -1 : i;
          newIndices.set(item, j);
        }
        for (i = start; i <= end; i++) {
          item = items[i];
          j = newIndices.get(item);
          if (j !== void 0 && j !== -1) {
            temp[j] = mapped[i];
            tempdisposers[j] = disposers[i];
            indexes && (tempIndexes[j] = indexes[i]);
            j = newIndicesNext[j];
            newIndices.set(item, j);
          } else disposers[i]();
        }
        for (j = start; j < newLen; j++) {
          if (j in temp) {
            mapped[j] = temp[j];
            disposers[j] = tempdisposers[j];
            if (indexes) {
              indexes[j] = tempIndexes[j];
              indexes[j](j);
            }
          } else mapped[j] = createRoot(mapper);
        }
        mapped = mapped.slice(0, len = newLen);
        items = newItems.slice(0);
      }
      return mapped;
    });
    function mapper(disposer) {
      disposers[j] = disposer;
      if (indexes) {
        const [s, set] = createSignal(j);
        indexes[j] = set;
        return mapFn(newItems[j], s);
      }
      return mapFn(newItems[j]);
    }
  };
}
var hydrationEnabled = false;
function createComponent(Comp, props) {
  if (hydrationEnabled) {
    if (sharedConfig.context) {
      const c = sharedConfig.context;
      setHydrateContext(nextHydrateContext());
      const r = untrack(() => Comp(props || {}));
      setHydrateContext(c);
      return r;
    }
  }
  return untrack(() => Comp(props || {}));
}
function trueFn() {
  return true;
}
var propTraps = {
  get(_, property, receiver) {
    if (property === $PROXY) return receiver;
    return _.get(property);
  },
  has(_, property) {
    if (property === $PROXY) return true;
    return _.has(property);
  },
  set: trueFn,
  deleteProperty: trueFn,
  getOwnPropertyDescriptor(_, property) {
    return {
      configurable: true,
      enumerable: true,
      get() {
        return _.get(property);
      },
      set: trueFn,
      deleteProperty: trueFn
    };
  },
  ownKeys(_) {
    return _.keys();
  }
};
function resolveSource(s) {
  return !(s = typeof s === "function" ? s() : s) ? {} : s;
}
function resolveSources() {
  for (let i = 0, length = this.length; i < length; ++i) {
    const v = this[i]();
    if (v !== void 0) return v;
  }
}
function mergeProps(...sources) {
  let proxy = false;
  for (let i = 0; i < sources.length; i++) {
    const s = sources[i];
    proxy = proxy || !!s && $PROXY in s;
    sources[i] = typeof s === "function" ? (proxy = true, createMemo(s)) : s;
  }
  if (SUPPORTS_PROXY && proxy) {
    return new Proxy(
      {
        get(property) {
          for (let i = sources.length - 1; i >= 0; i--) {
            const v = resolveSource(sources[i])[property];
            if (v !== void 0) return v;
          }
        },
        has(property) {
          for (let i = sources.length - 1; i >= 0; i--) {
            if (property in resolveSource(sources[i])) return true;
          }
          return false;
        },
        keys() {
          const keys = [];
          for (let i = 0; i < sources.length; i++)
            keys.push(...Object.keys(resolveSource(sources[i])));
          return [...new Set(keys)];
        }
      },
      propTraps
    );
  }
  const sourcesMap = {};
  const defined = /* @__PURE__ */ Object.create(null);
  for (let i = sources.length - 1; i >= 0; i--) {
    const source = sources[i];
    if (!source) continue;
    const sourceKeys = Object.getOwnPropertyNames(source);
    for (let i2 = sourceKeys.length - 1; i2 >= 0; i2--) {
      const key = sourceKeys[i2];
      if (key === "__proto__" || key === "constructor") continue;
      const desc = Object.getOwnPropertyDescriptor(source, key);
      if (!defined[key]) {
        defined[key] = desc.get ? {
          enumerable: true,
          configurable: true,
          get: resolveSources.bind(sourcesMap[key] = [desc.get.bind(source)])
        } : desc.value !== void 0 ? desc : void 0;
      } else {
        const sources2 = sourcesMap[key];
        if (sources2) {
          if (desc.get) sources2.push(desc.get.bind(source));
          else if (desc.value !== void 0) sources2.push(() => desc.value);
        }
      }
    }
  }
  const target = {};
  const definedKeys = Object.keys(defined);
  for (let i = definedKeys.length - 1; i >= 0; i--) {
    const key = definedKeys[i], desc = defined[key];
    if (desc && desc.get) Object.defineProperty(target, key, desc);
    else target[key] = desc ? desc.value : void 0;
  }
  return target;
}
function splitProps(props, ...keys) {
  if (SUPPORTS_PROXY && $PROXY in props) {
    const blocked = new Set(keys.length > 1 ? keys.flat() : keys[0]);
    const res = keys.map((k) => {
      return new Proxy(
        {
          get(property) {
            return k.includes(property) ? props[property] : void 0;
          },
          has(property) {
            return k.includes(property) && property in props;
          },
          keys() {
            return k.filter((property) => property in props);
          }
        },
        propTraps
      );
    });
    res.push(
      new Proxy(
        {
          get(property) {
            return blocked.has(property) ? void 0 : props[property];
          },
          has(property) {
            return blocked.has(property) ? false : property in props;
          },
          keys() {
            return Object.keys(props).filter((k) => !blocked.has(k));
          }
        },
        propTraps
      )
    );
    return res;
  }
  const otherObject = {};
  const objects = keys.map(() => ({}));
  for (const propName of Object.getOwnPropertyNames(props)) {
    const desc = Object.getOwnPropertyDescriptor(props, propName);
    const isDefaultDesc = !desc.get && !desc.set && desc.enumerable && desc.writable && desc.configurable;
    let blocked = false;
    let objectIndex = 0;
    for (const k of keys) {
      if (k.includes(propName)) {
        blocked = true;
        isDefaultDesc ? objects[objectIndex][propName] = desc.value : Object.defineProperty(objects[objectIndex], propName, desc);
      }
      ++objectIndex;
    }
    if (!blocked) {
      isDefaultDesc ? otherObject[propName] = desc.value : Object.defineProperty(otherObject, propName, desc);
    }
  }
  return [...objects, otherObject];
}
function For(props) {
  const fallback = "fallback" in props && {
    fallback: () => props.fallback
  };
  return createMemo(mapArray(() => props.each, props.children, fallback || void 0));
}

// node_modules/.pnpm/solid-js@1.9.6/node_modules/solid-js/web/dist/web.js
var booleans = [
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "disabled",
  "formnovalidate",
  "hidden",
  "indeterminate",
  "inert",
  "ismap",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "seamless",
  "selected"
];
var Properties = /* @__PURE__ */ new Set([
  "className",
  "value",
  "readOnly",
  "noValidate",
  "formNoValidate",
  "isMap",
  "noModule",
  "playsInline",
  ...booleans
]);
var ChildProperties = /* @__PURE__ */ new Set([
  "innerHTML",
  "textContent",
  "innerText",
  "children"
]);
var Aliases = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(null), {
  className: "class",
  htmlFor: "for"
});
var PropAliases = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(null), {
  class: "className",
  novalidate: {
    $: "noValidate",
    FORM: 1
  },
  formnovalidate: {
    $: "formNoValidate",
    BUTTON: 1,
    INPUT: 1
  },
  ismap: {
    $: "isMap",
    IMG: 1
  },
  nomodule: {
    $: "noModule",
    SCRIPT: 1
  },
  playsinline: {
    $: "playsInline",
    VIDEO: 1
  },
  readonly: {
    $: "readOnly",
    INPUT: 1,
    TEXTAREA: 1
  }
});
function getPropAlias(prop, tagName) {
  const a = PropAliases[prop];
  return typeof a === "object" ? a[tagName] ? a["$"] : void 0 : a;
}
var DelegatedEvents = /* @__PURE__ */ new Set([
  "beforeinput",
  "click",
  "dblclick",
  "contextmenu",
  "focusin",
  "focusout",
  "input",
  "keydown",
  "keyup",
  "mousedown",
  "mousemove",
  "mouseout",
  "mouseover",
  "mouseup",
  "pointerdown",
  "pointermove",
  "pointerout",
  "pointerover",
  "pointerup",
  "touchend",
  "touchmove",
  "touchstart"
]);
var SVGElements = /* @__PURE__ */ new Set([
  "altGlyph",
  "altGlyphDef",
  "altGlyphItem",
  "animate",
  "animateColor",
  "animateMotion",
  "animateTransform",
  "circle",
  "clipPath",
  "color-profile",
  "cursor",
  "defs",
  "desc",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "font",
  "font-face",
  "font-face-format",
  "font-face-name",
  "font-face-src",
  "font-face-uri",
  "foreignObject",
  "g",
  "glyph",
  "glyphRef",
  "hkern",
  "image",
  "line",
  "linearGradient",
  "marker",
  "mask",
  "metadata",
  "missing-glyph",
  "mpath",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "set",
  "stop",
  "svg",
  "switch",
  "symbol",
  "text",
  "textPath",
  "tref",
  "tspan",
  "use",
  "view",
  "vkern"
]);
var SVGNamespace = {
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace"
};
var memo = (fn) => createMemo(() => fn());
function reconcileArrays(parentNode, a, b) {
  let bLength = b.length, aEnd = a.length, bEnd = bLength, aStart = 0, bStart = 0, after = a[aEnd - 1].nextSibling, map = null;
  while (aStart < aEnd || bStart < bEnd) {
    if (a[aStart] === b[bStart]) {
      aStart++;
      bStart++;
      continue;
    }
    while (a[aEnd - 1] === b[bEnd - 1]) {
      aEnd--;
      bEnd--;
    }
    if (aEnd === aStart) {
      const node = bEnd < bLength ? bStart ? b[bStart - 1].nextSibling : b[bEnd - bStart] : after;
      while (bStart < bEnd) parentNode.insertBefore(b[bStart++], node);
    } else if (bEnd === bStart) {
      while (aStart < aEnd) {
        if (!map || !map.has(a[aStart])) a[aStart].remove();
        aStart++;
      }
    } else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
      const node = a[--aEnd].nextSibling;
      parentNode.insertBefore(b[bStart++], a[aStart++].nextSibling);
      parentNode.insertBefore(b[--bEnd], node);
      a[aEnd] = b[bEnd];
    } else {
      if (!map) {
        map = /* @__PURE__ */ new Map();
        let i = bStart;
        while (i < bEnd) map.set(b[i], i++);
      }
      const index = map.get(a[aStart]);
      if (index != null) {
        if (bStart < index && index < bEnd) {
          let i = aStart, sequence = 1, t;
          while (++i < aEnd && i < bEnd) {
            if ((t = map.get(a[i])) == null || t !== index + sequence) break;
            sequence++;
          }
          if (sequence > index - bStart) {
            const node = a[aStart];
            while (bStart < index) parentNode.insertBefore(b[bStart++], node);
          } else parentNode.replaceChild(b[bStart++], a[aStart++]);
        } else aStart++;
      } else a[aStart++].remove();
    }
  }
}
var $$EVENTS = "_$DX_DELEGATE";
function template(html, isImportNode, isSVG, isMathML) {
  let node;
  const create = () => {
    const t = isMathML ? document.createElementNS("http://www.w3.org/1998/Math/MathML", "template") : document.createElement("template");
    t.innerHTML = html;
    return isSVG ? t.content.firstChild.firstChild : isMathML ? t.firstChild : t.content.firstChild;
  };
  const fn = isImportNode ? () => untrack(() => document.importNode(node || (node = create()), true)) : () => (node || (node = create())).cloneNode(true);
  fn.cloneNode = fn;
  return fn;
}
function delegateEvents(eventNames, document2 = window.document) {
  const e = document2[$$EVENTS] || (document2[$$EVENTS] = /* @__PURE__ */ new Set());
  for (let i = 0, l = eventNames.length; i < l; i++) {
    const name = eventNames[i];
    if (!e.has(name)) {
      e.add(name);
      document2.addEventListener(name, eventHandler);
    }
  }
}
function setAttribute(node, name, value) {
  if (isHydrating(node)) return;
  if (value == null) node.removeAttribute(name);
  else node.setAttribute(name, value);
}
function setAttributeNS(node, namespace, name, value) {
  if (isHydrating(node)) return;
  if (value == null) node.removeAttributeNS(namespace, name);
  else node.setAttributeNS(namespace, name, value);
}
function setBoolAttribute(node, name, value) {
  if (isHydrating(node)) return;
  value ? node.setAttribute(name, "") : node.removeAttribute(name);
}
function className(node, value) {
  if (isHydrating(node)) return;
  if (value == null) node.removeAttribute("class");
  else node.className = value;
}
function addEventListener(node, name, handler, delegate) {
  if (delegate) {
    if (Array.isArray(handler)) {
      node[`$$${name}`] = handler[0];
      node[`$$${name}Data`] = handler[1];
    } else node[`$$${name}`] = handler;
  } else if (Array.isArray(handler)) {
    const handlerFn = handler[0];
    node.addEventListener(name, handler[0] = (e) => handlerFn.call(node, handler[1], e));
  } else node.addEventListener(name, handler, typeof handler !== "function" && handler);
}
function classList(node, value, prev = {}) {
  const classKeys = Object.keys(value || {}), prevKeys = Object.keys(prev);
  let i, len;
  for (i = 0, len = prevKeys.length; i < len; i++) {
    const key = prevKeys[i];
    if (!key || key === "undefined" || value[key]) continue;
    toggleClassKey(node, key, false);
    delete prev[key];
  }
  for (i = 0, len = classKeys.length; i < len; i++) {
    const key = classKeys[i], classValue = !!value[key];
    if (!key || key === "undefined" || prev[key] === classValue || !classValue) continue;
    toggleClassKey(node, key, true);
    prev[key] = classValue;
  }
  return prev;
}
function style(node, value, prev) {
  if (!value) return prev ? setAttribute(node, "style") : value;
  const nodeStyle = node.style;
  if (typeof value === "string") return nodeStyle.cssText = value;
  typeof prev === "string" && (nodeStyle.cssText = prev = void 0);
  prev || (prev = {});
  value || (value = {});
  let v, s;
  for (s in prev) {
    value[s] == null && nodeStyle.removeProperty(s);
    delete prev[s];
  }
  for (s in value) {
    v = value[s];
    if (v !== prev[s]) {
      nodeStyle.setProperty(s, v);
      prev[s] = v;
    }
  }
  return prev;
}
function spread(node, props = {}, isSVG, skipChildren) {
  const prevProps = {};
  if (!skipChildren) {
    createRenderEffect(
      () => prevProps.children = insertExpression(node, props.children, prevProps.children)
    );
  }
  createRenderEffect(() => typeof props.ref === "function" && use(props.ref, node));
  createRenderEffect(() => assign(node, props, isSVG, true, prevProps, true));
  return prevProps;
}
function use(fn, element, arg) {
  return untrack(() => fn(element, arg));
}
function insert(parent, accessor, marker, initial) {
  if (marker !== void 0 && !initial) initial = [];
  if (typeof accessor !== "function") return insertExpression(parent, accessor, initial, marker);
  createRenderEffect((current) => insertExpression(parent, accessor(), current, marker), initial);
}
function assign(node, props, isSVG, skipChildren, prevProps = {}, skipRef = false) {
  props || (props = {});
  for (const prop in prevProps) {
    if (!(prop in props)) {
      if (prop === "children") continue;
      prevProps[prop] = assignProp(node, prop, null, prevProps[prop], isSVG, skipRef, props);
    }
  }
  for (const prop in props) {
    if (prop === "children") {
      if (!skipChildren) insertExpression(node, props.children);
      continue;
    }
    const value = props[prop];
    prevProps[prop] = assignProp(node, prop, value, prevProps[prop], isSVG, skipRef, props);
  }
}
function getNextElement(template2) {
  let node, key, hydrating = isHydrating();
  if (!hydrating || !(node = sharedConfig.registry.get(key = getHydrationKey()))) {
    return template2();
  }
  if (sharedConfig.completed) sharedConfig.completed.add(node);
  sharedConfig.registry.delete(key);
  return node;
}
function isHydrating(node) {
  return !!sharedConfig.context && !sharedConfig.done && (!node || node.isConnected);
}
function toPropertyName(name) {
  return name.toLowerCase().replace(/-([a-z])/g, (_, w) => w.toUpperCase());
}
function toggleClassKey(node, key, value) {
  const classNames = key.trim().split(/\s+/);
  for (let i = 0, nameLen = classNames.length; i < nameLen; i++)
    node.classList.toggle(classNames[i], value);
}
function assignProp(node, prop, value, prev, isSVG, skipRef, props) {
  let isCE, isProp, isChildProp, propAlias, forceProp;
  if (prop === "style") return style(node, value, prev);
  if (prop === "classList") return classList(node, value, prev);
  if (value === prev) return prev;
  if (prop === "ref") {
    if (!skipRef) value(node);
  } else if (prop.slice(0, 3) === "on:") {
    const e = prop.slice(3);
    prev && node.removeEventListener(e, prev, typeof prev !== "function" && prev);
    value && node.addEventListener(e, value, typeof value !== "function" && value);
  } else if (prop.slice(0, 10) === "oncapture:") {
    const e = prop.slice(10);
    prev && node.removeEventListener(e, prev, true);
    value && node.addEventListener(e, value, true);
  } else if (prop.slice(0, 2) === "on") {
    const name = prop.slice(2).toLowerCase();
    const delegate = DelegatedEvents.has(name);
    if (!delegate && prev) {
      const h = Array.isArray(prev) ? prev[0] : prev;
      node.removeEventListener(name, h);
    }
    if (delegate || value) {
      addEventListener(node, name, value, delegate);
      delegate && delegateEvents([name]);
    }
  } else if (prop.slice(0, 5) === "attr:") {
    setAttribute(node, prop.slice(5), value);
  } else if (prop.slice(0, 5) === "bool:") {
    setBoolAttribute(node, prop.slice(5), value);
  } else if ((forceProp = prop.slice(0, 5) === "prop:") || (isChildProp = ChildProperties.has(prop)) || !isSVG && ((propAlias = getPropAlias(prop, node.tagName)) || (isProp = Properties.has(prop))) || (isCE = node.nodeName.includes("-") || "is" in props)) {
    if (forceProp) {
      prop = prop.slice(5);
      isProp = true;
    } else if (isHydrating(node)) return value;
    if (prop === "class" || prop === "className") className(node, value);
    else if (isCE && !isProp && !isChildProp) node[toPropertyName(prop)] = value;
    else node[propAlias || prop] = value;
  } else {
    const ns = isSVG && prop.indexOf(":") > -1 && SVGNamespace[prop.split(":")[0]];
    if (ns) setAttributeNS(node, ns, prop, value);
    else setAttribute(node, Aliases[prop] || prop, value);
  }
  return value;
}
function eventHandler(e) {
  if (sharedConfig.registry && sharedConfig.events) {
    if (sharedConfig.events.find(([el, ev]) => ev === e)) return;
  }
  let node = e.target;
  const key = `$$${e.type}`;
  const oriTarget = e.target;
  const oriCurrentTarget = e.currentTarget;
  const retarget = (value) => Object.defineProperty(e, "target", {
    configurable: true,
    value
  });
  const handleNode = () => {
    const handler = node[key];
    if (handler && !node.disabled) {
      const data = node[`${key}Data`];
      data !== void 0 ? handler.call(node, data, e) : handler.call(node, e);
      if (e.cancelBubble) return;
    }
    node.host && typeof node.host !== "string" && !node.host._$host && node.contains(e.target) && retarget(node.host);
    return true;
  };
  const walkUpTree = () => {
    while (handleNode() && (node = node._$host || node.parentNode || node.host)) ;
  };
  Object.defineProperty(e, "currentTarget", {
    configurable: true,
    get() {
      return node || document;
    }
  });
  if (sharedConfig.registry && !sharedConfig.done) sharedConfig.done = _$HY.done = true;
  if (e.composedPath) {
    const path = e.composedPath();
    retarget(path[0]);
    for (let i = 0; i < path.length - 2; i++) {
      node = path[i];
      if (!handleNode()) break;
      if (node._$host) {
        node = node._$host;
        walkUpTree();
        break;
      }
      if (node.parentNode === oriCurrentTarget) {
        break;
      }
    }
  } else walkUpTree();
  retarget(oriTarget);
}
function insertExpression(parent, value, current, marker, unwrapArray) {
  const hydrating = isHydrating(parent);
  if (hydrating) {
    !current && (current = [...parent.childNodes]);
    let cleaned = [];
    for (let i = 0; i < current.length; i++) {
      const node = current[i];
      if (node.nodeType === 8 && node.data.slice(0, 2) === "!$") node.remove();
      else cleaned.push(node);
    }
    current = cleaned;
  }
  while (typeof current === "function") current = current();
  if (value === current) return current;
  const t = typeof value, multi = marker !== void 0;
  parent = multi && current[0] && current[0].parentNode || parent;
  if (t === "string" || t === "number") {
    if (hydrating) return current;
    if (t === "number") {
      value = value.toString();
      if (value === current) return current;
    }
    if (multi) {
      let node = current[0];
      if (node && node.nodeType === 3) {
        node.data !== value && (node.data = value);
      } else node = document.createTextNode(value);
      current = cleanChildren(parent, current, marker, node);
    } else {
      if (current !== "" && typeof current === "string") {
        current = parent.firstChild.data = value;
      } else current = parent.textContent = value;
    }
  } else if (value == null || t === "boolean") {
    if (hydrating) return current;
    current = cleanChildren(parent, current, marker);
  } else if (t === "function") {
    createRenderEffect(() => {
      let v = value();
      while (typeof v === "function") v = v();
      current = insertExpression(parent, v, current, marker);
    });
    return () => current;
  } else if (Array.isArray(value)) {
    const array = [];
    const currentArray = current && Array.isArray(current);
    if (normalizeIncomingArray(array, value, current, unwrapArray)) {
      createRenderEffect(() => current = insertExpression(parent, array, current, marker, true));
      return () => current;
    }
    if (hydrating) {
      if (!array.length) return current;
      if (marker === void 0) return current = [...parent.childNodes];
      let node = array[0];
      if (node.parentNode !== parent) return current;
      const nodes = [node];
      while ((node = node.nextSibling) !== marker) nodes.push(node);
      return current = nodes;
    }
    if (array.length === 0) {
      current = cleanChildren(parent, current, marker);
      if (multi) return current;
    } else if (currentArray) {
      if (current.length === 0) {
        appendNodes(parent, array, marker);
      } else reconcileArrays(parent, current, array);
    } else {
      current && cleanChildren(parent);
      appendNodes(parent, array);
    }
    current = array;
  } else if (value.nodeType) {
    if (hydrating && value.parentNode) return current = multi ? [value] : value;
    if (Array.isArray(current)) {
      if (multi) return current = cleanChildren(parent, current, marker, value);
      cleanChildren(parent, current, null, value);
    } else if (current == null || current === "" || !parent.firstChild) {
      parent.appendChild(value);
    } else parent.replaceChild(value, parent.firstChild);
    current = value;
  } else ;
  return current;
}
function normalizeIncomingArray(normalized, array, current, unwrap) {
  let dynamic = false;
  for (let i = 0, len = array.length; i < len; i++) {
    let item = array[i], prev = current && current[normalized.length], t;
    if (item == null || item === true || item === false) ;
    else if ((t = typeof item) === "object" && item.nodeType) {
      normalized.push(item);
    } else if (Array.isArray(item)) {
      dynamic = normalizeIncomingArray(normalized, item, prev) || dynamic;
    } else if (t === "function") {
      if (unwrap) {
        while (typeof item === "function") item = item();
        dynamic = normalizeIncomingArray(
          normalized,
          Array.isArray(item) ? item : [item],
          Array.isArray(prev) ? prev : [prev]
        ) || dynamic;
      } else {
        normalized.push(item);
        dynamic = true;
      }
    } else {
      const value = String(item);
      if (prev && prev.nodeType === 3 && prev.data === value) normalized.push(prev);
      else normalized.push(document.createTextNode(value));
    }
  }
  return dynamic;
}
function appendNodes(parent, array, marker = null) {
  for (let i = 0, len = array.length; i < len; i++) parent.insertBefore(array[i], marker);
}
function cleanChildren(parent, current, marker, replacement) {
  if (marker === void 0) return parent.textContent = "";
  const node = replacement || document.createTextNode("");
  if (current.length) {
    let inserted = false;
    for (let i = current.length - 1; i >= 0; i--) {
      const el = current[i];
      if (node !== el) {
        const isParent = el.parentNode === parent;
        if (!inserted && !i)
          isParent ? parent.replaceChild(node, el) : parent.insertBefore(node, marker);
        else isParent && el.remove();
      } else inserted = true;
    }
  } else parent.insertBefore(node, marker);
  return [node];
}
function getHydrationKey() {
  return sharedConfig.getNextContextId();
}
var RequestContext = Symbol();
var SVG_NAMESPACE = "http://www.w3.org/2000/svg";
function createElement(tagName, isSVG = false) {
  return isSVG ? document.createElementNS(SVG_NAMESPACE, tagName) : document.createElement(tagName);
}
function createDynamic(component, props) {
  const cached = createMemo(component);
  return createMemo(() => {
    const component2 = cached();
    switch (typeof component2) {
      case "function":
        return untrack(() => component2(props));
      case "string":
        const isSvg = SVGElements.has(component2);
        const el = sharedConfig.context ? getNextElement() : createElement(component2, isSvg);
        spread(el, props, isSvg);
        return el;
    }
  });
}
function Dynamic(props) {
  const [, others] = splitProps(props, ["component"]);
  return createDynamic(() => props.component, others);
}

// node_modules/.pnpm/solid-element@1.9.1_solid-js@1.9.6/node_modules/solid-element/dist/index.js
function createProps(raw) {
  const keys = Object.keys(raw);
  const props = {};
  for (let i = 0; i < keys.length; i++) {
    const [get, set] = createSignal(raw[keys[i]]);
    Object.defineProperty(props, keys[i], {
      get,
      set(v) {
        set(() => v);
      }
    });
  }
  return props;
}
function lookupContext(el) {
  if (el.assignedSlot && el.assignedSlot._$owner) return el.assignedSlot._$owner;
  let next = el.parentNode;
  while (next && !next._$owner && !(next.assignedSlot && next.assignedSlot._$owner))
    next = next.parentNode;
  return next && next.assignedSlot ? next.assignedSlot._$owner : el._$owner;
}
function withSolid(ComponentType) {
  return (rawProps, options) => {
    const { element } = options;
    return createRoot((dispose2) => {
      const props = createProps(rawProps);
      element.addPropertyChangedCallback((key, val) => props[key] = val);
      element.addReleaseCallback(() => {
        element.renderRoot.textContent = "";
        dispose2();
      });
      const comp = ComponentType(props, options);
      return insert(element.renderRoot, comp);
    }, lookupContext(element));
  };
}
function customElement(tag, props, ComponentType) {
  if (arguments.length === 2) {
    ComponentType = props;
    props = {};
  }
  return register(tag, props)(withSolid(ComponentType));
}

// node_modules/.pnpm/lucide-solid@0.509.0_solid-js@1.9.6/node_modules/lucide-solid/dist/esm/defaultAttributes.js
var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};

// node_modules/.pnpm/lucide-solid@0.509.0_solid-js@1.9.6/node_modules/lucide-solid/dist/esm/shared/src/utils.js
var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
var toCamelCase = (string) => string.replace(/^([A-Z])|[\s-_]+(\w)/g, (match, p1, p2) => p2 ? p2.toUpperCase() : p1.toLowerCase());
var toPascalCase = (string) => {
  const camelCase = toCamelCase(string);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};
var mergeClasses = (...classes) => classes.filter((className2, index, array) => {
  return Boolean(className2) && className2.trim() !== "" && array.indexOf(className2) === index;
}).join(" ").trim();

// node_modules/.pnpm/lucide-solid@0.509.0_solid-js@1.9.6/node_modules/lucide-solid/dist/esm/Icon.js
var _tmpl$ = /* @__PURE__ */ template(`<svg>`);
var Icon = (props) => {
  const [localProps, rest] = splitProps(props, ["color", "size", "strokeWidth", "children", "class", "name", "iconNode", "absoluteStrokeWidth"]);
  return (() => {
    var _el$ = _tmpl$();
    spread(_el$, mergeProps(defaultAttributes, {
      get width() {
        return localProps.size ?? defaultAttributes.width;
      },
      get height() {
        return localProps.size ?? defaultAttributes.height;
      },
      get stroke() {
        return localProps.color ?? defaultAttributes.stroke;
      },
      get ["stroke-width"]() {
        return memo(() => !!localProps.absoluteStrokeWidth)() ? Number(localProps.strokeWidth ?? defaultAttributes["stroke-width"]) * 24 / Number(localProps.size) : Number(localProps.strokeWidth ?? defaultAttributes["stroke-width"]);
      },
      get ["class"]() {
        return mergeClasses("lucide", "lucide-icon", ...localProps.name != null ? [`lucide-${toKebabCase(toPascalCase(localProps.name))}`, `lucide-${toKebabCase(localProps.name)}`] : [], localProps.class != null ? localProps.class : "");
      }
    }, rest), true, true);
    insert(_el$, createComponent(For, {
      get each() {
        return localProps.iconNode;
      },
      children: ([elementName, attrs]) => {
        return createComponent(Dynamic, mergeProps({
          component: elementName
        }, attrs));
      }
    }));
    return _el$;
  })();
};

// node_modules/.pnpm/lucide-solid@0.509.0_solid-js@1.9.6/node_modules/lucide-solid/dist/esm/icons/check.js
var iconNode = [["path", {
  d: "M20 6 9 17l-5-5",
  key: "1gmf2c"
}]];
var Check = (props) => createComponent(Icon, mergeProps(props, {
  iconNode,
  name: "check"
}));

// node_modules/.pnpm/lucide-solid@0.509.0_solid-js@1.9.6/node_modules/lucide-solid/dist/esm/icons/file-check.js
var iconNode2 = [["path", {
  d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
  key: "1rqfz7"
}], ["path", {
  d: "M14 2v4a2 2 0 0 0 2 2h4",
  key: "tnqrlb"
}], ["path", {
  d: "m9 15 2 2 4-4",
  key: "1grp1n"
}]];
var FileCheck = (props) => createComponent(Icon, mergeProps(props, {
  iconNode: iconNode2,
  name: "file-check"
}));

// node_modules/.pnpm/lucide-solid@0.509.0_solid-js@1.9.6/node_modules/lucide-solid/dist/esm/icons/file-spreadsheet.js
var iconNode3 = [["path", {
  d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
  key: "1rqfz7"
}], ["path", {
  d: "M14 2v4a2 2 0 0 0 2 2h4",
  key: "tnqrlb"
}], ["path", {
  d: "M8 13h2",
  key: "yr2amv"
}], ["path", {
  d: "M14 13h2",
  key: "un5t4a"
}], ["path", {
  d: "M8 17h2",
  key: "2yhykz"
}], ["path", {
  d: "M14 17h2",
  key: "10kma7"
}]];
var FileSpreadsheet = (props) => createComponent(Icon, mergeProps(props, {
  iconNode: iconNode3,
  name: "file-spreadsheet"
}));

// node_modules/.pnpm/lucide-solid@0.509.0_solid-js@1.9.6/node_modules/lucide-solid/dist/esm/icons/triangle-alert.js
var iconNode4 = [["path", {
  d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
  key: "wmoenq"
}], ["path", {
  d: "M12 9v4",
  key: "juzpu7"
}], ["path", {
  d: "M12 17h.01",
  key: "p32p05"
}]];
var TriangleAlert = (props) => createComponent(Icon, mergeProps(props, {
  iconNode: iconNode4,
  name: "triangle-alert"
}));

// node_modules/.pnpm/lucide-solid@0.509.0_solid-js@1.9.6/node_modules/lucide-solid/dist/esm/icons/upload.js
var iconNode5 = [["path", {
  d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
  key: "ih7n3h"
}], ["polyline", {
  points: "17 8 12 3 7 8",
  key: "t8dd8p"
}], ["line", {
  x1: "12",
  x2: "12",
  y1: "3",
  y2: "15",
  key: "widbto"
}]];
var Upload = (props) => createComponent(Icon, mergeProps(props, {
  iconNode: iconNode5,
  name: "upload"
}));

// src/components/ExcelUploadComponent.tsx
var _tmpl$2 = /* @__PURE__ */ template(`<div class="flex items-center justify-center mb-4"><h2>`);
var _tmpl$22 = /* @__PURE__ */ template(`<div><p class="text-sm font-medium text-gray-700 mb-1"></p><p class="text-xs text-gray-500 mb-3"></p><input type=file accept=".xlsx, .xls"class=hidden id=file-upload><label for=file-upload>`);
var _tmpl$3 = /* @__PURE__ */ template(`<div class=space-y-3><div><span class=font-medium></span> </div><button>`);
var _tmpl$4 = /* @__PURE__ */ template(`<div><div class="flex items-center mb-2"><span class=font-medium>Verification Issues:</span></div><ul class="list-disc pl-5 space-y-1">`);
var _tmpl$5 = /* @__PURE__ */ template(`<li>`);
var _tmpl$6 = /* @__PURE__ */ template(`<div><span class=font-medium>File verified successfully`);
var _tmpl$7 = /* @__PURE__ */ template(`<div class="excel-upload-component flex justify-center items-center"><div class="p-8 max-w-lg w-full bg-white rounded-2xl drop-shadow-2xl border border-green-200"><div class=space-y-4>`);
var getColorHelpers = (props) => ({
  primaryColor: () => props.primaryColor || "text-green-600",
  primaryBgColor: () => props.primaryColor?.replace("text-", "bg-") || "bg-green-600",
  hoverBgColor: () => props.hoverColor?.replace("text-", "bg-") || "bg-green-700",
  successColor: () => props.successColor || "text-green-700",
  successBgColor: () => props.successColor?.replace("text-", "bg-").replace("700", "50") || "bg-green-50",
  successIconColor: () => props.successColor?.replace("700", "600") || "text-green-600",
  dragBorderColor: () => props.dragActiveColor?.replace("text-", "border-") || "border-green-500",
  dragBgColor: () => props.dragActiveColor?.replace("text-", "bg-").replace("500", "50") || "bg-green-50",
  errorColor: () => "text-red-700",
  errorBgColor: () => "bg-red-50"
});
var getTextHelpers = (props) => ({
  title: () => props.title || "Excel File Upload",
  dragDropText: () => props.dragDropText || "Drag and drop your Excel file here",
  orText: () => props.orText || "or",
  selectButtonText: () => props.selectButtonText || "Select File",
  fileSelectedText: () => props.fileSelectedText || "File selected:",
  uploadButtonText: () => props.uploadButtonText || "Verify & Upload"
});
function ExcelUploadComponent(props = {}) {
  console.log(props);
  const [fileName, setFileName] = createSignal("");
  const [isDragging, setIsDragging] = createSignal(false);
  const [selectedFile, setSelectedFile] = createSignal(null);
  const [verificationErrors, setVerificationErrors] = createSignal([]);
  const [isVerified, setIsVerified] = createSignal(false);
  const [isVerifying, setIsVerifying] = createSignal(false);
  let containerRef;
  let fileInputRef;
  const colors = getColorHelpers(props);
  const handleFileChange = (event) => {
    const target = event.target;
    const file = target.files?.[0];
    if (file) {
      setFileName(file.name);
      setSelectedFile(file);
      setIsVerified(false);
      setVerificationErrors([]);
    }
  };
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        setFileName(file.name);
        setSelectedFile(file);
        setIsVerified(false);
        setVerificationErrors([]);
        if (fileInputRef) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInputRef.files = dataTransfer.files;
        }
      }
    }
  };
  const verifyFile = () => {
    const file = selectedFile();
    if (!file) return;
    setIsVerifying(true);
    setVerificationErrors([]);
    if (props.verificationRules && props.verificationRules.length > 0) {
      const errors = [];
      props.verificationRules.forEach((rule) => {
        const result = rule(file);
        if (result !== true) {
          errors.push(typeof result === "string" ? result : "Verification failed");
        }
      });
      setVerificationErrors(errors);
      setIsVerified(errors.length === 0);
    } else {
      setIsVerified(true);
    }
    setIsVerifying(false);
  };
  const handleUpload = () => {
    if (!isVerified()) {
      verifyFile();
      if (verificationErrors().length > 0) {
        return;
      }
    }
    const file = selectedFile();
    if (file && props.onUpload) {
      props.onUpload(file);
    }
  };
  onMount(() => {
    if (props.styles && containerRef) {
      const styleEl = document.createElement("style");
      styleEl.textContent = props.styles;
      const root = containerRef.getRootNode();
      if (root instanceof ShadowRoot) {
        root.prepend(styleEl);
      }
    }
  });
  const renderHeader = () => (() => {
    var _el$ = _tmpl$2(), _el$2 = _el$.firstChild;
    insert(_el$, createComponent(FileSpreadsheet, {
      get ["class"]() {
        return `h-6 w-6 ${colors.primaryColor()} mr-2`;
      }
    }), _el$2);
    insert(_el$2, () => getTextHelpers(props).title());
    createRenderEffect(() => className(_el$2, `text-xl font-bold ${colors.primaryColor()}`));
    return _el$;
  })();
  const renderDragArea = () => (() => {
    var _el$3 = _tmpl$22(), _el$4 = _el$3.firstChild, _el$5 = _el$4.nextSibling, _el$6 = _el$5.nextSibling, _el$7 = _el$6.nextSibling;
    _el$3.addEventListener("drop", handleDrop);
    _el$3.addEventListener("dragleave", handleDragLeave);
    _el$3.addEventListener("dragover", handleDragOver);
    _el$3.addEventListener("dragenter", handleDragEnter);
    insert(_el$3, createComponent(Upload, {
      get ["class"]() {
        return `h-12 w-12 ${colors.primaryColor()} mb-2`;
      }
    }), _el$4);
    insert(_el$4, () => getTextHelpers(props).dragDropText());
    insert(_el$5, () => getTextHelpers(props).orText());
    _el$6.addEventListener("change", handleFileChange);
    var _ref$ = fileInputRef;
    typeof _ref$ === "function" ? use(_ref$, _el$6) : fileInputRef = _el$6;
    insert(_el$7, () => getTextHelpers(props).selectButtonText());
    createRenderEffect((_p$) => {
      var _v$ = `border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center ${isDragging() ? `${colors.dragBorderColor()} ${colors.dragBgColor()}` : "border-gray-300"}`, _v$2 = `py-2 px-4 text-sm font-medium text-white ${colors.primaryBgColor()} rounded-md hover:${colors.hoverBgColor()} cursor-pointer`;
      _v$ !== _p$.e && className(_el$3, _p$.e = _v$);
      _v$2 !== _p$.t && className(_el$7, _p$.t = _v$2);
      return _p$;
    }, {
      e: void 0,
      t: void 0
    });
    return _el$3;
  })();
  const renderFileStatus = () => fileName() && (() => {
    var _el$8 = _tmpl$3(), _el$9 = _el$8.firstChild, _el$0 = _el$9.firstChild, _el$1 = _el$0.nextSibling, _el$10 = _el$9.nextSibling;
    insert(_el$9, createComponent(Check, {
      get ["class"]() {
        return `h-5 w-5 mr-2 ${colors.successIconColor()}`;
      }
    }), _el$0);
    insert(_el$0, () => getTextHelpers(props).fileSelectedText());
    insert(_el$9, fileName, null);
    insert(_el$8, (() => {
      var _c$ = memo(() => verificationErrors().length > 0);
      return () => _c$() && (() => {
        var _el$11 = _tmpl$4(), _el$12 = _el$11.firstChild, _el$13 = _el$12.firstChild, _el$14 = _el$12.nextSibling;
        insert(_el$12, createComponent(TriangleAlert, {
          "class": "h-5 w-5 mr-2"
        }), _el$13);
        insert(_el$14, createComponent(For, {
          get each() {
            return verificationErrors();
          },
          children: (error) => (() => {
            var _el$15 = _tmpl$5();
            insert(_el$15, error);
            return _el$15;
          })()
        }));
        createRenderEffect(() => className(_el$11, `p-3 ${colors.errorBgColor} ${colors.errorColor()} rounded-md text-sm`));
        return _el$11;
      })();
    })(), _el$10);
    insert(_el$8, (() => {
      var _c$2 = memo(() => !!isVerified());
      return () => _c$2() && (() => {
        var _el$16 = _tmpl$6(), _el$17 = _el$16.firstChild;
        insert(_el$16, createComponent(Check, {
          get ["class"]() {
            return `h-5 w-5 mr-2 ${colors.successIconColor()}`;
          }
        }), _el$17);
        createRenderEffect(() => className(_el$16, `p-3 ${colors.successBgColor()} ${colors.successColor()} rounded-md text-sm flex items-center`));
        return _el$16;
      })();
    })(), _el$10);
    _el$10.$$click = handleUpload;
    insert(_el$10, createComponent(FileCheck, {
      "class": "h-5 w-5 mr-2"
    }), null);
    insert(_el$10, (() => {
      var _c$3 = memo(() => !!isVerifying());
      return () => _c$3() ? "Verifying..." : getTextHelpers(props).uploadButtonText();
    })(), null);
    createRenderEffect((_p$) => {
      var _v$3 = `p-3 ${colors.successBgColor()} ${colors.successColor()} rounded-md text-sm flex items-center`, _v$4 = isVerifying(), _v$5 = `w-full py-2 px-4 flex items-center justify-center text-sm font-medium text-white 
          ${isVerifying() ? "bg-gray-400" : colors.primaryBgColor()} 
          rounded-md 
          ${isVerifying() ? "" : `hover:${colors.hoverBgColor()}`} 
          transition-colors duration-200`;
      _v$3 !== _p$.e && className(_el$9, _p$.e = _v$3);
      _v$4 !== _p$.t && (_el$10.disabled = _p$.t = _v$4);
      _v$5 !== _p$.a && className(_el$10, _p$.a = _v$5);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    });
    return _el$8;
  })();
  return (() => {
    var _el$18 = _tmpl$7(), _el$19 = _el$18.firstChild, _el$20 = _el$19.firstChild;
    var _ref$2 = containerRef;
    typeof _ref$2 === "function" ? use(_ref$2, _el$18) : containerRef = _el$18;
    insert(_el$20, renderHeader, null);
    insert(_el$20, renderDragArea, null);
    insert(_el$20, renderFileStatus, null);
    return _el$18;
  })();
}
delegateEvents(["click"]);

// src/styles.css
var styles_default = '/*! tailwindcss v4.1.6 | MIT License | https://tailwindcss.com */\n@layer properties;\n@layer theme, base, components, utilities;\n@layer theme {\n  :root, :host {\n    --font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji",\n      "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";\n    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",\n      "Courier New", monospace;\n    --color-red-50: oklch(97.1% 0.013 17.38);\n    --color-red-700: oklch(50.5% 0.213 27.518);\n    --color-green-50: oklch(98.2% 0.018 155.826);\n    --color-green-200: oklch(92.5% 0.084 155.995);\n    --color-green-500: oklch(72.3% 0.219 149.579);\n    --color-green-600: oklch(62.7% 0.194 149.214);\n    --color-green-700: oklch(52.7% 0.154 150.069);\n    --color-gray-50: oklch(98.5% 0.002 247.839);\n    --color-gray-300: oklch(87.2% 0.01 258.338);\n    --color-gray-400: oklch(70.7% 0.022 261.325);\n    --color-gray-500: oklch(55.1% 0.027 264.364);\n    --color-gray-700: oklch(37.3% 0.034 259.733);\n    --color-white: #fff;\n    --spacing: 0.25rem;\n    --container-lg: 32rem;\n    --text-xs: 0.75rem;\n    --text-xs--line-height: calc(1 / 0.75);\n    --text-sm: 0.875rem;\n    --text-sm--line-height: calc(1.25 / 0.875);\n    --text-xl: 1.25rem;\n    --text-xl--line-height: calc(1.75 / 1.25);\n    --font-weight-medium: 500;\n    --font-weight-bold: 700;\n    --radius-md: 0.375rem;\n    --radius-lg: 0.5rem;\n    --radius-2xl: 1rem;\n    --drop-shadow-2xl: 0 25px 25px rgb(0 0 0 / 0.15);\n    --default-transition-duration: 150ms;\n    --default-transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n    --default-font-family: var(--font-sans);\n    --default-mono-font-family: var(--font-mono);\n  }\n}\n@layer base {\n  *, ::after, ::before, ::backdrop, ::file-selector-button {\n    box-sizing: border-box;\n    margin: 0;\n    padding: 0;\n    border: 0 solid;\n  }\n  html, :host {\n    line-height: 1.5;\n    -webkit-text-size-adjust: 100%;\n    tab-size: 4;\n    font-family: var(--default-font-family, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");\n    font-feature-settings: var(--default-font-feature-settings, normal);\n    font-variation-settings: var(--default-font-variation-settings, normal);\n    -webkit-tap-highlight-color: transparent;\n  }\n  hr {\n    height: 0;\n    color: inherit;\n    border-top-width: 1px;\n  }\n  abbr:where([title]) {\n    -webkit-text-decoration: underline dotted;\n    text-decoration: underline dotted;\n  }\n  h1, h2, h3, h4, h5, h6 {\n    font-size: inherit;\n    font-weight: inherit;\n  }\n  a {\n    color: inherit;\n    -webkit-text-decoration: inherit;\n    text-decoration: inherit;\n  }\n  b, strong {\n    font-weight: bolder;\n  }\n  code, kbd, samp, pre {\n    font-family: var(--default-mono-font-family, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace);\n    font-feature-settings: var(--default-mono-font-feature-settings, normal);\n    font-variation-settings: var(--default-mono-font-variation-settings, normal);\n    font-size: 1em;\n  }\n  small {\n    font-size: 80%;\n  }\n  sub, sup {\n    font-size: 75%;\n    line-height: 0;\n    position: relative;\n    vertical-align: baseline;\n  }\n  sub {\n    bottom: -0.25em;\n  }\n  sup {\n    top: -0.5em;\n  }\n  table {\n    text-indent: 0;\n    border-color: inherit;\n    border-collapse: collapse;\n  }\n  :-moz-focusring {\n    outline: auto;\n  }\n  progress {\n    vertical-align: baseline;\n  }\n  summary {\n    display: list-item;\n  }\n  ol, ul, menu {\n    list-style: none;\n  }\n  img, svg, video, canvas, audio, iframe, embed, object {\n    display: block;\n    vertical-align: middle;\n  }\n  img, video {\n    max-width: 100%;\n    height: auto;\n  }\n  button, input, select, optgroup, textarea, ::file-selector-button {\n    font: inherit;\n    font-feature-settings: inherit;\n    font-variation-settings: inherit;\n    letter-spacing: inherit;\n    color: inherit;\n    border-radius: 0;\n    background-color: transparent;\n    opacity: 1;\n  }\n  :where(select:is([multiple], [size])) optgroup {\n    font-weight: bolder;\n  }\n  :where(select:is([multiple], [size])) optgroup option {\n    padding-inline-start: 20px;\n  }\n  ::file-selector-button {\n    margin-inline-end: 4px;\n  }\n  ::placeholder {\n    opacity: 1;\n  }\n  @supports (not (-webkit-appearance: -apple-pay-button))  or (contain-intrinsic-size: 1px) {\n    ::placeholder {\n      color: currentcolor;\n      @supports (color: color-mix(in lab, red, red)) {\n        color: color-mix(in oklab, currentcolor 50%, transparent);\n      }\n    }\n  }\n  textarea {\n    resize: vertical;\n  }\n  ::-webkit-search-decoration {\n    -webkit-appearance: none;\n  }\n  ::-webkit-date-and-time-value {\n    min-height: 1lh;\n    text-align: inherit;\n  }\n  ::-webkit-datetime-edit {\n    display: inline-flex;\n  }\n  ::-webkit-datetime-edit-fields-wrapper {\n    padding: 0;\n  }\n  ::-webkit-datetime-edit, ::-webkit-datetime-edit-year-field, ::-webkit-datetime-edit-month-field, ::-webkit-datetime-edit-day-field, ::-webkit-datetime-edit-hour-field, ::-webkit-datetime-edit-minute-field, ::-webkit-datetime-edit-second-field, ::-webkit-datetime-edit-millisecond-field, ::-webkit-datetime-edit-meridiem-field {\n    padding-block: 0;\n  }\n  :-moz-ui-invalid {\n    box-shadow: none;\n  }\n  button, input:where([type="button"], [type="reset"], [type="submit"]), ::file-selector-button {\n    appearance: button;\n  }\n  ::-webkit-inner-spin-button, ::-webkit-outer-spin-button {\n    height: auto;\n  }\n  [hidden]:where(:not([hidden="until-found"])) {\n    display: none !important;\n  }\n}\n@layer utilities {\n  .container {\n    width: 100%;\n    @media (width >= 40rem) {\n      max-width: 40rem;\n    }\n    @media (width >= 48rem) {\n      max-width: 48rem;\n    }\n    @media (width >= 64rem) {\n      max-width: 64rem;\n    }\n    @media (width >= 80rem) {\n      max-width: 80rem;\n    }\n    @media (width >= 96rem) {\n      max-width: 96rem;\n    }\n  }\n  .mr-2 {\n    margin-right: calc(var(--spacing) * 2);\n  }\n  .mb-1 {\n    margin-bottom: calc(var(--spacing) * 1);\n  }\n  .mb-2 {\n    margin-bottom: calc(var(--spacing) * 2);\n  }\n  .mb-3 {\n    margin-bottom: calc(var(--spacing) * 3);\n  }\n  .mb-4 {\n    margin-bottom: calc(var(--spacing) * 4);\n  }\n  .contents {\n    display: contents;\n  }\n  .flex {\n    display: flex;\n  }\n  .hidden {\n    display: none;\n  }\n  .h-5 {\n    height: calc(var(--spacing) * 5);\n  }\n  .h-6 {\n    height: calc(var(--spacing) * 6);\n  }\n  .h-12 {\n    height: calc(var(--spacing) * 12);\n  }\n  .min-h-screen {\n    min-height: 100vh;\n  }\n  .w-5 {\n    width: calc(var(--spacing) * 5);\n  }\n  .w-6 {\n    width: calc(var(--spacing) * 6);\n  }\n  .w-12 {\n    width: calc(var(--spacing) * 12);\n  }\n  .w-full {\n    width: 100%;\n  }\n  .max-w-lg {\n    max-width: var(--container-lg);\n  }\n  .cursor-pointer {\n    cursor: pointer;\n  }\n  .list-disc {\n    list-style-type: disc;\n  }\n  .flex-col {\n    flex-direction: column;\n  }\n  .items-center {\n    align-items: center;\n  }\n  .justify-center {\n    justify-content: center;\n  }\n  .space-y-1 {\n    :where(& > :not(:last-child)) {\n      --tw-space-y-reverse: 0;\n      margin-block-start: calc(calc(var(--spacing) * 1) * var(--tw-space-y-reverse));\n      margin-block-end: calc(calc(var(--spacing) * 1) * calc(1 - var(--tw-space-y-reverse)));\n    }\n  }\n  .space-y-3 {\n    :where(& > :not(:last-child)) {\n      --tw-space-y-reverse: 0;\n      margin-block-start: calc(calc(var(--spacing) * 3) * var(--tw-space-y-reverse));\n      margin-block-end: calc(calc(var(--spacing) * 3) * calc(1 - var(--tw-space-y-reverse)));\n    }\n  }\n  .space-y-4 {\n    :where(& > :not(:last-child)) {\n      --tw-space-y-reverse: 0;\n      margin-block-start: calc(calc(var(--spacing) * 4) * var(--tw-space-y-reverse));\n      margin-block-end: calc(calc(var(--spacing) * 4) * calc(1 - var(--tw-space-y-reverse)));\n    }\n  }\n  .rounded-2xl {\n    border-radius: var(--radius-2xl);\n  }\n  .rounded-lg {\n    border-radius: var(--radius-lg);\n  }\n  .rounded-md {\n    border-radius: var(--radius-md);\n  }\n  .border {\n    border-style: var(--tw-border-style);\n    border-width: 1px;\n  }\n  .border-2 {\n    border-style: var(--tw-border-style);\n    border-width: 2px;\n  }\n  .border-dashed {\n    --tw-border-style: dashed;\n    border-style: dashed;\n  }\n  .border-gray-300 {\n    border-color: var(--color-gray-300);\n  }\n  .border-green-200 {\n    border-color: var(--color-green-200);\n  }\n  .border-green-500 {\n    border-color: var(--color-green-500);\n  }\n  .bg-gray-50 {\n    background-color: var(--color-gray-50);\n  }\n  .bg-gray-400 {\n    background-color: var(--color-gray-400);\n  }\n  .bg-green-50 {\n    background-color: var(--color-green-50);\n  }\n  .bg-green-600 {\n    background-color: var(--color-green-600);\n  }\n  .bg-green-700 {\n    background-color: var(--color-green-700);\n  }\n  .bg-red-50 {\n    background-color: var(--color-red-50);\n  }\n  .bg-white {\n    background-color: var(--color-white);\n  }\n  .p-3 {\n    padding: calc(var(--spacing) * 3);\n  }\n  .p-6 {\n    padding: calc(var(--spacing) * 6);\n  }\n  .p-8 {\n    padding: calc(var(--spacing) * 8);\n  }\n  .px-4 {\n    padding-inline: calc(var(--spacing) * 4);\n  }\n  .py-2 {\n    padding-block: calc(var(--spacing) * 2);\n  }\n  .pl-5 {\n    padding-left: calc(var(--spacing) * 5);\n  }\n  .text-center {\n    text-align: center;\n  }\n  .text-sm {\n    font-size: var(--text-sm);\n    line-height: var(--tw-leading, var(--text-sm--line-height));\n  }\n  .text-xl {\n    font-size: var(--text-xl);\n    line-height: var(--tw-leading, var(--text-xl--line-height));\n  }\n  .text-xs {\n    font-size: var(--text-xs);\n    line-height: var(--tw-leading, var(--text-xs--line-height));\n  }\n  .font-bold {\n    --tw-font-weight: var(--font-weight-bold);\n    font-weight: var(--font-weight-bold);\n  }\n  .font-medium {\n    --tw-font-weight: var(--font-weight-medium);\n    font-weight: var(--font-weight-medium);\n  }\n  .text-gray-500 {\n    color: var(--color-gray-500);\n  }\n  .text-gray-700 {\n    color: var(--color-gray-700);\n  }\n  .text-green-600 {\n    color: var(--color-green-600);\n  }\n  .text-green-700 {\n    color: var(--color-green-700);\n  }\n  .text-red-700 {\n    color: var(--color-red-700);\n  }\n  .text-white {\n    color: var(--color-white);\n  }\n  .shadow {\n    --tw-shadow: 0 1px 3px 0 var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 1px 2px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1));\n    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);\n  }\n  .drop-shadow-2xl {\n    --tw-drop-shadow-size: drop-shadow(0 25px 25px var(--tw-drop-shadow-color, rgb(0 0 0 / 0.15)));\n    --tw-drop-shadow: drop-shadow(var(--drop-shadow-2xl));\n    filter: var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,);\n  }\n  .filter {\n    filter: var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,);\n  }\n  .transition-colors {\n    transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;\n    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));\n    transition-duration: var(--tw-duration, var(--default-transition-duration));\n  }\n  .duration-200 {\n    --tw-duration: 200ms;\n    transition-duration: 200ms;\n  }\n}\n@property --tw-space-y-reverse {\n  syntax: "*";\n  inherits: false;\n  initial-value: 0;\n}\n@property --tw-border-style {\n  syntax: "*";\n  inherits: false;\n  initial-value: solid;\n}\n@property --tw-font-weight {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-shadow {\n  syntax: "*";\n  inherits: false;\n  initial-value: 0 0 #0000;\n}\n@property --tw-shadow-color {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-shadow-alpha {\n  syntax: "<percentage>";\n  inherits: false;\n  initial-value: 100%;\n}\n@property --tw-inset-shadow {\n  syntax: "*";\n  inherits: false;\n  initial-value: 0 0 #0000;\n}\n@property --tw-inset-shadow-color {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-inset-shadow-alpha {\n  syntax: "<percentage>";\n  inherits: false;\n  initial-value: 100%;\n}\n@property --tw-ring-color {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-ring-shadow {\n  syntax: "*";\n  inherits: false;\n  initial-value: 0 0 #0000;\n}\n@property --tw-inset-ring-color {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-inset-ring-shadow {\n  syntax: "*";\n  inherits: false;\n  initial-value: 0 0 #0000;\n}\n@property --tw-ring-inset {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-ring-offset-width {\n  syntax: "<length>";\n  inherits: false;\n  initial-value: 0px;\n}\n@property --tw-ring-offset-color {\n  syntax: "*";\n  inherits: false;\n  initial-value: #fff;\n}\n@property --tw-ring-offset-shadow {\n  syntax: "*";\n  inherits: false;\n  initial-value: 0 0 #0000;\n}\n@property --tw-blur {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-brightness {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-contrast {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-grayscale {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-hue-rotate {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-invert {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-opacity {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-saturate {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-sepia {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-drop-shadow {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-drop-shadow-color {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-drop-shadow-alpha {\n  syntax: "<percentage>";\n  inherits: false;\n  initial-value: 100%;\n}\n@property --tw-drop-shadow-size {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-duration {\n  syntax: "*";\n  inherits: false;\n}\n@layer properties {\n  @supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b)))) {\n    *, ::before, ::after, ::backdrop {\n      --tw-space-y-reverse: 0;\n      --tw-border-style: solid;\n      --tw-font-weight: initial;\n      --tw-shadow: 0 0 #0000;\n      --tw-shadow-color: initial;\n      --tw-shadow-alpha: 100%;\n      --tw-inset-shadow: 0 0 #0000;\n      --tw-inset-shadow-color: initial;\n      --tw-inset-shadow-alpha: 100%;\n      --tw-ring-color: initial;\n      --tw-ring-shadow: 0 0 #0000;\n      --tw-inset-ring-color: initial;\n      --tw-inset-ring-shadow: 0 0 #0000;\n      --tw-ring-inset: initial;\n      --tw-ring-offset-width: 0px;\n      --tw-ring-offset-color: #fff;\n      --tw-ring-offset-shadow: 0 0 #0000;\n      --tw-blur: initial;\n      --tw-brightness: initial;\n      --tw-contrast: initial;\n      --tw-grayscale: initial;\n      --tw-hue-rotate: initial;\n      --tw-invert: initial;\n      --tw-opacity: initial;\n      --tw-saturate: initial;\n      --tw-sepia: initial;\n      --tw-drop-shadow: initial;\n      --tw-drop-shadow-color: initial;\n      --tw-drop-shadow-alpha: 100%;\n      --tw-drop-shadow-size: initial;\n      --tw-duration: initial;\n    }\n  }\n} ';

// src/index.ts
customElement("excel-upload", { title: "" }, (props) => {
  return ExcelUploadComponent({
    styles: styles_default,
    title: props.title
  });
});
export {
  ExcelUploadComponent
};
/*! Bundled license information:

lucide-solid/dist/esm/defaultAttributes.js:
lucide-solid/dist/esm/shared/src/utils.js:
lucide-solid/dist/esm/Icon.js:
lucide-solid/dist/esm/icons/check.js:
lucide-solid/dist/esm/icons/file-check.js:
lucide-solid/dist/esm/icons/file-spreadsheet.js:
lucide-solid/dist/esm/icons/triangle-alert.js:
lucide-solid/dist/esm/icons/upload.js:
lucide-solid/dist/esm/lucide-solid.js:
  (**
   * @license lucide-solid v0.509.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
//# sourceMappingURL=index.js.map

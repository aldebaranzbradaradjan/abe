
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init$1(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.35.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.35.0 */

    const { Error: Error_1, Object: Object_1$2, console: console_1 } = globals;

    // (209:0) {:else}
    function create_else_block$2(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (202:0) {#if componentParams}
    function create_if_block$3(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(202:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn("Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading");

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    	try {
    		window.history.replaceState(undefined, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event("hashchange"));
    }

    function link(node, hrefVar) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, hrefVar || node.getAttribute("href"));

    	return {
    		update(updated) {
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, href) {
    	// Destination must start with '/'
    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute: " + href);
    	}

    	// Add # to the href attribute
    	node.setAttribute("href", "#" + href);

    	node.addEventListener("click", scrollstateHistoryHandler);
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {HTMLElementEventMap} event - an onclick event attached to an anchor tag
     */
    function scrollstateHistoryHandler(event) {
    	// Prevent default anchor onclick behaviour
    	event.preventDefault();

    	const href = event.currentTarget.getAttribute("href");

    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument - strings must start with / or *");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == "string") {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || "/";
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || "/";
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	if (restoreScrollState) {
    		window.addEventListener("popstate", event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		});

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.scrollX, previousScrollState.scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick("conditionsFailed", detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoading", Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == "object" && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    	});

    	const writable_props = ["routes", "prefix", "restoreScrollState"];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		scrollstateHistoryHandler,
    		createEventDispatcher,
    		afterUpdate,
    		regexparam,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		lastLoc,
    		componentObj
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("previousScrollState" in $$props) previousScrollState = $$props.previousScrollState;
    		if ("lastLoc" in $$props) lastLoc = $$props.lastLoc;
    		if ("componentObj" in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$1(this, options, instance$i, create_fragment$i, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$i.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/routes/Modal.svelte generated by Svelte v3.35.0 */
    const file$h = "src/routes/Modal.svelte";
    const get_button_slot_changes = dirty => ({});
    const get_button_slot_context = ctx => ({});
    const get_title_slot_changes = dirty => ({});
    const get_title_slot_context = ctx => ({});

    // (7:0) {#if show}
    function create_if_block$2(ctx) {
    	let div0;
    	let div0_intro;
    	let div0_outro;
    	let t0;
    	let div4;
    	let div1;
    	let h2;
    	let t1;
    	let form;
    	let div2;
    	let t2;
    	let div3;
    	let button;
    	let t4;
    	let div4_intro;
    	let div4_outro;
    	let current;
    	let mounted;
    	let dispose;
    	const title_slot_template = /*#slots*/ ctx[2].title;
    	const title_slot = create_slot(title_slot_template, ctx, /*$$scope*/ ctx[1], get_title_slot_context);
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);
    	const button_slot_template = /*#slots*/ ctx[2].button;
    	const button_slot = create_slot(button_slot_template, ctx, /*$$scope*/ ctx[1], get_button_slot_context);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div4 = element("div");
    			div1 = element("div");
    			h2 = element("h2");
    			if (title_slot) title_slot.c();
    			t1 = space();
    			form = element("form");
    			div2 = element("div");
    			if (default_slot) default_slot.c();
    			t2 = space();
    			div3 = element("div");
    			button = element("button");
    			button.textContent = "Cancel";
    			t4 = space();
    			if (button_slot) button_slot.c();
    			attr_dev(div0, "class", "modal-background svelte-1byuywo");
    			add_location(div0, file$h, 7, 1, 94);
    			attr_dev(h2, "class", "title svelte-1byuywo");
    			add_location(h2, file$h, 12, 3, 284);
    			attr_dev(div1, "class", "w3-center");
    			add_location(div1, file$h, 11, 2, 257);
    			attr_dev(div2, "class", "w3-section svelte-1byuywo");
    			add_location(div2, file$h, 16, 3, 377);
    			attr_dev(form, "class", "w3-container svelte-1byuywo");
    			add_location(form, file$h, 15, 2, 346);
    			attr_dev(button, "class", "w3-button w3-blue round svelte-1byuywo");
    			add_location(button, file$h, 22, 3, 515);
    			attr_dev(div3, "class", "w3-container w3-border-top w3-padding-16 w3-light-grey svelte-1byuywo");
    			add_location(div3, file$h, 21, 2, 443);
    			attr_dev(div4, "class", "w3-modal-content w3-card-4 modal-content svelte-1byuywo");
    			add_location(div4, file$h, 9, 1, 182);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div1);
    			append_dev(div1, h2);

    			if (title_slot) {
    				title_slot.m(h2, null);
    			}

    			append_dev(div4, t1);
    			append_dev(div4, form);
    			append_dev(form, div2);

    			if (default_slot) {
    				default_slot.m(div2, null);
    			}

    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, button);
    			append_dev(div3, t4);

    			if (button_slot) {
    				button_slot.m(div3, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler*/ ctx[3], false, false, false),
    					listen_dev(button, "click", /*click_handler_1*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (title_slot) {
    				if (title_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(title_slot, title_slot_template, ctx, /*$$scope*/ ctx[1], dirty, get_title_slot_changes, get_title_slot_context);
    				}
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}

    			if (button_slot) {
    				if (button_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(button_slot, button_slot_template, ctx, /*$$scope*/ ctx[1], dirty, get_button_slot_changes, get_button_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div0_outro) div0_outro.end(1);
    				if (!div0_intro) div0_intro = create_in_transition(div0, fade, {});
    				div0_intro.start();
    			});

    			transition_in(title_slot, local);
    			transition_in(default_slot, local);
    			transition_in(button_slot, local);

    			add_render_callback(() => {
    				if (div4_outro) div4_outro.end(1);
    				if (!div4_intro) div4_intro = create_in_transition(div4, fade, {});
    				div4_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div0_intro) div0_intro.invalidate();
    			div0_outro = create_out_transition(div0, fade, {});
    			transition_out(title_slot, local);
    			transition_out(default_slot, local);
    			transition_out(button_slot, local);
    			if (div4_intro) div4_intro.invalidate();
    			div4_outro = create_out_transition(div4, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching && div0_outro) div0_outro.end();
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div4);
    			if (title_slot) title_slot.d(detaching);
    			if (default_slot) default_slot.d(detaching);
    			if (button_slot) button_slot.d(detaching);
    			if (detaching && div4_outro) div4_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(7:0) {#if show}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*show*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*show*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*show*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Modal", slots, ['title','default','button']);
    	let { show } = $$props;
    	const writable_props = ["show"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(0, show = false);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(0, show = false);
    	};

    	$$self.$$set = $$props => {
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ fade, show });

    	$$self.$inject_state = $$props => {
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [show, $$scope, slots, click_handler, click_handler_1];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$h, create_fragment$h, safe_not_equal, { show: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$h.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*show*/ ctx[0] === undefined && !("show" in props)) {
    			console.warn("<Modal> was created without expected prop 'show'");
    		}
    	}

    	get show() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    let wasm;

    const heap = new Array(32).fill(undefined);

    heap.push(undefined, null, true, false);

    function getObject(idx) { return heap[idx]; }

    let heap_next = heap.length;

    function dropObject(idx) {
        if (idx < 36) return;
        heap[idx] = heap_next;
        heap_next = idx;
    }

    function takeObject(idx) {
        const ret = getObject(idx);
        dropObject(idx);
        return ret;
    }

    function addHeapObject(obj) {
        if (heap_next === heap.length) heap.push(heap.length + 1);
        const idx = heap_next;
        heap_next = heap[idx];

        heap[idx] = obj;
        return idx;
    }

    let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

    cachedTextDecoder.decode();

    let cachegetUint8Memory0 = null;
    function getUint8Memory0() {
        if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
            cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
        }
        return cachegetUint8Memory0;
    }

    function getStringFromWasm0(ptr, len) {
        return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
    }

    function debugString(val) {
        // primitive types
        const type = typeof val;
        if (type == 'number' || type == 'boolean' || val == null) {
            return  `${val}`;
        }
        if (type == 'string') {
            return `"${val}"`;
        }
        if (type == 'symbol') {
            const description = val.description;
            if (description == null) {
                return 'Symbol';
            } else {
                return `Symbol(${description})`;
            }
        }
        if (type == 'function') {
            const name = val.name;
            if (typeof name == 'string' && name.length > 0) {
                return `Function(${name})`;
            } else {
                return 'Function';
            }
        }
        // objects
        if (Array.isArray(val)) {
            const length = val.length;
            let debug = '[';
            if (length > 0) {
                debug += debugString(val[0]);
            }
            for(let i = 1; i < length; i++) {
                debug += ', ' + debugString(val[i]);
            }
            debug += ']';
            return debug;
        }
        // Test for built-in
        const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
        let className;
        if (builtInMatches.length > 1) {
            className = builtInMatches[1];
        } else {
            // Failed to match the standard '[object ClassName]'
            return toString.call(val);
        }
        if (className == 'Object') {
            // we're a user defined class or Object
            // JSON.stringify avoids problems with cycles, and is generally much
            // easier than looping through ownProperties of `val`.
            try {
                return 'Object(' + JSON.stringify(val) + ')';
            } catch (_) {
                return 'Object';
            }
        }
        // errors
        if (val instanceof Error) {
            return `${val.name}: ${val.message}\n${val.stack}`;
        }
        // TODO we could test for more things here, like `Set`s and `Map`s.
        return className;
    }

    let WASM_VECTOR_LEN = 0;

    let cachedTextEncoder = new TextEncoder('utf-8');

    const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
        ? function (arg, view) {
        return cachedTextEncoder.encodeInto(arg, view);
    }
        : function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    });

    function passStringToWasm0(arg, malloc, realloc) {

        if (realloc === undefined) {
            const buf = cachedTextEncoder.encode(arg);
            const ptr = malloc(buf.length);
            getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
            WASM_VECTOR_LEN = buf.length;
            return ptr;
        }

        let len = arg.length;
        let ptr = malloc(len);

        const mem = getUint8Memory0();

        let offset = 0;

        for (; offset < len; offset++) {
            const code = arg.charCodeAt(offset);
            if (code > 0x7F) break;
            mem[ptr + offset] = code;
        }

        if (offset !== len) {
            if (offset !== 0) {
                arg = arg.slice(offset);
            }
            ptr = realloc(ptr, len, len = offset + arg.length * 3);
            const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
            const ret = encodeString(arg, view);

            offset += ret.written;
        }

        WASM_VECTOR_LEN = offset;
        return ptr;
    }

    let cachegetInt32Memory0 = null;
    function getInt32Memory0() {
        if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
            cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
        }
        return cachegetInt32Memory0;
    }

    function makeClosure(arg0, arg1, dtor, f) {
        const state = { a: arg0, b: arg1, cnt: 1, dtor };
        const real = (...args) => {
            // First up with a closure we increment the internal reference
            // count. This ensures that the Rust closure environment won't
            // be deallocated while we're invoking it.
            state.cnt++;
            try {
                return f(state.a, state.b, ...args);
            } finally {
                if (--state.cnt === 0) {
                    wasm.__wbindgen_export_2.get(state.dtor)(state.a, state.b);
                    state.a = 0;

                }
            }
        };
        real.original = state;

        return real;
    }
    function __wbg_adapter_16(arg0, arg1, arg2) {
        wasm._dyn_core__ops__function__Fn__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h4b2fcfb27da0c61b(arg0, arg1, addHeapObject(arg2));
    }

    function makeMutClosure(arg0, arg1, dtor, f) {
        const state = { a: arg0, b: arg1, cnt: 1, dtor };
        const real = (...args) => {
            // First up with a closure we increment the internal reference
            // count. This ensures that the Rust closure environment won't
            // be deallocated while we're invoking it.
            state.cnt++;
            const a = state.a;
            state.a = 0;
            try {
                return f(a, state.b, ...args);
            } finally {
                if (--state.cnt === 0) {
                    wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);

                } else {
                    state.a = a;
                }
            }
        };
        real.original = state;

        return real;
    }

    let stack_pointer = 32;

    function addBorrowedObject(obj) {
        if (stack_pointer == 1) throw new Error('out of js stack');
        heap[--stack_pointer] = obj;
        return stack_pointer;
    }
    function __wbg_adapter_19(arg0, arg1, arg2) {
        try {
            wasm._dyn_core__ops__function__FnMut___A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h661a714473b89679(arg0, arg1, addBorrowedObject(arg2));
        } finally {
            heap[stack_pointer++] = undefined;
        }
    }

    function notDefined(what) { return () => { throw new Error(`${what} is not defined`); }; }

    function isLikeNone(x) {
        return x === undefined || x === null;
    }

    function handleError(f, args) {
        try {
            return f.apply(this, args);
        } catch (e) {
            wasm.__wbindgen_exn_store(addHeapObject(e));
        }
    }

    async function load(module, imports) {
        if (typeof Response === 'function' && module instanceof Response) {
            if (typeof WebAssembly.instantiateStreaming === 'function') {
                try {
                    return await WebAssembly.instantiateStreaming(module, imports);

                } catch (e) {
                    if (module.headers.get('Content-Type') != 'application/wasm') {
                        console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                    } else {
                        throw e;
                    }
                }
            }

            const bytes = await module.arrayBuffer();
            return await WebAssembly.instantiate(bytes, imports);

        } else {
            const instance = await WebAssembly.instantiate(module, imports);

            if (instance instanceof WebAssembly.Instance) {
                return { instance, module };

            } else {
                return instance;
            }
        }
    }

    async function init(input) {
        if (typeof input === 'undefined') {
            input = new URL('wasm_bg.wasm', (document.currentScript && document.currentScript.src || new URL('bundle.js', document.baseURI).href));
        }
        const imports = {};
        imports.wbg = {};
        imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
            takeObject(arg0);
        };
        imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
            var ret = getObject(arg0);
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_cb_drop = function(arg0) {
            const obj = takeObject(arg0).original;
            if (obj.cnt-- == 1) {
                obj.a = 0;
                return true;
            }
            var ret = false;
            return ret;
        };
        imports.wbg.__wbg_random_6711c0e53b003e8d = typeof Math.random == 'function' ? Math.random : notDefined('Math.random');
        imports.wbg.__wbindgen_is_undefined = function(arg0) {
            var ret = getObject(arg0) === undefined;
            return ret;
        };
        imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
            var ret = getStringFromWasm0(arg0, arg1);
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_instanceof_Window_c4b70662a0d2c5ec = function(arg0) {
            var ret = getObject(arg0) instanceof Window;
            return ret;
        };
        imports.wbg.__wbg_document_1c64944725c0d81d = function(arg0) {
            var ret = getObject(arg0).document;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_head_d205ec9bd59f31a7 = function(arg0) {
            var ret = getObject(arg0).head;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_createElement_86c152812a141a62 = function() { return handleError(function (arg0, arg1, arg2) {
            var ret = getObject(arg0).createElement(getStringFromWasm0(arg1, arg2));
            return addHeapObject(ret);
        }, arguments) };
        imports.wbg.__wbg_createElementNS_ae12b8681c3957a3 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            var ret = getObject(arg0).createElementNS(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
            return addHeapObject(ret);
        }, arguments) };
        imports.wbg.__wbg_createTextNode_365db3bc3d0523ab = function(arg0, arg1, arg2) {
            var ret = getObject(arg0).createTextNode(getStringFromWasm0(arg1, arg2));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_getElementById_f3e94458ce77f0d0 = function(arg0, arg1, arg2) {
            var ret = getObject(arg0).getElementById(getStringFromWasm0(arg1, arg2));
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_instanceof_HtmlTextAreaElement_c2f3b4bd6871d5ad = function(arg0) {
            var ret = getObject(arg0) instanceof HTMLTextAreaElement;
            return ret;
        };
        imports.wbg.__wbg_value_686b2a68422cb88d = function(arg0, arg1) {
            var ret = getObject(arg1).value;
            var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbg_setvalue_0a07023245efa3cc = function(arg0, arg1, arg2) {
            getObject(arg0).value = getStringFromWasm0(arg1, arg2);
        };
        imports.wbg.__wbg_selectionStart_a48a5db04d7a57a3 = function() { return handleError(function (arg0, arg1) {
            var ret = getObject(arg1).selectionStart;
            getInt32Memory0()[arg0 / 4 + 1] = isLikeNone(ret) ? 0 : ret;
            getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
        }, arguments) };
        imports.wbg.__wbg_setselectionStart_9c82f69e855d2516 = function() { return handleError(function (arg0, arg1, arg2) {
            getObject(arg0).selectionStart = arg1 === 0 ? undefined : arg2 >>> 0;
        }, arguments) };
        imports.wbg.__wbg_selectionEnd_671997e2b45dfc5d = function() { return handleError(function (arg0, arg1) {
            var ret = getObject(arg1).selectionEnd;
            getInt32Memory0()[arg0 / 4 + 1] = isLikeNone(ret) ? 0 : ret;
            getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
        }, arguments) };
        imports.wbg.__wbg_setselectionEnd_f0fa260621ac9b0c = function() { return handleError(function (arg0, arg1, arg2) {
            getObject(arg0).selectionEnd = arg1 === 0 ? undefined : arg2 >>> 0;
        }, arguments) };
        imports.wbg.__wbg_setRangeText_7616cb1c924a28ed = function() { return handleError(function (arg0, arg1, arg2) {
            getObject(arg0).setRangeText(getStringFromWasm0(arg1, arg2));
        }, arguments) };
        imports.wbg.__wbg_instanceof_HtmlButtonElement_54060a3d8d49c8a6 = function(arg0) {
            var ret = getObject(arg0) instanceof HTMLButtonElement;
            return ret;
        };
        imports.wbg.__wbg_settype_bd9da7e07b7cb217 = function(arg0, arg1, arg2) {
            getObject(arg0).type = getStringFromWasm0(arg1, arg2);
        };
        imports.wbg.__wbg_instanceof_HtmlInputElement_8cafe5f30dfdb6bc = function(arg0) {
            var ret = getObject(arg0) instanceof HTMLInputElement;
            return ret;
        };
        imports.wbg.__wbg_setchecked_206243371da58f6a = function(arg0, arg1) {
            getObject(arg0).checked = arg1 !== 0;
        };
        imports.wbg.__wbg_settype_6a7d0ca3b1b6d0c2 = function(arg0, arg1, arg2) {
            getObject(arg0).type = getStringFromWasm0(arg1, arg2);
        };
        imports.wbg.__wbg_value_0627d4b1c27534e6 = function(arg0, arg1) {
            var ret = getObject(arg1).value;
            var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbg_setvalue_2459f62386b6967f = function(arg0, arg1, arg2) {
            getObject(arg0).value = getStringFromWasm0(arg1, arg2);
        };
        imports.wbg.__wbg_namespaceURI_f4cd665d07463337 = function(arg0, arg1) {
            var ret = getObject(arg1).namespaceURI;
            var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbg_setid_681bb5a14c3d5850 = function(arg0, arg1, arg2) {
            getObject(arg0).id = getStringFromWasm0(arg1, arg2);
        };
        imports.wbg.__wbg_scrollTop_e053c182e96917d6 = function(arg0) {
            var ret = getObject(arg0).scrollTop;
            return ret;
        };
        imports.wbg.__wbg_setscrollTop_0ae63bc824011913 = function(arg0, arg1) {
            getObject(arg0).scrollTop = arg1;
        };
        imports.wbg.__wbg_scrollHeight_987ac70f30463ef3 = function(arg0) {
            var ret = getObject(arg0).scrollHeight;
            return ret;
        };
        imports.wbg.__wbg_setinnerHTML_e5b817d6227a431c = function(arg0, arg1, arg2) {
            getObject(arg0).innerHTML = getStringFromWasm0(arg1, arg2);
        };
        imports.wbg.__wbg_removeAttribute_eea03ed128669b8f = function() { return handleError(function (arg0, arg1, arg2) {
            getObject(arg0).removeAttribute(getStringFromWasm0(arg1, arg2));
        }, arguments) };
        imports.wbg.__wbg_setAttribute_1b533bf07966de55 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).setAttribute(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        }, arguments) };
        imports.wbg.__wbg_instanceof_HtmlElement_df66c8b4a687aa43 = function(arg0) {
            var ret = getObject(arg0) instanceof HTMLElement;
            return ret;
        };
        imports.wbg.__wbg_style_c88e323890d3a091 = function(arg0) {
            var ret = getObject(arg0).style;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_offsetLeft_d6d050965faa87a8 = function(arg0) {
            var ret = getObject(arg0).offsetLeft;
            return ret;
        };
        imports.wbg.__wbg_offsetWidth_69cd6669725b154f = function(arg0) {
            var ret = getObject(arg0).offsetWidth;
            return ret;
        };
        imports.wbg.__wbg_focus_00530e359f44fc6e = function() { return handleError(function (arg0) {
            getObject(arg0).focus();
        }, arguments) };
        imports.wbg.__wbg_new_28b6d1b27ad74026 = function() { return handleError(function (arg0, arg1) {
            var ret = new Event(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        }, arguments) };
        imports.wbg.__wbg_addEventListener_52721772cc0a7f30 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
            getObject(arg0).addEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3));
        }, arguments) };
        imports.wbg.__wbg_addEventListener_09e11fbf8b4b719b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).addEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3), getObject(arg4));
        }, arguments) };
        imports.wbg.__wbg_removeEventListener_f2adc9b2b318de99 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
            getObject(arg0).removeEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3));
        }, arguments) };
        imports.wbg.__wbg_removeEventListener_24d5a7c12c3f3c39 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).removeEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3), arg4 !== 0);
        }, arguments) };
        imports.wbg.__wbg_instanceof_HtmlDocument_1faa18f5a2da6fb3 = function(arg0) {
            var ret = getObject(arg0) instanceof HTMLDocument;
            return ret;
        };
        imports.wbg.__wbg_execCommand_6f61c62ff71c2bd2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            var ret = getObject(arg0).execCommand(getStringFromWasm0(arg1, arg2), arg3 !== 0, getStringFromWasm0(arg4, arg5));
            return ret;
        }, arguments) };
        imports.wbg.__wbg_lastChild_ca5bac177ef353f6 = function(arg0) {
            var ret = getObject(arg0).lastChild;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_setnodeValue_702374ad3d0ec3df = function(arg0, arg1, arg2) {
            getObject(arg0).nodeValue = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
        };
        imports.wbg.__wbg_textContent_eef491bffc43d8d6 = function(arg0, arg1) {
            var ret = getObject(arg1).textContent;
            var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbg_settextContent_799ebbf96e16265d = function(arg0, arg1, arg2) {
            getObject(arg0).textContent = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
        };
        imports.wbg.__wbg_appendChild_d318db34c4559916 = function() { return handleError(function (arg0, arg1) {
            var ret = getObject(arg0).appendChild(getObject(arg1));
            return addHeapObject(ret);
        }, arguments) };
        imports.wbg.__wbg_insertBefore_5b314357408fbec1 = function() { return handleError(function (arg0, arg1, arg2) {
            var ret = getObject(arg0).insertBefore(getObject(arg1), getObject(arg2));
            return addHeapObject(ret);
        }, arguments) };
        imports.wbg.__wbg_removeChild_d3ca7b53e537867e = function() { return handleError(function (arg0, arg1) {
            var ret = getObject(arg0).removeChild(getObject(arg1));
            return addHeapObject(ret);
        }, arguments) };
        imports.wbg.__wbg_setProperty_1460c660bc329763 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).setProperty(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        }, arguments) };
        imports.wbg.__wbg_clientX_97ff0f5c7b19e687 = function(arg0) {
            var ret = getObject(arg0).clientX;
            return ret;
        };
        imports.wbg.__wbg_newnoargs_be86524d73f67598 = function(arg0, arg1) {
            var ret = new Function(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_new_0b83d3df67ecb33e = function() {
            var ret = new Object();
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_call_888d259a5fefc347 = function() { return handleError(function (arg0, arg1) {
            var ret = getObject(arg0).call(getObject(arg1));
            return addHeapObject(ret);
        }, arguments) };
        imports.wbg.__wbg_is_0f5efc7977a2c50b = function(arg0, arg1) {
            var ret = Object.is(getObject(arg0), getObject(arg1));
            return ret;
        };
        imports.wbg.__wbg_self_c6fbdfc2918d5e58 = function() { return handleError(function () {
            var ret = self.self;
            return addHeapObject(ret);
        }, arguments) };
        imports.wbg.__wbg_window_baec038b5ab35c54 = function() { return handleError(function () {
            var ret = window.window;
            return addHeapObject(ret);
        }, arguments) };
        imports.wbg.__wbg_globalThis_3f735a5746d41fbd = function() { return handleError(function () {
            var ret = globalThis.globalThis;
            return addHeapObject(ret);
        }, arguments) };
        imports.wbg.__wbg_global_1bc0b39582740e95 = function() { return handleError(function () {
            var ret = global.global;
            return addHeapObject(ret);
        }, arguments) };
        imports.wbg.__wbg_set_82a4e8a85e31ac42 = function() { return handleError(function (arg0, arg1, arg2) {
            var ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
            return ret;
        }, arguments) };
        imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
            var ret = debugString(getObject(arg1));
            var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbindgen_throw = function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        };
        imports.wbg.__wbindgen_closure_wrapper171 = function(arg0, arg1, arg2) {
            var ret = makeClosure(arg0, arg1, 95, __wbg_adapter_16);
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_closure_wrapper1230 = function(arg0, arg1, arg2) {
            var ret = makeMutClosure(arg0, arg1, 152, __wbg_adapter_19);
            return addHeapObject(ret);
        };

        if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
            input = fetch(input);
        }



        const { instance, module } = await load(await input, imports);

        wasm = instance.exports;
        init.__wbindgen_wasm_module = module;
        wasm.__wbindgen_start();
        return wasm;
    }

    /* src/routes/Editor/Editor.svelte generated by Svelte v3.35.0 */
    const file$g = "src/routes/Editor/Editor.svelte";

    // (98:0) <Modal bind:show={showSave}>
    function create_default_slot_1$1(ctx) {
    	let t0;
    	let b;
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			t0 = text("Do you want to save the post : ");
    			b = element("b");
    			t1 = text(/*title*/ ctx[0]);
    			t2 = text(" in the editor ?");
    			add_location(b, file$g, 98, 32, 2689);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, b, anchor);
    			append_dev(b, t1);
    			insert_dev(target, t2, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 1) set_data_dev(t1, /*title*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(98:0) <Modal bind:show={showSave}>",
    		ctx
    	});

    	return block;
    }

    // (100:1) 
    function create_title_slot_1$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Save Post";
    			attr_dev(div, "slot", "title");
    			add_location(div, file$g, 99, 1, 2723);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_title_slot_1$1.name,
    		type: "slot",
    		source: "(100:1) ",
    		ctx
    	});

    	return block;
    }

    // (101:1) 
    function create_button_slot_1$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Save";
    			attr_dev(button, "slot", "button");
    			attr_dev(button, "class", "w3-button w3-blue w3-right round");
    			add_location(button, file$g, 100, 1, 2758);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[10], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_button_slot_1$1.name,
    		type: "slot",
    		source: "(101:1) ",
    		ctx
    	});

    	return block;
    }

    // (111:2) <Modal bind:show={showBack}>
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Do you realy want to go back to the dashboard ? Unsaved changes could be lost !");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(111:2) <Modal bind:show={showBack}>",
    		ctx
    	});

    	return block;
    }

    // (113:1) 
    function create_title_slot$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Go Back to Dashboard";
    			attr_dev(div, "slot", "title");
    			add_location(div, file$g, 112, 1, 3028);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_title_slot$1.name,
    		type: "slot",
    		source: "(113:1) ",
    		ctx
    	});

    	return block;
    }

    // (114:1) 
    function create_button_slot$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Go Back";
    			attr_dev(button, "slot", "button");
    			attr_dev(button, "class", "w3-button w3-blue w3-right round");
    			add_location(button, file$g, 113, 1, 3074);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_3*/ ctx[12], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_button_slot$1.name,
    		type: "slot",
    		source: "(114:1) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let input;
    	let t2;
    	let div1;
    	let t4;
    	let div3;
    	let textarea;
    	let t5;
    	let div5;
    	let div4;
    	let t6;
    	let modal0;
    	let updating_show;
    	let t7;
    	let modal1;
    	let updating_show_1;
    	let current;
    	let mounted;
    	let dispose;

    	function modal0_show_binding(value) {
    		/*modal0_show_binding*/ ctx[11](value);
    	}

    	let modal0_props = {
    		$$slots: {
    			button: [create_button_slot_1$1],
    			title: [create_title_slot_1$1],
    			default: [create_default_slot_1$1]
    		},
    		$$scope: { ctx }
    	};

    	if (/*showSave*/ ctx[2] !== void 0) {
    		modal0_props.show = /*showSave*/ ctx[2];
    	}

    	modal0 = new Modal({ props: modal0_props, $$inline: true });
    	binding_callbacks.push(() => bind(modal0, "show", modal0_show_binding));

    	function modal1_show_binding(value) {
    		/*modal1_show_binding*/ ctx[13](value);
    	}

    	let modal1_props = {
    		$$slots: {
    			button: [create_button_slot$1],
    			title: [create_title_slot$1],
    			default: [create_default_slot$1]
    		},
    		$$scope: { ctx }
    	};

    	if (/*showBack*/ ctx[3] !== void 0) {
    		modal1_props.show = /*showBack*/ ctx[3];
    	}

    	modal1 = new Modal({ props: modal1_props, $$inline: true });
    	binding_callbacks.push(() => bind(modal1, "show", modal1_show_binding));

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Back to Dashboard";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			div1 = element("div");
    			div1.textContent = "Save";
    			t4 = space();
    			div3 = element("div");
    			textarea = element("textarea");
    			t5 = space();
    			div5 = element("div");
    			div4 = element("div");
    			t6 = space();
    			create_component(modal0.$$.fragment);
    			t7 = space();
    			create_component(modal1.$$.fragment);
    			attr_dev(div0, "class", "w3-bar-item w3-button");
    			set_style(div0, "width", "10%");
    			add_location(div0, file$g, 79, 1, 1921);
    			attr_dev(input, "id", "title");
    			attr_dev(input, "class", "w3-bar-item w3-center");
    			set_style(input, "width", "80%");
    			set_style(input, "background-color", "var(--color-editor-bg)");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Title...");
    			add_location(input, file$g, 82, 1, 2038);
    			attr_dev(div1, "class", "w3-bar-item w3-button w3-right");
    			set_style(div1, "width", "10%");
    			add_location(div1, file$g, 83, 1, 2205);
    			attr_dev(div2, "class", "w3-bar w3-black svelte-1s968h");
    			add_location(div2, file$g, 78, 0, 1890);
    			attr_dev(textarea, "id", "abstract");
    			attr_dev(textarea, "class", "abstract svelte-1s968h");
    			attr_dev(textarea, "placeholder", "Abstract...");
    			add_location(textarea, file$g, 87, 1, 2357);
    			attr_dev(div3, "class", "w3-row flex-container svelte-1s968h");
    			add_location(div3, file$g, 86, 0, 2320);
    			attr_dev(div4, "id", "yew_editor");
    			add_location(div4, file$g, 92, 1, 2533);
    			attr_dev(div5, "class", "editor svelte-1s968h");
    			add_location(div5, file$g, 90, 0, 2456);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, input);
    			set_input_value(input, /*title*/ ctx[0]);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, textarea);
    			set_input_value(textarea, /*abstract*/ ctx[1]);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			insert_dev(target, t6, anchor);
    			mount_component(modal0, target, anchor);
    			insert_dev(target, t7, anchor);
    			mount_component(modal1, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler*/ ctx[6], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    					listen_dev(div1, "click", /*click_handler_1*/ ctx[8], false, false, false),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[9])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1 && input.value !== /*title*/ ctx[0]) {
    				set_input_value(input, /*title*/ ctx[0]);
    			}

    			if (dirty & /*abstract*/ 2) {
    				set_input_value(textarea, /*abstract*/ ctx[1]);
    			}

    			const modal0_changes = {};

    			if (dirty & /*$$scope, showSave, title*/ 65541) {
    				modal0_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_show && dirty & /*showSave*/ 4) {
    				updating_show = true;
    				modal0_changes.show = /*showSave*/ ctx[2];
    				add_flush_callback(() => updating_show = false);
    			}

    			modal0.$set(modal0_changes);
    			const modal1_changes = {};

    			if (dirty & /*$$scope*/ 65536) {
    				modal1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_show_1 && dirty & /*showBack*/ 8) {
    				updating_show_1 = true;
    				modal1_changes.show = /*showBack*/ ctx[3];
    				add_flush_callback(() => updating_show_1 = false);
    			}

    			modal1.$set(modal1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal0.$$.fragment, local);
    			transition_in(modal1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal0.$$.fragment, local);
    			transition_out(modal1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t6);
    			destroy_component(modal0, detaching);
    			if (detaching) detach_dev(t7);
    			destroy_component(modal1, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Editor", slots, []);
    	let { params = {} } = $$props;
    	let post;
    	let title;
    	let abstract;
    	let showSave = false;
    	let showBack = false;

    	async function save() {
    		if (params.id !== null) {
    			let fetch_params = {
    				id: Number(params.id),
    				title,
    				abstract_: abstract,
    				body: document.getElementById("textarea").value
    			};

    			await fetch("/api/v1/post/admin_restricted/update", {
    				method: "PUT",
    				headers: {
    					"Content-Type": "application/json;charset=utf-8"
    				},
    				body: JSON.stringify(fetch_params)
    			});
    		} else {
    			let fetch_params = {
    				title,
    				abstract_: abstract,
    				body: document.getElementById("textarea").value
    			};

    			let response = await fetch("/api/v1/post/admin_restricted/create", {
    				method: "POST",
    				headers: {
    					"Content-Type": "application/json;charset=utf-8"
    				},
    				body: JSON.stringify(fetch_params)
    			});

    			response = await response.json();
    			push("/editor/" + response);
    		}
    	}

    	async function get_post(id) {
    		let fetch_params = { id: Number(id) };

    		let response = await fetch("/api/v1/post/admin_restricted", {
    			method: "POST",
    			headers: {
    				"Content-Type": "application/json;charset=utf-8"
    			},
    			body: JSON.stringify(fetch_params)
    		});

    		post = await response.json();
    		$$invalidate(0, title = post.title);
    		$$invalidate(1, abstract = post.abstract_);

    		// dirty way to wait 200ms after yew loading
    		//setTimeout(() => {
    		var el = document.getElementById("textarea");

    		el.value = post.body;
    		var evt = document.createEvent("Events");
    		var evt = new Event("input");
    		el.dispatchEvent(evt);
    	} //}, 500);

    	onMount(async () => {
    		await init("/dashboard/admin_restricted/ame/wasm_bg.wasm");
    		if (params.id !== null) get_post(params.id);
    	});

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Editor> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(3, showBack = true);
    	};

    	function input_input_handler() {
    		title = this.value;
    		$$invalidate(0, title);
    	}

    	const click_handler_1 = () => {
    		$$invalidate(2, showSave = true);
    	};

    	function textarea_input_handler() {
    		abstract = this.value;
    		$$invalidate(1, abstract);
    	}

    	const click_handler_2 = () => {
    		save();
    		$$invalidate(2, showSave = false);
    	};

    	function modal0_show_binding(value) {
    		showSave = value;
    		$$invalidate(2, showSave);
    	}

    	const click_handler_3 = () => {
    		push("/");
    	};

    	function modal1_show_binding(value) {
    		showBack = value;
    		$$invalidate(3, showBack);
    	}

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(5, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		push,
    		onMount,
    		Modal,
    		init,
    		params,
    		post,
    		title,
    		abstract,
    		showSave,
    		showBack,
    		save,
    		get_post
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(5, params = $$props.params);
    		if ("post" in $$props) post = $$props.post;
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("abstract" in $$props) $$invalidate(1, abstract = $$props.abstract);
    		if ("showSave" in $$props) $$invalidate(2, showSave = $$props.showSave);
    		if ("showBack" in $$props) $$invalidate(3, showBack = $$props.showBack);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		title,
    		abstract,
    		showSave,
    		showBack,
    		save,
    		params,
    		click_handler,
    		input_input_handler,
    		click_handler_1,
    		textarea_input_handler,
    		click_handler_2,
    		modal0_show_binding,
    		click_handler_3,
    		modal1_show_binding
    	];
    }

    class Editor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$g, create_fragment$g, safe_not_equal, { params: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Editor",
    			options,
    			id: create_fragment$g.name
    		});
    	}

    	get params() {
    		throw new Error("<Editor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Editor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/Sidebar.svelte generated by Svelte v3.35.0 */

    const { Object: Object_1$1 } = globals;
    const file$f = "src/routes/Sidebar.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (18:4) {#each Object.values(Tabs) as Tab}
    function create_each_block$4(ctx) {
    	let button;
    	let i;
    	let t0;
    	let t1_value = /*Tab*/ ctx[4] + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*Tab*/ ctx[4]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			i = element("i");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(i, "class", "fa fa-fw");
    			toggle_class(i, "fa-pencil", /*Tab*/ ctx[4] === /*Tabs*/ ctx[1].Posts);
    			toggle_class(i, "fa-list", /*Tab*/ ctx[4] === /*Tabs*/ ctx[1].Categories);
    			toggle_class(i, "fa-bar-chart", /*Tab*/ ctx[4] === /*Tabs*/ ctx[1].Statistics);
    			toggle_class(i, "fa-asterisk", /*Tab*/ ctx[4] === /*Tabs*/ ctx[1].Others);
    			add_location(i, file$f, 23, 8, 595);
    			attr_dev(button, "class", "w3-bar-item w3-button svelte-1uyjxwu");
    			toggle_class(button, "selected_tab", /*indextab*/ ctx[0] === /*Tab*/ ctx[4]);
    			add_location(button, file$f, 18, 6, 445);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, i);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*Object, Tabs*/ 2) {
    				toggle_class(i, "fa-pencil", /*Tab*/ ctx[4] === /*Tabs*/ ctx[1].Posts);
    			}

    			if (dirty & /*Object, Tabs*/ 2) {
    				toggle_class(i, "fa-list", /*Tab*/ ctx[4] === /*Tabs*/ ctx[1].Categories);
    			}

    			if (dirty & /*Object, Tabs*/ 2) {
    				toggle_class(i, "fa-bar-chart", /*Tab*/ ctx[4] === /*Tabs*/ ctx[1].Statistics);
    			}

    			if (dirty & /*Object, Tabs*/ 2) {
    				toggle_class(i, "fa-asterisk", /*Tab*/ ctx[4] === /*Tabs*/ ctx[1].Others);
    			}

    			if (dirty & /*Tabs*/ 2 && t1_value !== (t1_value = /*Tab*/ ctx[4] + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*indextab, Object, Tabs*/ 3) {
    				toggle_class(button, "selected_tab", /*indextab*/ ctx[0] === /*Tab*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(18:4) {#each Object.values(Tabs) as Tab}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let div1;
    	let br;
    	let t0;
    	let h2;
    	let img;
    	let img_src_value;
    	let t1;
    	let span;
    	let t3;
    	let div0;
    	let t4;
    	let button;
    	let i;
    	let t5;
    	let mounted;
    	let dispose;
    	let each_value = Object.values(/*Tabs*/ ctx[1]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			br = element("br");
    			t0 = space();
    			h2 = element("h2");
    			img = element("img");
    			t1 = space();
    			span = element("span");
    			span.textContent = "Abe Dashboard";
    			t3 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			button = element("button");
    			i = element("i");
    			t5 = text(" Logout");
    			add_location(br, file$f, 7, 2, 131);
    			set_style(img, "width", "100%");
    			if (img.src !== (img_src_value = "/dashboard/admin_restricted/images/abe.webp")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "logo");
    			add_location(img, file$f, 9, 4, 162);
    			add_location(span, file$f, 10, 4, 254);
    			attr_dev(h2, "class", "title svelte-1uyjxwu");
    			add_location(h2, file$f, 8, 2, 139);
    			attr_dev(div0, "class", "fixed-center svelte-1uyjxwu");
    			set_style(div0, "top", "calc(50% - " + Object.values(/*Tabs*/ ctx[1]).length * 38.5 / 2 + "px)");
    			add_location(div0, file$f, 13, 2, 292);
    			attr_dev(i, "class", "fa fa-fw fa-sign-out ");
    			add_location(i, file$f, 36, 4, 966);
    			attr_dev(button, "class", "w3-bar-item w3-button fixed-bottom svelte-1uyjxwu");
    			add_location(button, file$f, 35, 2, 892);
    			attr_dev(div1, "class", "w3-sidebar w3-bar-block w3-card svelte-1uyjxwu");
    			add_location(div1, file$f, 6, 0, 83);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, br);
    			append_dev(div1, t0);
    			append_dev(div1, h2);
    			append_dev(h2, img);
    			append_dev(h2, t1);
    			append_dev(h2, span);
    			append_dev(div1, t3);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div1, t4);
    			append_dev(div1, button);
    			append_dev(button, i);
    			append_dev(button, t5);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*logout*/ ctx[2])) /*logout*/ ctx[2].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*indextab, Object, Tabs*/ 3) {
    				each_value = Object.values(/*Tabs*/ ctx[1]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*Tabs*/ 2) {
    				set_style(div0, "top", "calc(50% - " + Object.values(/*Tabs*/ ctx[1]).length * 38.5 / 2 + "px)");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Sidebar", slots, []);
    	let { Tabs } = $$props;
    	let { indextab } = $$props;
    	let { logout } = $$props;
    	const writable_props = ["Tabs", "indextab", "logout"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = Tab => $$invalidate(0, indextab = Tab);

    	$$self.$$set = $$props => {
    		if ("Tabs" in $$props) $$invalidate(1, Tabs = $$props.Tabs);
    		if ("indextab" in $$props) $$invalidate(0, indextab = $$props.indextab);
    		if ("logout" in $$props) $$invalidate(2, logout = $$props.logout);
    	};

    	$$self.$capture_state = () => ({ Tabs, indextab, logout });

    	$$self.$inject_state = $$props => {
    		if ("Tabs" in $$props) $$invalidate(1, Tabs = $$props.Tabs);
    		if ("indextab" in $$props) $$invalidate(0, indextab = $$props.indextab);
    		if ("logout" in $$props) $$invalidate(2, logout = $$props.logout);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [indextab, Tabs, logout, click_handler];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$f, create_fragment$f, safe_not_equal, { Tabs: 1, indextab: 0, logout: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$f.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*Tabs*/ ctx[1] === undefined && !("Tabs" in props)) {
    			console.warn("<Sidebar> was created without expected prop 'Tabs'");
    		}

    		if (/*indextab*/ ctx[0] === undefined && !("indextab" in props)) {
    			console.warn("<Sidebar> was created without expected prop 'indextab'");
    		}

    		if (/*logout*/ ctx[2] === undefined && !("logout" in props)) {
    			console.warn("<Sidebar> was created without expected prop 'logout'");
    		}
    	}

    	get Tabs() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Tabs(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get indextab() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set indextab(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get logout() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set logout(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function createFormatter (selectedStartDate, selectedEndDate, config) {
      const formatter = derived([ selectedStartDate, selectedEndDate ], ([ $selectedStartDate, $selectedEndDate ]) => {
        const formattedSelected = $selectedStartDate && $selectedStartDate.format(config.format);
        const formattedSelectedEnd = config.isRangePicker && $selectedEndDate && $selectedEndDate.format(config.format);

        return {
          formattedSelected,
          formattedSelectedEnd,
          formattedCombined: config.isRangePicker ? `${formattedSelected} - ${formattedSelectedEnd}` : formattedSelected
        }
      });

      return { formatter }
    }

    var SECONDS_A_MINUTE = 60;
    var SECONDS_A_HOUR = SECONDS_A_MINUTE * 60;
    var SECONDS_A_DAY = SECONDS_A_HOUR * 24;
    var SECONDS_A_WEEK = SECONDS_A_DAY * 7;
    var MILLISECONDS_A_SECOND = 1e3;
    var MILLISECONDS_A_MINUTE = SECONDS_A_MINUTE * MILLISECONDS_A_SECOND;
    var MILLISECONDS_A_HOUR = SECONDS_A_HOUR * MILLISECONDS_A_SECOND;
    var MILLISECONDS_A_DAY = SECONDS_A_DAY * MILLISECONDS_A_SECOND;
    var MILLISECONDS_A_WEEK = SECONDS_A_WEEK * MILLISECONDS_A_SECOND; // English locales

    var MS = 'millisecond';
    var S = 'second';
    var MIN = 'minute';
    var H = 'hour';
    var D = 'day';
    var W = 'week';
    var M = 'month';
    var Q = 'quarter';
    var Y = 'year';
    var DATE = 'date';
    var FORMAT_DEFAULT = 'YYYY-MM-DDTHH:mm:ssZ';
    var INVALID_DATE_STRING = 'Invalid Date'; // regex

    var REGEX_PARSE = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[^0-9]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/;
    var REGEX_FORMAT = /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g;

    // English [en]
    // We don't need weekdaysShort, weekdaysMin, monthsShort in en.js locale
    var en = {
      name: 'en',
      weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
      months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_')
    };

    var padStart = function padStart(string, length, pad) {
      var s = String(string);
      if (!s || s.length >= length) return string;
      return "" + Array(length + 1 - s.length).join(pad) + string;
    };

    var padZoneStr = function padZoneStr(instance) {
      var negMinutes = -instance.utcOffset();
      var minutes = Math.abs(negMinutes);
      var hourOffset = Math.floor(minutes / 60);
      var minuteOffset = minutes % 60;
      return "" + (negMinutes <= 0 ? '+' : '-') + padStart(hourOffset, 2, '0') + ":" + padStart(minuteOffset, 2, '0');
    };

    var monthDiff = function monthDiff(a, b) {
      // function from moment.js in order to keep the same result
      if (a.date() < b.date()) return -monthDiff(b, a);
      var wholeMonthDiff = (b.year() - a.year()) * 12 + (b.month() - a.month());
      var anchor = a.clone().add(wholeMonthDiff, M);
      var c = b - anchor < 0;
      var anchor2 = a.clone().add(wholeMonthDiff + (c ? -1 : 1), M);
      return +(-(wholeMonthDiff + (b - anchor) / (c ? anchor - anchor2 : anchor2 - anchor)) || 0);
    };

    var absFloor = function absFloor(n) {
      return n < 0 ? Math.ceil(n) || 0 : Math.floor(n);
    };

    var prettyUnit = function prettyUnit(u) {
      var special = {
        M: M,
        y: Y,
        w: W,
        d: D,
        D: DATE,
        h: H,
        m: MIN,
        s: S,
        ms: MS,
        Q: Q
      };
      return special[u] || String(u || '').toLowerCase().replace(/s$/, '');
    };

    var isUndefined = function isUndefined(s) {
      return s === undefined;
    };

    var U = {
      s: padStart,
      z: padZoneStr,
      m: monthDiff,
      a: absFloor,
      p: prettyUnit,
      u: isUndefined
    };

    var L = 'en'; // global locale

    var Ls = {}; // global loaded locale

    Ls[L] = en;

    var isDayjs = function isDayjs(d) {
      return d instanceof Dayjs;
    }; // eslint-disable-line no-use-before-define


    var parseLocale = function parseLocale(preset, object, isLocal) {
      var l;
      if (!preset) return L;

      if (typeof preset === 'string') {
        if (Ls[preset]) {
          l = preset;
        }

        if (object) {
          Ls[preset] = object;
          l = preset;
        }
      } else {
        var name = preset.name;
        Ls[name] = preset;
        l = name;
      }

      if (!isLocal && l) L = l;
      return l || !isLocal && L;
    };

    var dayjs = function dayjs(date, c) {
      if (isDayjs(date)) {
        return date.clone();
      } // eslint-disable-next-line no-nested-ternary


      var cfg = typeof c === 'object' ? c : {};
      cfg.date = date;
      cfg.args = arguments; // eslint-disable-line prefer-rest-params

      return new Dayjs(cfg); // eslint-disable-line no-use-before-define
    };

    var wrapper = function wrapper(date, instance) {
      return dayjs(date, {
        locale: instance.$L,
        utc: instance.$u,
        x: instance.$x,
        $offset: instance.$offset // todo: refactor; do not use this.$offset in you code

      });
    };

    var Utils = U; // for plugin use

    Utils.l = parseLocale;
    Utils.i = isDayjs;
    Utils.w = wrapper;

    var parseDate = function parseDate(cfg) {
      var date = cfg.date,
          utc = cfg.utc;
      if (date === null) return new Date(NaN); // null is invalid

      if (Utils.u(date)) return new Date(); // today

      if (date instanceof Date) return new Date(date);

      if (typeof date === 'string' && !/Z$/i.test(date)) {
        var d = date.match(REGEX_PARSE);

        if (d) {
          var m = d[2] - 1 || 0;
          var ms = (d[7] || '0').substring(0, 3);

          if (utc) {
            return new Date(Date.UTC(d[1], m, d[3] || 1, d[4] || 0, d[5] || 0, d[6] || 0, ms));
          }

          return new Date(d[1], m, d[3] || 1, d[4] || 0, d[5] || 0, d[6] || 0, ms);
        }
      }

      return new Date(date); // everything else
    };

    var Dayjs = /*#__PURE__*/function () {
      function Dayjs(cfg) {
        this.$L = parseLocale(cfg.locale, null, true);
        this.parse(cfg); // for plugin
      }

      var _proto = Dayjs.prototype;

      _proto.parse = function parse(cfg) {
        this.$d = parseDate(cfg);
        this.$x = cfg.x || {};
        this.init();
      };

      _proto.init = function init() {
        var $d = this.$d;
        this.$y = $d.getFullYear();
        this.$M = $d.getMonth();
        this.$D = $d.getDate();
        this.$W = $d.getDay();
        this.$H = $d.getHours();
        this.$m = $d.getMinutes();
        this.$s = $d.getSeconds();
        this.$ms = $d.getMilliseconds();
      } // eslint-disable-next-line class-methods-use-this
      ;

      _proto.$utils = function $utils() {
        return Utils;
      };

      _proto.isValid = function isValid() {
        return !(this.$d.toString() === INVALID_DATE_STRING);
      };

      _proto.isSame = function isSame(that, units) {
        var other = dayjs(that);
        return this.startOf(units) <= other && other <= this.endOf(units);
      };

      _proto.isAfter = function isAfter(that, units) {
        return dayjs(that) < this.startOf(units);
      };

      _proto.isBefore = function isBefore(that, units) {
        return this.endOf(units) < dayjs(that);
      };

      _proto.$g = function $g(input, get, set) {
        if (Utils.u(input)) return this[get];
        return this.set(set, input);
      };

      _proto.unix = function unix() {
        return Math.floor(this.valueOf() / 1000);
      };

      _proto.valueOf = function valueOf() {
        // timezone(hour) * 60 * 60 * 1000 => ms
        return this.$d.getTime();
      };

      _proto.startOf = function startOf(units, _startOf) {
        var _this = this;

        // startOf -> endOf
        var isStartOf = !Utils.u(_startOf) ? _startOf : true;
        var unit = Utils.p(units);

        var instanceFactory = function instanceFactory(d, m) {
          var ins = Utils.w(_this.$u ? Date.UTC(_this.$y, m, d) : new Date(_this.$y, m, d), _this);
          return isStartOf ? ins : ins.endOf(D);
        };

        var instanceFactorySet = function instanceFactorySet(method, slice) {
          var argumentStart = [0, 0, 0, 0];
          var argumentEnd = [23, 59, 59, 999];
          return Utils.w(_this.toDate()[method].apply( // eslint-disable-line prefer-spread
          _this.toDate('s'), (isStartOf ? argumentStart : argumentEnd).slice(slice)), _this);
        };

        var $W = this.$W,
            $M = this.$M,
            $D = this.$D;
        var utcPad = "set" + (this.$u ? 'UTC' : '');

        switch (unit) {
          case Y:
            return isStartOf ? instanceFactory(1, 0) : instanceFactory(31, 11);

          case M:
            return isStartOf ? instanceFactory(1, $M) : instanceFactory(0, $M + 1);

          case W:
            {
              var weekStart = this.$locale().weekStart || 0;
              var gap = ($W < weekStart ? $W + 7 : $W) - weekStart;
              return instanceFactory(isStartOf ? $D - gap : $D + (6 - gap), $M);
            }

          case D:
          case DATE:
            return instanceFactorySet(utcPad + "Hours", 0);

          case H:
            return instanceFactorySet(utcPad + "Minutes", 1);

          case MIN:
            return instanceFactorySet(utcPad + "Seconds", 2);

          case S:
            return instanceFactorySet(utcPad + "Milliseconds", 3);

          default:
            return this.clone();
        }
      };

      _proto.endOf = function endOf(arg) {
        return this.startOf(arg, false);
      };

      _proto.$set = function $set(units, _int) {
        var _C$D$C$DATE$C$M$C$Y$C;

        // private set
        var unit = Utils.p(units);
        var utcPad = "set" + (this.$u ? 'UTC' : '');
        var name = (_C$D$C$DATE$C$M$C$Y$C = {}, _C$D$C$DATE$C$M$C$Y$C[D] = utcPad + "Date", _C$D$C$DATE$C$M$C$Y$C[DATE] = utcPad + "Date", _C$D$C$DATE$C$M$C$Y$C[M] = utcPad + "Month", _C$D$C$DATE$C$M$C$Y$C[Y] = utcPad + "FullYear", _C$D$C$DATE$C$M$C$Y$C[H] = utcPad + "Hours", _C$D$C$DATE$C$M$C$Y$C[MIN] = utcPad + "Minutes", _C$D$C$DATE$C$M$C$Y$C[S] = utcPad + "Seconds", _C$D$C$DATE$C$M$C$Y$C[MS] = utcPad + "Milliseconds", _C$D$C$DATE$C$M$C$Y$C)[unit];
        var arg = unit === D ? this.$D + (_int - this.$W) : _int;

        if (unit === M || unit === Y) {
          // clone is for badMutable plugin
          var date = this.clone().set(DATE, 1);
          date.$d[name](arg);
          date.init();
          this.$d = date.set(DATE, Math.min(this.$D, date.daysInMonth())).$d;
        } else if (name) this.$d[name](arg);

        this.init();
        return this;
      };

      _proto.set = function set(string, _int2) {
        return this.clone().$set(string, _int2);
      };

      _proto.get = function get(unit) {
        return this[Utils.p(unit)]();
      };

      _proto.add = function add(number, units) {
        var _this2 = this,
            _C$MIN$C$H$C$S$unit;

        number = Number(number); // eslint-disable-line no-param-reassign

        var unit = Utils.p(units);

        var instanceFactorySet = function instanceFactorySet(n) {
          var d = dayjs(_this2);
          return Utils.w(d.date(d.date() + Math.round(n * number)), _this2);
        };

        if (unit === M) {
          return this.set(M, this.$M + number);
        }

        if (unit === Y) {
          return this.set(Y, this.$y + number);
        }

        if (unit === D) {
          return instanceFactorySet(1);
        }

        if (unit === W) {
          return instanceFactorySet(7);
        }

        var step = (_C$MIN$C$H$C$S$unit = {}, _C$MIN$C$H$C$S$unit[MIN] = MILLISECONDS_A_MINUTE, _C$MIN$C$H$C$S$unit[H] = MILLISECONDS_A_HOUR, _C$MIN$C$H$C$S$unit[S] = MILLISECONDS_A_SECOND, _C$MIN$C$H$C$S$unit)[unit] || 1; // ms

        var nextTimeStamp = this.$d.getTime() + number * step;
        return Utils.w(nextTimeStamp, this);
      };

      _proto.subtract = function subtract(number, string) {
        return this.add(number * -1, string);
      };

      _proto.format = function format(formatStr) {
        var _this3 = this;

        if (!this.isValid()) return INVALID_DATE_STRING;
        var str = formatStr || FORMAT_DEFAULT;
        var zoneStr = Utils.z(this);
        var locale = this.$locale();
        var $H = this.$H,
            $m = this.$m,
            $M = this.$M;
        var weekdays = locale.weekdays,
            months = locale.months,
            meridiem = locale.meridiem;

        var getShort = function getShort(arr, index, full, length) {
          return arr && (arr[index] || arr(_this3, str)) || full[index].substr(0, length);
        };

        var get$H = function get$H(num) {
          return Utils.s($H % 12 || 12, num, '0');
        };

        var meridiemFunc = meridiem || function (hour, minute, isLowercase) {
          var m = hour < 12 ? 'AM' : 'PM';
          return isLowercase ? m.toLowerCase() : m;
        };

        var matches = {
          YY: String(this.$y).slice(-2),
          YYYY: this.$y,
          M: $M + 1,
          MM: Utils.s($M + 1, 2, '0'),
          MMM: getShort(locale.monthsShort, $M, months, 3),
          MMMM: getShort(months, $M),
          D: this.$D,
          DD: Utils.s(this.$D, 2, '0'),
          d: String(this.$W),
          dd: getShort(locale.weekdaysMin, this.$W, weekdays, 2),
          ddd: getShort(locale.weekdaysShort, this.$W, weekdays, 3),
          dddd: weekdays[this.$W],
          H: String($H),
          HH: Utils.s($H, 2, '0'),
          h: get$H(1),
          hh: get$H(2),
          a: meridiemFunc($H, $m, true),
          A: meridiemFunc($H, $m, false),
          m: String($m),
          mm: Utils.s($m, 2, '0'),
          s: String(this.$s),
          ss: Utils.s(this.$s, 2, '0'),
          SSS: Utils.s(this.$ms, 3, '0'),
          Z: zoneStr // 'ZZ' logic below

        };
        return str.replace(REGEX_FORMAT, function (match, $1) {
          return $1 || matches[match] || zoneStr.replace(':', '');
        }); // 'ZZ'
      };

      _proto.utcOffset = function utcOffset() {
        // Because a bug at FF24, we're rounding the timezone offset around 15 minutes
        // https://github.com/moment/moment/pull/1871
        return -Math.round(this.$d.getTimezoneOffset() / 15) * 15;
      };

      _proto.diff = function diff(input, units, _float) {
        var _C$Y$C$M$C$Q$C$W$C$D$;

        var unit = Utils.p(units);
        var that = dayjs(input);
        var zoneDelta = (that.utcOffset() - this.utcOffset()) * MILLISECONDS_A_MINUTE;
        var diff = this - that;
        var result = Utils.m(this, that);
        result = (_C$Y$C$M$C$Q$C$W$C$D$ = {}, _C$Y$C$M$C$Q$C$W$C$D$[Y] = result / 12, _C$Y$C$M$C$Q$C$W$C$D$[M] = result, _C$Y$C$M$C$Q$C$W$C$D$[Q] = result / 3, _C$Y$C$M$C$Q$C$W$C$D$[W] = (diff - zoneDelta) / MILLISECONDS_A_WEEK, _C$Y$C$M$C$Q$C$W$C$D$[D] = (diff - zoneDelta) / MILLISECONDS_A_DAY, _C$Y$C$M$C$Q$C$W$C$D$[H] = diff / MILLISECONDS_A_HOUR, _C$Y$C$M$C$Q$C$W$C$D$[MIN] = diff / MILLISECONDS_A_MINUTE, _C$Y$C$M$C$Q$C$W$C$D$[S] = diff / MILLISECONDS_A_SECOND, _C$Y$C$M$C$Q$C$W$C$D$)[unit] || diff; // milliseconds

        return _float ? result : Utils.a(result);
      };

      _proto.daysInMonth = function daysInMonth() {
        return this.endOf(M).$D;
      };

      _proto.$locale = function $locale() {
        // get locale object
        return Ls[this.$L];
      };

      _proto.locale = function locale(preset, object) {
        if (!preset) return this.$L;
        var that = this.clone();
        var nextLocaleName = parseLocale(preset, object, true);
        if (nextLocaleName) that.$L = nextLocaleName;
        return that;
      };

      _proto.clone = function clone() {
        return Utils.w(this.$d, this);
      };

      _proto.toDate = function toDate() {
        return new Date(this.valueOf());
      };

      _proto.toJSON = function toJSON() {
        return this.isValid() ? this.toISOString() : null;
      };

      _proto.toISOString = function toISOString() {
        // ie 8 return
        // new Dayjs(this.valueOf() + this.$d.getTimezoneOffset() * 60000)
        // .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
        return this.$d.toISOString();
      };

      _proto.toString = function toString() {
        return this.$d.toUTCString();
      };

      return Dayjs;
    }();

    var proto = Dayjs.prototype;
    dayjs.prototype = proto;
    [['$ms', MS], ['$s', S], ['$m', MIN], ['$H', H], ['$W', D], ['$M', M], ['$y', Y], ['$D', DATE]].forEach(function (g) {
      proto[g[1]] = function (input) {
        return this.$g(input, g[0], g[1]);
      };
    });

    dayjs.extend = function (plugin, option) {
      if (!plugin.$i) {
        // install plugin only once
        plugin(option, Dayjs, dayjs);
        plugin.$i = true;
      }

      return dayjs;
    };

    dayjs.locale = parseLocale;
    dayjs.isDayjs = isDayjs;

    dayjs.unix = function (timestamp) {
      return dayjs(timestamp * 1e3);
    };

    dayjs.en = Ls[L];
    dayjs.Ls = Ls;
    dayjs.p = {};

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var localeData = createCommonjsModule(function (module, exports) {
    !function(n,e){module.exports=e();}(commonjsGlobal,(function(){return function(n,e,t){var r=e.prototype,o=function(n){return n&&(n.indexOf?n:n.s)},u=function(n,e,t,r,u){var i=n.name?n:n.$locale(),a=o(i[e]),s=o(i[t]),f=a||s.map((function(n){return n.substr(0,r)}));if(!u)return f;var d=i.weekStart;return f.map((function(n,e){return f[(e+(d||0))%7]}))},i=function(){return t.Ls[t.locale()]},a=function(n,e){return n.formats[e]||function(n){return n.replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,(function(n,e,t){return e||t.slice(1)}))}(n.formats[e.toUpperCase()])},s=function(){var n=this;return {months:function(e){return e?e.format("MMMM"):u(n,"months")},monthsShort:function(e){return e?e.format("MMM"):u(n,"monthsShort","months",3)},firstDayOfWeek:function(){return n.$locale().weekStart||0},weekdays:function(e){return e?e.format("dddd"):u(n,"weekdays")},weekdaysMin:function(e){return e?e.format("dd"):u(n,"weekdaysMin","weekdays",2)},weekdaysShort:function(e){return e?e.format("ddd"):u(n,"weekdaysShort","weekdays",3)},longDateFormat:function(e){return a(n.$locale(),e)},meridiem:this.$locale().meridiem,ordinal:this.$locale().ordinal}};r.localeData=function(){return s.bind(this)()},t.localeData=function(){var n=i();return {firstDayOfWeek:function(){return n.weekStart||0},weekdays:function(){return t.weekdays()},weekdaysShort:function(){return t.weekdaysShort()},weekdaysMin:function(){return t.weekdaysMin()},months:function(){return t.months()},monthsShort:function(){return t.monthsShort()},longDateFormat:function(e){return a(n,e)},meridiem:n.meridiem,ordinal:n.ordinal}},t.months=function(){return u(i(),"months")},t.monthsShort=function(){return u(i(),"monthsShort","months",3)},t.weekdays=function(n){return u(i(),"weekdays",null,null,n)},t.weekdaysShort=function(n){return u(i(),"weekdaysShort","weekdays",3,n)},t.weekdaysMin=function(n){return u(i(),"weekdaysMin","weekdays",2,n)};}}));
    });

    var minMax = createCommonjsModule(function (module, exports) {
    !function(e,n){module.exports=n();}(commonjsGlobal,(function(){return function(e,n,t){var i=function(e,n){if(!n||!n.length||!n[0]||1===n.length&&!n[0].length)return null;var t;1===n.length&&n[0].length>0&&(n=n[0]);t=n[0];for(var i=1;i<n.length;i+=1)n[i].isValid()&&!n[i][e](t)||(t=n[i]);return t};t.max=function(){var e=[].slice.call(arguments,0);return i("isAfter",e)},t.min=function(){var e=[].slice.call(arguments,0);return i("isBefore",e)};}}));
    });

    var isSameOrBefore = createCommonjsModule(function (module, exports) {
    !function(e,i){module.exports=i();}(commonjsGlobal,(function(){return function(e,i){i.prototype.isSameOrBefore=function(e,i){return this.isSame(e,i)||this.isBefore(e,i)};}}));
    });

    var isSameOrAfter = createCommonjsModule(function (module, exports) {
    !function(e,t){module.exports=t();}(commonjsGlobal,(function(){return function(e,t){t.prototype.isSameOrAfter=function(e,t){return this.isSame(e,t)||this.isAfter(e,t)};}}));
    });

    dayjs.extend(localeData);
    dayjs.extend(minMax);
    dayjs.extend(isSameOrBefore);
    dayjs.extend(isSameOrAfter);

    function ensureFutureMonth (firstDate, secondDate) {
      return firstDate.isSame(secondDate, 'month') ? secondDate.add(1, 'month') : secondDate
    }

    function buildDaySelectionValidator (start, end, selectableCallback) {
      return date => {
        const isInRange = date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day');
        return {
          isInRange,
          selectable: isInRange && (!selectableCallback || selectableCallback(date.toDate())),
          isToday: date.isSame(dayjs(), 'day')
        }
      }
    }

    function getCalendarPage (date, dayValidator) {
      const displayedRangeStart = date.startOf('month').startOf('week');
      const displayedRangeEnd = date.endOf('month').endOf('week').add(1, 'day');

      const weeks = [];
      let currentDay = displayedRangeStart;
      while (currentDay.isBefore(displayedRangeEnd, 'day')) {
        const weekOfMonth = Math.floor(currentDay.diff(displayedRangeStart, 'days') / 7);
        const isRequestedMonth = currentDay.isSame(date, 'month');
        weeks[weekOfMonth] = weeks[weekOfMonth] || { days: [], id: `${currentDay.format('YYYYMMYYYY')}${weekOfMonth}` };
        weeks[weekOfMonth].days.push(
          Object.assign({
            partOfMonth: isRequestedMonth,
            firstOfMonth: isRequestedMonth && currentDay.date() === 1,
            lastOfMonth: isRequestedMonth && currentDay.date() === date.daysInMonth(),
            day: currentDay.date(),
            month: currentDay.month(),
            year: currentDay.year(),
            date: currentDay
          }, dayValidator(currentDay))
        );
        currentDay = currentDay.add(1, 'day');
      }

      return { month: date.month(), year: date.year(), weeks }
    }

    function getMonths (config) {
      const { start, end, selectableCallback } = config;
      const firstMonth = start.startOf('month').startOf('day');
      const lastMonth = ensureFutureMonth(firstMonth, end.startOf('month').startOf('day'));

      const months = [];
      const validator = buildDaySelectionValidator(start, end, selectableCallback);
      let date = dayjs(firstMonth);
      while (date.isSameOrBefore(lastMonth)) {
        months.push(getCalendarPage(date, validator));
        date = date.add(1, 'month');
      }
      return months
    }

    function moveDateWithinAllowedRange (date, config, isStart) {
      const isOutsideRange = (
        date.valueOf() < config.start.valueOf() ||
        date.valueOf() > config.end.valueOf()
      );

      if (isOutsideRange) {
        console.warn('Provided date', date.format(), 'is outside specified start-and-end range', config.start.format(), 'to', config.end.format());
        return isStart ? config.start : config.end
      }

      return date
    }

    function sanitizeInitialValue (value, config) {
      let isDateChosen = false;
      let chosen;

      if (config.isRangePicker) {
        const [ from, to ] = value || [];
        isDateChosen = Boolean(from).valueOf() && Boolean(to).valueOf();
        chosen = isDateChosen ? value.map(dayjs) : [ dayjs.max(dayjs(), config.start), dayjs.min(dayjs().add(1, 'month'), config.end) ];
      } else {
        isDateChosen = Boolean(value).valueOf();
        chosen = [ isDateChosen ? dayjs(value) : dayjs.max(dayjs(), config.start) ];
      }

      const [ from, to ] = chosen;

      return {
        isDateChosen,
        chosen: [
          moveDateWithinAllowedRange(from, config, true),
          ...config.isRangePicker ? [ moveDateWithinAllowedRange(to, config, false) ] : []
        ]
      }
    }

    const contextKey = {};

    function setup (given, config) {
      const today = dayjs().startOf('day');

      const { isDateChosen, chosen: [ preSelectedStart, preSelectedEnd ] } = sanitizeInitialValue(given, config);
      const selectedStartDate = writable(preSelectedStart);
      const selectedEndDate = writable(preSelectedEnd);
      const { formatter } = createFormatter(selectedStartDate, selectedEndDate, config);
      const component = writable('date-view');

      const leftDate = preSelectedStart.startOf('month');
      const rightDate = config.isRangePicker ? ensureFutureMonth(preSelectedStart, preSelectedEnd).startOf('month') : null;

      return {
        months: getMonths(config),
        component,
        today,
        selectedStartDate,
        selectedEndDate,
        leftCalendarDate: writable(leftDate),
        rightCalendarDate: writable(rightDate),
        config,
        shouldShakeDate: writable(false),
        isOpen: writable(false),
        isClosing: writable(false),
        highlighted: writable(today),
        formatter,
        isDateChosen: writable(isDateChosen),
        resetView: () => {
          component.set('date-view');
        },
        isSelectingFirstDate: writable(true)
      }
    }

    function sizes (w) {
      const contentWidth = [ ...w.document.body.children ].reduce((a, el) => Math.max(
        a, el.getBoundingClientRect().right), 0
      ) - w.document.body.getBoundingClientRect().x;

      return {
        pageWidth: Math.min(w.document.body.scrollWidth, contentWidth),
        pageHeight: w.document.body.scrollHeight,
        viewportHeight: w.innerHeight,
        viewportWidth: w.innerWidth
      }
    }

    const dimensions = {
      page: {
        padding: 6,
        deadzone: 80
      },
      content: {
        medium: {
          single: {
            height: 410,
            width: 340
          },
          range: {
            height: 410,
            width: 680
          }
        },
        small: {
          single: {
            height: 410,
            width: 340
          },
          range: {
            height: 786,
            width: 340
          }
        }
      }
    };

    function getPosition (w, e, config) {
      const { isRangePicker } = config;
      const { pageWidth, viewportHeight, viewportWidth } = sizes(w);

      const display = pageWidth < 480 ? 'small' : 'medium';
      const mode = isRangePicker ? 'range' : 'single';
      const { padding, deadzone } = dimensions.page;
      const { width, height } = dimensions.content[display][mode];

      if (viewportHeight < (height + padding + deadzone) || viewportWidth < (width + padding)) {
        return {
          fullscreen: true,
          top: 0,
          left: 0
        }
      }

      let left = Math.max(padding, e.pageX - (width / 2));

      if ((left + width) > pageWidth) {
        left = (pageWidth - width) - padding;
      }

      let top = Math.max(padding, e.pageY - (height / 2));

      const willExceedViewableArea = (top + height) > viewportHeight;
      if (willExceedViewableArea) {
        top = viewportHeight - height - padding;
      }

      return { top, left }
    }

    const once = (el, evt, cb) => {
      if (!el) { return }
      function handler () {
        cb.apply(this, arguments);
        el.removeEventListener(evt, handler);
      }
      el.addEventListener(evt, handler);
    };

    /* node_modules/@beyonk/svelte-datepicker/src/components/Popover.svelte generated by Svelte v3.35.0 */

    const { window: window_1 } = globals;
    const file$e = "node_modules/@beyonk/svelte-datepicker/src/components/Popover.svelte";
    const get_contents_slot_changes = dirty => ({});
    const get_contents_slot_context = ctx => ({});
    const get_trigger_slot_changes = dirty => ({});
    const get_trigger_slot_context = ctx => ({});

    function create_fragment$e(ctx) {
    	let div4;
    	let div0;
    	let t;
    	let div3;
    	let div2;
    	let div1;
    	let current;
    	let mounted;
    	let dispose;
    	add_render_callback(/*onwindowresize*/ ctx[17]);
    	const trigger_slot_template = /*#slots*/ ctx[16].trigger;
    	const trigger_slot = create_slot(trigger_slot_template, ctx, /*$$scope*/ ctx[15], get_trigger_slot_context);
    	const contents_slot_template = /*#slots*/ ctx[16].contents;
    	const contents_slot = create_slot(contents_slot_template, ctx, /*$$scope*/ ctx[15], get_contents_slot_context);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			if (trigger_slot) trigger_slot.c();
    			t = space();
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			if (contents_slot) contents_slot.c();
    			attr_dev(div0, "class", "trigger");
    			add_location(div0, file$e, 68, 2, 1613);
    			attr_dev(div1, "class", "contents-inner svelte-10d3skr");
    			add_location(div1, file$e, 80, 6, 2013);
    			attr_dev(div2, "class", "wrapper svelte-10d3skr");
    			add_location(div2, file$e, 79, 4, 1956);
    			attr_dev(div3, "class", "contents-wrapper svelte-10d3skr");
    			set_style(div3, "top", /*translateY*/ ctx[6] + "px");
    			set_style(div3, "left", /*translateX*/ ctx[7] + "px");
    			toggle_class(div3, "visible", /*$isOpen*/ ctx[8]);
    			toggle_class(div3, "shrink", /*$isClosing*/ ctx[9]);
    			toggle_class(div3, "is-fullscreen", /*isFullscreen*/ ctx[5]);
    			add_location(div3, file$e, 72, 2, 1731);
    			attr_dev(div4, "class", "sc-popover svelte-10d3skr");
    			add_location(div4, file$e, 67, 0, 1566);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);

    			if (trigger_slot) {
    				trigger_slot.m(div0, null);
    			}

    			/*div0_binding*/ ctx[18](div0);
    			append_dev(div4, t);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);

    			if (contents_slot) {
    				contents_slot.m(div1, null);
    			}

    			/*div2_binding*/ ctx[19](div2);
    			/*div3_binding*/ ctx[20](div3);
    			/*div4_binding*/ ctx[21](div4);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window_1, "resize", /*onwindowresize*/ ctx[17]),
    					listen_dev(div0, "click", /*doOpen*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (trigger_slot) {
    				if (trigger_slot.p && dirty & /*$$scope*/ 32768) {
    					update_slot(trigger_slot, trigger_slot_template, ctx, /*$$scope*/ ctx[15], dirty, get_trigger_slot_changes, get_trigger_slot_context);
    				}
    			}

    			if (contents_slot) {
    				if (contents_slot.p && dirty & /*$$scope*/ 32768) {
    					update_slot(contents_slot, contents_slot_template, ctx, /*$$scope*/ ctx[15], dirty, get_contents_slot_changes, get_contents_slot_context);
    				}
    			}

    			if (!current || dirty & /*translateY*/ 64) {
    				set_style(div3, "top", /*translateY*/ ctx[6] + "px");
    			}

    			if (!current || dirty & /*translateX*/ 128) {
    				set_style(div3, "left", /*translateX*/ ctx[7] + "px");
    			}

    			if (dirty & /*$isOpen*/ 256) {
    				toggle_class(div3, "visible", /*$isOpen*/ ctx[8]);
    			}

    			if (dirty & /*$isClosing*/ 512) {
    				toggle_class(div3, "shrink", /*$isClosing*/ ctx[9]);
    			}

    			if (dirty & /*isFullscreen*/ 32) {
    				toggle_class(div3, "is-fullscreen", /*isFullscreen*/ ctx[5]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(trigger_slot, local);
    			transition_in(contents_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(trigger_slot, local);
    			transition_out(contents_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (trigger_slot) trigger_slot.d(detaching);
    			/*div0_binding*/ ctx[18](null);
    			if (contents_slot) contents_slot.d(detaching);
    			/*div2_binding*/ ctx[19](null);
    			/*div3_binding*/ ctx[20](null);
    			/*div4_binding*/ ctx[21](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let $isOpen;
    	let $isClosing;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Popover", slots, ['trigger','contents']);
    	const { isOpen, isClosing, config, resetView } = getContext(contextKey);
    	validate_store(isOpen, "isOpen");
    	component_subscribe($$self, isOpen, value => $$invalidate(8, $isOpen = value));
    	validate_store(isClosing, "isClosing");
    	component_subscribe($$self, isClosing, value => $$invalidate(9, $isClosing = value));
    	const dispatch = createEventDispatcher();
    	let popover;
    	let w;
    	let triggerContainer;
    	let contentsAnimated;
    	let contentsWrapper;
    	let isFullscreen = false;
    	let translateY = 0;
    	let translateX = 0;
    	let { trigger } = $$props;

    	function close() {
    		isClosing.set(true);

    		once(contentsAnimated, "animationend", () => {
    			isClosing.set(false);
    			isOpen.set(false);
    			dispatch("closed");
    		});
    	}

    	function checkForFocusLoss(evt) {
    		if (!$isOpen) return;
    		let el = evt.target;

    		do {
    			if (el === popover) {
    				return;
    			}

    			el = el.parentNode;
    		} while (el);

    		close();
    	}

    	onMount(() => {
    		config.closeOnFocusLoss && document.addEventListener("click", checkForFocusLoss);

    		if (!trigger) {
    			return;
    		}

    		triggerContainer.appendChild(trigger.parentNode.removeChild(trigger));

    		return () => {
    			config.closeOnFocusLoss && document.removeEventListener("click", checkForFocusLoss);
    		};
    	});

    	const doOpen = async e => {
    		isOpen.set(true);
    		resetView();
    		await tick();
    		const { top, left, fullscreen } = getPosition(window, e, config);
    		$$invalidate(5, isFullscreen = fullscreen);
    		$$invalidate(6, translateY = top);
    		$$invalidate(7, translateX = left);
    		dispatch("opened");
    	};

    	const writable_props = ["trigger"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Popover> was created with unknown prop '${key}'`);
    	});

    	function onwindowresize() {
    		$$invalidate(1, w = window_1.innerWidth);
    	}

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			triggerContainer = $$value;
    			$$invalidate(2, triggerContainer);
    		});
    	}

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			contentsAnimated = $$value;
    			$$invalidate(3, contentsAnimated);
    		});
    	}

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			contentsWrapper = $$value;
    			$$invalidate(4, contentsWrapper);
    		});
    	}

    	function div4_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			popover = $$value;
    			$$invalidate(0, popover);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("trigger" in $$props) $$invalidate(13, trigger = $$props.trigger);
    		if ("$$scope" in $$props) $$invalidate(15, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		createEventDispatcher,
    		getContext,
    		tick,
    		contextKey,
    		getPosition,
    		once,
    		isOpen,
    		isClosing,
    		config,
    		resetView,
    		dispatch,
    		popover,
    		w,
    		triggerContainer,
    		contentsAnimated,
    		contentsWrapper,
    		isFullscreen,
    		translateY,
    		translateX,
    		trigger,
    		close,
    		checkForFocusLoss,
    		doOpen,
    		$isOpen,
    		$isClosing
    	});

    	$$self.$inject_state = $$props => {
    		if ("popover" in $$props) $$invalidate(0, popover = $$props.popover);
    		if ("w" in $$props) $$invalidate(1, w = $$props.w);
    		if ("triggerContainer" in $$props) $$invalidate(2, triggerContainer = $$props.triggerContainer);
    		if ("contentsAnimated" in $$props) $$invalidate(3, contentsAnimated = $$props.contentsAnimated);
    		if ("contentsWrapper" in $$props) $$invalidate(4, contentsWrapper = $$props.contentsWrapper);
    		if ("isFullscreen" in $$props) $$invalidate(5, isFullscreen = $$props.isFullscreen);
    		if ("translateY" in $$props) $$invalidate(6, translateY = $$props.translateY);
    		if ("translateX" in $$props) $$invalidate(7, translateX = $$props.translateX);
    		if ("trigger" in $$props) $$invalidate(13, trigger = $$props.trigger);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		popover,
    		w,
    		triggerContainer,
    		contentsAnimated,
    		contentsWrapper,
    		isFullscreen,
    		translateY,
    		translateX,
    		$isOpen,
    		$isClosing,
    		isOpen,
    		isClosing,
    		doOpen,
    		trigger,
    		close,
    		$$scope,
    		slots,
    		onwindowresize,
    		div0_binding,
    		div2_binding,
    		div3_binding,
    		div4_binding
    	];
    }

    class Popover extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$e, create_fragment$e, safe_not_equal, { trigger: 13, close: 14 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Popover",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*trigger*/ ctx[13] === undefined && !("trigger" in props)) {
    			console.warn("<Popover> was created without expected prop 'trigger'");
    		}
    	}

    	get trigger() {
    		throw new Error("<Popover>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set trigger(value) {
    		throw new Error("<Popover>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get close() {
    		return this.$$.ctx[14];
    	}

    	set close(value) {
    		throw new Error("<Popover>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    class CalendarStyle {
      constructor (overrides = {}) {
        this.style = '';
        this.buttonBackgroundColor = '#fff';
        this.buttonBorderColor = '#eee';
        this.buttonTextColor = '#333';
        this.buttonWidth = '300px';
        this.highlightColor = '#f7901e';
        this.passiveHighlightColor = '#FCD9B1';

        this.dayBackgroundColor = 'none';
        this.dayBackgroundColorIsNight = 'none';
        this.dayTextColor = '#4a4a4a';
        this.dayTextColorIsNight = '#4a4a4a';
        this.dayTextColorInRange = 'white';
        this.dayHighlightedBackgroundColor = '#efefef';
        this.dayHighlightedTextColor = '#4a4a4a';

        this.currentDayTextColor = '#000';
        this.selectedDayTextColor = 'white';

        this.timeNightModeTextColor = 'white';
        this.timeNightModeBackgroundColor = '#808080';
        this.timeDayModeTextColor = 'white';
        this.timeDayModeBackgroundColor = 'white';
        this.timeSelectedTextColor = '#3d4548';
        this.timeInputTextColor = '#3d4548';
        this.timeConfirmButtonColor = '#2196F3';
        this.timeConfirmButtonTextColor = 'white';

        this.toolbarBorderColor = '#888';

        this.contentBackground = 'white';

        this.monthYearTextColor = '#3d4548';
        this.legendTextColor = '#4a4a4a';

        this.datepickerWidth = 'auto';

        Object.entries(overrides).forEach(([ prop, value ]) => {
          this[prop] = value;
        });
      }

      toWrapperStyle () {
        return `
      --button-background-color: ${this.buttonBackgroundColor};
      --button-border-color: ${this.buttonBorderColor};
      --button-text-color: ${this.buttonTextColor};
      --button-width: ${this.buttonWidth};
      --highlight-color: ${this.highlightColor};
      --passive-highlight-color: ${this.passiveHighlightColor};

      --day-background-color: ${this.dayBackgroundColor};
      --day-background-color-is-night: ${this.dayBackgroundColorIsNight};
      --day-text-color: ${this.dayTextColor};
      --day-text-color-in-range: ${this.dayTextColorInRange};
      --day-text-color-is-night: ${this.dayTextColorIsNight};
      --day-highlighted-background-color: ${this.dayHighlightedBackgroundColor};
      --day-highlighted-text-color: ${this.dayHighlightedTextColor};

      --current-day-text-color: ${this.currentDayTextColor};
      --selected-day-text-color: ${this.selectedDayTextColor};

      --time-night-mode-text-color: ${this.timeNightModeTextColor};
      --time-night-mode-background-color: ${this.timeNightModeBackgroundColor};
      --time-day-mode-text-color: ${this.timeDayModeTextColor};
      --time-day-mode-background-color: ${this.timeDayModeBackgroundColor};

      --time-selected-text-color: ${this.timeSelectedTextColor};
      --time-input-text-color: ${this.timeInputTextColor};
      --time-confirm-button-text-color: ${this.timeConfirmButtonTextColor};
      --time-confirm-button-color: ${this.timeConfirmButtonColor};

      --toolbar-border-color: ${this.toolbarBorderColor};

      --content-background: ${this.contentBackground};

      --month-year-text-color: ${this.monthYearTextColor};
      --legend-text-color: ${this.legendTextColor};
      --datepicker-width: ${this.datepickerWidth};

      ${this.style}
    `
      }
    }

    function isDateBetweenSelected (a, b, c) {
      const start = a.startOf('day').toDate();
      const stop = b.startOf('day').toDate();
      const day = c.startOf('day').toDate();
      return day > start && day < stop
    }

    /* node_modules/@beyonk/svelte-datepicker/src/components/view/date-view/Week.svelte generated by Svelte v3.35.0 */
    const file$d = "node_modules/@beyonk/svelte-datepicker/src/components/view/date-view/Week.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	return child_ctx;
    }

    // (20:2) {#each days as day}
    function create_each_block$3(ctx) {
    	let div;
    	let button;
    	let t0_value = /*day*/ ctx[16].date.date() + "";
    	let t0;
    	let button_aria_label_value;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[15](/*day*/ ctx[16]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(button, "class", "day--label svelte-1gcp452");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "aria-label", button_aria_label_value = /*day*/ ctx[16].date.format("YYYY-MM-DD"));
    			toggle_class(button, "highlighted", /*day*/ ctx[16].date.isSame(/*$highlighted*/ ctx[5], "day"));
    			toggle_class(button, "shake-date", /*$shouldShakeDate*/ ctx[6] && /*day*/ ctx[16].date.isSame(/*$shouldShakeDate*/ ctx[6], "day"));
    			toggle_class(button, "disabled", !/*day*/ ctx[16].selectable);
    			add_location(button, file$d, 33, 6, 1247);
    			attr_dev(div, "class", "day svelte-1gcp452");
    			toggle_class(div, "is-night", !/*$isDaytime*/ ctx[2]);
    			toggle_class(div, "is-range-picker", /*config*/ ctx[7].isRangePicker);
    			toggle_class(div, "outside-month", !/*day*/ ctx[16].partOfMonth);
    			toggle_class(div, "first-of-month", /*day*/ ctx[16].firstOfMonth);
    			toggle_class(div, "last-of-month", /*day*/ ctx[16].lastOfMonth);
    			toggle_class(div, "selection-start", /*day*/ ctx[16].date.isSame(/*$selectedStartDate*/ ctx[3], "day"));
    			toggle_class(div, "selection-end", /*config*/ ctx[7].isRangePicker && /*day*/ ctx[16].date.isSame(/*$selectedEndDate*/ ctx[4], "day"));
    			toggle_class(div, "part-of-range", /*config*/ ctx[7].isRangePicker && isDateBetweenSelected(/*$selectedStartDate*/ ctx[3], /*$selectedEndDate*/ ctx[4], /*day*/ ctx[16].date));
    			toggle_class(div, "is-today", /*day*/ ctx[16].isToday);
    			toggle_class(div, "is-disabled", !/*day*/ ctx[16].selectable);
    			add_location(div, file$d, 20, 4, 625);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, t0);
    			append_dev(div, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", stop_propagation(click_handler), false, false, true);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*days*/ 1 && t0_value !== (t0_value = /*day*/ ctx[16].date.date() + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*days*/ 1 && button_aria_label_value !== (button_aria_label_value = /*day*/ ctx[16].date.format("YYYY-MM-DD"))) {
    				attr_dev(button, "aria-label", button_aria_label_value);
    			}

    			if (dirty & /*days, $highlighted*/ 33) {
    				toggle_class(button, "highlighted", /*day*/ ctx[16].date.isSame(/*$highlighted*/ ctx[5], "day"));
    			}

    			if (dirty & /*$shouldShakeDate, days*/ 65) {
    				toggle_class(button, "shake-date", /*$shouldShakeDate*/ ctx[6] && /*day*/ ctx[16].date.isSame(/*$shouldShakeDate*/ ctx[6], "day"));
    			}

    			if (dirty & /*days*/ 1) {
    				toggle_class(button, "disabled", !/*day*/ ctx[16].selectable);
    			}

    			if (dirty & /*$isDaytime*/ 4) {
    				toggle_class(div, "is-night", !/*$isDaytime*/ ctx[2]);
    			}

    			if (dirty & /*days*/ 1) {
    				toggle_class(div, "outside-month", !/*day*/ ctx[16].partOfMonth);
    			}

    			if (dirty & /*days*/ 1) {
    				toggle_class(div, "first-of-month", /*day*/ ctx[16].firstOfMonth);
    			}

    			if (dirty & /*days*/ 1) {
    				toggle_class(div, "last-of-month", /*day*/ ctx[16].lastOfMonth);
    			}

    			if (dirty & /*days, $selectedStartDate*/ 9) {
    				toggle_class(div, "selection-start", /*day*/ ctx[16].date.isSame(/*$selectedStartDate*/ ctx[3], "day"));
    			}

    			if (dirty & /*config, days, $selectedEndDate*/ 145) {
    				toggle_class(div, "selection-end", /*config*/ ctx[7].isRangePicker && /*day*/ ctx[16].date.isSame(/*$selectedEndDate*/ ctx[4], "day"));
    			}

    			if (dirty & /*config, isDateBetweenSelected, $selectedStartDate, $selectedEndDate, days*/ 153) {
    				toggle_class(div, "part-of-range", /*config*/ ctx[7].isRangePicker && isDateBetweenSelected(/*$selectedStartDate*/ ctx[3], /*$selectedEndDate*/ ctx[4], /*day*/ ctx[16].date));
    			}

    			if (dirty & /*days*/ 1) {
    				toggle_class(div, "is-today", /*day*/ ctx[16].isToday);
    			}

    			if (dirty & /*days*/ 1) {
    				toggle_class(div, "is-disabled", !/*day*/ ctx[16].selectable);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(20:2) {#each days as day}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div;
    	let div_intro;
    	let each_value = /*days*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "week svelte-1gcp452");
    			add_location(div, file$d, 15, 0, 510);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*$isDaytime, config, days, $selectedStartDate, $selectedEndDate, isDateBetweenSelected, $highlighted, $shouldShakeDate, dispatch*/ 8445) {
    				each_value = /*days*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (local) {
    				if (!div_intro) {
    					add_render_callback(() => {
    						div_intro = create_in_transition(div, fly, {
    							x: /*direction*/ ctx[1] * 50,
    							duration: 180,
    							delay: 90
    						});

    						div_intro.start();
    					});
    				}
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $isDaytime;
    	let $selectedStartDate;
    	let $selectedEndDate;
    	let $highlighted;
    	let $shouldShakeDate;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Week", slots, []);
    	let { viewContextKey } = $$props;
    	let { days } = $$props;
    	let { direction } = $$props;
    	const { config, shouldShakeDate, highlighted, selectedStartDate, selectedEndDate } = getContext(contextKey);
    	validate_store(shouldShakeDate, "shouldShakeDate");
    	component_subscribe($$self, shouldShakeDate, value => $$invalidate(6, $shouldShakeDate = value));
    	validate_store(highlighted, "highlighted");
    	component_subscribe($$self, highlighted, value => $$invalidate(5, $highlighted = value));
    	validate_store(selectedStartDate, "selectedStartDate");
    	component_subscribe($$self, selectedStartDate, value => $$invalidate(3, $selectedStartDate = value));
    	validate_store(selectedEndDate, "selectedEndDate");
    	component_subscribe($$self, selectedEndDate, value => $$invalidate(4, $selectedEndDate = value));
    	const { isDaytime } = getContext(viewContextKey);
    	validate_store(isDaytime, "isDaytime");
    	component_subscribe($$self, isDaytime, value => $$invalidate(2, $isDaytime = value));
    	const dispatch = createEventDispatcher();
    	const writable_props = ["viewContextKey", "days", "direction"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Week> was created with unknown prop '${key}'`);
    	});

    	const click_handler = day => dispatch("chosen", { date: day.date });

    	$$self.$$set = $$props => {
    		if ("viewContextKey" in $$props) $$invalidate(14, viewContextKey = $$props.viewContextKey);
    		if ("days" in $$props) $$invalidate(0, days = $$props.days);
    		if ("direction" in $$props) $$invalidate(1, direction = $$props.direction);
    	};

    	$$self.$capture_state = () => ({
    		isDateBetweenSelected,
    		fly,
    		createEventDispatcher,
    		getContext,
    		contextKey,
    		viewContextKey,
    		days,
    		direction,
    		config,
    		shouldShakeDate,
    		highlighted,
    		selectedStartDate,
    		selectedEndDate,
    		isDaytime,
    		dispatch,
    		$isDaytime,
    		$selectedStartDate,
    		$selectedEndDate,
    		$highlighted,
    		$shouldShakeDate
    	});

    	$$self.$inject_state = $$props => {
    		if ("viewContextKey" in $$props) $$invalidate(14, viewContextKey = $$props.viewContextKey);
    		if ("days" in $$props) $$invalidate(0, days = $$props.days);
    		if ("direction" in $$props) $$invalidate(1, direction = $$props.direction);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		days,
    		direction,
    		$isDaytime,
    		$selectedStartDate,
    		$selectedEndDate,
    		$highlighted,
    		$shouldShakeDate,
    		config,
    		shouldShakeDate,
    		highlighted,
    		selectedStartDate,
    		selectedEndDate,
    		isDaytime,
    		dispatch,
    		viewContextKey,
    		click_handler
    	];
    }

    class Week extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$1(this, options, instance$d, create_fragment$d, safe_not_equal, {
    			viewContextKey: 14,
    			days: 0,
    			direction: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Week",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*viewContextKey*/ ctx[14] === undefined && !("viewContextKey" in props)) {
    			console.warn("<Week> was created without expected prop 'viewContextKey'");
    		}

    		if (/*days*/ ctx[0] === undefined && !("days" in props)) {
    			console.warn("<Week> was created without expected prop 'days'");
    		}

    		if (/*direction*/ ctx[1] === undefined && !("direction" in props)) {
    			console.warn("<Week> was created without expected prop 'direction'");
    		}
    	}

    	get viewContextKey() {
    		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set viewContextKey(value) {
    		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get days() {
    		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set days(value) {
    		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get direction() {
    		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set direction(value) {
    		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@beyonk/svelte-datepicker/src/components/view/date-view/Month.svelte generated by Svelte v3.35.0 */
    const file$c = "node_modules/@beyonk/svelte-datepicker/src/components/view/date-view/Month.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (24:8) {#each dayjs.weekdaysShort() as day}
    function create_each_block_1(ctx) {
    	let span;
    	let t_value = /*day*/ ctx[10] + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "svelte-lktis3");
    			add_location(span, file$c, 24, 10, 509);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(24:8) {#each dayjs.weekdaysShort() as day}",
    		ctx
    	});

    	return block;
    }

    // (29:4) {#each $monthView.visibleMonth.weeks as week (week.id)}
    function create_each_block$2(key_1, ctx) {
    	let first;
    	let week;
    	let current;

    	week = new Week({
    			props: {
    				viewContextKey: /*viewContextKey*/ ctx[0],
    				days: /*week*/ ctx[7].days,
    				direction: /*direction*/ ctx[1]
    			},
    			$$inline: true
    		});

    	week.$on("chosen", /*chosen_handler*/ ctx[6]);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(week.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(week, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const week_changes = {};
    			if (dirty & /*viewContextKey*/ 1) week_changes.viewContextKey = /*viewContextKey*/ ctx[0];
    			if (dirty & /*$monthView*/ 4) week_changes.days = /*week*/ ctx[7].days;
    			if (dirty & /*direction*/ 2) week_changes.direction = /*direction*/ ctx[1];
    			week.$set(week_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(week.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(week.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(week, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(29:4) {#each $monthView.visibleMonth.weeks as week (week.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let t;
    	let each_blocks = [];
    	let each1_lookup = new Map();
    	let current;
    	let each_value_1 = dayjs.weekdaysShort();
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*$monthView*/ ctx[2].visibleMonth.weeks;
    	validate_each_argument(each_value);
    	const get_key = ctx => /*week*/ ctx[7].id;
    	validate_each_keys(ctx, each_value, get_each_context$2, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$2(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "month-week svelte-lktis3");
    			add_location(div0, file$c, 22, 6, 429);
    			attr_dev(div1, "class", "legend svelte-lktis3");
    			add_location(div1, file$c, 21, 4, 402);
    			attr_dev(div2, "class", "month-dates svelte-lktis3");
    			add_location(div2, file$c, 20, 2, 372);
    			attr_dev(div3, "class", "month-container svelte-lktis3");
    			add_location(div3, file$c, 19, 0, 340);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			append_dev(div2, t);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*dayjs*/ 0) {
    				each_value_1 = dayjs.weekdaysShort();
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*viewContextKey, $monthView, direction*/ 7) {
    				each_value = /*$monthView*/ ctx[2].visibleMonth.weeks;
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each1_lookup, div2, outro_and_destroy_block, create_each_block$2, null, get_each_context$2);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks_1, detaching);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let $monthView;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Month", slots, []);
    	let { viewContextKey } = $$props;
    	let { id } = $$props;
    	const { monthView } = getContext(viewContextKey);
    	validate_store(monthView, "monthView");
    	component_subscribe($$self, monthView, value => $$invalidate(2, $monthView = value));
    	let lastId = id;
    	let direction;
    	const writable_props = ["viewContextKey", "id"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Month> was created with unknown prop '${key}'`);
    	});

    	function chosen_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("viewContextKey" in $$props) $$invalidate(0, viewContextKey = $$props.viewContextKey);
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({
    		Week,
    		getContext,
    		dayjs,
    		viewContextKey,
    		id,
    		monthView,
    		lastId,
    		direction,
    		$monthView
    	});

    	$$self.$inject_state = $$props => {
    		if ("viewContextKey" in $$props) $$invalidate(0, viewContextKey = $$props.viewContextKey);
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    		if ("lastId" in $$props) $$invalidate(5, lastId = $$props.lastId);
    		if ("direction" in $$props) $$invalidate(1, direction = $$props.direction);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*lastId, id*/ 48) {
    			{
    				$$invalidate(1, direction = lastId < id ? 1 : -1);
    				$$invalidate(5, lastId = id);
    			}
    		}
    	};

    	return [viewContextKey, direction, $monthView, monthView, id, lastId, chosen_handler];
    }

    class Month extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$c, create_fragment$c, safe_not_equal, { viewContextKey: 0, id: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Month",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*viewContextKey*/ ctx[0] === undefined && !("viewContextKey" in props)) {
    			console.warn("<Month> was created without expected prop 'viewContextKey'");
    		}

    		if (/*id*/ ctx[4] === undefined && !("id" in props)) {
    			console.warn("<Month> was created without expected prop 'id'");
    		}
    	}

    	get viewContextKey() {
    		throw new Error("<Month>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set viewContextKey(value) {
    		throw new Error("<Month>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Month>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Month>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@beyonk/svelte-datepicker/src/components/view/date-view/NavBar.svelte generated by Svelte v3.35.0 */

    const { Object: Object_1 } = globals;
    const file$b = "node_modules/@beyonk/svelte-datepicker/src/components/view/date-view/NavBar.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	child_ctx[29] = i;
    	return child_ctx;
    }

    // (84:6) {#each availableMonths as monthDefinition, index}
    function create_each_block$1(ctx) {
    	let button;
    	let span;
    	let t0_value = /*monthDefinition*/ ctx[27].abbrev + "";
    	let t0;
    	let t1;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[21](/*monthDefinition*/ ctx[27], /*index*/ ctx[29], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(span, "class", "svelte-1c4p61v");
    			add_location(span, file$b, 90, 10, 3117);
    			attr_dev(button, "class", "month-selector--month svelte-1c4p61v");
    			button.disabled = button_disabled_value = !/*monthDefinition*/ ctx[27].selectable;
    			toggle_class(button, "selected", /*index*/ ctx[29] === /*$displayedDate*/ ctx[0].month());
    			add_location(button, file$b, 84, 8, 2867);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span);
    			append_dev(span, t0);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_2, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*availableMonths*/ 4 && t0_value !== (t0_value = /*monthDefinition*/ ctx[27].abbrev + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*availableMonths*/ 4 && button_disabled_value !== (button_disabled_value = !/*monthDefinition*/ ctx[27].selectable)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (dirty & /*$displayedDate*/ 1) {
    				toggle_class(button, "selected", /*index*/ ctx[29] === /*$displayedDate*/ ctx[0].month());
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(84:6) {#each availableMonths as monthDefinition, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div2;
    	let div0;
    	let button0;
    	let i0;
    	let button0_disabled_value;
    	let t0;
    	let button1;
    	let span;
    	let t1_value = /*$displayedDate*/ ctx[0].format("MMMM YYYY") + "";
    	let t1;
    	let t2;
    	let button2;
    	let i1;
    	let button2_disabled_value;
    	let t3;
    	let div1;
    	let mounted;
    	let dispose;
    	let each_value = /*availableMonths*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			i0 = element("i");
    			t0 = space();
    			button1 = element("button");
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			button2 = element("button");
    			i1 = element("i");
    			t3 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(i0, "class", "arrow left svelte-1c4p61v");
    			add_location(i0, file$b, 69, 6, 2340);
    			attr_dev(button0, "class", "control svelte-1c4p61v");
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "aria-label", "Previous month");
    			button0.disabled = button0_disabled_value = !/*canDecrementMonth*/ ctx[4];
    			add_location(button0, file$b, 64, 4, 2177);
    			add_location(span, file$b, 72, 6, 2463);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "label svelte-1c4p61v");
    			add_location(button1, file$b, 71, 4, 2385);
    			attr_dev(i1, "class", "arrow right svelte-1c4p61v");
    			add_location(i1, file$b, 79, 6, 2690);
    			attr_dev(button2, "class", "control svelte-1c4p61v");
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "aria-label", "Next month");
    			button2.disabled = button2_disabled_value = !/*canIncrementMonth*/ ctx[3];
    			add_location(button2, file$b, 74, 4, 2532);
    			attr_dev(div0, "class", "heading-section svelte-1c4p61v");
    			add_location(div0, file$b, 63, 2, 2143);
    			attr_dev(div1, "class", "month-selector svelte-1c4p61v");
    			toggle_class(div1, "open", /*monthSelectorOpen*/ ctx[1]);
    			add_location(div1, file$b, 82, 2, 2743);
    			attr_dev(div2, "class", "title svelte-1c4p61v");
    			add_location(div2, file$b, 62, 0, 2121);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, button0);
    			append_dev(button0, i0);
    			append_dev(div0, t0);
    			append_dev(div0, button1);
    			append_dev(button1, span);
    			append_dev(span, t1);
    			append_dev(div0, t2);
    			append_dev(div0, button2);
    			append_dev(button2, i1);
    			append_dev(div2, t3);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[19], false, false, false),
    					listen_dev(button1, "click", /*toggleMonthSelectorOpen*/ ctx[10], false, false, false),
    					listen_dev(button2, "click", /*click_handler_1*/ ctx[20], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*canDecrementMonth*/ 16 && button0_disabled_value !== (button0_disabled_value = !/*canDecrementMonth*/ ctx[4])) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*$displayedDate*/ 1 && t1_value !== (t1_value = /*$displayedDate*/ ctx[0].format("MMMM YYYY") + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*canIncrementMonth*/ 8 && button2_disabled_value !== (button2_disabled_value = !/*canIncrementMonth*/ ctx[3])) {
    				prop_dev(button2, "disabled", button2_disabled_value);
    			}

    			if (dirty & /*availableMonths, $displayedDate, monthSelected*/ 2053) {
    				each_value = /*availableMonths*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*monthSelectorOpen*/ 2) {
    				toggle_class(div1, "open", /*monthSelectorOpen*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let myPosition;
    	let startPosition;
    	let endPosition;
    	let canIncrementMonth;
    	let canDecrementMonth;
    	let $displayedDate;
    	let $leftCalendarDate;
    	let $rightCalendarDate;
    	let $monthView;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NavBar", slots, []);
    	let { viewContextKey } = $$props;
    	const { months, config, highlighted, leftCalendarDate, rightCalendarDate } = getContext(contextKey);
    	validate_store(leftCalendarDate, "leftCalendarDate");
    	component_subscribe($$self, leftCalendarDate, value => $$invalidate(15, $leftCalendarDate = value));
    	validate_store(rightCalendarDate, "rightCalendarDate");
    	component_subscribe($$self, rightCalendarDate, value => $$invalidate(17, $rightCalendarDate = value));
    	const { isStart, displayedDate, monthView } = getContext(viewContextKey);
    	validate_store(displayedDate, "displayedDate");
    	component_subscribe($$self, displayedDate, value => $$invalidate(0, $displayedDate = value));
    	validate_store(monthView, "monthView");
    	component_subscribe($$self, monthView, value => $$invalidate(18, $monthView = value));
    	let monthSelectorOpen = false;
    	let availableMonths;

    	function changeMonth(selectedMonth) {
    		displayedDate.update(v => v.month(selectedMonth));
    		highlighted.set($displayedDate);
    	}

    	function incrementMonth(direction) {
    		if (direction === 1 && !canIncrementMonth) return;
    		if (direction === -1 && !canDecrementMonth) return;
    		displayedDate.update(d => d.add(direction, "months"));
    		highlighted.set($displayedDate);
    	}

    	function toggleMonthSelectorOpen() {
    		$$invalidate(1, monthSelectorOpen = !monthSelectorOpen);
    	}

    	function monthSelected(event, { monthDefinition, index }) {
    		event.stopPropagation();
    		if (!monthDefinition.selectable) return;
    		changeMonth(index);
    		toggleMonthSelectorOpen();
    	}

    	const writable_props = ["viewContextKey"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NavBar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => incrementMonth(-1);
    	const click_handler_1 = () => incrementMonth(1);
    	const click_handler_2 = (monthDefinition, index, e) => monthSelected(e, { monthDefinition, index });

    	$$self.$$set = $$props => {
    		if ("viewContextKey" in $$props) $$invalidate(12, viewContextKey = $$props.viewContextKey);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		contextKey,
    		dayjs,
    		viewContextKey,
    		months,
    		config,
    		highlighted,
    		leftCalendarDate,
    		rightCalendarDate,
    		isStart,
    		displayedDate,
    		monthView,
    		monthSelectorOpen,
    		availableMonths,
    		changeMonth,
    		incrementMonth,
    		toggleMonthSelectorOpen,
    		monthSelected,
    		$displayedDate,
    		myPosition,
    		startPosition,
    		$leftCalendarDate,
    		endPosition,
    		$rightCalendarDate,
    		canIncrementMonth,
    		$monthView,
    		canDecrementMonth
    	});

    	$$self.$inject_state = $$props => {
    		if ("viewContextKey" in $$props) $$invalidate(12, viewContextKey = $$props.viewContextKey);
    		if ("monthSelectorOpen" in $$props) $$invalidate(1, monthSelectorOpen = $$props.monthSelectorOpen);
    		if ("availableMonths" in $$props) $$invalidate(2, availableMonths = $$props.availableMonths);
    		if ("myPosition" in $$props) $$invalidate(13, myPosition = $$props.myPosition);
    		if ("startPosition" in $$props) $$invalidate(14, startPosition = $$props.startPosition);
    		if ("endPosition" in $$props) $$invalidate(16, endPosition = $$props.endPosition);
    		if ("canIncrementMonth" in $$props) $$invalidate(3, canIncrementMonth = $$props.canIncrementMonth);
    		if ("canDecrementMonth" in $$props) $$invalidate(4, canDecrementMonth = $$props.canDecrementMonth);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$displayedDate*/ 1) {
    			{
    				const isOnLowerBoundary = config.start.isSame($displayedDate, "year");
    				const isOnUpperBoundary = config.end.isSame($displayedDate, "year");

    				$$invalidate(2, availableMonths = dayjs.months().map((m, i) => {
    					return Object.assign({}, { name: m, abbrev: dayjs.monthsShort()[i] }, {
    						selectable: !isOnLowerBoundary && !isOnUpperBoundary || (!isOnLowerBoundary || i >= config.start.month()) && (!isOnUpperBoundary || i <= config.end.year())
    					});
    				}));
    			}
    		}

    		if ($$self.$$.dirty & /*$displayedDate*/ 1) {
    			$$invalidate(13, myPosition = dayjs($displayedDate).diff("0000-00-00", "month"));
    		}

    		if ($$self.$$.dirty & /*$leftCalendarDate*/ 32768) {
    			$$invalidate(14, startPosition = dayjs($leftCalendarDate).diff("0000-00-00", "month"));
    		}

    		if ($$self.$$.dirty & /*$rightCalendarDate*/ 131072) {
    			$$invalidate(16, endPosition = dayjs($rightCalendarDate).diff("0000-00-00", "month"));
    		}

    		if ($$self.$$.dirty & /*$monthView, myPosition, endPosition*/ 335872) {
    			$$invalidate(3, canIncrementMonth = $monthView.monthIndex < months.length - 1 && (config.isRangePicker && isStart
    			? myPosition < endPosition - 1
    			: true));
    		}

    		if ($$self.$$.dirty & /*$monthView, myPosition, startPosition*/ 286720) {
    			$$invalidate(4, canDecrementMonth = $monthView.monthIndex > 0 && (config.isRangePicker && !isStart
    			? myPosition > startPosition + 1
    			: true));
    		}
    	};

    	return [
    		$displayedDate,
    		monthSelectorOpen,
    		availableMonths,
    		canIncrementMonth,
    		canDecrementMonth,
    		leftCalendarDate,
    		rightCalendarDate,
    		displayedDate,
    		monthView,
    		incrementMonth,
    		toggleMonthSelectorOpen,
    		monthSelected,
    		viewContextKey,
    		myPosition,
    		startPosition,
    		$leftCalendarDate,
    		endPosition,
    		$rightCalendarDate,
    		$monthView,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class NavBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$b, create_fragment$b, safe_not_equal, { viewContextKey: 12 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavBar",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*viewContextKey*/ ctx[12] === undefined && !("viewContextKey" in props)) {
    			console.warn("<NavBar> was created without expected prop 'viewContextKey'");
    		}
    	}

    	get viewContextKey() {
    		throw new Error("<NavBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set viewContextKey(value) {
    		throw new Error("<NavBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    let shakeHighlightTimeout;

    function getDay (months, m, d, y) {
      const theMonth = months.find(aMonth => aMonth.month === m && aMonth.year === y);
      if (!theMonth) {
        return null
      }

      for (let i = 0; i < theMonth.weeks.length; i += 1) {
        for (let j = 0; j < theMonth.weeks[i].days.length; j += 1) {
          const aDay = theMonth.weeks[i].days[j];
          if (aDay.month === m && aDay.day === d && aDay.year === y) return aDay
        }
      }
      return null
    }

    function checkIfVisibleDateIsSelectable (months, date) {
      const proposedDay = getDay(
        months,
        date.month(),
        date.date(),
        date.year()
      );
      return proposedDay && proposedDay.selectable
    }

    function shakeDate (shouldShakeDate, date) {
      clearTimeout(shakeHighlightTimeout);
      shouldShakeDate.set(date);
      shakeHighlightTimeout = setTimeout(() => {
        shouldShakeDate.set(false);
      }, 700);
    }

    /* node_modules/@beyonk/svelte-datepicker/src/components/view/date-view/DateView.svelte generated by Svelte v3.35.0 */
    const file$a = "node_modules/@beyonk/svelte-datepicker/src/components/view/date-view/DateView.svelte";

    function create_fragment$a(ctx) {
    	let div;
    	let navbar;
    	let t;
    	let month;
    	let current;

    	navbar = new NavBar({
    			props: {
    				viewContextKey: /*viewContextKey*/ ctx[0]
    			},
    			$$inline: true
    		});

    	month = new Month({
    			props: {
    				viewContextKey: /*viewContextKey*/ ctx[0],
    				id: /*visibleMonthsId*/ ctx[1]
    			},
    			$$inline: true
    		});

    	month.$on("chosen", /*chosen_handler*/ ctx[5]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(navbar.$$.fragment);
    			t = space();
    			create_component(month.$$.fragment);
    			attr_dev(div, "class", "svelte-3fib5n");
    			add_location(div, file$a, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(navbar, div, null);
    			append_dev(div, t);
    			mount_component(month, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const navbar_changes = {};
    			if (dirty & /*viewContextKey*/ 1) navbar_changes.viewContextKey = /*viewContextKey*/ ctx[0];
    			navbar.$set(navbar_changes);
    			const month_changes = {};
    			if (dirty & /*viewContextKey*/ 1) month_changes.viewContextKey = /*viewContextKey*/ ctx[0];
    			if (dirty & /*visibleMonthsId*/ 2) month_changes.id = /*visibleMonthsId*/ ctx[1];
    			month.$set(month_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(month.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(month.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(navbar);
    			destroy_component(month);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let visibleMonthsId;
    	let $displayedDate;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DateView", slots, []);
    	let { viewContextKey } = $$props;
    	const dispatch = createEventDispatcher();
    	const { displayedDate } = getContext(viewContextKey);
    	validate_store(displayedDate, "displayedDate");
    	component_subscribe($$self, displayedDate, value => $$invalidate(4, $displayedDate = value));
    	const { months, shouldShakeDate } = getContext(contextKey);

    	function registerSelection(chosen) {
    		if (!checkIfVisibleDateIsSelectable(months, chosen)) {
    			return shakeDate(shouldShakeDate, chosen);
    		}

    		dispatch("chosen", { date: chosen });
    		return true;
    	}

    	const writable_props = ["viewContextKey"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DateView> was created with unknown prop '${key}'`);
    	});

    	const chosen_handler = e => registerSelection(e.detail.date);

    	$$self.$$set = $$props => {
    		if ("viewContextKey" in $$props) $$invalidate(0, viewContextKey = $$props.viewContextKey);
    	};

    	$$self.$capture_state = () => ({
    		Month,
    		NavBar,
    		checkIfVisibleDateIsSelectable,
    		shakeDate,
    		contextKey,
    		getContext,
    		createEventDispatcher,
    		viewContextKey,
    		dispatch,
    		displayedDate,
    		months,
    		shouldShakeDate,
    		registerSelection,
    		visibleMonthsId,
    		$displayedDate
    	});

    	$$self.$inject_state = $$props => {
    		if ("viewContextKey" in $$props) $$invalidate(0, viewContextKey = $$props.viewContextKey);
    		if ("visibleMonthsId" in $$props) $$invalidate(1, visibleMonthsId = $$props.visibleMonthsId);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$displayedDate*/ 16) {
    			$$invalidate(1, visibleMonthsId = $displayedDate.unix());
    		}
    	};

    	return [
    		viewContextKey,
    		visibleMonthsId,
    		displayedDate,
    		registerSelection,
    		$displayedDate,
    		chosen_handler
    	];
    }

    class DateView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$a, create_fragment$a, safe_not_equal, { viewContextKey: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DateView",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*viewContextKey*/ ctx[0] === undefined && !("viewContextKey" in props)) {
    			console.warn("<DateView> was created without expected prop 'viewContextKey'");
    		}
    	}

    	get viewContextKey() {
    		throw new Error("<DateView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set viewContextKey(value) {
    		throw new Error("<DateView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function createMonthView (months, displayedDate) {
      return derived([ displayedDate ], ([ $displayedDate ]) => {
        let monthIndex = 0;

        const month = $displayedDate.month();
        const year = $displayedDate.year();
        for (let i = 0; i < months.length; i += 1) {
          if (months[i].month === month && months[i].year === year) {
            monthIndex = i;
          }
        }

        return {
          monthIndex,
          visibleMonth: months[monthIndex]
        }
      })
    }

    function createViewContext (isStart, mainContext) {
      const { config, months, leftCalendarDate, rightCalendarDate, selectedStartDate, selectedEndDate } = mainContext;
      const [ date, displayedDate ] = isStart ? [ selectedStartDate, leftCalendarDate ] : [ selectedEndDate, rightCalendarDate ];
      const isDaytime = derived(date, $date => {
        if (!$date) { return true }
        const [ h ] = dayjs($date).format('HH:mm').split(':').map(d => parseInt(d));
        return h > config.morning && h < config.night
      });

      return {
        isStart,
        date,
        view: DateView,
        isDaytime,
        displayedDate,
        monthView: createMonthView(months, displayedDate)
      }
    }

    /* node_modules/@beyonk/svelte-datepicker/src/components/Toolbar.svelte generated by Svelte v3.35.0 */
    const file$9 = "node_modules/@beyonk/svelte-datepicker/src/components/Toolbar.svelte";

    function create_fragment$9(ctx) {
    	let div;
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t = text(/*continueText*/ ctx[0]);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "button svelte-hbl86k");
    			add_location(button, file$9, 1, 2, 24);
    			attr_dev(div, "class", "toolbar svelte-hbl86k");
    			add_location(div, file$9, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", prevent_default(/*progress*/ ctx[2]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*continueText*/ 1) set_data_dev(t, /*continueText*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $component;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Toolbar", slots, []);
    	let { continueText } = $$props;
    	const dispatch = createEventDispatcher();
    	const { config, component, isDateChosen } = getContext(contextKey);
    	validate_store(component, "component");
    	component_subscribe($$self, component, value => $$invalidate(3, $component = value));

    	function finalise() {
    		isDateChosen.set(true);
    		dispatch("close");
    	}

    	function progress() {
    		isDateChosen.set(false);

    		if ($component === "date-view") {
    			if (config.isTimePicker) {
    				component.set("time-view");
    			} else {
    				finalise();
    			}
    		} else if ($component === "time-view") {
    			finalise();
    		}
    	}

    	const writable_props = ["continueText"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Toolbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("continueText" in $$props) $$invalidate(0, continueText = $$props.continueText);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		createEventDispatcher,
    		contextKey,
    		continueText,
    		dispatch,
    		config,
    		component,
    		isDateChosen,
    		finalise,
    		progress,
    		$component
    	});

    	$$self.$inject_state = $$props => {
    		if ("continueText" in $$props) $$invalidate(0, continueText = $$props.continueText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [continueText, component, progress];
    }

    class Toolbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$9, create_fragment$9, safe_not_equal, { continueText: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Toolbar",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*continueText*/ ctx[0] === undefined && !("continueText" in props)) {
    			console.warn("<Toolbar> was created without expected prop 'continueText'");
    		}
    	}

    	get continueText() {
    		throw new Error("<Toolbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set continueText(value) {
    		throw new Error("<Toolbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@beyonk/svelte-datepicker/src/components/view/time-view/Chevron.svelte generated by Svelte v3.35.0 */

    const file$8 = "node_modules/@beyonk/svelte-datepicker/src/components/view/time-view/Chevron.svelte";

    function create_fragment$8(ctx) {
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "chevron svelte-twxu81");
    			toggle_class(span, "bottom", !/*up*/ ctx[0]);
    			add_location(span, file$8, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*click_handler*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*up*/ 1) {
    				toggle_class(span, "bottom", !/*up*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Chevron", slots, []);
    	let { up = true } = $$props;
    	const writable_props = ["up"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Chevron> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("up" in $$props) $$invalidate(0, up = $$props.up);
    	};

    	$$self.$capture_state = () => ({ up });

    	$$self.$inject_state = $$props => {
    		if ("up" in $$props) $$invalidate(0, up = $$props.up);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [up, click_handler];
    }

    class Chevron extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$8, create_fragment$8, safe_not_equal, { up: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chevron",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get up() {
    		throw new Error("<Chevron>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set up(value) {
    		throw new Error("<Chevron>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function timeInput (node, store) {
      node.addEventListener('keydown', types);
      node.addEventListener('focus', resetTime);
      node.addEventListener('blur', attemptValuePersist);

      let time;

      const unsubscribe = store.subscribe(given => {
        time = given.split('');
        syncInput();
      });

      function syncInput () {
        node.value = time.join('');
      }

      function resetTime () {
        time = [];
        syncInput();
      }

      function persistTime () {
        store.set(time.join(''));
        syncInput();
      }

      function attemptValuePersist () {
        if (time.digits === 5) {
          persistTime();
          return
        }

        time = get_store_value(store).split('');
        syncInput();
      }

      function types (e) {
        e.preventDefault();
        const k = e.which;

        if (k >= 48 && k <= 57) {
          addDigit(k);
        }

        if (k === 8) {
          deleteDigit();
        }
      }

      function deleteDigit () {
        time.pop();
        time.length === 3 && time.pop();
        syncInput();
      }

      function isInvalidDigit (digit) {
        const tooManyDigits = time.length > 4;
        const invalidFirstDigit = time.length === 0 && ![ 0, 1, 2 ].includes(digit);
        const invalidSecondDigit = time.length === 1 && time[0] === 2 && digit > 3;
        const invalidThirdDigit = time.length === 3 && digit > 5;
        return tooManyDigits || invalidFirstDigit || invalidSecondDigit || invalidThirdDigit
      }

      function addDigit (k) {
        const digit = k - 48;
        if (isInvalidDigit(digit)) { return }

        time.length === 2 && time.push(':');
        time.push(digit);

        if (time.length === 5) {
          persistTime();
        }

        syncInput();
      }

      return {
        destroy () {
          unsubscribe();
          node.removeEventListener('keydown', types);
          node.removeEventListener('focus', resetTime);
          node.removeEventListener('blur', attemptValuePersist);
        }
      }
    }

    function format (h, m) {
      return [
        String(h).padStart(2, '0'),
        String(m).padStart(2, '0')
      ].join(':')
    }

    function createStore (date, config) {
      const time = writable(dayjs(date).format('HH:mm'));

      function increment (segment) {
        time.update(t => {
          let [ h, m ] = t.split(':');
          if (segment === 'hour' && h < 23) { ++h; }
          if (segment === 'minute' && m < 59) {
            m = Math.min(59, parseInt(m) + config.minuteStep);
          }
          return format(h, m)
        });
      }

      function decrement (segment) {
        time.update(t => {
          let [ h, m ] = t.split(':');
          if (segment === 'hour' && h > 0) { --h; }
          if (segment === 'minute' && m > 0) {
            m = Math.max(0, parseInt(m) - config.minuteStep);
          }
          return format(h, m)
        });
      }

      function set (t) {
        time.set(t);
      }
      return {
        increment,
        decrement,
        time,
        set
      }
    }

    /* node_modules/@beyonk/svelte-datepicker/src/components/view/time-view/TimeInput.svelte generated by Svelte v3.35.0 */
    const file$7 = "node_modules/@beyonk/svelte-datepicker/src/components/view/time-view/TimeInput.svelte";

    function create_fragment$7(ctx) {
    	let div2;
    	let div0;
    	let chevron0;
    	let t0;
    	let chevron1;
    	let t1;
    	let input;
    	let t2;
    	let div1;
    	let chevron2;
    	let t3;
    	let chevron3;
    	let current;
    	let mounted;
    	let dispose;
    	chevron0 = new Chevron({ props: { up: true }, $$inline: true });
    	chevron0.$on("click", /*click_handler*/ ctx[7]);
    	chevron1 = new Chevron({ props: { up: true }, $$inline: true });
    	chevron1.$on("click", /*click_handler_1*/ ctx[8]);
    	chevron2 = new Chevron({ props: { up: false }, $$inline: true });
    	chevron2.$on("click", /*click_handler_2*/ ctx[9]);
    	chevron3 = new Chevron({ props: { up: false }, $$inline: true });
    	chevron3.$on("click", /*click_handler_3*/ ctx[10]);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(chevron0.$$.fragment);
    			t0 = space();
    			create_component(chevron1.$$.fragment);
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			div1 = element("div");
    			create_component(chevron2.$$.fragment);
    			t3 = space();
    			create_component(chevron3.$$.fragment);
    			attr_dev(div0, "class", "controls svelte-w5vedm");
    			add_location(div0, file$7, 1, 2, 57);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-w5vedm");
    			add_location(input, file$7, 5, 2, 215);
    			attr_dev(div1, "class", "controls svelte-w5vedm");
    			add_location(div1, file$7, 6, 2, 265);
    			attr_dev(div2, "class", "time-picker svelte-w5vedm");
    			toggle_class(div2, "is-night", !/*$isDaytime*/ ctx[0]);
    			add_location(div2, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(chevron0, div0, null);
    			append_dev(div0, t0);
    			mount_component(chevron1, div0, null);
    			append_dev(div2, t1);
    			append_dev(div2, input);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			mount_component(chevron2, div1, null);
    			append_dev(div1, t3);
    			mount_component(chevron3, div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(timeInput.call(null, input, /*timeStore*/ ctx[5]));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$isDaytime*/ 1) {
    				toggle_class(div2, "is-night", !/*$isDaytime*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(chevron0.$$.fragment, local);
    			transition_in(chevron1.$$.fragment, local);
    			transition_in(chevron2.$$.fragment, local);
    			transition_in(chevron3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(chevron0.$$.fragment, local);
    			transition_out(chevron1.$$.fragment, local);
    			transition_out(chevron2.$$.fragment, local);
    			transition_out(chevron3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(chevron0);
    			destroy_component(chevron1);
    			destroy_component(chevron2);
    			destroy_component(chevron3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $date;
    	let $isDaytime;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TimeInput", slots, []);
    	let { viewContextKey } = $$props;
    	const { config } = getContext(contextKey);
    	const { date, isDaytime } = getContext(viewContextKey);
    	validate_store(date, "date");
    	component_subscribe($$self, date, value => $$invalidate(11, $date = value));
    	validate_store(isDaytime, "isDaytime");
    	component_subscribe($$self, isDaytime, value => $$invalidate(0, $isDaytime = value));
    	const { increment, decrement, time: timeStore } = createStore($date, config);

    	onMount(() => timeStore.subscribe(ts => {
    		const [d, m] = ts.split(":").map(g => parseInt(g));
    		date.update(v => v.hour(d).minute(m));
    	}));

    	const writable_props = ["viewContextKey"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TimeInput> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => increment("hour");
    	const click_handler_1 = () => increment("minute");
    	const click_handler_2 = () => decrement("hour");
    	const click_handler_3 = () => decrement("minute");

    	$$self.$$set = $$props => {
    		if ("viewContextKey" in $$props) $$invalidate(6, viewContextKey = $$props.viewContextKey);
    	};

    	$$self.$capture_state = () => ({
    		contextKey,
    		onMount,
    		getContext,
    		Chevron,
    		timeInput,
    		createStore,
    		viewContextKey,
    		config,
    		date,
    		isDaytime,
    		increment,
    		decrement,
    		timeStore,
    		$date,
    		$isDaytime
    	});

    	$$self.$inject_state = $$props => {
    		if ("viewContextKey" in $$props) $$invalidate(6, viewContextKey = $$props.viewContextKey);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		$isDaytime,
    		date,
    		isDaytime,
    		increment,
    		decrement,
    		timeStore,
    		viewContextKey,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class TimeInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$7, create_fragment$7, safe_not_equal, { viewContextKey: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TimeInput",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*viewContextKey*/ ctx[6] === undefined && !("viewContextKey" in props)) {
    			console.warn("<TimeInput> was created without expected prop 'viewContextKey'");
    		}
    	}

    	get viewContextKey() {
    		throw new Error("<TimeInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set viewContextKey(value) {
    		throw new Error("<TimeInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@beyonk/svelte-datepicker/src/components/view/time-view/TimeView.svelte generated by Svelte v3.35.0 */
    const file$6 = "node_modules/@beyonk/svelte-datepicker/src/components/view/time-view/TimeView.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let span;
    	let t0_value = dayjs(/*$date*/ ctx[2]).format(/*config*/ ctx[5].format) + "";
    	let t0;
    	let t1;
    	let timeinput;
    	let current;

    	timeinput = new TimeInput({
    			props: {
    				viewContextKey: /*viewContextKey*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			create_component(timeinput.$$.fragment);
    			attr_dev(span, "class", "chosen-date svelte-17tznc2");
    			add_location(span, file$6, 12, 2, 395);
    			attr_dev(div, "class", "time-container svelte-17tznc2");
    			toggle_class(div, "is-night", !/*$isDaytime*/ ctx[1]);
    			add_location(div, file$6, 11, 0, 335);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(div, t1);
    			mount_component(timeinput, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*$date*/ 4) && t0_value !== (t0_value = dayjs(/*$date*/ ctx[2]).format(/*config*/ ctx[5].format) + "")) set_data_dev(t0, t0_value);
    			const timeinput_changes = {};
    			if (dirty & /*viewContextKey*/ 1) timeinput_changes.viewContextKey = /*viewContextKey*/ ctx[0];
    			timeinput.$set(timeinput_changes);

    			if (dirty & /*$isDaytime*/ 2) {
    				toggle_class(div, "is-night", !/*$isDaytime*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(timeinput.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(timeinput.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(timeinput);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $isDaytime;
    	let $date;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TimeView", slots, []);
    	let { viewContextKey } = $$props;
    	const { date, isDaytime } = getContext(viewContextKey);
    	validate_store(date, "date");
    	component_subscribe($$self, date, value => $$invalidate(2, $date = value));
    	validate_store(isDaytime, "isDaytime");
    	component_subscribe($$self, isDaytime, value => $$invalidate(1, $isDaytime = value));
    	const { config } = getContext(contextKey);
    	const writable_props = ["viewContextKey"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TimeView> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("viewContextKey" in $$props) $$invalidate(0, viewContextKey = $$props.viewContextKey);
    	};

    	$$self.$capture_state = () => ({
    		dayjs,
    		contextKey,
    		TimeInput,
    		getContext,
    		viewContextKey,
    		date,
    		isDaytime,
    		config,
    		$isDaytime,
    		$date
    	});

    	$$self.$inject_state = $$props => {
    		if ("viewContextKey" in $$props) $$invalidate(0, viewContextKey = $$props.viewContextKey);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [viewContextKey, $isDaytime, $date, date, isDaytime, config];
    }

    class TimeView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$6, create_fragment$6, safe_not_equal, { viewContextKey: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TimeView",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*viewContextKey*/ ctx[0] === undefined && !("viewContextKey" in props)) {
    			console.warn("<TimeView> was created without expected prop 'viewContextKey'");
    		}
    	}

    	get viewContextKey() {
    		throw new Error("<TimeView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set viewContextKey(value) {
    		throw new Error("<TimeView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@beyonk/svelte-datepicker/src/components/view/View.svelte generated by Svelte v3.35.0 */
    const file$5 = "node_modules/@beyonk/svelte-datepicker/src/components/view/View.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let switch_instance;
    	let current;

    	var switch_value = /*$component*/ ctx[2] === "date-view"
    	? DateView
    	: TimeView;

    	function switch_props(ctx) {
    		return {
    			props: {
    				viewContextKey: /*viewContextKey*/ ctx[0]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    		switch_instance.$on("chosen", /*chosen_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(div, "class", "calendar svelte-1sgbxd0");
    			toggle_class(div, "is-range-picker", /*config*/ ctx[3].isRangePicker);
    			toggle_class(div, "day", /*$isDaytime*/ ctx[1]);
    			toggle_class(div, "night", !/*$isDaytime*/ ctx[1]);
    			add_location(div, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = {};
    			if (dirty & /*viewContextKey*/ 1) switch_instance_changes.viewContextKey = /*viewContextKey*/ ctx[0];

    			if (switch_value !== (switch_value = /*$component*/ ctx[2] === "date-view"
    			? DateView
    			: TimeView)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					switch_instance.$on("chosen", /*chosen_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, null);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}

    			if (dirty & /*$isDaytime*/ 2) {
    				toggle_class(div, "day", /*$isDaytime*/ ctx[1]);
    			}

    			if (dirty & /*$isDaytime*/ 2) {
    				toggle_class(div, "night", !/*$isDaytime*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (switch_instance) destroy_component(switch_instance);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $isDaytime;
    	let $component;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("View", slots, []);
    	let { viewContextKey } = $$props;
    	const { config, component } = getContext(contextKey);
    	validate_store(component, "component");
    	component_subscribe($$self, component, value => $$invalidate(2, $component = value));
    	const { isDaytime } = getContext(viewContextKey);
    	validate_store(isDaytime, "isDaytime");
    	component_subscribe($$self, isDaytime, value => $$invalidate(1, $isDaytime = value));
    	const writable_props = ["viewContextKey"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<View> was created with unknown prop '${key}'`);
    	});

    	function chosen_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("viewContextKey" in $$props) $$invalidate(0, viewContextKey = $$props.viewContextKey);
    	};

    	$$self.$capture_state = () => ({
    		contextKey,
    		getContext,
    		DateView,
    		TimeView,
    		viewContextKey,
    		config,
    		component,
    		isDaytime,
    		$isDaytime,
    		$component
    	});

    	$$self.$inject_state = $$props => {
    		if ("viewContextKey" in $$props) $$invalidate(0, viewContextKey = $$props.viewContextKey);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		viewContextKey,
    		$isDaytime,
    		$component,
    		config,
    		component,
    		isDaytime,
    		chosen_handler
    	];
    }

    class View extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$5, create_fragment$5, safe_not_equal, { viewContextKey: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "View",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*viewContextKey*/ ctx[0] === undefined && !("viewContextKey" in props)) {
    			console.warn("<View> was created without expected prop 'viewContextKey'");
    		}
    	}

    	get viewContextKey() {
    		throw new Error("<View>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set viewContextKey(value) {
    		throw new Error("<View>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@beyonk/svelte-datepicker/src/components/DatePicker.svelte generated by Svelte v3.35.0 */
    const file$4 = "node_modules/@beyonk/svelte-datepicker/src/components/DatePicker.svelte";
    const get_default_slot_changes = dirty => ({ formatted: dirty[0] & /*$formatter*/ 256 });
    const get_default_slot_context = ctx => ({ formatted: /*$formatter*/ ctx[8] });

    // (181:8) {#if !trigger}
    function create_if_block_1$1(ctx) {
    	let button;

    	function select_block_type(ctx, dirty) {
    		if (/*$isDateChosen*/ ctx[4]) return create_if_block_2$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if_block.c();
    			attr_dev(button, "class", "calendar-button svelte-19zfrtc");
    			attr_dev(button, "type", "button");
    			add_location(button, file$4, 181, 10, 4173);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if_block.m(button, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(181:8) {#if !trigger}",
    		ctx
    	});

    	return block;
    }

    // (185:12) {:else}
    function create_else_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*placeholder*/ ctx[0]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*placeholder*/ 1) set_data_dev(t, /*placeholder*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(185:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (183:12) {#if $isDateChosen}
    function create_if_block_2$1(ctx) {
    	let t_value = /*$formatter*/ ctx[8].formattedCombined + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$formatter*/ 256 && t_value !== (t_value = /*$formatter*/ ctx[8].formattedCombined + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(183:12) {#if $isDateChosen}",
    		ctx
    	});

    	return block;
    }

    // (180:35)          
    function fallback_block(ctx) {
    	let if_block_anchor;
    	let if_block = !/*trigger*/ ctx[1] && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (!/*trigger*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(180:35)          ",
    		ctx
    	});

    	return block;
    }

    // (179:4) 
    function create_trigger_slot(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[34].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[37], get_default_slot_context);
    	const default_slot_or_fallback = default_slot || fallback_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			attr_dev(div, "slot", "trigger");
    			attr_dev(div, "class", "svelte-19zfrtc");
    			add_location(div, file$4, 178, 4, 4083);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty[0] & /*$formatter*/ 256 | dirty[1] & /*$$scope*/ 64) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[37], dirty, get_default_slot_changes, get_default_slot_context);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && dirty[0] & /*$formatter, $isDateChosen, placeholder, trigger*/ 275) {
    					default_slot_or_fallback.p(ctx, dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_trigger_slot.name,
    		type: "slot",
    		source: "(179:4) ",
    		ctx
    	});

    	return block;
    }

    // (198:8) {#if config.isRangePicker}
    function create_if_block$1(ctx) {
    	let view;
    	let current;

    	view = new View({
    			props: {
    				viewContextKey: /*endContextKey*/ ctx[11]
    			},
    			$$inline: true
    		});

    	view.$on("chosen", /*addDate*/ ctx[21]);

    	const block = {
    		c: function create() {
    			create_component(view.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(view, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(view.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(view.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(view, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(198:8) {#if config.isRangePicker}",
    		ctx
    	});

    	return block;
    }

    // (192:4) 
    function create_contents_slot(ctx) {
    	let div1;
    	let div0;
    	let view;
    	let t0;
    	let t1;
    	let toolbar;
    	let current;

    	view = new View({
    			props: {
    				viewContextKey: /*startContextKey*/ ctx[10]
    			},
    			$$inline: true
    		});

    	view.$on("chosen", /*addDate*/ ctx[21]);
    	let if_block = /*config*/ ctx[12].isRangePicker && create_if_block$1(ctx);

    	toolbar = new Toolbar({
    			props: { continueText: /*continueText*/ ctx[3] },
    			$$inline: true
    		});

    	toolbar.$on("close", /*close*/ ctx[22]);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(view.$$.fragment);
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			create_component(toolbar.$$.fragment);
    			attr_dev(div0, "class", "view svelte-19zfrtc");
    			add_location(div0, file$4, 192, 6, 4516);
    			attr_dev(div1, "class", "contents svelte-19zfrtc");
    			attr_dev(div1, "slot", "contents");
    			toggle_class(div1, "is-range-picker", /*config*/ ctx[12].isRangePicker);
    			add_location(div1, file$4, 191, 4, 4426);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(view, div0, null);
    			append_dev(div0, t0);
    			if (if_block) if_block.m(div0, null);
    			append_dev(div1, t1);
    			mount_component(toolbar, div1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*config*/ ctx[12].isRangePicker) if_block.p(ctx, dirty);
    			const toolbar_changes = {};
    			if (dirty[0] & /*continueText*/ 8) toolbar_changes.continueText = /*continueText*/ ctx[3];
    			toolbar.$set(toolbar_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(view.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(toolbar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(view.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(toolbar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(view);
    			if (if_block) if_block.d();
    			destroy_component(toolbar);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_contents_slot.name,
    		type: "slot",
    		source: "(192:4) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let popover_1;
    	let div_style_value;
    	let current;

    	let popover_1_props = {
    		trigger: /*trigger*/ ctx[1],
    		$$slots: {
    			contents: [create_contents_slot],
    			trigger: [create_trigger_slot]
    		},
    		$$scope: { ctx }
    	};

    	popover_1 = new Popover({ props: popover_1_props, $$inline: true });
    	/*popover_1_binding*/ ctx[35](popover_1);
    	popover_1.$on("opened", /*initialisePicker*/ ctx[20]);
    	popover_1.$on("closed", /*closed_handler*/ ctx[36]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(popover_1.$$.fragment);
    			attr_dev(div, "class", "datepicker svelte-19zfrtc");
    			attr_dev(div, "style", div_style_value = /*styling*/ ctx[2].toWrapperStyle());
    			toggle_class(div, "open", /*$isOpen*/ ctx[6]);
    			toggle_class(div, "closing", /*$isClosing*/ ctx[7]);
    			add_location(div, file$4, 168, 0, 3842);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(popover_1, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const popover_1_changes = {};
    			if (dirty[0] & /*trigger*/ 2) popover_1_changes.trigger = /*trigger*/ ctx[1];

    			if (dirty[0] & /*continueText, $formatter, $isDateChosen, placeholder, trigger*/ 283 | dirty[1] & /*$$scope*/ 64) {
    				popover_1_changes.$$scope = { dirty, ctx };
    			}

    			popover_1.$set(popover_1_changes);

    			if (!current || dirty[0] & /*styling*/ 4 && div_style_value !== (div_style_value = /*styling*/ ctx[2].toWrapperStyle())) {
    				attr_dev(div, "style", div_style_value);
    			}

    			if (dirty[0] & /*$isOpen*/ 64) {
    				toggle_class(div, "open", /*$isOpen*/ ctx[6]);
    			}

    			if (dirty[0] & /*$isClosing*/ 128) {
    				toggle_class(div, "closing", /*$isClosing*/ ctx[7]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(popover_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(popover_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*popover_1_binding*/ ctx[35](null);
    			destroy_component(popover_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $selectedStartDate;
    	let $selectedEndDate;
    	let $isSelectingFirstDate;
    	let $isDateChosen;
    	let $isOpen;
    	let $isClosing;
    	let $formatter;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DatePicker", slots, ['default']);
    	let { range = false } = $$props;
    	let { placeholder = "Choose Date" } = $$props;
    	let { format = "DD / MM / YYYY" } = $$props;
    	let { start = dayjs().subtract(1, "year") } = $$props;
    	let { end = dayjs().add(1, "year") } = $$props;
    	let { trigger = null } = $$props;
    	let { selectableCallback = null } = $$props;
    	let { styling = new CalendarStyle() } = $$props;
    	let { selected } = $$props;
    	let { closeOnFocusLoss = true } = $$props;
    	let { time = false } = $$props;
    	let { morning = 7 } = $$props;
    	let { night = 19 } = $$props;
    	let { minuteStep = 5 } = $$props;
    	let { continueText = "Continue" } = $$props;
    	const dispatch = createEventDispatcher();
    	const startContextKey = {};
    	const endContextKey = {};

    	const config = {
    		start: dayjs(start),
    		end: dayjs(end),
    		isRangePicker: range,
    		isTimePicker: time,
    		closeOnFocusLoss,
    		format,
    		morning,
    		night,
    		selectableCallback,
    		minuteStep: parseInt(minuteStep)
    	};

    	setContext(contextKey, setup(selected, config));
    	const { selectedStartDate, selectedEndDate, isOpen, isClosing, highlighted, formatter, isDateChosen, isSelectingFirstDate } = getContext(contextKey);
    	validate_store(selectedStartDate, "selectedStartDate");
    	component_subscribe($$self, selectedStartDate, value => $$invalidate(38, $selectedStartDate = value));
    	validate_store(selectedEndDate, "selectedEndDate");
    	component_subscribe($$self, selectedEndDate, value => $$invalidate(39, $selectedEndDate = value));
    	validate_store(isOpen, "isOpen");
    	component_subscribe($$self, isOpen, value => $$invalidate(6, $isOpen = value));
    	validate_store(isClosing, "isClosing");
    	component_subscribe($$self, isClosing, value => $$invalidate(7, $isClosing = value));
    	validate_store(formatter, "formatter");
    	component_subscribe($$self, formatter, value => $$invalidate(8, $formatter = value));
    	validate_store(isDateChosen, "isDateChosen");
    	component_subscribe($$self, isDateChosen, value => $$invalidate(4, $isDateChosen = value));
    	validate_store(isSelectingFirstDate, "isSelectingFirstDate");
    	component_subscribe($$self, isSelectingFirstDate, value => $$invalidate(40, $isSelectingFirstDate = value));
    	setContext(startContextKey, createViewContext(true, getContext(contextKey)));

    	if (config.isRangePicker) {
    		setContext(endContextKey, createViewContext(false, getContext(contextKey)));
    	}

    	let popover;

    	function initialisePicker() {
    		highlighted.set($selectedStartDate);
    		dispatch("open");
    	}

    	function setRangeValue() {
    		$$invalidate(23, selected = [$selectedStartDate, $selectedEndDate]);

    		dispatch("range-selected", {
    			from: $selectedStartDate.toDate(),
    			to: $selectedEndDate.toDate()
    		});
    	}

    	function setDateValue() {
    		$$invalidate(23, selected = $selectedStartDate.toDate());
    		dispatch("date-selected", { date: $selectedStartDate.toDate() });
    	}

    	function swapDatesIfRequired() {
    		if (!config.isRangePicker) {
    			return;
    		}

    		const from = $selectedStartDate;
    		const to = $selectedEndDate;

    		if (to.isBefore(from)) {
    			selectedStartDate.set(to);
    			selectedEndDate.set(from);
    		}
    	}

    	function addDate(e) {
    		const { date } = e.detail;

    		if ($isSelectingFirstDate) {
    			selectedStartDate.set(date);
    		} else {
    			selectedEndDate.set(date);
    		}

    		swapDatesIfRequired();
    		config.isRangePicker && isSelectingFirstDate.update(v => !v);
    	}

    	function close() {
    		swapDatesIfRequired();
    		popover.close();
    	}

    	const writable_props = [
    		"range",
    		"placeholder",
    		"format",
    		"start",
    		"end",
    		"trigger",
    		"selectableCallback",
    		"styling",
    		"selected",
    		"closeOnFocusLoss",
    		"time",
    		"morning",
    		"night",
    		"minuteStep",
    		"continueText"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DatePicker> was created with unknown prop '${key}'`);
    	});

    	function popover_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			popover = $$value;
    			$$invalidate(5, popover);
    		});
    	}

    	const closed_handler = () => dispatch("close");

    	$$self.$$set = $$props => {
    		if ("range" in $$props) $$invalidate(24, range = $$props.range);
    		if ("placeholder" in $$props) $$invalidate(0, placeholder = $$props.placeholder);
    		if ("format" in $$props) $$invalidate(25, format = $$props.format);
    		if ("start" in $$props) $$invalidate(26, start = $$props.start);
    		if ("end" in $$props) $$invalidate(27, end = $$props.end);
    		if ("trigger" in $$props) $$invalidate(1, trigger = $$props.trigger);
    		if ("selectableCallback" in $$props) $$invalidate(28, selectableCallback = $$props.selectableCallback);
    		if ("styling" in $$props) $$invalidate(2, styling = $$props.styling);
    		if ("selected" in $$props) $$invalidate(23, selected = $$props.selected);
    		if ("closeOnFocusLoss" in $$props) $$invalidate(29, closeOnFocusLoss = $$props.closeOnFocusLoss);
    		if ("time" in $$props) $$invalidate(30, time = $$props.time);
    		if ("morning" in $$props) $$invalidate(31, morning = $$props.morning);
    		if ("night" in $$props) $$invalidate(32, night = $$props.night);
    		if ("minuteStep" in $$props) $$invalidate(33, minuteStep = $$props.minuteStep);
    		if ("continueText" in $$props) $$invalidate(3, continueText = $$props.continueText);
    		if ("$$scope" in $$props) $$invalidate(37, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Popover,
    		dayjs,
    		contextKey,
    		setup,
    		createEventDispatcher,
    		setContext,
    		getContext,
    		CalendarStyle,
    		createViewContext,
    		Toolbar,
    		View,
    		range,
    		placeholder,
    		format,
    		start,
    		end,
    		trigger,
    		selectableCallback,
    		styling,
    		selected,
    		closeOnFocusLoss,
    		time,
    		morning,
    		night,
    		minuteStep,
    		continueText,
    		dispatch,
    		startContextKey,
    		endContextKey,
    		config,
    		selectedStartDate,
    		selectedEndDate,
    		isOpen,
    		isClosing,
    		highlighted,
    		formatter,
    		isDateChosen,
    		isSelectingFirstDate,
    		popover,
    		initialisePicker,
    		setRangeValue,
    		setDateValue,
    		swapDatesIfRequired,
    		addDate,
    		close,
    		$selectedStartDate,
    		$selectedEndDate,
    		$isSelectingFirstDate,
    		$isDateChosen,
    		$isOpen,
    		$isClosing,
    		$formatter
    	});

    	$$self.$inject_state = $$props => {
    		if ("range" in $$props) $$invalidate(24, range = $$props.range);
    		if ("placeholder" in $$props) $$invalidate(0, placeholder = $$props.placeholder);
    		if ("format" in $$props) $$invalidate(25, format = $$props.format);
    		if ("start" in $$props) $$invalidate(26, start = $$props.start);
    		if ("end" in $$props) $$invalidate(27, end = $$props.end);
    		if ("trigger" in $$props) $$invalidate(1, trigger = $$props.trigger);
    		if ("selectableCallback" in $$props) $$invalidate(28, selectableCallback = $$props.selectableCallback);
    		if ("styling" in $$props) $$invalidate(2, styling = $$props.styling);
    		if ("selected" in $$props) $$invalidate(23, selected = $$props.selected);
    		if ("closeOnFocusLoss" in $$props) $$invalidate(29, closeOnFocusLoss = $$props.closeOnFocusLoss);
    		if ("time" in $$props) $$invalidate(30, time = $$props.time);
    		if ("morning" in $$props) $$invalidate(31, morning = $$props.morning);
    		if ("night" in $$props) $$invalidate(32, night = $$props.night);
    		if ("minuteStep" in $$props) $$invalidate(33, minuteStep = $$props.minuteStep);
    		if ("continueText" in $$props) $$invalidate(3, continueText = $$props.continueText);
    		if ("popover" in $$props) $$invalidate(5, popover = $$props.popover);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*$isDateChosen*/ 16) {
    			{
    				if ($isDateChosen) {
    					config.isRangePicker ? setRangeValue() : setDateValue();
    					dispatch("change");
    				}
    			}
    		}
    	};

    	return [
    		placeholder,
    		trigger,
    		styling,
    		continueText,
    		$isDateChosen,
    		popover,
    		$isOpen,
    		$isClosing,
    		$formatter,
    		dispatch,
    		startContextKey,
    		endContextKey,
    		config,
    		selectedStartDate,
    		selectedEndDate,
    		isOpen,
    		isClosing,
    		formatter,
    		isDateChosen,
    		isSelectingFirstDate,
    		initialisePicker,
    		addDate,
    		close,
    		selected,
    		range,
    		format,
    		start,
    		end,
    		selectableCallback,
    		closeOnFocusLoss,
    		time,
    		morning,
    		night,
    		minuteStep,
    		slots,
    		popover_1_binding,
    		closed_handler,
    		$$scope
    	];
    }

    class DatePicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$1(
    			this,
    			options,
    			instance$4,
    			create_fragment$4,
    			safe_not_equal,
    			{
    				range: 24,
    				placeholder: 0,
    				format: 25,
    				start: 26,
    				end: 27,
    				trigger: 1,
    				selectableCallback: 28,
    				styling: 2,
    				selected: 23,
    				closeOnFocusLoss: 29,
    				time: 30,
    				morning: 31,
    				night: 32,
    				minuteStep: 33,
    				continueText: 3
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DatePicker",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*selected*/ ctx[23] === undefined && !("selected" in props)) {
    			console.warn("<DatePicker> was created without expected prop 'selected'");
    		}
    	}

    	get range() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set range(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get format() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set format(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get start() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set start(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get end() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set end(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get trigger() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set trigger(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectableCallback() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectableCallback(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get styling() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set styling(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeOnFocusLoss() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeOnFocusLoss(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get time() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set time(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get morning() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set morning(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get night() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set night(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get minuteStep() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minuteStep(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get continueText() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set continueText(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/Posts/PostsFilters.svelte generated by Svelte v3.35.0 */

    const file$3 = "src/routes/Posts/PostsFilters.svelte";

    function create_fragment$3(ctx) {
    	let div3;
    	let h40;
    	let t1;
    	let div0;
    	let input0;
    	let t2;
    	let p0;
    	let t4;
    	let input1;
    	let t5;
    	let h41;
    	let t7;
    	let div1;
    	let label0;
    	let input2;
    	let t8;
    	let p1;
    	let t10;
    	let label1;
    	let input3;
    	let t11;
    	let p2;
    	let t13;
    	let label2;
    	let input4;
    	let t14;
    	let p3;
    	let t16;
    	let label3;
    	let input5;
    	let t17;
    	let p4;
    	let t19;
    	let h42;
    	let t21;
    	let div2;
    	let label4;
    	let input6;
    	let t22;
    	let t23;
    	let label5;
    	let input7;
    	let t24;
    	let t25;
    	let label6;
    	let input8;
    	let t26;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			h40 = element("h4");
    			h40.textContent = "Date";
    			t1 = space();
    			div0 = element("div");
    			input0 = element("input");
    			t2 = space();
    			p0 = element("p");
    			p0.textContent = "to";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			h41 = element("h4");
    			h41.textContent = "Category";
    			t7 = space();
    			div1 = element("div");
    			label0 = element("label");
    			input2 = element("input");
    			t8 = space();
    			p1 = element("p");
    			p1.textContent = "Informatique";
    			t10 = space();
    			label1 = element("label");
    			input3 = element("input");
    			t11 = space();
    			p2 = element("p");
    			p2.textContent = "Learning";
    			t13 = space();
    			label2 = element("label");
    			input4 = element("input");
    			t14 = space();
    			p3 = element("p");
    			p3.textContent = "Building";
    			t16 = space();
    			label3 = element("label");
    			input5 = element("input");
    			t17 = space();
    			p4 = element("p");
    			p4.textContent = "Combat";
    			t19 = space();
    			h42 = element("h4");
    			h42.textContent = "Status";
    			t21 = space();
    			div2 = element("div");
    			label4 = element("label");
    			input6 = element("input");
    			t22 = text(" Not Published");
    			t23 = space();
    			label5 = element("label");
    			input7 = element("input");
    			t24 = text(" Pending");
    			t25 = space();
    			label6 = element("label");
    			input8 = element("input");
    			t26 = text(" Published");
    			attr_dev(h40, "class", "svelte-yt2pwp");
    			add_location(h40, file$3, 20, 8, 382);
    			attr_dev(input0, "type", "date");
    			attr_dev(input0, "class", "svelte-yt2pwp");
    			add_location(input0, file$3, 22, 12, 445);
    			attr_dev(p0, "class", "svelte-yt2pwp");
    			add_location(p0, file$3, 22, 55, 488);
    			attr_dev(input1, "type", "date");
    			attr_dev(input1, "class", "svelte-yt2pwp");
    			add_location(input1, file$3, 22, 65, 498);
    			attr_dev(div0, "class", "flex-container svelte-yt2pwp");
    			add_location(div0, file$3, 21, 8, 404);
    			attr_dev(h41, "class", "svelte-yt2pwp");
    			add_location(h41, file$3, 25, 8, 571);
    			attr_dev(input2, "type", "checkbox");
    			attr_dev(input2, "class", "svelte-yt2pwp");
    			add_location(input2, file$3, 27, 19, 645);
    			attr_dev(p1, "class", "svelte-yt2pwp");
    			add_location(p1, file$3, 27, 67, 693);
    			attr_dev(label0, "class", "svelte-yt2pwp");
    			add_location(label0, file$3, 27, 12, 638);
    			attr_dev(input3, "type", "checkbox");
    			attr_dev(input3, "class", "svelte-yt2pwp");
    			add_location(input3, file$3, 28, 19, 741);
    			attr_dev(p2, "class", "svelte-yt2pwp");
    			add_location(p2, file$3, 28, 68, 790);
    			attr_dev(label1, "class", "svelte-yt2pwp");
    			add_location(label1, file$3, 28, 12, 734);
    			attr_dev(input4, "type", "checkbox");
    			attr_dev(input4, "class", "svelte-yt2pwp");
    			add_location(input4, file$3, 29, 19, 834);
    			attr_dev(p3, "class", "svelte-yt2pwp");
    			add_location(p3, file$3, 29, 68, 883);
    			attr_dev(label2, "class", "svelte-yt2pwp");
    			add_location(label2, file$3, 29, 12, 827);
    			attr_dev(input5, "type", "checkbox");
    			attr_dev(input5, "class", "svelte-yt2pwp");
    			add_location(input5, file$3, 30, 19, 927);
    			attr_dev(p4, "class", "svelte-yt2pwp");
    			add_location(p4, file$3, 30, 69, 977);
    			attr_dev(label3, "class", "svelte-yt2pwp");
    			add_location(label3, file$3, 30, 12, 920);
    			attr_dev(div1, "class", "flex-container svelte-yt2pwp");
    			add_location(div1, file$3, 26, 8, 597);
    			attr_dev(h42, "class", "svelte-yt2pwp");
    			add_location(h42, file$3, 33, 8, 1032);
    			attr_dev(input6, "type", "checkbox");
    			attr_dev(input6, "class", "svelte-yt2pwp");
    			add_location(input6, file$3, 35, 19, 1104);
    			attr_dev(label4, "class", "svelte-yt2pwp");
    			add_location(label4, file$3, 35, 12, 1097);
    			attr_dev(input7, "type", "checkbox");
    			attr_dev(input7, "class", "svelte-yt2pwp");
    			add_location(input7, file$3, 36, 19, 1200);
    			attr_dev(label5, "class", "svelte-yt2pwp");
    			add_location(label5, file$3, 36, 12, 1193);
    			attr_dev(input8, "type", "checkbox");
    			attr_dev(input8, "class", "svelte-yt2pwp");
    			add_location(input8, file$3, 37, 19, 1290);
    			attr_dev(label6, "class", "svelte-yt2pwp");
    			add_location(label6, file$3, 37, 12, 1283);
    			attr_dev(div2, "class", "flex-container svelte-yt2pwp");
    			add_location(div2, file$3, 34, 8, 1056);
    			attr_dev(div3, "class", "content svelte-yt2pwp");
    			add_location(div3, file$3, 19, 4, 352);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h40);
    			append_dev(div3, t1);
    			append_dev(div3, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*date_from*/ ctx[0]);
    			append_dev(div0, t2);
    			append_dev(div0, p0);
    			append_dev(div0, t4);
    			append_dev(div0, input1);
    			set_input_value(input1, /*date_to*/ ctx[1]);
    			append_dev(div3, t5);
    			append_dev(div3, h41);
    			append_dev(div3, t7);
    			append_dev(div3, div1);
    			append_dev(div1, label0);
    			append_dev(label0, input2);
    			input2.checked = /*cat_nego*/ ctx[2];
    			append_dev(label0, t8);
    			append_dev(label0, p1);
    			append_dev(div1, t10);
    			append_dev(div1, label1);
    			append_dev(label1, input3);
    			input3.checked = /*cat_learn*/ ctx[3];
    			append_dev(label1, t11);
    			append_dev(label1, p2);
    			append_dev(div1, t13);
    			append_dev(div1, label2);
    			append_dev(label2, input4);
    			input4.checked = /*cat_build*/ ctx[4];
    			append_dev(label2, t14);
    			append_dev(label2, p3);
    			append_dev(div1, t16);
    			append_dev(div1, label3);
    			append_dev(label3, input5);
    			input5.checked = /*cat_combat*/ ctx[5];
    			append_dev(label3, t17);
    			append_dev(label3, p4);
    			append_dev(div3, t19);
    			append_dev(div3, h42);
    			append_dev(div3, t21);
    			append_dev(div3, div2);
    			append_dev(div2, label4);
    			append_dev(label4, input6);
    			input6.checked = /*status_not_pub*/ ctx[6];
    			append_dev(label4, t22);
    			append_dev(div2, t23);
    			append_dev(div2, label5);
    			append_dev(label5, input7);
    			input7.checked = /*status_pending*/ ctx[7];
    			append_dev(label5, t24);
    			append_dev(div2, t25);
    			append_dev(div2, label6);
    			append_dev(label6, input8);
    			input8.checked = /*status_pub*/ ctx[8];
    			append_dev(label6, t26);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[9]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[10]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[11]),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[12]),
    					listen_dev(input4, "change", /*input4_change_handler*/ ctx[13]),
    					listen_dev(input5, "change", /*input5_change_handler*/ ctx[14]),
    					listen_dev(input6, "change", /*input6_change_handler*/ ctx[15]),
    					listen_dev(input7, "change", /*input7_change_handler*/ ctx[16]),
    					listen_dev(input8, "change", /*input8_change_handler*/ ctx[17])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*date_from*/ 1) {
    				set_input_value(input0, /*date_from*/ ctx[0]);
    			}

    			if (dirty & /*date_to*/ 2) {
    				set_input_value(input1, /*date_to*/ ctx[1]);
    			}

    			if (dirty & /*cat_nego*/ 4) {
    				input2.checked = /*cat_nego*/ ctx[2];
    			}

    			if (dirty & /*cat_learn*/ 8) {
    				input3.checked = /*cat_learn*/ ctx[3];
    			}

    			if (dirty & /*cat_build*/ 16) {
    				input4.checked = /*cat_build*/ ctx[4];
    			}

    			if (dirty & /*cat_combat*/ 32) {
    				input5.checked = /*cat_combat*/ ctx[5];
    			}

    			if (dirty & /*status_not_pub*/ 64) {
    				input6.checked = /*status_not_pub*/ ctx[6];
    			}

    			if (dirty & /*status_pending*/ 128) {
    				input7.checked = /*status_pending*/ ctx[7];
    			}

    			if (dirty & /*status_pub*/ 256) {
    				input8.checked = /*status_pub*/ ctx[8];
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PostsFilters", slots, []);
    	let date = false;
    	let category = false;
    	let status = false;
    	let date_from = "0001-01-01", date_to = "2021-05-06";
    	let cat_nego = true;
    	let cat_learn = true;
    	let cat_build = true;
    	let cat_combat = true;
    	let status_not_pub = true;
    	let status_pending = true;
    	let status_pub = true;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PostsFilters> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		date_from = this.value;
    		$$invalidate(0, date_from);
    	}

    	function input1_input_handler() {
    		date_to = this.value;
    		$$invalidate(1, date_to);
    	}

    	function input2_change_handler() {
    		cat_nego = this.checked;
    		$$invalidate(2, cat_nego);
    	}

    	function input3_change_handler() {
    		cat_learn = this.checked;
    		$$invalidate(3, cat_learn);
    	}

    	function input4_change_handler() {
    		cat_build = this.checked;
    		$$invalidate(4, cat_build);
    	}

    	function input5_change_handler() {
    		cat_combat = this.checked;
    		$$invalidate(5, cat_combat);
    	}

    	function input6_change_handler() {
    		status_not_pub = this.checked;
    		$$invalidate(6, status_not_pub);
    	}

    	function input7_change_handler() {
    		status_pending = this.checked;
    		$$invalidate(7, status_pending);
    	}

    	function input8_change_handler() {
    		status_pub = this.checked;
    		$$invalidate(8, status_pub);
    	}

    	$$self.$capture_state = () => ({
    		date,
    		category,
    		status,
    		date_from,
    		date_to,
    		cat_nego,
    		cat_learn,
    		cat_build,
    		cat_combat,
    		status_not_pub,
    		status_pending,
    		status_pub
    	});

    	$$self.$inject_state = $$props => {
    		if ("date" in $$props) date = $$props.date;
    		if ("category" in $$props) category = $$props.category;
    		if ("status" in $$props) status = $$props.status;
    		if ("date_from" in $$props) $$invalidate(0, date_from = $$props.date_from);
    		if ("date_to" in $$props) $$invalidate(1, date_to = $$props.date_to);
    		if ("cat_nego" in $$props) $$invalidate(2, cat_nego = $$props.cat_nego);
    		if ("cat_learn" in $$props) $$invalidate(3, cat_learn = $$props.cat_learn);
    		if ("cat_build" in $$props) $$invalidate(4, cat_build = $$props.cat_build);
    		if ("cat_combat" in $$props) $$invalidate(5, cat_combat = $$props.cat_combat);
    		if ("status_not_pub" in $$props) $$invalidate(6, status_not_pub = $$props.status_not_pub);
    		if ("status_pending" in $$props) $$invalidate(7, status_pending = $$props.status_pending);
    		if ("status_pub" in $$props) $$invalidate(8, status_pub = $$props.status_pub);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		date_from,
    		date_to,
    		cat_nego,
    		cat_learn,
    		cat_build,
    		cat_combat,
    		status_not_pub,
    		status_pending,
    		status_pub,
    		input0_input_handler,
    		input1_input_handler,
    		input2_change_handler,
    		input3_change_handler,
    		input4_change_handler,
    		input5_change_handler,
    		input6_change_handler,
    		input7_change_handler,
    		input8_change_handler
    	];
    }

    class PostsFilters extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PostsFilters",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/routes/Posts/Posts.svelte generated by Svelte v3.35.0 */
    const file$2 = "src/routes/Posts/Posts.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[34] = list[i];
    	return child_ctx;
    }

    // (134:4) {#each posts as item (item.id)}
    function create_each_block(key_1, ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*item*/ ctx[34].id + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*item*/ ctx[34].title + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*item*/ ctx[34].abstract_ + "";
    	let t4;
    	let t5;
    	let td3;

    	let t6_value = (/*item*/ ctx[34].published === null
    	? "Not Published"
    	: Date.parse(/*item*/ ctx[34].published) - get_local_offset() * 1000 * 60 < Date.now()
    		? "Published (" + get_local_from_utc(/*item*/ ctx[34].published) + ")"
    		: "Not Yet Published (" + get_local_from_utc(/*item*/ ctx[34].published) + ")") + "";

    	let t6;
    	let t7;
    	let td4;
    	let div1;
    	let i0;
    	let t8;
    	let div0;
    	let t10;
    	let div3;
    	let i1;
    	let t11;
    	let div2;
    	let t13;
    	let div5;
    	let i2;
    	let t14;
    	let div4;
    	let t16;
    	let mounted;
    	let dispose;

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[20](/*item*/ ctx[34]);
    	}

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[21](/*item*/ ctx[34]);
    	}

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[22](/*item*/ ctx[34]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			div1 = element("div");
    			i0 = element("i");
    			t8 = space();
    			div0 = element("div");
    			div0.textContent = "Delete";
    			t10 = space();
    			div3 = element("div");
    			i1 = element("i");
    			t11 = space();
    			div2 = element("div");
    			div2.textContent = "Publish";
    			t13 = space();
    			div5 = element("div");
    			i2 = element("i");
    			t14 = space();
    			div4 = element("div");
    			div4.textContent = "Edit";
    			t16 = space();
    			attr_dev(td0, "class", "svelte-ww1lcw");
    			add_location(td0, file$2, 136, 8, 3123);
    			attr_dev(td1, "class", "svelte-ww1lcw");
    			add_location(td1, file$2, 137, 8, 3150);
    			attr_dev(td2, "class", "svelte-ww1lcw");
    			add_location(td2, file$2, 138, 8, 3180);
    			attr_dev(td3, "class", "svelte-ww1lcw");
    			add_location(td3, file$2, 139, 8, 3214);
    			attr_dev(i0, "class", "fa fa-close fa-fw");
    			add_location(i0, file$2, 156, 12, 3775);
    			add_location(div0, file$2, 157, 12, 3819);
    			attr_dev(div1, "class", "row_button danger svelte-ww1lcw");
    			add_location(div1, file$2, 149, 10, 3587);
    			attr_dev(i1, "class", "fa fa-share-alt fa-fw");
    			add_location(i1, file$2, 167, 12, 4081);
    			add_location(div2, file$2, 168, 12, 4129);
    			attr_dev(div3, "class", "row_button svelte-ww1lcw");
    			add_location(div3, file$2, 159, 10, 3864);
    			attr_dev(i2, "class", "fa fa-edit fa-fw");
    			add_location(i2, file$2, 177, 12, 4354);
    			add_location(div4, file$2, 178, 12, 4397);
    			attr_dev(div5, "class", "row_button svelte-ww1lcw");
    			add_location(div5, file$2, 170, 10, 4175);
    			attr_dev(td4, "class", "svelte-ww1lcw");
    			add_location(td4, file$2, 148, 8, 3572);
    			attr_dev(tr, "class", "svelte-ww1lcw");
    			add_location(tr, file$2, 134, 6, 3045);
    			this.first = tr;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, div1);
    			append_dev(div1, i0);
    			append_dev(div1, t8);
    			append_dev(div1, div0);
    			append_dev(td4, t10);
    			append_dev(td4, div3);
    			append_dev(div3, i1);
    			append_dev(div3, t11);
    			append_dev(div3, div2);
    			append_dev(td4, t13);
    			append_dev(td4, div5);
    			append_dev(div5, i2);
    			append_dev(div5, t14);
    			append_dev(div5, div4);
    			append_dev(tr, t16);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "click", click_handler_2, false, false, false),
    					listen_dev(div3, "click", click_handler_3, false, false, false),
    					listen_dev(div5, "click", click_handler_4, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*posts*/ 2 && t0_value !== (t0_value = /*item*/ ctx[34].id + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*posts*/ 2 && t2_value !== (t2_value = /*item*/ ctx[34].title + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*posts*/ 2 && t4_value !== (t4_value = /*item*/ ctx[34].abstract_ + "")) set_data_dev(t4, t4_value);

    			if (dirty[0] & /*posts*/ 2 && t6_value !== (t6_value = (/*item*/ ctx[34].published === null
    			? "Not Published"
    			: Date.parse(/*item*/ ctx[34].published) - get_local_offset() * 1000 * 60 < Date.now()
    				? "Published (" + get_local_from_utc(/*item*/ ctx[34].published) + ")"
    				: "Not Yet Published (" + get_local_from_utc(/*item*/ ctx[34].published) + ")") + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(134:4) {#each posts as item (item.id)}",
    		ctx
    	});

    	return block;
    }

    // (187:0) <Modal bind:show={showDeletePost}>
    function create_default_slot_3(ctx) {
    	let t0;
    	let b;
    	let t1_value = /*get_post_by_id*/ ctx[10](/*selected_post*/ ctx[2]).title + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			t0 = text("Are you sure you want to delete the post : ");
    			b = element("b");
    			t1 = text(t1_value);
    			t2 = text("\n  ?");
    			add_location(b, file$2, 187, 45, 4569);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, b, anchor);
    			append_dev(b, t1);
    			insert_dev(target, t2, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*selected_post*/ 4 && t1_value !== (t1_value = /*get_post_by_id*/ ctx[10](/*selected_post*/ ctx[2]).title + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(187:0) <Modal bind:show={showDeletePost}>",
    		ctx
    	});

    	return block;
    }

    // (192:2) 
    function create_title_slot_3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Delete Post";
    			attr_dev(div, "slot", "title");
    			add_location(div, file$2, 191, 2, 4628);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_title_slot_3.name,
    		type: "slot",
    		source: "(192:2) ",
    		ctx
    	});

    	return block;
    }

    // (193:2) 
    function create_button_slot_3(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Delete";
    			attr_dev(button, "slot", "button");
    			attr_dev(button, "class", "w3-button w3-red w3-right round svelte-ww1lcw");
    			add_location(button, file$2, 192, 2, 4666);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_5*/ ctx[23], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_button_slot_3.name,
    		type: "slot",
    		source: "(193:2) ",
    		ctx
    	});

    	return block;
    }

    // (202:0) <Modal bind:show={showPublishPost}>
    function create_default_slot_2(ctx) {
    	let p;
    	let t0;
    	let b;
    	let t1_value = /*get_post_by_id*/ ctx[10](/*selected_post*/ ctx[2]).title + "";
    	let t1;
    	let t2;
    	let t3;
    	let datepicker;
    	let current;

    	datepicker = new DatePicker({
    			props: {
    				format: "ddd, DD MMM YYYY HH:mm",
    				time: true
    			},
    			$$inline: true
    		});

    	datepicker.$on("date-selected", /*date_selected_handler*/ ctx[26]);

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Use datepicker to choose de publication date of the post : ");
    			b = element("b");
    			t1 = text(t1_value);
    			t2 = text(".");
    			t3 = space();
    			create_component(datepicker.$$.fragment);
    			add_location(b, file$2, 203, 63, 4919);
    			add_location(p, file$2, 202, 2, 4852);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, b);
    			append_dev(b, t1);
    			append_dev(p, t2);
    			insert_dev(target, t3, anchor);
    			mount_component(datepicker, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*selected_post*/ 4) && t1_value !== (t1_value = /*get_post_by_id*/ ctx[10](/*selected_post*/ ctx[2]).title + "")) set_data_dev(t1, t1_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datepicker.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datepicker.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			destroy_component(datepicker, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(202:0) <Modal bind:show={showPublishPost}>",
    		ctx
    	});

    	return block;
    }

    // (218:2) 
    function create_title_slot_2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Publish Post";
    			attr_dev(div, "slot", "title");
    			add_location(div, file$2, 217, 2, 5187);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_title_slot_2.name,
    		type: "slot",
    		source: "(218:2) ",
    		ctx
    	});

    	return block;
    }

    // (219:2) 
    function create_button_slot_2(ctx) {
    	let button;
    	let t;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("Publish");
    			attr_dev(button, "slot", "button");
    			attr_dev(button, "class", "w3-button w3-red w3-right round svelte-ww1lcw");
    			button.disabled = button_disabled_value = !/*can_publish*/ ctx[9];
    			add_location(button, file$2, 218, 2, 5226);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_6*/ ctx[25], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*can_publish*/ 512 && button_disabled_value !== (button_disabled_value = !/*can_publish*/ ctx[9])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_button_slot_2.name,
    		type: "slot",
    		source: "(219:2) ",
    		ctx
    	});

    	return block;
    }

    // (229:0) <Modal bind:show={showEditPost}>
    function create_default_slot_1(ctx) {
    	let t0;
    	let b;
    	let t1_value = /*get_post_by_id*/ ctx[10](/*selected_post*/ ctx[2]).title + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			t0 = text("Open the post : ");
    			b = element("b");
    			t1 = text(t1_value);
    			t2 = text(" in the editor ?");
    			add_location(b, file$2, 229, 18, 5455);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, b, anchor);
    			append_dev(b, t1);
    			insert_dev(target, t2, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*selected_post*/ 4 && t1_value !== (t1_value = /*get_post_by_id*/ ctx[10](/*selected_post*/ ctx[2]).title + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(229:0) <Modal bind:show={showEditPost}>",
    		ctx
    	});

    	return block;
    }

    // (231:2) 
    function create_title_slot_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Edit Post";
    			attr_dev(div, "slot", "title");
    			add_location(div, file$2, 230, 2, 5518);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_title_slot_1.name,
    		type: "slot",
    		source: "(231:2) ",
    		ctx
    	});

    	return block;
    }

    // (232:2) 
    function create_button_slot_1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Edit";
    			attr_dev(button, "slot", "button");
    			attr_dev(button, "class", "w3-button w3-blue w3-right round svelte-ww1lcw");
    			add_location(button, file$2, 231, 2, 5554);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_7*/ ctx[28], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_button_slot_1.name,
    		type: "slot",
    		source: "(232:2) ",
    		ctx
    	});

    	return block;
    }

    // (241:0) <Modal bind:show={showAddPost}>
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Create a new post in the editor ?");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(241:0) <Modal bind:show={showAddPost}>",
    		ctx
    	});

    	return block;
    }

    // (243:2) 
    function create_title_slot(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Add Post";
    			attr_dev(div, "slot", "title");
    			add_location(div, file$2, 242, 2, 5769);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_title_slot.name,
    		type: "slot",
    		source: "(243:2) ",
    		ctx
    	});

    	return block;
    }

    // (244:2) 
    function create_button_slot(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Add";
    			attr_dev(button, "slot", "button");
    			attr_dev(button, "class", "w3-button w3-blue w3-right round svelte-ww1lcw");
    			add_location(button, file$2, 243, 2, 5804);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_8*/ ctx[30], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_button_slot.name,
    		type: "slot",
    		source: "(244:2) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div0;
    	let input;
    	let t0;
    	let button;
    	let t2;
    	let i;
    	let t3;
    	let div1;
    	let postsfilters;
    	let div1_hidden_value;
    	let t4;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t6;
    	let th1;
    	let t8;
    	let th2;
    	let t10;
    	let th3;
    	let t12;
    	let th4;
    	let t14;
    	let tbody;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t15;
    	let modal0;
    	let updating_show;
    	let t16;
    	let modal1;
    	let updating_show_1;
    	let t17;
    	let modal2;
    	let updating_show_2;
    	let t18;
    	let modal3;
    	let updating_show_3;
    	let current;
    	let mounted;
    	let dispose;
    	postsfilters = new PostsFilters({ $$inline: true });
    	let each_value = /*posts*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*item*/ ctx[34].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	function modal0_show_binding(value) {
    		/*modal0_show_binding*/ ctx[24](value);
    	}

    	let modal0_props = {
    		$$slots: {
    			button: [create_button_slot_3],
    			title: [create_title_slot_3],
    			default: [create_default_slot_3]
    		},
    		$$scope: { ctx }
    	};

    	if (/*showDeletePost*/ ctx[4] !== void 0) {
    		modal0_props.show = /*showDeletePost*/ ctx[4];
    	}

    	modal0 = new Modal({ props: modal0_props, $$inline: true });
    	binding_callbacks.push(() => bind(modal0, "show", modal0_show_binding));

    	function modal1_show_binding(value) {
    		/*modal1_show_binding*/ ctx[27](value);
    	}

    	let modal1_props = {
    		$$slots: {
    			button: [create_button_slot_2],
    			title: [create_title_slot_2],
    			default: [create_default_slot_2]
    		},
    		$$scope: { ctx }
    	};

    	if (/*showPublishPost*/ ctx[5] !== void 0) {
    		modal1_props.show = /*showPublishPost*/ ctx[5];
    	}

    	modal1 = new Modal({ props: modal1_props, $$inline: true });
    	binding_callbacks.push(() => bind(modal1, "show", modal1_show_binding));

    	function modal2_show_binding(value) {
    		/*modal2_show_binding*/ ctx[29](value);
    	}

    	let modal2_props = {
    		$$slots: {
    			button: [create_button_slot_1],
    			title: [create_title_slot_1],
    			default: [create_default_slot_1]
    		},
    		$$scope: { ctx }
    	};

    	if (/*showEditPost*/ ctx[6] !== void 0) {
    		modal2_props.show = /*showEditPost*/ ctx[6];
    	}

    	modal2 = new Modal({ props: modal2_props, $$inline: true });
    	binding_callbacks.push(() => bind(modal2, "show", modal2_show_binding));

    	function modal3_show_binding(value) {
    		/*modal3_show_binding*/ ctx[31](value);
    	}

    	let modal3_props = {
    		$$slots: {
    			button: [create_button_slot],
    			title: [create_title_slot],
    			default: [create_default_slot]
    		},
    		$$scope: { ctx }
    	};

    	if (/*showAddPost*/ ctx[7] !== void 0) {
    		modal3_props.show = /*showAddPost*/ ctx[7];
    	}

    	modal3 = new Modal({ props: modal3_props, $$inline: true });
    	binding_callbacks.push(() => bind(modal3, "show", modal3_show_binding));

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = "Show Filters";
    			t2 = space();
    			i = element("i");
    			t3 = space();
    			div1 = element("div");
    			create_component(postsfilters.$$.fragment);
    			t4 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Id";
    			t6 = space();
    			th1 = element("th");
    			th1.textContent = "Title";
    			t8 = space();
    			th2 = element("th");
    			th2.textContent = "Abstract";
    			t10 = space();
    			th3 = element("th");
    			th3.textContent = "Status";
    			t12 = space();
    			th4 = element("th");
    			th4.textContent = "Actions";
    			t14 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t15 = space();
    			create_component(modal0.$$.fragment);
    			t16 = space();
    			create_component(modal1.$$.fragment);
    			t17 = space();
    			create_component(modal2.$$.fragment);
    			t18 = space();
    			create_component(modal3.$$.fragment);
    			attr_dev(input, "class", " svelte-ww1lcw");
    			set_style(input, "flex-grow", "1");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Search..");
    			add_location(input, file$2, 100, 2, 2399);
    			attr_dev(button, "class", "button svelte-ww1lcw");
    			add_location(button, file$2, 108, 2, 2577);
    			attr_dev(i, "class", "w3-button fa fa-plus fa-lg svelte-ww1lcw");
    			add_location(i, file$2, 114, 2, 2694);
    			attr_dev(div0, "class", "flex-container svelte-ww1lcw");
    			add_location(div0, file$2, 99, 0, 2368);
    			div1.hidden = div1_hidden_value = !/*showFilters*/ ctx[0];
    			add_location(div1, file$2, 117, 0, 2781);
    			add_location(th0, file$2, 124, 6, 2869);
    			add_location(th1, file$2, 125, 6, 2887);
    			add_location(th2, file$2, 126, 6, 2908);
    			add_location(th3, file$2, 127, 6, 2932);
    			add_location(th4, file$2, 128, 6, 2954);
    			attr_dev(tr, "class", "svelte-ww1lcw");
    			add_location(tr, file$2, 123, 4, 2858);
    			add_location(thead, file$2, 122, 2, 2846);
    			attr_dev(tbody, "class", "svelte-ww1lcw");
    			add_location(tbody, file$2, 132, 2, 2995);
    			attr_dev(table, "class", "svelte-ww1lcw");
    			add_location(table, file$2, 121, 0, 2836);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, input);
    			set_input_value(input, /*search_text*/ ctx[3]);
    			append_dev(div0, t0);
    			append_dev(div0, button);
    			append_dev(div0, t2);
    			append_dev(div0, i);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(postsfilters, div1, null);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t6);
    			append_dev(tr, th1);
    			append_dev(tr, t8);
    			append_dev(tr, th2);
    			append_dev(tr, t10);
    			append_dev(tr, th3);
    			append_dev(tr, t12);
    			append_dev(tr, th4);
    			append_dev(table, t14);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			insert_dev(target, t15, anchor);
    			mount_component(modal0, target, anchor);
    			insert_dev(target, t16, anchor);
    			mount_component(modal1, target, anchor);
    			insert_dev(target, t17, anchor);
    			mount_component(modal2, target, anchor);
    			insert_dev(target, t18, anchor);
    			mount_component(modal3, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "keypress", /*keypress_handler*/ ctx[16], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[17]),
    					listen_dev(button, "click", /*click_handler*/ ctx[18], false, false, false),
    					listen_dev(i, "click", /*click_handler_1*/ ctx[19], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*search_text*/ 8 && input.value !== /*search_text*/ ctx[3]) {
    				set_input_value(input, /*search_text*/ ctx[3]);
    			}

    			if (!current || dirty[0] & /*showFilters*/ 1 && div1_hidden_value !== (div1_hidden_value = !/*showFilters*/ ctx[0])) {
    				prop_dev(div1, "hidden", div1_hidden_value);
    			}

    			if (dirty[0] & /*selected_post, posts, showEditPost, can_publish, showPublishPost, showDeletePost*/ 630) {
    				each_value = /*posts*/ ctx[1];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, tbody, destroy_block, create_each_block, null, get_each_context);
    			}

    			const modal0_changes = {};

    			if (dirty[0] & /*selected_post*/ 4 | dirty[1] & /*$$scope*/ 64) {
    				modal0_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_show && dirty[0] & /*showDeletePost*/ 16) {
    				updating_show = true;
    				modal0_changes.show = /*showDeletePost*/ ctx[4];
    				add_flush_callback(() => updating_show = false);
    			}

    			modal0.$set(modal0_changes);
    			const modal1_changes = {};

    			if (dirty[0] & /*can_publish, publish_datepicker, selected_post*/ 772 | dirty[1] & /*$$scope*/ 64) {
    				modal1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_show_1 && dirty[0] & /*showPublishPost*/ 32) {
    				updating_show_1 = true;
    				modal1_changes.show = /*showPublishPost*/ ctx[5];
    				add_flush_callback(() => updating_show_1 = false);
    			}

    			modal1.$set(modal1_changes);
    			const modal2_changes = {};

    			if (dirty[0] & /*selected_post*/ 4 | dirty[1] & /*$$scope*/ 64) {
    				modal2_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_show_2 && dirty[0] & /*showEditPost*/ 64) {
    				updating_show_2 = true;
    				modal2_changes.show = /*showEditPost*/ ctx[6];
    				add_flush_callback(() => updating_show_2 = false);
    			}

    			modal2.$set(modal2_changes);
    			const modal3_changes = {};

    			if (dirty[1] & /*$$scope*/ 64) {
    				modal3_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_show_3 && dirty[0] & /*showAddPost*/ 128) {
    				updating_show_3 = true;
    				modal3_changes.show = /*showAddPost*/ ctx[7];
    				add_flush_callback(() => updating_show_3 = false);
    			}

    			modal3.$set(modal3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postsfilters.$$.fragment, local);
    			transition_in(modal0.$$.fragment, local);
    			transition_in(modal1.$$.fragment, local);
    			transition_in(modal2.$$.fragment, local);
    			transition_in(modal3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postsfilters.$$.fragment, local);
    			transition_out(modal0.$$.fragment, local);
    			transition_out(modal1.$$.fragment, local);
    			transition_out(modal2.$$.fragment, local);
    			transition_out(modal3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			destroy_component(postsfilters);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(table);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching) detach_dev(t15);
    			destroy_component(modal0, detaching);
    			if (detaching) detach_dev(t16);
    			destroy_component(modal1, detaching);
    			if (detaching) detach_dev(t17);
    			destroy_component(modal2, detaching);
    			if (detaching) detach_dev(t18);
    			destroy_component(modal3, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function get_local_offset() {
    	var d = new Date();
    	return d.getTimezoneOffset();
    }

    function get_local_from_utc(e) {
    	return new Date(Date.parse(e) - get_local_offset() * 1000 * 60).toLocaleString("en-GB");
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Posts", slots, []);
    	let showFilters = false;
    	let posts = [];
    	let selected_post = 0;
    	let page = 1;
    	let page_size = 20;
    	let search_text = "";
    	let showDeletePost = false;
    	let showPublishPost = false;
    	let showEditPost = false;
    	let showAddPost = false;
    	let publish_datepicker;
    	let can_publish = false;

    	function get_post_by_id(id) {
    		return posts[posts.findIndex(item => item.id === selected_post)];
    	}

    	async function search() {
    		let params = {
    			page,
    			page_size,
    			state: "All",
    			text: search_text
    		};

    		let response = await fetch("/api/v1/post/admin_restricted/list", {
    			method: "POST",
    			headers: {
    				"Content-Type": "application/json;charset=utf-8"
    			},
    			body: JSON.stringify(params)
    		});

    		$$invalidate(1, posts = await response.json());
    		$$invalidate(1, posts = Array.from(posts[0]));
    	}

    	async function deletePost() {
    		let params = { id: selected_post };

    		await fetch("/api/v1/post/admin_restricted/delete", {
    			method: "DELETE",
    			headers: {
    				"Content-Type": "application/json;charset=utf-8"
    			},
    			body: JSON.stringify(params)
    		});

    		await search();
    		$$invalidate(4, showDeletePost = false);
    	}

    	async function publishPost() {
    		let params = {
    			id: selected_post,
    			date: publish_datepicker.toISOString().slice(0, 19).replace("Z", "")
    		};

    		await fetch("/api/v1/post/admin_restricted/publish", {
    			method: "PUT",
    			headers: {
    				"Content-Type": "application/json;charset=utf-8"
    			},
    			body: JSON.stringify(params)
    		});

    		await search();
    		$$invalidate(5, showPublishPost = false);
    	}

    	async function editPost() {
    		$$invalidate(6, showEditPost = false);
    		push("/editor/" + selected_post);
    	}

    	async function addPost() {
    		$$invalidate(7, showAddPost = false);
    		push("/editor/");
    	}

    	onMount(() => {
    		search();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Posts> was created with unknown prop '${key}'`);
    	});

    	const keypress_handler = e => e.key === "Enter" && search();

    	function input_input_handler() {
    		search_text = this.value;
    		$$invalidate(3, search_text);
    	}

    	const click_handler = () => {
    		$$invalidate(0, showFilters = !showFilters);
    	};

    	const click_handler_1 = () => $$invalidate(7, showAddPost = true);

    	const click_handler_2 = item => {
    		$$invalidate(2, selected_post = item.id);
    		$$invalidate(4, showDeletePost = true);
    	};

    	const click_handler_3 = item => {
    		$$invalidate(2, selected_post = item.id);
    		$$invalidate(9, can_publish = false);
    		$$invalidate(5, showPublishPost = true);
    	};

    	const click_handler_4 = item => {
    		$$invalidate(2, selected_post = item.id);
    		$$invalidate(6, showEditPost = true);
    	};

    	const click_handler_5 = () => {
    		deletePost();
    	};

    	function modal0_show_binding(value) {
    		showDeletePost = value;
    		$$invalidate(4, showDeletePost);
    	}

    	const click_handler_6 = () => {
    		publishPost();
    	};

    	const date_selected_handler = e => {
    		$$invalidate(8, publish_datepicker = new Date(Date.parse(e.detail.date)));
    		$$invalidate(9, can_publish = true);
    	};

    	function modal1_show_binding(value) {
    		showPublishPost = value;
    		$$invalidate(5, showPublishPost);
    	}

    	const click_handler_7 = () => {
    		editPost();
    	};

    	function modal2_show_binding(value) {
    		showEditPost = value;
    		$$invalidate(6, showEditPost);
    	}

    	const click_handler_8 = () => {
    		addPost();
    	};

    	function modal3_show_binding(value) {
    		showAddPost = value;
    		$$invalidate(7, showAddPost);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		push,
    		DatePicker,
    		Modal,
    		PostsFilters,
    		showFilters,
    		posts,
    		selected_post,
    		page,
    		page_size,
    		search_text,
    		showDeletePost,
    		showPublishPost,
    		showEditPost,
    		showAddPost,
    		publish_datepicker,
    		can_publish,
    		get_post_by_id,
    		get_local_offset,
    		get_local_from_utc,
    		search,
    		deletePost,
    		publishPost,
    		editPost,
    		addPost
    	});

    	$$self.$inject_state = $$props => {
    		if ("showFilters" in $$props) $$invalidate(0, showFilters = $$props.showFilters);
    		if ("posts" in $$props) $$invalidate(1, posts = $$props.posts);
    		if ("selected_post" in $$props) $$invalidate(2, selected_post = $$props.selected_post);
    		if ("page" in $$props) page = $$props.page;
    		if ("page_size" in $$props) page_size = $$props.page_size;
    		if ("search_text" in $$props) $$invalidate(3, search_text = $$props.search_text);
    		if ("showDeletePost" in $$props) $$invalidate(4, showDeletePost = $$props.showDeletePost);
    		if ("showPublishPost" in $$props) $$invalidate(5, showPublishPost = $$props.showPublishPost);
    		if ("showEditPost" in $$props) $$invalidate(6, showEditPost = $$props.showEditPost);
    		if ("showAddPost" in $$props) $$invalidate(7, showAddPost = $$props.showAddPost);
    		if ("publish_datepicker" in $$props) $$invalidate(8, publish_datepicker = $$props.publish_datepicker);
    		if ("can_publish" in $$props) $$invalidate(9, can_publish = $$props.can_publish);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		showFilters,
    		posts,
    		selected_post,
    		search_text,
    		showDeletePost,
    		showPublishPost,
    		showEditPost,
    		showAddPost,
    		publish_datepicker,
    		can_publish,
    		get_post_by_id,
    		search,
    		deletePost,
    		publishPost,
    		editPost,
    		addPost,
    		keypress_handler,
    		input_input_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		modal0_show_binding,
    		click_handler_6,
    		date_selected_handler,
    		modal1_show_binding,
    		click_handler_7,
    		modal2_show_binding,
    		click_handler_8,
    		modal3_show_binding
    	];
    }

    class Posts extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$2, create_fragment$2, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Posts",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/routes/Dashboard.svelte generated by Svelte v3.35.0 */
    const file$1 = "src/routes/Dashboard.svelte";

    // (44:2) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No page selected !";
    			add_location(p, file$1, 45, 4, 877);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(44:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (40:37) 
    function create_if_block_3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Work in progress !";
    			add_location(p, file$1, 41, 4, 835);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(40:37) ",
    		ctx
    	});

    	return block;
    }

    // (36:41) 
    function create_if_block_2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Work in progress !";
    			add_location(p, file$1, 37, 4, 765);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(36:41) ",
    		ctx
    	});

    	return block;
    }

    // (32:41) 
    function create_if_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Work in progress !";
    			add_location(p, file$1, 33, 4, 691);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(32:41) ",
    		ctx
    	});

    	return block;
    }

    // (28:2) {#if indextab === Tabs.Posts}
    function create_if_block(ctx) {
    	let posts;
    	let current;

    	posts = new Posts({
    			props: { Tabs: /*Tabs*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(posts.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(posts, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(posts.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(posts.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(posts, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(28:2) {#if indextab === Tabs.Posts}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let sidebar;
    	let updating_indextab;
    	let t;
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;

    	function sidebar_indextab_binding(value) {
    		/*sidebar_indextab_binding*/ ctx[2](value);
    	}

    	let sidebar_props = { Tabs: /*Tabs*/ ctx[1], logout };

    	if (/*indextab*/ ctx[0] !== void 0) {
    		sidebar_props.indextab = /*indextab*/ ctx[0];
    	}

    	sidebar = new Sidebar({ props: sidebar_props, $$inline: true });
    	binding_callbacks.push(() => bind(sidebar, "indextab", sidebar_indextab_binding));

    	const if_block_creators = [
    		create_if_block,
    		create_if_block_1,
    		create_if_block_2,
    		create_if_block_3,
    		create_else_block
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*indextab*/ ctx[0] === /*Tabs*/ ctx[1].Posts) return 0;
    		if (/*indextab*/ ctx[0] === /*Tabs*/ ctx[1].Categories) return 1;
    		if (/*indextab*/ ctx[0] === /*Tabs*/ ctx[1].Statistics) return 2;
    		if (/*indextab*/ ctx[0] === /*Tabs*/ ctx[1].Others) return 3;
    		return 4;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			create_component(sidebar.$$.fragment);
    			t = space();
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "content svelte-1m1ajij");
    			add_location(div, file$1, 25, 0, 561);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(sidebar, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const sidebar_changes = {};

    			if (!updating_indextab && dirty & /*indextab*/ 1) {
    				updating_indextab = true;
    				sidebar_changes.indextab = /*indextab*/ ctx[0];
    				add_flush_callback(() => updating_indextab = false);
    			}

    			sidebar.$set(sidebar_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sidebar, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const apiLogoutURL = "http://127.0.0.1:8080/api/v1/logout";

    async function logout() {
    	const response = await fetch(apiLogoutURL);
    	await response.text;
    	window.location.href = "/dashboard/login";
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Dashboard", slots, []);

    	let Tabs = {
    		Posts: "Posts",
    		Categories: "Categories",
    		Statistics: "Statistics",
    		Others: "Others"
    	};

    	let indextab = Tabs.Posts;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Dashboard> was created with unknown prop '${key}'`);
    	});

    	function sidebar_indextab_binding(value) {
    		indextab = value;
    		$$invalidate(0, indextab);
    	}

    	$$self.$capture_state = () => ({
    		Sidebar,
    		Posts,
    		Tabs,
    		apiLogoutURL,
    		indextab,
    		logout
    	});

    	$$self.$inject_state = $$props => {
    		if ("Tabs" in $$props) $$invalidate(1, Tabs = $$props.Tabs);
    		if ("indextab" in $$props) $$invalidate(0, indextab = $$props.indextab);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [indextab, Tabs, sidebar_indextab_binding];
    }

    class Dashboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dashboard",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const routes = {
      "/": Dashboard,
      "/editor/:id?": Editor,
    };

    /* src/App.svelte generated by Svelte v3.35.0 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let body;
    	let router;
    	let current;
    	router = new Router({ props: { routes }, $$inline: true });

    	const block = {
    		c: function create() {
    			body = element("body");
    			create_component(router.$$.fragment);
    			add_location(body, file, 5, 0, 95);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			mount_component(router, body, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Router, routes });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

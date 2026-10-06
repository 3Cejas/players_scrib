const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');

function harness({ reducedMotion = false, animationsSupported = true } = {}) {
    const loads = [];
    const animations = [];
    const classes = new Set();
    const attrs = new Map();
    const context = vm.createContext({
        Terminal: function () {},
        window: { matchMedia: () => ({ matches: reducedMotion }) },
        document: { body: { classList: { remove() {} } } },
        Image: function () { loads.push(this); }
    });
    for (const method of ['cancelGalleryLightboxTransition', 'renderGalleryLightboxItem', 'navigateGalleryLightbox', 'closeGalleryLightbox']) {
        vm.runInContext(source.match(new RegExp('Terminal\\.prototype\\.' + method + ' = function[\\s\\S]*?\\n    \\};'))[0], context);
    }
    const terminal = new context.Terminal();
    terminal.galleryLightboxRequestId = 0;
    terminal.galleryLightboxIndex = -1;
    terminal.galleryLightboxDisplayedIndex = -1;
    terminal.galleryLightboxItems = ['one', 'two', 'three'].map(src => ({ src, caption: src + ' caption' }));
    terminal.galleryLightbox = { classList: {
        add: name => classes.add(name),
        remove: name => classes.delete(name),
        toggle: (name, force) => force ? classes.add(name) : classes.delete(name)
    } };
    terminal.galleryLightboxPrev = {};
    terminal.galleryLightboxNext = {};
    terminal.galleryLightboxCaption = {};
    terminal.galleryLightboxImage = {
        getAttribute: name => attrs.get(name),
        setAttribute: (name, value) => attrs.set(name, value),
        removeAttribute: name => attrs.delete(name)
    };
    if (animationsSupported) {
        terminal.galleryLightboxImage.animate = (frames, options) => {
            let finish, reject;
            const animation = { frames, options, cancelled: false,
                finished: new Promise((resolve, rejectPromise) => { finish = resolve; reject = rejectPromise; }),
                finish: () => finish(),
                cancel: () => { animation.cancelled = true; reject(new Error('cancelled')); }
            };
            animations.push(animation);
            return animation;
        };
    }
    return { terminal, loads, animations, classes, attrs };
}

test('gallery keeps the current photo until the next one loads, then fades and slides in the right direction', async () => {
    const { terminal, loads, animations, attrs } = harness();
    terminal.renderGalleryLightboxItem(0);
    assert.equal(animations.length, 0);
    assert.equal(terminal.galleryLightboxPrev.disabled, true);
    terminal.navigateGalleryLightbox(1);
    assert.equal(attrs.get('src'), 'one');
    assert.equal(terminal.galleryLightboxCaption.textContent, 'one caption');
    loads[0].onload();
    assert.equal(attrs.get('src'), 'one');
    assert.equal(animations[0].options.duration, 110);
    animations[0].finish();
    await Promise.resolve();
    assert.equal(attrs.get('src'), 'two');
    assert.equal(terminal.galleryLightboxCaption.textContent, 'two caption');
    assert.equal(animations[1].frames[0].transform, 'translateX(18px)');
    assert.equal(animations[1].options.duration, 230);
    terminal.navigateGalleryLightbox(-1);
    assert.equal(animations[1].cancelled, true);
    loads[1].onload();
    animations[2].finish();
    await Promise.resolve();
    assert.equal(animations[3].frames[0].transform, 'translateX(-18px)');
});

test('rapid navigation ignores stale loads and cancels unfinished transitions', async () => {
    const { terminal, loads, animations, attrs } = harness();
    terminal.renderGalleryLightboxItem(0);
    terminal.navigateGalleryLightbox(1);
    const staleLoad = loads[0].onload;
    terminal.navigateGalleryLightbox(1);
    staleLoad();
    assert.equal(animations.length, 0);
    loads[1].onload();
    const staleAnimation = animations[0];
    terminal.navigateGalleryLightbox(-1);
    staleAnimation.finish();
    await Promise.resolve();
    assert.equal(attrs.get('src'), 'one');
    loads[2].onload();
    animations[1].finish();
    await Promise.resolve();
    assert.equal(attrs.get('src'), 'two');
    assert.equal(terminal.galleryLightboxIndex, 1);
});

test('closing while a photo loads prevents late callbacks from changing the closed gallery', () => {
    const { terminal, loads, attrs, classes } = harness();
    terminal.renderGalleryLightboxItem(0);
    terminal.navigateGalleryLightbox(1);
    const staleLoad = loads[0].onload;
    terminal.closeGalleryLightbox();
    staleLoad();
    assert.equal(attrs.has('src'), false);
    assert.equal(terminal.galleryLightboxIndex, -1);
    assert.equal(terminal.galleryLightboxCaption.textContent, '');
    assert.equal(classes.has('output-lightbox--hidden'), true);
    assert.equal(loads[0].onload, null);
});

test('closing during a fade cancels it and prevents a late image swap', async () => {
    const { terminal, loads, animations, attrs } = harness();
    terminal.renderGalleryLightboxItem(0);
    terminal.navigateGalleryLightbox(1);
    loads[0].onload();
    terminal.closeGalleryLightbox();
    animations[0].finish();
    await Promise.resolve();
    assert.equal(animations[0].cancelled, true);
    assert.equal(attrs.has('src'), false);
});

for (const options of [{ reducedMotion: true }, { animationsSupported: false }]) {
    test('photo navigation works without motion: ' + JSON.stringify(options), () => {
        const { terminal, loads, animations, attrs } = harness(options);
        terminal.renderGalleryLightboxItem(0);
        terminal.navigateGalleryLightbox(1);
        loads[0].onload();
        assert.equal(attrs.get('src'), 'two');
        assert.equal(animations.length, 0);
    });
}

test('gallery navigation respects album bounds and retains the current photo on a load failure', () => {
    const { terminal, loads, attrs } = harness();
    terminal.renderGalleryLightboxItem(0);
    terminal.navigateGalleryLightbox(-1);
    assert.equal(loads.length, 0);
    terminal.navigateGalleryLightbox(1);
    loads[0].onerror();
    assert.equal(attrs.get('src'), 'one');
    assert.equal(terminal.galleryLightboxIndex, 0);
    assert.equal(terminal.galleryLightboxPrev.disabled, true);
    terminal.renderGalleryLightboxItem(2);
    terminal.navigateGalleryLightbox(1);
    assert.equal(terminal.galleryLightboxNext.disabled, true);
    assert.equal(loads.length, 1);
});

test('reduced-motion CSS disables gallery button movement and transitions', () => {
    const css = fs.readFileSync(path.join(__dirname, '../css/main.css'), 'utf8');
    const reducedRules = css.slice(css.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
    assert.match(reducedRules, /\.output-album-nav,[\s\S]*?\.output-lightbox__nav,[\s\S]*?\.output-lightbox__close\s*\{\s*transition: none !important/);
    assert.match(reducedRules, /\.output-lightbox__nav\s*\{\s*transform: translateY\(-50%\) !important/);
});

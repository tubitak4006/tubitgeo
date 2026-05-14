/* ==========================================================
   TÜBİTAK 4006 — Grafik-Çizim-Kontrol
   Script: zero-gravity 3D scene + KaTeX glyphs + form
   ========================================================== */

(() => {
    'use strict';

    /* ------------------------------------------------------
       1. KaTeX rendering for floating math glyphs
       ------------------------------------------------------ */
    function renderFloatingGlyphs() {
        if (typeof window.katex === 'undefined') {
            // KaTeX not yet loaded — fall back to plain Unicode
            const fallback = {
                '\\sum': 'Σ', '\\pi': 'π', '\\int': '∫', '\\nabla': '∇',
                '\\partial': '∂', '\\infty': '∞', '\\theta': 'θ', '\\sqrt{x}': '√x',
                '\\alpha': 'α', '\\beta': 'β', '\\omega': 'ω', '\\lambda': 'λ',
                '\\Delta': 'Δ', '\\mu': 'μ', '\\Sigma': 'Σ', '\\phi': 'φ',
                'e^{i\\pi}': 'eⁱᵖⁱ', 'x^2': 'x²'
            };
            document.querySelectorAll('.glyph').forEach((el) => {
                const tex = el.dataset.tex;
                el.textContent = fallback[tex] || tex;
            });
            return;
        }
        document.querySelectorAll('.glyph').forEach((el) => {
            const tex = el.dataset.tex;
            try {
                window.katex.render(tex, el, {
                    throwOnError: false,
                    displayMode: false
                });
            } catch (err) {
                el.textContent = tex;
            }
        });
    }

    // KaTeX script is loaded with `defer`; render once parsed
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // wait a tick for the deferred KaTeX script to execute
            setTimeout(renderFloatingGlyphs, 0);
        });
    } else {
        setTimeout(renderFloatingGlyphs, 0);
    }

    /* ------------------------------------------------------
       2. Three.js zero-gravity scene — dense & varied
       ------------------------------------------------------ */
    function initThreeScene() {
        if (typeof THREE === 'undefined') return;

        const canvas = document.getElementById('three-canvas');
        if (!canvas) return;

        // Honor reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            canvas.style.display = 'none';
            return;
        }

        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'low-power'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        renderer.setSize(window.innerWidth, window.innerHeight);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            55,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 16;

        // Lighting (subtle — most shapes are wireframes/lines)
        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const dir = new THREE.DirectionalLight(0x3B82F6, 0.4);
        dir.position.set(5, 6, 8);
        scene.add(dir);

        // Brand palette
        const COLORS = {
            navy:      new THREE.Color(0x19376D),
            navyDeep:  new THREE.Color(0x0B2447),
            azure:     new THREE.Color(0x2563EB),
            azureSoft: new THREE.Color(0x60A5FA),
            turquoise: new THREE.Color(0x14B8A6),
            turquoiseSoft: new THREE.Color(0x5EEAD4),
            sky:       new THREE.Color(0x93C5FD)
        };
        const COLOR_LIST = [
            COLORS.navy, COLORS.azure, COLORS.azureSoft,
            COLORS.turquoise, COLORS.turquoiseSoft, COLORS.sky, COLORS.navyDeep
        ];

        // ---- Helpers ----
        const objects = [];
        const rand  = (min, max) => min + Math.random() * (max - min);
        const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const sign  = () => (Math.random() < 0.5 ? -1 : 1);

        function attachMotion(mesh, position) {
            mesh.userData = {
                rotSpeed: {
                    x: rand(-0.006, 0.006),
                    y: rand(-0.006, 0.006),
                    z: rand(-0.003, 0.003)
                },
                // zero-gravity: independent sin frequencies per axis
                bobSpeed:   rand(0.0003, 0.0010),
                bobSpeedX:  rand(0.0003, 0.0009),
                bobSpeedZ:  rand(0.0002, 0.0006),
                bobAmpY:    rand(0.4, 1.2),
                bobAmpX:    rand(0.3, 0.9),
                bobAmpZ:    rand(0.2, 0.6),
                phaseY: Math.random() * Math.PI * 2,
                phaseX: Math.random() * Math.PI * 2,
                phaseZ: Math.random() * Math.PI * 2,
                origin: position.clone()
            };
        }

        function addShape(geometry, color, position, scale = 1, opacity = 0.5) {
            const material = new THREE.MeshBasicMaterial({
                color,
                wireframe: true,
                transparent: true,
                opacity
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(position);
            mesh.scale.setScalar(scale);
            attachMotion(mesh, position);
            scene.add(mesh);
            objects.push(mesh);
            return mesh;
        }

        // ---- Geometry factory: random varied math/geometry shapes ----
        const shapeFactories = [
            // Math/geometry — polyhedra
            () => new THREE.IcosahedronGeometry(rand(0.9, 1.6), Math.random() < 0.5 ? 0 : 1),
            () => new THREE.OctahedronGeometry(rand(0.8, 1.4)),
            () => new THREE.DodecahedronGeometry(rand(0.9, 1.4)),
            () => new THREE.TetrahedronGeometry(rand(0.9, 1.5)),
            // Math — knots, tori, rings
            () => new THREE.TorusKnotGeometry(rand(0.7, 1.0), rand(0.22, 0.34), 80, 12, 2, 3),
            () => new THREE.TorusKnotGeometry(rand(0.6, 0.9), rand(0.18, 0.28), 80, 10, 3, 5),
            () => new THREE.TorusGeometry(rand(0.9, 1.3), rand(0.22, 0.34), 12, 40),
            () => new THREE.RingGeometry(rand(0.6, 0.9), rand(1.0, 1.3), 28, 1),
            // Geometry — primitives
            () => new THREE.SphereGeometry(rand(0.7, 1.1), 14, 10),
            () => new THREE.ConeGeometry(rand(0.6, 0.9), rand(1.4, 2.0), 6, 1),
            () => new THREE.CylinderGeometry(rand(0.5, 0.8), rand(0.5, 0.8), rand(1.2, 1.6), 8, 1),
            () => new THREE.BoxGeometry(rand(0.9, 1.4), rand(0.9, 1.4), rand(0.9, 1.4))
        ];

        // ---- Place ~22 shapes spread across the viewport ----
        // Distribute via loose grid sectors so they don't clump
        const sectors = [
            // [x range, y range]
            [-9, -5,  3,  6], [-3,  3,  3,  6], [ 5,  9,  3,  6],   // top row
            [-9, -5, -1,  2], [-3,  3, -1,  2], [ 5,  9, -1,  2],   // mid row
            [-9, -5, -6, -2], [-3,  3, -6, -2], [ 5,  9, -6, -2],   // bottom row
            // extra fill — diagonals & far edges
            [-10, -7,  6,  8], [ 7, 10,  6,  8],
            [-10, -7, -8, -5], [ 7, 10, -8, -5],
            [-7, -3,  7,  9], [ 3,  7,  7,  9],
            [-6, -2, -8, -6], [ 2,  6, -8, -6],
            // mid-ground extras
            [-2,  2,  4,  6], [-2,  2, -6, -4],
            [-8, -5,  0,  3], [ 5,  8,  0,  3],
            [-1,  3,  0,  3]
        ];

        sectors.forEach((s) => {
            const [x1, x2, y1, y2] = s;
            const pos = new THREE.Vector3(
                rand(x1, x2),
                rand(y1, y2),
                rand(-5, -1)
            );
            const geo = pick(shapeFactories)();
            const color = pick(COLOR_LIST);
            const scale = rand(0.55, 1.15);
            const opacity = rand(0.30, 0.55);
            addShape(geo, color, pos, scale, opacity);
        });

        // ---- AI: Neural network constellations (3 of varied sizes) ----
        function makeNeuralCluster(nodeCount, radius, position, scale, opts = {}) {
            const group = new THREE.Group();
            // distribute nodes on a roughly spherical shell with one center
            const nodePositions = [new THREE.Vector3(0, 0, 0)];
            for (let i = 0; i < nodeCount - 1; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                nodePositions.push(new THREE.Vector3(
                    radius * Math.sin(phi) * Math.cos(theta),
                    radius * Math.sin(phi) * Math.sin(theta),
                    radius * Math.cos(phi) * 0.4
                ));
            }
            const nodeGeo = new THREE.SphereGeometry(opts.nodeSize ?? 0.10, 12, 10);
            const nodeMat = new THREE.MeshBasicMaterial({
                color: opts.nodeColor ?? COLORS.turquoise,
                transparent: true,
                opacity: 0.85
            });
            nodePositions.forEach((p) => {
                const n = new THREE.Mesh(nodeGeo, nodeMat);
                n.position.copy(p);
                group.add(n);
            });
            // connect every outer node to center, plus some neighbor edges
            const edgeMat = new THREE.LineBasicMaterial({
                color: opts.edgeColor ?? COLORS.azure,
                transparent: true,
                opacity: 0.40
            });
            for (let i = 1; i < nodePositions.length; i++) {
                const g = new THREE.BufferGeometry().setFromPoints([
                    nodePositions[0], nodePositions[i]
                ]);
                group.add(new THREE.Line(g, edgeMat));
            }
            // a few neighbor edges for "synapses"
            const neighborEdges = Math.floor(nodeCount * 0.6);
            for (let k = 0; k < neighborEdges; k++) {
                const a = 1 + Math.floor(Math.random() * (nodeCount - 1));
                let b = 1 + Math.floor(Math.random() * (nodeCount - 1));
                if (b === a) b = (b % (nodeCount - 1)) + 1;
                const g = new THREE.BufferGeometry().setFromPoints([
                    nodePositions[a], nodePositions[b]
                ]);
                group.add(new THREE.Line(g, edgeMat));
            }
            group.position.copy(position);
            group.scale.setScalar(scale);
            attachMotion(group, position);
            // give neural clusters their own slow rotation tendency
            group.userData.rotSpeed = {
                x: rand(-0.0015, 0.0015),
                y: rand(0.001, 0.004),
                z: rand(-0.0008, 0.0008)
            };
            scene.add(group);
            objects.push(group);
            return group;
        }

        // small fast-spinning cluster — top right
        makeNeuralCluster(7, 1.6, new THREE.Vector3(6.5, 5.2, -3), 0.9, {
            nodeColor: COLORS.turquoise, edgeColor: COLORS.azure
        });
        // medium cluster — left middle
        makeNeuralCluster(11, 2.0, new THREE.Vector3(-7.5, -1, -4), 0.8, {
            nodeColor: COLORS.azureSoft, edgeColor: COLORS.azure, nodeSize: 0.09
        });
        // large dense cluster — bottom right
        makeNeuralCluster(14, 2.4, new THREE.Vector3(5.5, -5.5, -5), 0.75, {
            nodeColor: COLORS.turquoiseSoft, edgeColor: COLORS.navy, nodeSize: 0.08
        });

        // ---- Particle field for ambient depth ----
        const particleCount = 180;
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3]     = (Math.random() - 0.5) * 28;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particlesMaterial = new THREE.PointsMaterial({
            color: COLORS.azureSoft,
            size: 0.06,
            transparent: true,
            opacity: 0.55,
            sizeAttenuation: true
        });
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);

        // a second, smaller set of brighter particles for sparkle
        const sparkCount = 40;
        const sparkGeo = new THREE.BufferGeometry();
        const sparkPos = new Float32Array(sparkCount * 3);
        for (let i = 0; i < sparkCount; i++) {
            sparkPos[i * 3]     = (Math.random() - 0.5) * 24;
            sparkPos[i * 3 + 1] = (Math.random() - 0.5) * 16;
            sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 6;
        }
        sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
        const sparkMat = new THREE.PointsMaterial({
            color: COLORS.turquoise,
            size: 0.10,
            transparent: true,
            opacity: 0.7,
            sizeAttenuation: true
        });
        const sparks = new THREE.Points(sparkGeo, sparkMat);
        scene.add(sparks);

        // ---- Pointer parallax ----
        const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
        window.addEventListener('pointermove', (e) => {
            pointer.tx = (e.clientX / window.innerWidth - 0.5) * 0.7;
            pointer.ty = (e.clientY / window.innerHeight - 0.5) * 0.7;
        }, { passive: true });

        // ---- Resize handling ----
        function onResize() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
        window.addEventListener('resize', onResize);

        // ---- Animation loop ----
        const clock = new THREE.Clock();
        let frameId;

        function tick() {
            const t = clock.getElapsedTime() * 1000;

            // smooth pointer easing on camera
            pointer.x += (pointer.tx - pointer.x) * 0.04;
            pointer.y += (pointer.ty - pointer.y) * 0.04;
            camera.position.x = pointer.x * 1.0;
            camera.position.y = -pointer.y * 1.0;
            camera.lookAt(0, 0, 0);

            // each object: independent rotation + 3-axis sin bob (zero-gravity)
            objects.forEach((o) => {
                const u = o.userData;
                o.rotation.x += u.rotSpeed.x;
                o.rotation.y += u.rotSpeed.y;
                o.rotation.z += u.rotSpeed.z;

                o.position.x = u.origin.x + Math.sin(t * u.bobSpeedX + u.phaseX) * u.bobAmpX;
                o.position.y = u.origin.y + Math.sin(t * u.bobSpeed  + u.phaseY) * u.bobAmpY;
                o.position.z = u.origin.z + Math.sin(t * u.bobSpeedZ + u.phaseZ) * u.bobAmpZ;
            });

            // particle drift
            particles.rotation.y += 0.0003;
            particles.rotation.x += 0.00008;
            sparks.rotation.y    -= 0.0005;

            renderer.render(scene, camera);
            frameId = requestAnimationFrame(tick);
        }
        tick();

        // pause when tab hidden (saves battery)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cancelAnimationFrame(frameId);
            } else {
                tick();
            }
        });
    }

    /* ------------------------------------------------------
       3. Form handling — registration + login
          Backed by localStorage (per-device).
          Same device can only register a given identity once;
          but two different devices can register the same name
          (they are independent stores).
       ------------------------------------------------------ */

    /* ---- Storage layer (localStorage) --------------------- */
    const ACCOUNTS_KEY = 'gck:accounts';
    const WORK_KEY_PREFIX = 'gck:work:';

    function accountId(acc) {
        // unique key for each student (case-insensitive)
        return [
            acc.ad.toLocaleLowerCase('tr-TR'),
            acc.soyad.toLocaleLowerCase('tr-TR'),
            String(acc.sinifDerecesi),
            acc.sube.toUpperCase()
        ].join('|');
    }

    function loadAccounts() {
        try {
            const raw = localStorage.getItem(ACCOUNTS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    }
    function saveAccounts(list) {
        try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list)); }
        catch (e) { console.warn('Hesap listesi kaydedilemedi:', e); }
    }
    function findAccount(acc) {
        const id = accountId(acc);
        return loadAccounts().find(a => accountId(a) === id) || null;
    }
    function createAccount(acc) {
        const record = {
            ad:            acc.ad,
            soyad:         acc.soyad,
            sinifDerecesi: acc.sinifDerecesi,
            sube:          acc.sube,
            createdAt:     new Date().toISOString()
        };
        const list = loadAccounts();
        // Defensive: refuse duplicate creation at the storage layer too
        if (list.some(a => accountId(a) === accountId(record))) {
            throw new Error('Bu bilgilerle zaten bir hesap var.');
        }
        list.push(record);
        saveAccounts(list);
        return record;
    }
    function workKeyFor(acc) {
        return WORK_KEY_PREFIX + accountId(acc);
    }
    function loadUserWork(acc) {
        try {
            const raw = localStorage.getItem(workKeyFor(acc));
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    }
    function saveUserWork(acc, functions) {
        try {
            localStorage.setItem(workKeyFor(acc), JSON.stringify(functions));
        } catch (e) {
            console.warn('Çalışma kaydedilemedi:', e);
        }
    }

    /* ---- Input filters & validation ----------------------- */

    // Latin alphabet (English) + Turkish letters + space
    // Allowed: a-z, A-Z, çÇ, ğĞ, ıİ, öÖ, şŞ, üÜ, and space
    const LETTERS_REGEX = /^[A-Za-zÇĞİıÖŞÜçğöşü\s]+$/;
    const LETTERS_FILTER = /[^A-Za-zÇĞİıÖŞÜçğöşü\s]/g;

    function attachLettersOnlyFilter(input) {
        // Strip non-letter characters as the user types/pastes.
        input.addEventListener('input', (e) => {
            const cleaned = e.target.value.replace(LETTERS_FILTER, '');
            if (cleaned !== e.target.value) {
                const pos = e.target.selectionStart - (e.target.value.length - cleaned.length);
                e.target.value = cleaned;
                try { e.target.setSelectionRange(pos, pos); } catch {}
            }
        });
        // Block non-letter keystrokes pre-emptively (still allows backspace, tab, arrows, etc.)
        input.addEventListener('keypress', (e) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const ch = e.key;
            if (ch.length === 1 && !LETTERS_REGEX.test(ch)) {
                e.preventDefault();
            }
        });
    }

    // Capitalize first letter of each word, lowercase rest (Turkish-aware)
    function titleCaseTR(str) {
        return str
            .trim()
            .toLocaleLowerCase('tr-TR')
            .split(/\s+/)
            .map(w => w.length ? w[0].toLocaleUpperCase('tr-TR') + w.slice(1) : w)
            .join(' ');
    }

    /* ---- Initialize forms --------------------------------- */
    function initForm() {
        const registerForm  = document.getElementById('registrationForm');
        const loginForm     = document.getElementById('loginForm');
        const tabRegister   = document.getElementById('tabRegister');
        const tabLogin      = document.getElementById('tabLogin');
        const formTabs      = document.querySelector('.form-tabs');
        const success       = document.getElementById('formSuccess');
        const successName   = document.getElementById('successName');
        const successSube   = document.getElementById('successSube');
        const successTitle  = document.getElementById('successTitle');
        const successMessage= document.getElementById('successMessage');
        const goToLoginBtn  = document.getElementById('goToLoginBtn');
        const registerError = document.getElementById('registerError');
        const loginError    = document.getElementById('loginError');
        const loginBanner   = document.getElementById('loginBanner');

        if (!registerForm || !loginForm) return;

        // Apply letters-only filter to ad/soyad inputs in BOTH forms
        ['ad', 'soyad', 'loginAd', 'loginSoyad'].forEach(id => {
            const el = document.getElementById(id);
            if (el) attachLettersOnlyFilter(el);
        });

        /* --- Helper: defensively show/hide an element --- */
        function setHidden(el, hidden) {
            if (!el) return;
            if (hidden) {
                el.setAttribute('hidden', '');
                el.style.display = 'none';
            } else {
                el.removeAttribute('hidden');
                el.style.display = '';
            }
        }

        /* --- Tab switching --- */
        function showMode(mode) {
            const isLogin = (mode === 'login');
            // Defensive: hide success first, then swap forms
            setHidden(success, true);
            setHidden(registerForm, isLogin);
            setHidden(loginForm,    !isLogin);
            tabRegister.classList.toggle('is-active', !isLogin);
            tabLogin.classList.toggle('is-active',     isLogin);
            tabRegister.setAttribute('aria-selected', String(!isLogin));
            tabLogin.setAttribute('aria-selected',     String(isLogin));
            if (formTabs) formTabs.dataset.mode = mode;
            // clear errors when switching
            if (registerError) { registerError.hidden = true; registerError.textContent = ''; }
            if (loginError)    { loginError.hidden    = true; loginError.textContent    = ''; }
        }
        tabRegister.addEventListener('click', () => {
            // Manually switching to register clears the banner
            if (loginBanner) setHidden(loginBanner, true);
            showMode('register');
        });
        tabLogin.addEventListener('click',    () => showMode('login'));

        /* --- Validation helpers --- */
        function showError(box, msg) {
            if (!box) return;
            box.textContent = msg;
            box.hidden = false;
        }
        function setSubmitLoading(form, loading) {
            const btn = form.querySelector('.submit-btn');
            if (!btn) return;
            btn.disabled = loading;
            btn.classList.toggle('is-loading', loading);
        }
        function validateCommon(adVal, soyadVal, sinifVal, subeVal) {
            const errors = [];
            if (!adVal || adVal.length < 2 || !LETTERS_REGEX.test(adVal)) {
                errors.push({ msg: 'Adınızı sadece harflerle girin (en az 2 karakter).' });
            }
            if (!soyadVal || soyadVal.length < 2 || !LETTERS_REGEX.test(soyadVal)) {
                errors.push({ msg: 'Soyadınızı sadece harflerle girin (en az 2 karakter).' });
            }
            if (!['9','10','11','12'].includes(String(sinifVal))) {
                errors.push({ msg: 'Sınıf derecesini seçin.' });
            }
            if (!subeVal || !/^[A-Z]$/.test(subeVal)) {
                errors.push({ msg: 'Şube seçin.' });
            }
            return errors;
        }

        /* --- After registration: switch to login tab with a friendly banner --- */
        function switchToLoginAfterRegistration(record) {
            setHidden(success, true);
            registerForm.reset();
            showMode('login');
            if (loginBanner) {
                loginBanner.innerHTML = `<strong>${record.ad} ${record.soyad}</strong> · ${record.sinifDerecesi}/${record.sube} olarak kaydoldun. Şimdi aynı bilgilerle giriş yap.`;
                setHidden(loginBanner, false);
            }
            // focus the first login field
            const loginAd = document.getElementById('loginAd');
            if (loginAd) loginAd.focus();
        }

        if (goToLoginBtn) {
            goToLoginBtn.addEventListener('click', () => {
                const stored = goToLoginBtn._record;
                if (stored) {
                    switchToLoginAfterRegistration(stored);
                } else {
                    setHidden(success, true);
                    showMode('login');
                }
            });
        }

        /* --- REGISTER submit --- */
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            registerError.hidden = true;

            const ad    = titleCaseTR((registerForm.querySelector('#ad').value || ''));
            const soyad = titleCaseTR((registerForm.querySelector('#soyad').value || ''));
            const sinif = registerForm.querySelector('#sinifDerecesi').value;
            const sube  = registerForm.querySelector('#sube').value;

            const errors = validateCommon(ad, soyad, sinif, sube);
            if (errors.length) {
                showError(registerError, errors[0].msg);
                return;
            }

            const candidate = { ad, soyad, sinifDerecesi: sinif, sube };

            try {
                // Block duplicate accounts on THIS device
                const existing = findAccount(candidate);
                if (existing) {
                    showError(registerError, 'Bu bilgilerle bu cihazda zaten kayıt var. Lütfen "Giriş Yap" sekmesini kullanın.');
                    return;
                }

                const record = createAccount(candidate);

                // Show success briefly, then redirect to login tab
                setHidden(registerForm, true);
                setHidden(loginForm,    true);
                setHidden(success,      false);
                successTitle.textContent   = 'Kaydın oluşturuldu!';
                successName.textContent    = record.ad + ' ' + record.soyad;
                successSube.textContent    = record.sinifDerecesi + '/' + record.sube;
                successMessage.innerHTML   = 'Şimdi <strong>Giriş Yap</strong> sekmesinden hesabına giriş yapabilirsin.';
                if (goToLoginBtn) goToLoginBtn._record = record;

                // Auto-redirect to login tab after a short delay
                setTimeout(() => switchToLoginAfterRegistration(record), 1800);
            } catch (err) {
                console.error('Kayıt hatası:', err);
                showError(registerError, 'Kayıt yapılamadı: ' + (err.message || 'bilinmeyen hata'));
            }
        });

        /* --- LOGIN submit --- */
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loginError.hidden = true;

            const ad    = titleCaseTR((loginForm.querySelector('#loginAd').value || ''));
            const soyad = titleCaseTR((loginForm.querySelector('#loginSoyad').value || ''));
            const sinif = loginForm.querySelector('#loginSinifDerecesi').value;
            const sube  = loginForm.querySelector('#loginSube').value;

            const errors = validateCommon(ad, soyad, sinif, sube);
            if (errors.length) {
                showError(loginError, errors[0].msg);
                return;
            }

            const candidate = { ad, soyad, sinifDerecesi: sinif, sube };

            try {
                const existing = findAccount(candidate);
                if (!existing) {
                    showError(loginError, 'Bu bilgilerle bu cihazda kayıtlı bir hesap bulunamadı. "Kayıt Ol" sekmesinden hesap oluşturabilirsin.');
                    return;
                }

                const savedWork = loadUserWork(existing);

                if (loginBanner) setHidden(loginBanner, true);
                transitionToWorkspace(existing, savedWork);
            } catch (err) {
                console.error('Giriş hatası:', err);
                showError(loginError, 'Giriş yapılamadı: ' + (err.message || 'bilinmeyen hata'));
            }
        });

        // Default mode
        showMode('register');
    }

    /* ------------------------------------------------------
       3b. Stage transitions (landing ⇄ workspace)
       ------------------------------------------------------ */
    let workspaceController = null;
    let currentWorkUser = null;

    function transitionToWorkspace(user, savedWork) {
        currentWorkUser = user;
        const nameEl  = document.getElementById('userNameDisplay');
        const subeEl  = document.getElementById('userSubeDisplay');
        if (nameEl) nameEl.textContent = user.ad + ' ' + user.soyad;
        if (subeEl) subeEl.textContent = user.sinifDerecesi + '/' + user.sube;

        document.body.dataset.stage = 'workspace';
        document.getElementById('workspaceStage').setAttribute('aria-hidden', 'false');
        document.getElementById('landingStage').setAttribute('aria-hidden', 'true');

        // initialize plotter on first transition
        if (!workspaceController) {
            workspaceController = initWorkspace();
        }
        // Restore this user's saved functions (passed in from login), else seed demo
        if (workspaceController && workspaceController.restoreFunctions) {
            workspaceController.restoreFunctions(savedWork);
        }
        // canvas needs to know its real visible size
        requestAnimationFrame(() => {
            workspaceController?.plotter.resize();
        });
    }

    function transitionToLanding() {
        // Save current user's work before leaving (best-effort)
        if (currentWorkUser && workspaceController && workspaceController.snapshotFunctions) {
            try {
                saveUserWork(currentWorkUser, workspaceController.snapshotFunctions());
            } catch (e) {
                console.warn('Çalışma çıkıştan önce kaydedilemedi:', e);
            }
        }
        currentWorkUser = null;

        document.body.dataset.stage = 'landing';
        document.getElementById('workspaceStage').setAttribute('aria-hidden', 'true');
        document.getElementById('landingStage').setAttribute('aria-hidden', 'false');

        // reset both forms so a different user can sign in
        const registerForm = document.getElementById('registrationForm');
        const loginForm    = document.getElementById('loginForm');
        const success      = document.getElementById('formSuccess');
        const loginBanner  = document.getElementById('loginBanner');
        if (registerForm) {
            registerForm.reset();
            registerForm.removeAttribute('hidden');
            registerForm.style.display = '';
        }
        if (loginForm) {
            loginForm.reset();
            loginForm.setAttribute('hidden', '');
            loginForm.style.display = 'none';
        }
        if (success) {
            success.setAttribute('hidden', '');
            success.style.display = 'none';
        }
        if (loginBanner) {
            loginBanner.setAttribute('hidden', '');
            loginBanner.style.display = 'none';
        }

        // Default back to register tab
        const tabRegister = document.getElementById('tabRegister');
        if (tabRegister) tabRegister.click();
    }

    /* ------------------------------------------------------
       4. Math expression parser (recursive descent)
          Supports: + - * / ^ , unary -, parens, implicit *,
                    function calls, identifiers (x, pi, e),
                    decimals.
          Returns a compiled function f(x) -> number.
       ------------------------------------------------------ */
    const FN_TABLE = {
        sin: Math.sin, cos: Math.cos, tan: Math.tan,
        asin: Math.asin, acos: Math.acos, atan: Math.atan,
        sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
        sqrt: Math.sqrt, abs: Math.abs,
        log: (v) => Math.log10(v),
        ln:  Math.log,
        exp: Math.exp,
        floor: Math.floor, ceil: Math.ceil, round: Math.round
    };
    const CONST_TABLE = { pi: Math.PI, e: Math.E };

    function tokenize(input) {
        // accept Turkish decimal comma as a convenience
        const src = input.replace(/,/g, '.');
        const tokens = [];
        let i = 0;
        while (i < src.length) {
            const c = src[i];
            if (/\s/.test(c)) { i++; continue; }
            if (/[0-9.]/.test(c)) {
                let n = '';
                while (i < src.length && /[0-9.]/.test(src[i])) n += src[i++];
                if ((n.match(/\./g) || []).length > 1)
                    throw new Error(`Geçersiz sayı: ${n}`);
                tokens.push({ type: 'num', value: parseFloat(n) });
                continue;
            }
            if (/[a-zA-Z_]/.test(c)) {
                let id = '';
                while (i < src.length && /[a-zA-Z0-9_]/.test(src[i])) id += src[i++];
                tokens.push({ type: 'id', value: id.toLowerCase() });
                continue;
            }
            if ('+-*/^()'.includes(c)) {
                tokens.push({ type: 'op', value: c });
                i++;
                continue;
            }
            throw new Error(`Beklenmeyen karakter: "${c}"`);
        }
        // Insert implicit multiplication:
        //   num→id    (2x, 3sin)
        //   num→(     (2(x+1))
        //   )→num     ((x)2  — rare but possible)
        //   )→id      ((x)y, (x+1)sin(x))
        //   )→(       ((x+1)(x-1))
        //   id→(   only when id is NOT a function name (so it's a variable: x(2))
        const isFn = (name) => FN_TABLE.hasOwnProperty(name);
        const out = [];
        for (let j = 0; j < tokens.length; j++) {
            out.push(tokens[j]);
            const cur = tokens[j];
            const nxt = tokens[j + 1];
            if (!nxt) continue;
            const curIsCloseParen = cur.type === 'op' && cur.value === ')';
            const curIsNum = cur.type === 'num';
            const curIsVar = cur.type === 'id' && !isFn(cur.value);
            const nxtIsId = nxt.type === 'id';
            const nxtIsNum = nxt.type === 'num';
            const nxtIsOpenParen = nxt.type === 'op' && nxt.value === '(';
            const insert =
                (curIsNum && (nxtIsId || nxtIsOpenParen)) ||
                (curIsCloseParen && (nxtIsNum || nxtIsId || nxtIsOpenParen)) ||
                (curIsVar && nxtIsOpenParen);
            if (insert) out.push({ type: 'op', value: '*' });
        }
        return out;
    }

    function parse(input) {
        const tokens = tokenize(input);
        if (!tokens.length) throw new Error('Boş ifade');
        let pos = 0;
        const peek = () => tokens[pos];
        const eat  = () => tokens[pos++];

        // Grammar (precedence low → high):
        //   expr   = term (('+'|'-') term)*
        //   term   = unary (('*'|'/') unary)*
        //   unary  = '-' unary | '+' unary | power
        //   power  = primary ('^' unary)?           [right-assoc;
        //                                             unary lets -x^-x parse,
        //                                             and -x^2 = -(x^2)]
        //   primary = num | '(' expr ')' | identifier ['(' expr ')']

        function expr() {
            let left = term();
            while (peek() && peek().type === 'op' && (peek().value === '+' || peek().value === '-')) {
                const op = eat().value;
                const right = term();
                left = { type: 'bin', op, left, right };
            }
            return left;
        }
        function term() {
            let left = unary();
            while (peek() && peek().type === 'op' && (peek().value === '*' || peek().value === '/')) {
                const op = eat().value;
                const right = unary();
                left = { type: 'bin', op, left, right };
            }
            return left;
        }
        function unary() {
            if (peek() && peek().type === 'op' && (peek().value === '-' || peek().value === '+')) {
                const op = eat().value;
                const operand = unary();
                return op === '-'
                    ? { type: 'unary', op: '-', operand }
                    : operand;
            }
            return power();
        }
        function power() {
            const base = primary();
            if (peek() && peek().type === 'op' && peek().value === '^') {
                eat();
                const exp = unary();      // right-assoc; unary so -x^-2 works
                return { type: 'bin', op: '^', left: base, right: exp };
            }
            return base;
        }
        function primary() {
            const t = eat();
            if (!t) throw new Error('Beklenmeyen ifade sonu');
            if (t.type === 'num') return { type: 'num', value: t.value };
            if (t.type === 'op' && t.value === '(') {
                const e = expr();
                const close = eat();
                if (!close || close.value !== ')') throw new Error('Eksik kapatma parantezi');
                return e;
            }
            if (t.type === 'id') {
                if (peek() && peek().type === 'op' && peek().value === '(') {
                    eat();
                    const arg = expr();
                    const close = eat();
                    if (!close || close.value !== ')') throw new Error('Eksik kapatma parantezi');
                    if (!FN_TABLE.hasOwnProperty(t.value))
                        throw new Error(`Bilinmeyen fonksiyon: ${t.value}`);
                    return { type: 'call', name: t.value, arg };
                }
                if (t.value === 'x') return { type: 'var', name: 'x' };
                if (CONST_TABLE.hasOwnProperty(t.value)) return { type: 'const', name: t.value };
                throw new Error(`Bilinmeyen tanımlayıcı: ${t.value}`);
            }
            throw new Error(`Beklenmeyen sembol: ${t.value}`);
        }

        const ast = expr();
        if (pos < tokens.length) {
            throw new Error(`Beklenmeyen sembol: ${tokens[pos].value}`);
        }
        return ast;
    }

    function evalAst(node, x) {
        switch (node.type) {
            case 'num':   return node.value;
            case 'var':   return x;
            case 'const': return CONST_TABLE[node.name];
            case 'unary': return -evalAst(node.operand, x);
            case 'bin': {
                const a = evalAst(node.left, x);
                const b = evalAst(node.right, x);
                switch (node.op) {
                    case '+': return a + b;
                    case '-': return a - b;
                    case '*': return a * b;
                    case '/': return a / b;
                    case '^': return Math.pow(a, b);
                }
                return NaN;
            }
            case 'call': return FN_TABLE[node.name](evalAst(node.arg, x));
        }
        return NaN;
    }

    function compileExpression(input) {
        const ast = parse(input);
        // sanity test
        const probe = evalAst(ast, 1);
        if (typeof probe !== 'number') throw new Error('Geçersiz ifade');
        return (x) => evalAst(ast, x);
    }

    /* ------------------------------------------------------
       5. GraphPlotter — canvas-based real-time renderer
       ------------------------------------------------------ */
    class GraphPlotter {
        constructor(canvas) {
            this.canvas  = canvas;
            this.ctx     = canvas.getContext('2d');
            this.dpr     = Math.min(window.devicePixelRatio || 1, 2);
            this.functions = [];
            this.preview = null;             // { fn, color }
            this.cursor  = null;             // world {x,y} | null
            this.viewport = { xMin: -10, xMax: 10, yMin: -7, yMax: 7 };
            this.onCursorChange = null;
            this._setupEvents();
        }

        resize() {
            const rect = this.canvas.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            this.canvas.width  = Math.round(rect.width  * this.dpr);
            this.canvas.height = Math.round(rect.height * this.dpr);
            this._adjustAspect();
            this.draw();
        }

        _adjustAspect() {
            const aspect = this.canvas.height / this.canvas.width;
            const xRange = this.viewport.xMax - this.viewport.xMin;
            const yMid   = (this.viewport.yMax + this.viewport.yMin) / 2;
            const yRange = xRange * aspect;
            this.viewport.yMin = yMid - yRange / 2;
            this.viewport.yMax = yMid + yRange / 2;
        }

        worldToScreen(x, y) {
            const sx = (x - this.viewport.xMin) / (this.viewport.xMax - this.viewport.xMin) * this.canvas.width;
            const sy = this.canvas.height - (y - this.viewport.yMin) / (this.viewport.yMax - this.viewport.yMin) * this.canvas.height;
            return { x: sx, y: sy };
        }
        screenToWorld(sx, sy) {
            const x = this.viewport.xMin + (sx / this.canvas.width)  * (this.viewport.xMax - this.viewport.xMin);
            const y = this.viewport.yMin + (1 - sy / this.canvas.height) * (this.viewport.yMax - this.viewport.yMin);
            return { x, y };
        }

        addFunction(expression, color) {
            const fn = compileExpression(expression);   // throws on error
            const id = `f_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
            this.functions.push({ id, expression, fn, color, visible: true });
            this.draw();
            return id;
        }
        removeFunction(id) {
            this.functions = this.functions.filter(f => f.id !== id);
            this.draw();
        }
        toggleFunction(id) {
            const f = this.functions.find(x => x.id === id);
            if (f) { f.visible = !f.visible; this.draw(); }
        }
        setPreview(expression, color) {
            try {
                const fn = compileExpression(expression);
                this.preview = { fn, color };
            } catch {
                this.preview = null;
            }
            this.draw();
        }
        clearPreview() {
            this.preview = null;
            this.draw();
        }

        zoom(factor, center) {
            const c = center || {
                x: (this.viewport.xMin + this.viewport.xMax) / 2,
                y: (this.viewport.yMin + this.viewport.yMax) / 2
            };
            this.viewport.xMin = c.x + (this.viewport.xMin - c.x) * factor;
            this.viewport.xMax = c.x + (this.viewport.xMax - c.x) * factor;
            this.viewport.yMin = c.y + (this.viewport.yMin - c.y) * factor;
            this.viewport.yMax = c.y + (this.viewport.yMax - c.y) * factor;
            this.draw();
        }

        resetView() {
            this.viewport = { xMin: -10, xMax: 10, yMin: -7, yMax: 7 };
            this._adjustAspect();
            this.draw();
        }

        // --- drawing ---
        draw() {
            const { ctx, canvas } = this;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this._drawGrid();
            this._drawAxes();
            for (const f of this.functions) if (f.visible) this._drawFunction(f.fn, f.color, 2.4);
            if (this.preview) this._drawFunction(this.preview.fn, this.preview.color, 1.8, [6, 6]);
            if (this.cursor) this._drawCursor();
        }

        _niceStep(range, target) {
            const rough = range / target;
            const exp = Math.floor(Math.log10(rough));
            const frac = rough / Math.pow(10, exp);
            const nice = frac < 1.5 ? 1 : frac < 3 ? 2 : frac < 7 ? 5 : 10;
            return nice * Math.pow(10, exp);
        }

        _drawGrid() {
            const { ctx, canvas, viewport } = this;
            const stepMajor = this._niceStep(viewport.xMax - viewport.xMin, 10);
            const stepMinor = stepMajor / 5;
            // minor
            ctx.strokeStyle = 'rgba(11, 36, 71, 0.04)';
            ctx.lineWidth = 1;
            this._drawGridLines(stepMinor);
            // major
            ctx.strokeStyle = 'rgba(11, 36, 71, 0.10)';
            ctx.lineWidth = 1;
            this._drawGridLines(stepMajor);
        }
        _drawGridLines(step) {
            const { ctx, canvas, viewport } = this;
            const xStart = Math.ceil(viewport.xMin / step) * step;
            for (let x = xStart; x <= viewport.xMax + step / 2; x += step) {
                const sx = this.worldToScreen(x, 0).x;
                ctx.beginPath();
                ctx.moveTo(sx, 0); ctx.lineTo(sx, canvas.height);
                ctx.stroke();
            }
            const yStart = Math.ceil(viewport.yMin / step) * step;
            for (let y = yStart; y <= viewport.yMax + step / 2; y += step) {
                const sy = this.worldToScreen(0, y).y;
                ctx.beginPath();
                ctx.moveTo(0, sy); ctx.lineTo(canvas.width, sy);
                ctx.stroke();
            }
        }

        _drawAxes() {
            const { ctx, canvas, viewport, dpr } = this;
            const x0 = this.worldToScreen(0, 0).x;
            const y0 = this.worldToScreen(0, 0).y;

            ctx.strokeStyle = 'rgba(11, 36, 71, 0.55)';
            ctx.lineWidth = 1.4 * dpr;

            // x axis
            const xLineY = Math.max(0, Math.min(canvas.height, y0));
            ctx.beginPath();
            ctx.moveTo(0, xLineY); ctx.lineTo(canvas.width, xLineY);
            ctx.stroke();
            // y axis
            const yLineX = Math.max(0, Math.min(canvas.width, x0));
            ctx.beginPath();
            ctx.moveTo(yLineX, 0); ctx.lineTo(yLineX, canvas.height);
            ctx.stroke();

            // ticks + labels
            const step = this._niceStep(viewport.xMax - viewport.xMin, 10);
            ctx.fillStyle = 'rgba(11, 36, 71, 0.7)';
            ctx.font = `${10.5 * dpr}px JetBrains Mono, monospace`;
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';

            const axisInsideX = (x0 >= 0 && x0 <= canvas.width);
            const axisInsideY = (y0 >= 0 && y0 <= canvas.height);

            // x ticks
            const xStart = Math.ceil(viewport.xMin / step) * step;
            for (let x = xStart; x <= viewport.xMax + step / 2; x += step) {
                if (Math.abs(x) < step / 1e6) continue;
                const sx = this.worldToScreen(x, 0).x;
                const ty = axisInsideY
                    ? Math.min(canvas.height - 14 * dpr, y0 + 6 * dpr)
                    : 6 * dpr;
                ctx.fillText(this._fmt(x), sx + 3 * dpr, ty);
                if (axisInsideY) {
                    ctx.beginPath();
                    ctx.moveTo(sx, y0 - 4 * dpr);
                    ctx.lineTo(sx, y0 + 4 * dpr);
                    ctx.stroke();
                }
            }
            // y ticks
            const yStart = Math.ceil(viewport.yMin / step) * step;
            for (let y = yStart; y <= viewport.yMax + step / 2; y += step) {
                if (Math.abs(y) < step / 1e6) continue;
                const sy = this.worldToScreen(0, y).y;
                const tx = axisInsideX
                    ? Math.min(canvas.width - 40 * dpr, x0 + 6 * dpr)
                    : 6 * dpr;
                ctx.textBaseline = 'bottom';
                ctx.fillText(this._fmt(y), tx, sy - 3 * dpr);
                ctx.textBaseline = 'top';
                if (axisInsideX) {
                    ctx.beginPath();
                    ctx.moveTo(x0 - 4 * dpr, sy);
                    ctx.lineTo(x0 + 4 * dpr, sy);
                    ctx.stroke();
                }
            }

            // origin marker
            if (axisInsideX && axisInsideY) {
                ctx.fillText('0', x0 + 4 * dpr, y0 + 4 * dpr);
            }
        }

        _fmt(n) {
            if (Math.abs(n) >= 10000 || (Math.abs(n) < 0.001 && n !== 0)) {
                return n.toExponential(1);
            }
            return parseFloat(n.toFixed(4)).toString();
        }

        _drawFunction(fn, color, width = 2.4, dash = null) {
            const { ctx, canvas, viewport, dpr } = this;
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = width * dpr;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            if (dash) ctx.setLineDash(dash.map(d => d * dpr));

            ctx.beginPath();
            const samples = canvas.width;             // pixel-density sampling
            const dx = (viewport.xMax - viewport.xMin) / samples;
            let prevValid = false;
            let prevSy = 0;
            const jumpThreshold = canvas.height * 0.5;

            for (let i = 0; i <= samples; i++) {
                const x = viewport.xMin + i * dx;
                let y;
                try { y = fn(x); }
                catch { y = NaN; }
                if (!Number.isFinite(y)) { prevValid = false; continue; }

                const sx = (i * canvas.width) / samples;
                const sy = canvas.height - (y - viewport.yMin) / (viewport.yMax - viewport.yMin) * canvas.height;

                if (prevValid && Math.abs(sy - prevSy) < jumpThreshold) {
                    ctx.lineTo(sx, sy);
                } else {
                    ctx.moveTo(sx, sy);
                }
                prevValid = true;
                prevSy = sy;
            }
            ctx.stroke();
            ctx.restore();
        }

        _drawCursor() {
            const { ctx, canvas, dpr } = this;
            const { x: sx, y: sy } = this.worldToScreen(this.cursor.x, this.cursor.y);
            ctx.save();
            ctx.strokeStyle = 'rgba(37, 99, 235, 0.4)';
            ctx.lineWidth = 1 * dpr;
            ctx.setLineDash([4 * dpr, 4 * dpr]);
            ctx.beginPath();
            ctx.moveTo(sx, 0); ctx.lineTo(sx, canvas.height);
            ctx.moveTo(0, sy); ctx.lineTo(canvas.width, sy);
            ctx.stroke();
            ctx.restore();
        }

        _setupEvents() {
            const c = this.canvas;
            // wheel zoom (centered on mouse)
            c.addEventListener('wheel', (e) => {
                e.preventDefault();
                const rect = c.getBoundingClientRect();
                const mx = (e.clientX - rect.left) * this.dpr;
                const my = (e.clientY - rect.top)  * this.dpr;
                const center = this.screenToWorld(mx, my);
                this.zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, center);
            }, { passive: false });

            // pan
            let panning = false;
            let lastX = 0, lastY = 0;
            c.addEventListener('pointerdown', (e) => {
                panning = true;
                lastX = e.clientX; lastY = e.clientY;
                c.setPointerCapture(e.pointerId);
            });
            c.addEventListener('pointermove', (e) => {
                const rect = c.getBoundingClientRect();
                const mx = (e.clientX - rect.left) * this.dpr;
                const my = (e.clientY - rect.top)  * this.dpr;
                this.cursor = this.screenToWorld(mx, my);
                this.onCursorChange?.(this.cursor);

                if (panning) {
                    const dx = e.clientX - lastX;
                    const dy = e.clientY - lastY;
                    lastX = e.clientX; lastY = e.clientY;
                    const xpp = (this.viewport.xMax - this.viewport.xMin) / (c.clientWidth);
                    const ypp = (this.viewport.yMax - this.viewport.yMin) / (c.clientHeight);
                    this.viewport.xMin -= dx * xpp;
                    this.viewport.xMax -= dx * xpp;
                    this.viewport.yMin += dy * ypp;
                    this.viewport.yMax += dy * ypp;
                }
                this.draw();
            });
            const endPan = () => { panning = false; };
            c.addEventListener('pointerup',     endPan);
            c.addEventListener('pointercancel', endPan);
            c.addEventListener('pointerleave', () => {
                panning = false;
                this.cursor = null;
                this.onCursorChange?.(null);
                this.draw();
            });

            window.addEventListener('resize', () => this.resize());
        }
    }

    /* ------------------------------------------------------
       6. Workspace controller — wires UI to plotter
       ------------------------------------------------------ */
    function initWorkspace() {
        const canvas       = document.getElementById('graphCanvas');
        const exprForm     = document.getElementById('exprForm');
        const exprInput    = document.getElementById('exprInput');
        const exprError    = document.getElementById('exprError');
        const exprPreview  = document.getElementById('exprPreview');
        const fnList       = document.getElementById('fnList');
        const fnEmpty      = document.getElementById('fnEmpty');
        const fnCount      = document.getElementById('fnCount');
        const readoutX     = document.getElementById('readoutX');
        const readoutY     = document.getElementById('readoutY');
        const resetViewBtn = document.getElementById('resetViewBtn');
        const exitBtn      = document.getElementById('exitWorkspaceBtn');
        const sidebarBtn   = document.getElementById('toggleSidebarBtn');
        const zoomIn       = document.getElementById('zoomInBtn');
        const zoomOut      = document.getElementById('zoomOutBtn');
        if (!canvas) return null;

        const plotter = new GraphPlotter(canvas);

        // Color palette for plotted functions (cycle)
        const PALETTE = [
            '#2563EB', // azure
            '#14B8A6', // turquoise
            '#7C3AED', // violet
            '#F59E0B', // amber
            '#EC4899', // pink
            '#10B981', // emerald
            '#EF4444'  // red
        ];
        let colorIdx = 0;
        const nextColor = () => PALETTE[(colorIdx++) % PALETTE.length];

        // Cursor readout
        plotter.onCursorChange = (w) => {
            if (!w) {
                readoutX.textContent = '—';
                readoutY.textContent = '—';
            } else {
                readoutX.textContent = w.x.toFixed(2);
                readoutY.textContent = w.y.toFixed(2);
            }
        };

        // Render the function list
        function renderList() {
            fnList.innerHTML = '';
            plotter.functions.forEach((f) => {
                const li = document.createElement('li');
                li.className = 'fn-item' + (f.visible ? '' : ' is-hidden');
                li.innerHTML = `
                    <span class="fn-color" style="background: ${f.color}"></span>
                    <code class="fn-expr"></code>
                    <button type="button" class="fn-btn fn-toggle" title="Görünürlüğü değiştir">${f.visible ? '◉' : '○'}</button>
                    <button type="button" class="fn-btn fn-delete" title="Sil">✕</button>
                `;
                li.querySelector('.fn-expr').textContent = `y = ${f.expression}`;
                li.querySelector('.fn-toggle').addEventListener('click', () => {
                    plotter.toggleFunction(f.id);
                    renderList();
                    persistWork();
                });
                li.querySelector('.fn-delete').addEventListener('click', () => {
                    plotter.removeFunction(f.id);
                    renderList();
                    persistWork();
                });
                fnList.appendChild(li);
            });
            fnCount.textContent = plotter.functions.length;
            fnEmpty.classList.toggle('is-hidden', plotter.functions.length > 0);
        }

        // Persist current functions for the logged-in user (localStorage, debounced)
        let persistTimer = null;
        function persistWork() {
            if (!currentWorkUser) return;
            clearTimeout(persistTimer);
            persistTimer = setTimeout(() => {
                try {
                    saveUserWork(currentWorkUser, snapshotFunctions());
                } catch (e) {
                    console.warn('Çalışma kaydedilemedi:', e);
                }
            }, 400);
        }

        // Take a snapshot of the current functions (serializable)
        function snapshotFunctions() {
            return plotter.functions.map(f => ({
                expression: f.expression,
                color:      f.color,
                visible:    f.visible
            }));
        }

        // Restore functions from a saved snapshot (or seed demo if nothing saved)
        function restoreFunctions(saved) {
            // clear any existing functions first
            plotter.functions = [];
            colorIdx = 0;

            if (Array.isArray(saved) && saved.length > 0) {
                saved.forEach(item => {
                    try {
                        plotter.addFunction(item.expression, item.color || nextColor());
                        if (item.visible === false) {
                            const last = plotter.functions[plotter.functions.length - 1];
                            if (last) plotter.toggleFunction(last.id);
                        }
                        // keep color cycle in sync if a color was supplied
                        if (item.color && PALETTE.includes(item.color)) {
                            colorIdx = PALETTE.indexOf(item.color) + 1;
                        }
                    } catch (e) {
                        console.warn('Kayıtlı fonksiyon yüklenemedi:', item.expression, e);
                    }
                });
            } else {
                // First-time user — seed a demo function
                try { plotter.addFunction('x^2 - 4', nextColor()); } catch {}
            }
            renderList();
        }

        function showError(msg) {
            exprError.textContent = msg;
            exprError.classList.add('visible');
        }
        function hideError() {
            exprError.textContent = '';
            exprError.classList.remove('visible');
        }

        // Live preview while typing
        let previewColor = PALETTE[colorIdx % PALETTE.length] + '99';
        exprInput.addEventListener('input', () => {
            const v = exprInput.value.trim();
            hideError();
            if (!v) {
                plotter.clearPreview();
                exprPreview.hidden = true;
                return;
            }
            try {
                compileExpression(v);     // validation only
                previewColor = PALETTE[colorIdx % PALETTE.length] + '99';
                plotter.setPreview(v, previewColor);
                exprPreview.hidden = false;
            } catch {
                plotter.clearPreview();
                exprPreview.hidden = true;
            }
        });

        // Submit: commit the previewed function
        exprForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const v = exprInput.value.trim();
            if (!v) return;
            try {
                plotter.addFunction(v, nextColor());
                plotter.clearPreview();
                exprInput.value = '';
                exprPreview.hidden = true;
                hideError();
                renderList();
                persistWork();
                exprInput.focus();
            } catch (err) {
                showError(err.message || 'Geçersiz ifade');
            }
        });

        // Example chips
        document.querySelectorAll('.example-chip').forEach((chip) => {
            chip.addEventListener('click', () => {
                exprInput.value = chip.dataset.expr;
                exprInput.dispatchEvent(new Event('input'));
                if (typeof exprForm.requestSubmit === 'function') {
                    exprForm.requestSubmit();
                } else {
                    // fallback: directly add via the same path the submit handler uses
                    try {
                        plotter.addFunction(chip.dataset.expr, nextColor());
                        plotter.clearPreview();
                        exprInput.value = '';
                        exprPreview.hidden = true;
                        hideError();
                        renderList();
                        persistWork();
                    } catch (err) {
                        showError(err.message || 'Geçersiz ifade');
                    }
                }
            });
        });

        // View controls
        resetViewBtn.addEventListener('click', () => plotter.resetView());
        zoomIn?.addEventListener('click',  () => plotter.zoom(1 / 1.3));
        zoomOut?.addEventListener('click', () => plotter.zoom(1.3));

        // Exit back to landing
        exitBtn.addEventListener('click', () => transitionToLanding());

        // Mobile sidebar toggle
        sidebarBtn?.addEventListener('click', () => {
            const cur = document.body.dataset.sidebar;
            document.body.dataset.sidebar = (cur === 'closed') ? 'open' : 'closed';
            // canvas needs to know its new size after the layout shift
            requestAnimationFrame(() => plotter.resize());
        });

        // Seed function & list rendering is now handled by restoreFunctions(),
        // which is called from transitionToWorkspace once the user logs in.
        renderList();
        return { plotter, snapshotFunctions, restoreFunctions };
    }

    /* ------------------------------------------------------
       7. Boot
       ------------------------------------------------------ */
    function boot() {
        initThreeScene();
        initForm();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();

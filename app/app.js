/*
 * LUMEN 1.2 — liquid-glass launcher for Samsung Tizen TVs (built and tested on a 2016 model: Tizen 2.4, WebKit 538).
 * Plain ES5. Public Tizen APIs only:
 *   tizen.application.getAppsInfo / launch      (verified on a 2016 Tizen 2.4 TV)
 *   tizen.tvinputdevice                          (verified: colour keys yes, Home key no)
 *   tizen.systeminfo VIDEOSOURCE + tizen.tvwindow (verified on a 2016 Tizen 2.4 TV)
 *   XMLHttpRequest to api.open-meteo.com          (verified on a 2016 Tizen 2.4 TV)
 *   tizen.filesystem (backup), Web Audio + sounds/*.mp3 (soundscape), tizen.power (screen off) (verified on a 2016 Tizen 2.4 TV)
 * In a desktop browser (no tizen object) it runs with sample data for preview/testing.
 */
(function () {
    'use strict';

    // ------------------------------------------------------------------ EDIT ME: your city (weather + sunrise/sunset)
    // Find your coordinates on any map (e.g. right-click → coordinates). Leave lat/lon as null to hide the weather.
    var CITY = { name: '[YOUR CITY]', nameAz: '[YOUR CITY]', lat: null, lon: null };

    var VERSION = '1.2.0';
    var onTV = typeof window.tizen !== 'undefined';
    var STORE_KEY = 'lumen.v1';   // unchanged so favourites/recent survive the update
    var $ = function (id) { return document.getElementById(id); };
    var Q = {};                   // preview-only URL options (?demo=1&lang=az&phase=night&night=1)
    if (!onTV) { location.search.replace(/[?&]([^=&]+)=?([^&]*)/g, function (m, k, v) { Q[k] = decodeURIComponent(v); }); }

    // ================================================================== language
    var STR = {
        en: {
            favourites: 'Favourites', sources: 'Sources', continue: 'Continue watching', allApps: 'All apps', settings: 'Settings',
            arrange: 'Arrange', sleep: 'Sleep timer', soundscape: 'Soundscape', screenOff: 'Screen off',
            recentEmpty: 'Apps you open will appear here',
            gNight: 'Good night', gMorning: 'Good morning', gAfternoon: 'Good afternoon', gEvening: 'Good evening',
            justNow: 'just now', minAgo: '%n min ago', hAgo: '%n h ago', yesterday: 'Yesterday', daysAgo: '%n days ago',
            liveTV: 'Live TV', connected: 'Connected', noSignal: 'No signal', tv: 'TV',
            wClear: 'Clear', wPartly: 'Partly cloudy', wOvercast: 'Overcast', wFog: 'Fog', wDrizzle: 'Drizzle', wRain: 'Rain',
            wSnow: 'Snow', wShowers: 'Showers', wSnowShowers: 'Snow showers', wStorm: 'Thunderstorm', wCloudy: 'Cloudy',
            wNone: 'Weather unavailable', place: '', loading: 'Loading…',
            hHome: 'OK open · hold OK or <span class="key g"></span>options <span class="key y"></span>pin <span class="key r"></span>arrange <span class="key b"></span>settings',
            hDrawer: 'OK open · hold OK or <span class="key g"></span>options <span class="key y"></span>pin <span class="key r"></span>hide · BACK close',
            hArrange: 'OK pick up / drop · ◀ ▶ move <span class="key y"></span>unpin <span class="key r"></span>done',
            hSettings: '◀ ▶ change · ▲ ▼ move · BACK close', hMenu: '▲ ▼ choose · OK select · BACK close',
            drawerSub: 'OK open · hold OK or GREEN for options · YELLOW pin · RED hide · BACK close',
            moving: 'Moving — ◀ ▶ to place, OK to drop', arrangeMode: 'Arrange mode — OK picks up a favourite',
            pinTip: 'Open All apps and press YELLOW to pin',
            open: 'Open', addFav: 'Add to Favourites', remFav: 'Remove from Favourites', move: 'Move', hide: 'Hide from All apps',
            unhide: 'Show in All apps', remRecent: 'Remove from Continue watching', about: 'About this app',
            rename: 'Rename', hideInput: 'Hide this input', originalName: 'Original name', renameTitle: 'Name for %s',
            off: 'Off', min: '%n min', sleepTitle: 'Sleep timer', soundTitle: 'Soundscape', stopSound: 'Stop',
            sRain: 'Rain', sOcean: 'Ocean waves', sFire: 'Fireplace', sBrown: 'Brown noise', sStorm: 'Thunderstorm', sStream: 'Forest stream',
            sBirds: 'Morning birds', sNight: 'Summer night', sWind: 'Wind', credits: 'Sound credits', creditsTitle: 'Sound credits',
            sleepSet: 'Sleep timer: %n min — then sound stops and the picture goes dark', sleepOff: 'Sleep timer off',
            sleepDone: 'Sleep timer finished', soundOn: 'Playing: %s', soundOff: 'Soundscape stopped', noAudio: 'Sound is not available on this TV',
            blackHint: 'Press any button to turn the picture back on',
            favAdded: '%s pinned to Favourites', favRemoved: '%s removed from Favourites', chooseApp: 'Choose an app first',
            srcStay: 'Sources always stay in the main panel', hidden: '%s hidden — Settings › Show hidden & system apps brings it back',
            visibleAgain: '%s is visible again', sysStay: 'System components stay hidden on the home screen',
            arrangeOn: 'Arrange mode — pick up a favourite with OK', favSaved: 'Favourites saved',
            opening: 'Opening %s…', previewOpen: 'Preview — on the TV this opens the app', cantOpen: 'Couldn\'t open %s',
            watchHint: '%s · press BACK to return to Lumen', cantShow: 'Couldn\'t show %s here — use the remote\'s SOURCE button',
            inputHidden: '%s hidden — Settings › Show hidden inputs brings it back', inputsBack: 'All inputs are visible again',
            renamed: 'Renamed to %s', recentRemoved: 'Removed from Continue watching', resetDone: 'Layout and settings reset',
            backupOk: 'Settings backed up (%s)', backupFail: 'Backup failed: %s', restoreOk: 'Settings restored', restoreNone: 'No backup found',
            fxAuto: 'This TV is a little slow — switched to Fast effects', appsFail: 'Could not read the app list',
            // settings
            stWall: 'Wallpaper', stLight: 'Scene light', stTransp: 'Glass transparency', stBlur: 'Background blur', stRefl: 'Reflections',
            stEdge: 'Edge lighting', stAnim: 'Animations', stFx: 'Effects quality', stNight: 'Night mode', stSaver: 'Screensaver',
            stSaverNow: 'Show screensaver now', stClock: 'Clock', stLang: 'Language', stShowAll: 'Show hidden & system apps',
            stInputs: 'Show hidden inputs', stBackup: 'Back up settings', stRestore: 'Restore backup', stReset: 'Reset layout & settings',
            oAuto: 'Auto', oAutoSun: 'Auto — follows the sun', oDawn: 'Dawn', oDay: 'Day', oSunset: 'Sunset', oNight: 'Night',
            oOff: 'Off', oOn: 'On', oSoft: 'Soft', oFrost: 'Frosted', oSubtle: 'Subtle', oBright: 'Bright', oFull: 'Full', oReduced: 'Reduced',
            oFast: 'Fast', oBalanced: 'Balanced', oRich: 'Rich', oSunToSun: 'Sunset to sunrise', oFrom: 'From %s to 07:00',
            o24: '24-hour', o12: '12-hour', wMountain: 'Mountain lake', wAurora: 'Aurora', wDusk: 'Dusk', wLagoon: 'Lagoon', wGraphite: 'Graphite',
            speedFirst: 'speed: move around first', speed: 'speed %s ms', apps: 'apps', weather: 'weather'
        },
        az: {
            favourites: 'Sevimlilər', sources: 'Mənbələr', continue: 'Davam et', allApps: 'Bütün tətbiqlər', settings: 'Ayarlar',
            arrange: 'Düzən', sleep: 'Yuxu taymeri', soundscape: 'Səs fonu', screenOff: 'Ekranı söndür',
            recentEmpty: 'Açdığınız tətbiqlər burada görünəcək',
            gNight: 'Gecəniz xeyrə qalsın', gMorning: 'Sabahınız xeyir', gAfternoon: 'Günortanız xeyir', gEvening: 'Axşamınız xeyir',
            justNow: 'indicə', minAgo: '%n dəq əvvəl', hAgo: '%n saat əvvəl', yesterday: 'Dünən', daysAgo: '%n gün əvvəl',
            liveTV: 'Canlı TV', connected: 'Qoşulub', noSignal: 'Siqnal yoxdur', tv: 'TV',
            wClear: 'Açıq', wPartly: 'Az buludlu', wOvercast: 'Tutqun', wFog: 'Duman', wDrizzle: 'Çiskin', wRain: 'Yağış',
            wSnow: 'Qar', wShowers: 'Leysan', wSnowShowers: 'Qar yağır', wStorm: 'İldırım', wCloudy: 'Buludlu',
            wNone: 'Hava məlumatı yoxdur', place: '', loading: 'Yüklənir…',
            hHome: 'OK aç · OK-ni saxla və ya <span class="key g"></span>seçimlər <span class="key y"></span>sevimli <span class="key r"></span>düzən <span class="key b"></span>ayarlar',
            hDrawer: 'OK aç · OK-ni saxla və ya <span class="key g"></span>seçimlər <span class="key y"></span>sevimli <span class="key r"></span>gizlət · BACK bağla',
            hArrange: 'OK götür / qoy · ◀ ▶ apar <span class="key y"></span>çıxar <span class="key r"></span>hazır',
            hSettings: '◀ ▶ dəyiş · ▲ ▼ keç · BACK bağla', hMenu: '▲ ▼ seç · OK təsdiq · BACK bağla',
            drawerSub: 'OK aç · seçimlər üçün OK-ni saxla və ya YAŞIL · SARI sevimli · QIRMIZI gizlət · BACK bağla',
            moving: 'Daşınır — ◀ ▶ yer seç, OK ilə qoy', arrangeMode: 'Düzən rejimi — OK ilə sevimlini götürün',
            pinTip: 'Bütün tətbiqləri açın və SARI ilə əlavə edin',
            open: 'Aç', addFav: 'Sevimlilərə əlavə et', remFav: 'Sevimlilərdən çıxar', move: 'Yerini dəyiş', hide: 'Bütün tətbiqlərdən gizlət',
            unhide: 'Bütün tətbiqlərdə göstər', remRecent: '"Davam et"dən sil', about: 'Tətbiq haqqında',
            rename: 'Adını dəyiş', hideInput: 'Bu mənbəni gizlət', originalName: 'Əsl ad', renameTitle: '%s üçün ad',
            off: 'Söndür', min: '%n dəq', sleepTitle: 'Yuxu taymeri', soundTitle: 'Səs fonu', stopSound: 'Dayandır',
            sRain: 'Yağış', sOcean: 'Okean dalğaları', sFire: 'Kamin', sBrown: 'Qəhvəyi küy', sStorm: 'Tufan', sStream: 'Meşə çayı',
            sBirds: 'Səhər quşları', sNight: 'Yay gecəsi', sWind: 'Külək', credits: 'Səs müəllifləri', creditsTitle: 'Səs müəllifləri',
            sleepSet: 'Yuxu taymeri: %n dəq — sonra səs dayanır və ekran qaralır', sleepOff: 'Yuxu taymeri söndürüldü',
            sleepDone: 'Yuxu taymeri bitdi', soundOn: 'Səslənir: %s', soundOff: 'Səs fonu dayandırıldı', noAudio: 'Bu televizorda səs mümkün deyil',
            blackHint: 'Ekranı qaytarmaq üçün istənilən düyməni basın',
            favAdded: '%s sevimlilərə əlavə edildi', favRemoved: '%s sevimlilərdən çıxarıldı', chooseApp: 'Əvvəlcə tətbiq seçin',
            srcStay: 'Mənbələr həmişə əsas paneldə qalır', hidden: '%s gizlədildi — Ayarlar › Gizli tətbiqləri göstər ilə qaytarın',
            visibleAgain: '%s yenidən görünür', sysStay: 'Sistem komponentləri ana ekranda gizli qalır',
            arrangeOn: 'Düzən rejimi — OK ilə sevimlini götürün', favSaved: 'Sevimlilər yadda saxlandı',
            opening: '%s açılır…', previewOpen: 'Önizləmə — televizorda tətbiq açılacaq', cantOpen: '%s açılmadı',
            watchHint: '%s · Lumen-ə qayıtmaq üçün BACK', cantShow: '%s burada göstərilmədi — pultun SOURCE düyməsindən istifadə edin',
            inputHidden: '%s gizlədildi — Ayarlar › Gizli mənbələri göstər ilə qaytarın', inputsBack: 'Bütün mənbələr yenidən görünür',
            renamed: 'Yeni ad: %s', recentRemoved: '"Davam et"dən silindi', resetDone: 'Düzən və ayarlar sıfırlandı',
            backupOk: 'Ayarlar yedəkləndi (%s)', backupFail: 'Yedəkləmə alınmadı: %s', restoreOk: 'Ayarlar bərpa edildi', restoreNone: 'Yedək tapılmadı',
            fxAuto: 'Televizor bir az yavaşdır — sürətli effektlərə keçildi', appsFail: 'Tətbiq siyahısı oxunmadı',
            stWall: 'Divar kağızı', stLight: 'Səhnə işığı', stTransp: 'Şüşə şəffaflığı', stBlur: 'Fon bulanıqlığı', stRefl: 'Parıltı',
            stEdge: 'Kənar işığı', stAnim: 'Animasiyalar', stFx: 'Effekt keyfiyyəti', stNight: 'Gecə rejimi', stSaver: 'Ekran qoruyucu',
            stSaverNow: 'Ekran qoruyucunu indi göstər', stClock: 'Saat', stLang: 'Dil', stShowAll: 'Gizli və sistem tətbiqlərini göstər',
            stInputs: 'Gizli mənbələri göstər', stBackup: 'Ayarları yedəklə', stRestore: 'Yedəkdən bərpa et', stReset: 'Düzəni və ayarları sıfırla',
            oAuto: 'Avto', oAutoSun: 'Avto — günəşə görə', oDawn: 'Şəfəq', oDay: 'Gündüz', oSunset: 'Gün batımı', oNight: 'Gecə',
            oOff: 'Yox', oOn: 'Var', oSoft: 'Yumşaq', oFrost: 'Buzlu', oSubtle: 'Zəif', oBright: 'Parlaq', oFull: 'Tam', oReduced: 'Azaldılmış',
            oFast: 'Sürətli', oBalanced: 'Balanslı', oRich: 'Zəngin', oSunToSun: 'Gün batımından şəfəqədək', oFrom: '%s-dan 07:00-dək',
            o24: '24 saat', o12: '12 saat', wMountain: 'Dağ gölü', wAurora: 'Qütb parıltısı', wDusk: 'Alaqaranlıq', wLagoon: 'Laquna', wGraphite: 'Qrafit',
            speedFirst: 'sürət: əvvəlcə bir az gəzin', speed: 'sürət %s ms', apps: 'tətbiq', weather: 'hava'
        }
    };
    var DAYS = { en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                 az: ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'] };
    var MONTHS = { en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                   az: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'] };
    var LANGS = ['en', 'az'];
    function L() { return LANGS[cfg.lang] || 'en'; }
    function T(key, a) {
        var s = STR[L()][key]; if (s === undefined) { s = STR.en[key] || key; }
        if (a !== undefined) { s = s.replace('%n', a).replace('%s', a); }
        return s;
    }

    // ================================================================== configuration
    var GROUP_RULES = [                     // first match wins; '=name' means exact name
        ['Sport', ['sport', 'eurosport', 'red bull', 'goal', 'dazn', 'nba', 'nfl', 'formula']],
        ['UK TV', ['iplayer', 'bbc', 'itv', 'channel 4', 'all 4', 'my5', '=5', 'stv', '=u', 'uktv', 'britbox']],
        ['Movies & Series', ['netflix', 'prime', 'amazon', 'youtube', '=now', 'now tv', 'disney', 'rakuten', 'mubi',
                             'chili', 'curzon', 'tubi', 'hayu', 'apple tv', 'plex', 'facebook watch', 'vimeo']],
        ['Music & Radio', ['spotify', 'deezer', 'tunein', 'vidzone', 'music', 'radio', 'heart']],
        ['World', ['iptv', 'world', 'international']],
        ['Kids & Games', ['kids', 'ketchup', 'toon', 'bubble', 'game', 'cartoon']]
    ];
    var GROUP_AZ = { 'Sport': 'İdman', 'UK TV': 'Britaniya TV', 'Movies & Series': 'Filmlər və seriallar', 'Music & Radio': 'Musiqi və radio',
                     'World': 'Dünya', 'Kids & Games': 'Uşaqlar və oyunlar', 'More': 'Digər', 'Hidden & system': 'Gizli və sistem' };
    function groupLabel(n) { return L() === 'az' ? (GROUP_AZ[n] || n) : n; }
    var USER_FACING_SYSTEM = ['netflix', 'youtube', 'internet', 'browser', 'samsung tv plus', 'gallery', 'e-manual'];
    var DEFAULT_FAV_NAMES = [/netflix/i, /youtube/i];
    var PALETTE = [['#ff5a6a', '#8f0f22'], ['#38b6ff', '#0b4e8f'], ['#43d17a', '#0f6b38'], ['#b13dff', '#4b0f8a'],
                   ['#ffad3b', '#a5490a'], ['#29d3c3', '#0d5d74'], ['#7d8bff', '#2a2f7a'], ['#ff6fb5', '#7a1450'],
                   ['#e9c84a', '#7a5a08'], ['#4a7dff', '#142a7a'], ['#ff8a3d', '#8a3205'], ['#5a6478', '#1c2230']];
    var WALLS = [['scenic', 'wMountain'], ['aurora', 'wAurora'], ['dusk', 'wDusk'], ['lagoon', 'wLagoon'], ['graphite', 'wGraphite']];
    var PHASES = ['dawn', 'day', 'sunset', 'night'];
    var SETTINGS = [
        { key: 'wall', label: 'stWall', type: 'wall' },
        { key: 'light', label: 'stLight', type: 'choice', opts: ['oAutoSun', 'oDawn', 'oDay', 'oSunset', 'oNight'] },
        { key: 'transp', label: 'stTransp', type: 'range', min: 0, max: 100, step: 10 },
        { key: 'blur', label: 'stBlur', type: 'choice', opts: ['oOff', 'oSoft', 'oFrost'] },
        { key: 'refl', label: 'stRefl', type: 'choice', opts: ['oOff', 'oSubtle', 'oBright'] },
        { key: 'edge', label: 'stEdge', type: 'choice', opts: ['oOff', 'oOn'] },
        { key: 'anim', label: 'stAnim', type: 'choice', opts: ['oFull', 'oReduced', 'oOff'] },
        { key: 'fx', label: 'stFx', type: 'choice', opts: ['oAuto', 'oFast', 'oBalanced', 'oRich'] },
        { key: 'night', label: 'stNight', type: 'choice', opts: ['oOff', 'oSunToSun', '21:00', '22:00', '23:00', '00:00'] },
        { key: 'saver', label: 'stSaver', type: 'choice', opts: ['oOff', 5, 10, 15, 30] },
        { key: 'saverNow', label: 'stSaverNow', type: 'action' },
        { key: 'clock', label: 'stClock', type: 'choice', opts: ['o24', 'o12'] },
        { key: 'lang', label: 'stLang', type: 'choice', opts: ['English', 'Azərbaycan'] },
        { key: 'showAll', label: 'stShowAll', type: 'choice', opts: ['oOff', 'oOn'] },
        { key: 'inputs', label: 'stInputs', type: 'action' },
        { key: 'backup', label: 'stBackup', type: 'action' },
        { key: 'restore', label: 'stRestore', type: 'action' },
        { key: 'reset', label: 'stReset', type: 'action' }
    ];
    var DEFAULTS = { wall: 0, light: 0, transp: 60, blur: 0, refl: 1, edge: 1, anim: 0, fx: 0, night: 3, saver: 2, clock: 0, lang: 0, showAll: 0 };
    var WEATHER = { lat: CITY.lat, lon: CITY.lon, everyMs: 30 * 60 * 1000 };
    var CFG_VERSION = 2;          // 1.2 renumbered wall (scenic first) and fx (Auto first)

    // ================================================================== persistent state
    var st = { favs: null, recent: [], recentAt: {}, hidden: {}, srcNames: {}, srcHidden: {}, autoFx: 'balanced', cfgv: CFG_VERSION, cfg: copy(DEFAULTS) };
    function loadState(p) {
        if (p.favs) { st.favs = p.favs; }
        if (p.recent) { st.recent = p.recent; }
        if (p.recentAt) { st.recentAt = p.recentAt; }
        if (p.hidden) { st.hidden = p.hidden; }
        if (p.srcNames) { st.srcNames = p.srcNames; }
        if (p.srcHidden) { st.srcHidden = p.srcHidden; }
        if (p.autoFx) { st.autoFx = p.autoFx; }
        if (p.cfg) {
            for (var k in DEFAULTS) { if (typeof p.cfg[k] === 'number') { st.cfg[k] = p.cfg[k]; } }
            if (p.cfgv !== CFG_VERSION) { st.cfg.wall = 0; st.cfg.fx = 0; st.cfg.blur = 0; st.cfg.night = DEFAULTS.night; st.cfg.saver = DEFAULTS.saver; }   // 1.1 → 1.2: start on the new scenic wallpaper, Auto effects
        }
        st.cfgv = CFG_VERSION;
    }
    (function load() {
        try {
            var raw = window.localStorage && localStorage.getItem(STORE_KEY);
            if (raw) { loadState(JSON.parse(raw)); }
        } catch (e) { }
    }());
    function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(st)); } catch (e) { } }
    function copy(o) { var r = {}; for (var k in o) { r[k] = o[k]; } return r; }
    var cfg = st.cfg;
    if (Q.lang === 'az') { cfg.lang = 1; }

    // ================================================================== apps model
    var apps = {};
    var groups = [];
    var selfId = 'LumenTV001.Lumen';
    var diag = { apps: 0, sources: 0, connected: 0, weather: 'pending', srcError: '' };

    function isSystem(info) {
        var id = info.id, n = (info.name || '').toLowerCase();
        for (var i = 0; i < USER_FACING_SYSTEM.length; i++) { if (n.indexOf(USER_FACING_SYSTEM[i]) >= 0) { return false; } }
        if (/^org\.tizen\./.test(id) || /^com\.samsung\./.test(id)) { return true; }
        return /widget|service|agent|daemon|automation|aging|applist|avcontrol|notification|installer|manager|setting|popup|test/.test(n);
    }
    function groupOf(name) {
        var n = name.toLowerCase();
        for (var g = 0; g < GROUP_RULES.length; g++) {
            var words = GROUP_RULES[g][1];
            for (var w = 0; w < words.length; w++) {
                var word = words[w];
                if (word.charAt(0) === '=' ? n === word.slice(1) : n.indexOf(word) >= 0) { return GROUP_RULES[g][0]; }
            }
        }
        return 'More';
    }
    function ingest(list) {
        apps = {};
        for (var i = 0; i < list.length; i++) {
            var a = list[i];
            if (!a || !a.id || a.id === selfId || a.show === false) { continue; }
            apps[a.id] = { id: a.id, name: a.name || a.id, icon: a.iconPath || '', system: isSystem(a) };
        }
        diag.apps = 0;
        for (var k in apps) { if (!apps[k].system) { diag.apps++; } }
        if (!st.favs) {
            st.favs = [];
            for (var f = 0; f < DEFAULT_FAV_NAMES.length; f++) {
                for (var id in apps) { if (DEFAULT_FAV_NAMES[f].test(apps[id].name)) { st.favs.push(id); break; } }
            }
            save();
        }
        buildGroups();
    }
    function buildGroups() {
        var map = {}, order = [], g, id;
        for (g = 0; g < GROUP_RULES.length; g++) { order.push(GROUP_RULES[g][0]); }
        order.push('More');
        if (cfg.showAll) { order.push('Hidden & system'); }
        for (g = 0; g < order.length; g++) { map[order[g]] = []; }
        var ids = [];
        for (id in apps) { ids.push(id); }
        ids.sort(function (x, y) { var a = apps[x].name.toLowerCase(), b = apps[y].name.toLowerCase(); return a < b ? -1 : a > b ? 1 : 0; });
        for (var i = 0; i < ids.length; i++) {
            id = ids[i];
            if (apps[id].system || st.hidden[id]) { if (cfg.showAll) { map['Hidden & system'].push(id); } continue; }
            map[groupOf(apps[id].name)].push(id);
        }
        groups = [];
        for (g = 0; g < order.length; g++) { if (map[order[g]].length) { groups.push({ name: order[g], ids: map[order[g]] }); } }
    }
    function favList() { return (st.favs || []).filter(function (id) { return !!apps[id]; }); }
    function recentList() { return st.recent.filter(function (id) { return !!apps[id]; }).slice(0, 8); }

    function loadApps(done) {
        if (!onTV) { ingest(SAMPLE_APPS); return done && done(); }
        try {
            tizen.application.getAppsInfo(function (list) { ingest(list); if (done) { done(); } },
                function (e) { toast(T('appsFail') + ': ' + e.message); if (done) { done(); } });
        } catch (e) { toast(T('appsFail') + ': ' + e.message); if (done) { done(); } }
    }

    // ================================================================== sources (inputs)
    var SRC_PRESETS = [   // [label (en), label (az), icon]
        ['PlayStation', 'PlayStation', 'game'], ['Xbox', 'Xbox', 'game'], ['Nintendo Switch', 'Nintendo Switch', 'game'],
        ['Game console', 'Oyun konsolu', 'game'], ['Apple TV', 'Apple TV', 'box'], ['Set-top box', 'TV qəbuledici', 'box'],
        ['Soundbar', 'Saundbar', 'sound'], ['Blu-ray', 'Blu-ray', 'disc'], ['Laptop', 'Noutbuk', 'pc'], ['Camera', 'Kamera', 'cam']
    ];
    var sources = [];
    var allSources = [];
    function srcBase(s) { return s.type === 'TV' ? T('tv') : 'HDMI ' + s.number; }
    function srcName(s) { var p = st.srcNames[s.key]; return p !== undefined && SRC_PRESETS[p] ? SRC_PRESETS[p][L() === 'az' ? 1 : 0] : srcBase(s); }
    function srcSub(s) {
        var state = s.type === 'TV' ? T('liveTV') : (s.on ? T('connected') : T('noSignal'));
        return st.srcNames[s.key] !== undefined ? srcBase(s) + ' · ' + state : state;
    }
    function srcIcon(s) { var p = st.srcNames[s.key]; return p !== undefined && SRC_PRESETS[p] ? SRC_PRESETS[p][2] : (s.type === 'TV' ? 'tv' : 'hdmi'); }
    function loadSources(done) {
        function build(vs) {
            var list = [], seen = {}, i, s;
            var conn = (vs && vs.connected) || [], disc = (vs && vs.disconnected) || [];
            var all = conn.map(function (x) { return [x, true]; }).concat(disc.map(function (x) { return [x, false]; }));
            for (i = 0; i < all.length; i++) {
                s = all[i][0];
                if (s.type !== 'TV' && s.type !== 'HDMI') { continue; }
                var key = s.type + (s.number || 0);
                if (seen[key]) { continue; }
                seen[key] = 1;
                list.push({ key: key, type: s.type, number: s.number, on: all[i][1], raw: s });
            }
            list.sort(function (a, b) { return (a.type === 'TV' ? -1 : 0) - (b.type === 'TV' ? -1 : 0) || a.number - b.number; });
            if (!list.length) { list.push({ key: 'TV0', type: 'TV', number: 0, on: true, raw: null }); }
            allSources = list;
            filterSources();
            diag.sources = list.length;
            diag.connected = list.filter(function (x) { return x.type === 'HDMI' && x.on; }).length;
            if (done) { done(); }
        }
        if (!onTV) { return build(SAMPLE_VIDEOSOURCE); }
        try {
            tizen.systeminfo.getPropertyValue('VIDEOSOURCE', build, function (e) { diag.srcError = e.message; build(null); });
        } catch (e) { diag.srcError = e.message; build(null); }
    }
    function filterSources() { sources = allSources.filter(function (s) { return !st.srcHidden[s.key]; }); }

    var watching = null, watchTimer;
    function openSource(src) {
        if (src.type === 'TV' || !src.raw) { return launchSystemTV(); }
        if (!onTV) { return startWatching(src); }
        try {
            tizen.tvwindow.setSource(src.raw, function () {
                tizen.tvwindow.show(function () { startWatching(src); },
                    function (e) { sourceFailed(src, e); }, ['0px', '0px', '1920px', '1080px'], 'MAIN');
            }, function (e) { sourceFailed(src, e); }, 'MAIN');
        } catch (e) { sourceFailed(src, e); }
    }
    function sourceFailed(src, e) {
        diag.srcError = (e && (e.name + ': ' + e.message)) || 'unknown';
        toast(T('cantShow', srcName(src)));
    }
    function startWatching(src) {
        watching = src;
        addBody('watching');
        document.documentElement.style.background = 'transparent';
        $('watchText').textContent = T('watchHint', srcName(src));
        $('watchHint').className = 'glass solid';
        if (!onTV) { $('watch').innerHTML += '<div id="watchPreview">' + srcName(src) + ' (preview)</div>'; }
        clearTimeout(watchTimer);
        watchTimer = setTimeout(function () { $('watchHint').className = 'glass solid fade'; }, 3500);
    }
    function stopWatching() {
        if (!watching) { return; }
        watching = null;
        if (onTV) { try { tizen.tvwindow.hide(function () { }, function () { }, 'MAIN'); } catch (e) { } }
        var p = $('watchPreview'); if (p) { p.parentNode.removeChild(p); }
        remBody('watching');
        document.documentElement.style.background = '';
    }
    function launchSystemTV() {
        if (!onTV) { return toast('Preview: would open Live TV (org.tizen.tv-viewer)'); }
        try {
            tizen.application.launch('org.tizen.tv-viewer', function () { }, function (e) { toast(T('cantOpen', T('liveTV')) + ': ' + e.message); });
        } catch (e) { toast(T('cantOpen', T('liveTV')) + ': ' + e.message); }
    }

    // ================================================================== sun (follow the sun) — your city
    var sun = { rise: 7 * 60, set: 18 * 60, fromWeather: false };
    function calcSun(d) {        // NOAA sunrise equation, minutes after local midnight
        if (WEATHER.lat === null || WEATHER.lon === null) { return { rise: 7 * 60, set: 18 * 60 }; }
        var rad = Math.PI / 180, lat = WEATHER.lat, lng = WEATHER.lon;
        var start = new Date(d.getFullYear(), 0, 0), N = Math.floor((d - start) / 86400000), lngHour = lng / 15;
        function one(rising) {
            var t = N + ((rising ? 6 : 18) - lngHour) / 24;
            var M = 0.9856 * t - 3.289;
            var Lg = (M + 1.916 * Math.sin(M * rad) + 0.020 * Math.sin(2 * M * rad) + 282.634 + 360) % 360;
            var RA = Math.atan(0.91764 * Math.tan(Lg * rad)) / rad;
            RA = (RA + 360) % 360;
            RA += Math.floor(Lg / 90) * 90 - Math.floor(RA / 90) * 90;
            RA /= 15;
            var sinDec = 0.39782 * Math.sin(Lg * rad), cosDec = Math.cos(Math.asin(sinDec));
            var cosH = (Math.cos(90.833 * rad) - sinDec * Math.sin(lat * rad)) / (cosDec * Math.cos(lat * rad));
            var H = (rising ? 360 - Math.acos(cosH) / rad : Math.acos(cosH) / rad) / 15;
            var Tm = H + RA - 0.06571 * t - 6.622;
            var UT = (Tm - lngHour + 48) % 24;
            return Math.round(((UT * 60 - d.getTimezoneOffset()) + 1440) % 1440);
        }
        return { rise: one(true), set: one(false) };
    }
    function nowDate() {          // preview can fake the time with ?time=23:10
        var d = new Date();
        if (Q.time) { var m = /(\d+):(\d+)/.exec(Q.time); if (m) { d.setHours(+m[1], +m[2]); } }
        return d;
    }
    function minutesNow(d) { return d.getHours() * 60 + d.getMinutes(); }
    function phaseNow(d) {
        if (Q.phase) { return Q.phase; }
        if (cfg.light) { return PHASES[cfg.light - 1]; }
        var m = minutesNow(d);
        if (m >= sun.rise - 45 && m < sun.rise + 60) { return 'dawn'; }
        if (m >= sun.set - 75 && m < sun.set + 40) { return 'sunset'; }
        if (m >= sun.rise + 60 && m < sun.set - 75) { return 'day'; }
        return 'night';
    }
    function nightNow(d) {
        if (Q.night) { return Q.night === '1'; }
        var m = minutesNow(d), o = cfg.night;
        if (!o) { return false; }
        if (o === 1) { return m >= sun.set || m < sun.rise; }
        var startH = [0, 0, 21, 22, 23, 0][o], s = startH * 60;
        return s === 0 ? m < 420 : (m >= s || m < 420);
    }

    // ================================================================== weather (Open-Meteo, your city)
    var lastWeather = { temp: '--°', kind: 'cloud', key: 'loading' };
    function weatherKind(code, day) {
        if (code === 0) { return [day ? 'sun' : 'moon', 'wClear']; }
        if (code <= 2) { return [day ? 'suncloud' : 'mooncloud', 'wPartly']; }
        if (code === 3) { return ['cloud', 'wOvercast']; }
        if (code === 45 || code === 48) { return ['fog', 'wFog']; }
        if (code >= 51 && code <= 67) { return ['rain', code < 61 ? 'wDrizzle' : 'wRain']; }
        if (code >= 71 && code <= 77) { return ['snow', 'wSnow']; }
        if (code >= 80 && code <= 82) { return ['rain', 'wShowers']; }
        if (code >= 85 && code <= 86) { return ['snow', 'wSnowShowers']; }
        if (code >= 95) { return ['storm', 'wStorm']; }
        return ['cloud', 'wCloudy'];
    }
    var WSVG = {
        sun: '<circle cx="50" cy="50" r="20" fill="#ffd678"/><g stroke="#ffd678" stroke-width="6" stroke-linecap="round"><path d="M50 14v8M50 78v8M14 50h8M78 50h8M25 25l6 6M69 69l6 6M25 75l6-6M69 31l6-6"/></g>',
        moon: '<path d="M62 20a30 30 0 1 0 18 46A26 26 0 0 1 62 20z" fill="#e8ecff"/>',
        cloud: '<path d="M26 76h50a16 16 0 0 0 0-32 22 22 0 0 0-42 5 14 14 0 0 0-8 27z" fill="rgba(255,255,255,.92)"/>',
        fog: '<path d="M22 40h56M16 54h68M24 68h52" stroke="rgba(255,255,255,.9)" stroke-width="7" stroke-linecap="round"/>',
        rain: '<path d="M26 60h50a16 16 0 0 0 0-32 22 22 0 0 0-42 5 14 14 0 0 0-8 27z" fill="rgba(255,255,255,.92)"/><path d="M36 70l-4 10M52 70l-4 10M68 70l-4 10" stroke="#7cc4ff" stroke-width="6" stroke-linecap="round"/>',
        snow: '<path d="M26 60h50a16 16 0 0 0 0-32 22 22 0 0 0-42 5 14 14 0 0 0-8 27z" fill="rgba(255,255,255,.92)"/><g fill="#fff"><circle cx="36" cy="76" r="4"/><circle cx="52" cy="82" r="4"/><circle cx="68" cy="76" r="4"/></g>',
        storm: '<path d="M26 58h50a16 16 0 0 0 0-32 22 22 0 0 0-42 5 14 14 0 0 0-8 27z" fill="rgba(255,255,255,.92)"/><path d="M52 60l-8 14h10l-6 14" fill="none" stroke="#ffd678" stroke-width="6" stroke-linejoin="round"/>'
    };
    WSVG.suncloud = '<circle cx="38" cy="40" r="16" fill="#ffd678"/>' + WSVG.cloud;
    WSVG.mooncloud = '<path d="M46 18a20 20 0 1 0 14 30A17 17 0 0 1 46 18z" fill="#e8ecff"/>' + WSVG.cloud;
    function setWeather(temp, kind, key) {
        lastWeather = { temp: temp, kind: kind, key: key };
        $('wIcon').innerHTML = '<svg viewBox="0 0 100 100">' + WSVG[kind] + '</svg>';
        $('wTemp').textContent = temp;
        $('wDesc').textContent = T(key);
        $('wPlace').textContent = cityName();
        $('wDesc').style.left = ($('wTemp').offsetWidth + 160) + 'px';
        $('sWeather').innerHTML = '<svg viewBox="0 0 100 100">' + WSVG[kind] + '</svg><span>' + temp + ' · ' + T(key) + ' · ' + cityName() + '</span>';
    }
    function cityName() { return L() === 'az' ? CITY.nameAz : CITY.name; }
    function hhmm(s) { var m = /T(\d\d):(\d\d)/.exec(s || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; }
    function loadWeather() {
        if (!onTV) { diag.weather = 'sample'; return setWeather('14°', 'suncloud', 'wPartly'); }
        if (WEATHER.lat === null || WEATHER.lon === null) { diag.weather = 'no city set'; addBody('no-weather'); return; }
        var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + WEATHER.lat + '&longitude=' + WEATHER.lon +
                  '&current=temperature_2m,weather_code,is_day&daily=sunrise,sunset&forecast_days=1&timezone=auto';
        try {
            var x = new XMLHttpRequest();
            x.open('GET', url, true);
            x.timeout = 15000;
            x.onload = function () {
                try {
                    var j = JSON.parse(x.responseText), c = j.current;
                    var k = weatherKind(c.weather_code, c.is_day === 1);
                    setWeather(Math.round(c.temperature_2m) + '°', k[0], k[1]);
                    if (j.daily) {
                        var r = hhmm(j.daily.sunrise && j.daily.sunrise[0]), s = hhmm(j.daily.sunset && j.daily.sunset[0]);
                        if (r !== null && s !== null) { sun.rise = r; sun.set = s; sun.fromWeather = true; }
                    }
                    diag.weather = 'ok';
                    tick();
                } catch (e) { weatherFail('bad data'); }
            };
            x.onerror = function () { weatherFail('offline'); };
            x.ontimeout = function () { weatherFail('timeout'); };
            x.send();
        } catch (e) { weatherFail(e.message); }
    }
    function weatherFail(why) {
        diag.weather = why;
        if (lastWeather.temp === '--°') { setWeather('--°', 'cloud', 'wNone'); }
    }

    // ================================================================== cards
    function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; } return Math.abs(h); }
    function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
    var TINTS = [[/netflix/i, ['#e3323c', '#5a0b10']], [/youtube/i, ['#ff4d4d', '#a3121c']], [/prime|amazon/i, ['#38b6ff', '#0b4e8f']],
                 [/spotify/i, ['#43d17a', '#0f6b38']], [/iplayer/i, ['#ff4fa8', '#6c1fb3']], [/disney/i, ['#4a7dff', '#142a7a']],
                 [/itv/i, ['#d7e85a', '#5d8a12']], [/bbc/i, ['#ff5a6a', '#8f0f22']], [/deezer/i, ['#c64dff', '#3d0b6b']]];
    function tintFor(name) {
        for (var i = 0; i < TINTS.length; i++) { if (TINTS[i][0].test(name)) { return TINTS[i][1]; } }
        return PALETTE[hash(name) % PALETTE.length];
    }
    function monogram(name) {
        var w = name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(function (x) { return x; });
        if (!w.length) { return '?'; }
        if (w.length === 1) { return w[0].length <= 3 ? w[0].toUpperCase() : w[0].charAt(0).toUpperCase(); }
        return (w[0].charAt(0) + w[1].charAt(0)).toUpperCase();
    }
    function makeCard(id, size) {
        var a = apps[id], pal = tintFor(a.name);
        var c = document.createElement('div');
        c.className = 'card ' + size + (st.favs && st.favs.indexOf(id) >= 0 ? ' fav' : '') +
                      (a.system ? ' sysapp' : st.hidden[id] ? ' hiddenapp' : '');
        var halo = document.createElement('div');
        halo.className = 'halo';
        halo.style.background = '-webkit-radial-gradient(center, ellipse cover, ' + rgba(pal[0], 0.75) + ' 0%, ' + rgba(pal[0], 0) + ' 70%)';
        halo.style.background = 'radial-gradient(ellipse at center, ' + rgba(pal[0], 0.75) + ' 0%, ' + rgba(pal[0], 0) + ' 70%)';
        var icon = document.createElement('div');
        icon.className = 'icon';
        icon.innerHTML = '<div class="gloss"></div><div class="glyph"></div><div class="sweep"></div>';
        function useMonogram() {
            icon.className = 'icon';
            icon.style.background = '-webkit-linear-gradient(top left, ' + rgba(pal[0], 0.86) + ', ' + rgba(pal[1], 0.78) + ')';
            icon.style.background = 'linear-gradient(135deg, ' + rgba(pal[0], 0.86) + ', ' + rgba(pal[1], 0.78) + ')';
            icon.children[1].textContent = monogram(a.name);
        }
        if (a.icon) {
            icon.className = 'icon plate';
            var img = document.createElement('img');
            img.onerror = function () { if (img.parentNode) { img.parentNode.removeChild(img); } useMonogram(); };
            img.src = a.icon;
            icon.insertBefore(img, icon.children[1]);
        } else { useMonogram(); }
        var badge = document.createElement('div');
        badge.className = 'badge';
        badge.textContent = '★';
        var name = document.createElement('div');
        name.className = 'name';
        name.textContent = a.name;
        c.appendChild(halo); c.appendChild(icon); c.appendChild(badge); c.appendChild(name);
        return c;
    }
    var SVG = {
        tv: '<svg viewBox="0 0 100 100"><rect x="14" y="24" width="72" height="48" rx="8" fill="none" stroke="#fff" stroke-width="6"/>' +
            '<path d="M36 84h28M42 12l8 10 8-10" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        hdmi: '<svg viewBox="0 0 100 100"><path d="M14 36h72v18l-10 12H24L14 54z" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>' +
              '<path d="M30 48h40" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>',
        game: '<svg viewBox="0 0 100 100"><path d="M30 32h40c10 0 16 8 18 20l3 14c1 8-7 12-12 6l-8-9H29l-8 9c-5 6-13 2-12-6l3-14c2-12 8-20 18-20z" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>' +
              '<path d="M31 44v14M24 51h14" stroke="#fff" stroke-width="6" stroke-linecap="round"/><circle cx="66" cy="47" r="4" fill="#fff"/><circle cx="74" cy="55" r="4" fill="#fff"/></svg>',
        box: '<svg viewBox="0 0 100 100"><rect x="14" y="36" width="72" height="30" rx="8" fill="none" stroke="#fff" stroke-width="6"/><circle cx="72" cy="51" r="4" fill="#fff"/>' +
             '<path d="M26 74h48" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".6"/></svg>',
        sound: '<svg viewBox="0 0 100 100"><rect x="8" y="40" width="84" height="22" rx="11" fill="none" stroke="#fff" stroke-width="6"/>' +
               '<circle cx="28" cy="51" r="4" fill="#fff"/><circle cx="50" cy="51" r="4" fill="#fff"/><circle cx="72" cy="51" r="4" fill="#fff"/></svg>',
        disc: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="34" fill="none" stroke="#fff" stroke-width="6"/><circle cx="50" cy="50" r="8" fill="none" stroke="#fff" stroke-width="6"/></svg>',
        pc: '<svg viewBox="0 0 100 100"><rect x="20" y="24" width="60" height="40" rx="6" fill="none" stroke="#fff" stroke-width="6"/>' +
            '<path d="M10 74h80" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>',
        cam: '<svg viewBox="0 0 100 100"><rect x="12" y="30" width="76" height="48" rx="10" fill="none" stroke="#fff" stroke-width="6"/>' +
             '<circle cx="50" cy="54" r="13" fill="none" stroke="#fff" stroke-width="6"/><path d="M36 30l5-9h18l5 9" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round"/></svg>',
        grid: '<svg viewBox="0 0 56 56"><g fill="#fff"><rect x="4" y="4" width="20" height="20" rx="6"/><rect x="32" y="4" width="20" height="20" rx="6"/>' +
              '<rect x="4" y="32" width="20" height="20" rx="6"/><rect x="32" y="32" width="20" height="20" rx="6" opacity=".55"/></g></svg>'
    };
    function glassCard(size, glyphHtml, name, sub, dim) {
        var c = document.createElement('div');
        c.className = 'card ' + size + ' source' + (dim ? ' nosignal' : '');
        c.innerHTML = '<div class="halo"></div><div class="icon"><div class="gloss"></div><div class="sglyph"></div><div class="sweep"></div></div>' +
                      '<div class="name"></div><div class="sub"></div>';
        c.children[0].style.background = 'radial-gradient(ellipse at center, rgba(255,255,255,.55) 0%, rgba(255,255,255,0) 70%)';
        c.children[1].children[1].innerHTML = glyphHtml;
        c.children[2].textContent = name;
        c.children[3].textContent = sub || '';
        return c;
    }
    function agoText(t) {
        if (!t) { return ''; }
        var s = (Date.now() - t) / 1000;
        if (s < 90) { return T('justNow'); }
        if (s < 3600) { return T('minAgo', Math.round(s / 60)); }
        var d = new Date(t), now = new Date(), y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        if (d >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) { return T('hAgo', Math.round(s / 3600)); }
        if (d >= y) { return T('yesterday'); }
        return T('daysAgo', Math.max(2, Math.round(s / 86400)));
    }

    // ================================================================== render
    var Z_TOP = 0, Z_DOCK = 1, Z_RECENT = 2;
    var TOP_IDS = ['btnSleep', 'btnSound', 'btnScreen', 'btnEdit', 'btnSettings'];
    var focus = { z: Z_DOCK, i: 0 }, lastCol = {};
    var drawer = { open: false, z: 0, i: 0, last: {} };
    var arranging = false, lifted = -1, settingsOpen = false, setIdx = 0;
    var lastFocusEl = null;
    var dockItems = [], dockEls = [], recentItems = [], recentEls = [], drawerEls = [];
    var SRC_GAP = 50, SRC_STEP = 226;

    function addBody(c) { if ((' ' + document.body.className + ' ').indexOf(' ' + c + ' ') < 0) { document.body.className += ' ' + c; } }
    function remBody(c) { document.body.className = (' ' + document.body.className + ' ').replace(' ' + c + ' ', ' ').replace(/^\s+|\s+$/g, ''); }

    function renderDock() {
        var track = $('dockTrack'), favs = favList();
        track.innerHTML = '';
        dockItems = []; dockEls = [];
        for (var i = 0; i < favs.length; i++) {
            var el = makeCard(favs[i], 'big');
            el.style.left = (i * 236) + 'px';
            if (i === lifted) { el.className += ' lifted'; }
            track.appendChild(el);
            dockItems.push({ kind: 'app', id: favs[i] }); dockEls.push(el);
        }
        var srcX = Math.max(favs.length, 1) * 236 + SRC_GAP;
        if (!favs.length) {
            var tip = document.createElement('div');
            tip.style.cssText = 'position:absolute;left:0;top:70px;width:220px;font-size:24px;line-height:34px;opacity:.7';
            tip.textContent = T('pinTip');
            track.appendChild(tip);
        }
        var div = document.createElement('div');
        div.className = 'divider';
        div.style.left = (srcX - SRC_GAP / 2) + 'px';
        track.appendChild(div);
        $('srcTitle').style.left = (56 + srcX) + 'px';
        for (var j = 0; j < sources.length; j++) {
            var s = sources[j];
            var se = glassCard('big', SVG[srcIcon(s)], srcName(s), srcSub(s), !s.on);
            se.style.left = (srcX + j * SRC_STEP) + 'px';
            track.appendChild(se);
            dockItems.push({ kind: 'src', src: s }); dockEls.push(se);
        }
        $('dockHint').textContent = arranging ? (lifted >= 0 ? T('moving') : T('arrangeMode')) : '';
    }
    var recentSubs = [];
    function renderRecent() {
        var track = $('recentTrack'), rec = recentList();
        track.innerHTML = '';
        recentItems = []; recentEls = []; recentSubs = [];
        for (var i = 0; i < rec.length; i++) {
            var el = makeCard(rec[i], 'mini');
            el.style.left = (i * 172) + 'px';
            var sub = document.createElement('div');
            sub.className = 'ago';
            sub.textContent = agoText(st.recentAt[rec[i]]);
            el.appendChild(sub);
            recentSubs.push([sub, rec[i]]);
            track.appendChild(el);
            recentItems.push({ kind: 'app', id: rec[i] }); recentEls.push(el);
        }
        var all = glassCard('mini', SVG.grid, T('allApps'), '', false);
        all.className = 'card mini allapps';
        all.style.left = (rec.length * 172) + 'px';
        track.appendChild(all);
        recentItems.push({ kind: 'all' }); recentEls.push(all);
        if (!rec.length) {
            var t = document.createElement('div');
            t.id = 'recentEmpty';
            t.textContent = T('recentEmpty');
            track.appendChild(t);
        }
    }
    function refreshAgo() { for (var i = 0; i < recentSubs.length; i++) { recentSubs[i][0].textContent = agoText(st.recentAt[recentSubs[i][1]]); } }
    function renderDrawer() {
        var track = $('rowsTrack');
        track.innerHTML = '';
        drawerEls = [];
        for (var g = 0; g < groups.length; g++) {
            var row = document.createElement('div');
            row.className = 'row';
            var t = document.createElement('div');
            t.className = 'zone-title';
            t.textContent = groupLabel(groups[g].name) + '  ·  ' + groups[g].ids.length;
            var rt = document.createElement('div');
            rt.className = 'rowTrack';
            var els = [];
            for (var i = 0; i < groups[g].ids.length; i++) {
                var el = makeCard(groups[g].ids[i], 'small');
                el.style.left = (i * 186) + 'px';
                rt.appendChild(el);
                els.push(el);
            }
            row.appendChild(t); row.appendChild(rt);
            track.appendChild(row);
            drawerEls.push(els);
        }
    }
    function renderAll() { renderDock(); renderRecent(); if (drawer.open) { renderDrawer(); } updateFocus(); }
    function applyLang() {
        var els = document.querySelectorAll('[data-t]');
        for (var i = 0; i < els.length; i++) { els[i].textContent = T(els[i].getAttribute('data-t')); }
        $('drawerSub').textContent = T('drawerSub');
        $('blackText').textContent = T('blackHint');
        document.documentElement.lang = L();
        setWeather(lastWeather.temp, lastWeather.kind, lastWeather.key);
        lastHints = '';
    }

    // ================================================================== focus
    function setT(el, x, y) {
        var v = 'translate3d(' + x + 'px,' + y + 'px,0)';
        if (el._t === v) { return; }
        el._t = v; el.style.webkitTransform = v; el.style.transform = v;
    }
    function topEls() { return TOP_IDS.map(function (id) { return $(id); }); }
    function zoneEls(z) { return z === Z_DOCK ? dockEls : z === Z_RECENT ? recentEls : topEls(); }
    function pillClass(id, focused) {
        var c = 'pill' + (id === 'btnEdit' || id === 'btnSettings' ? '' : ' icon');
        if (id === 'btnEdit' && arranging) { c += ' on'; }
        if (id === 'btnSleep' && sleepEnd) { c += ' on'; }
        if (id === 'btnSound' && sound.kind) { c += ' on'; }
        return c + (focused ? ' focus' : '');
    }
    function updateFocus() {
        if (lastFocusEl && lastFocusEl.className.indexOf('focus') >= 0) { lastFocusEl.className = lastFocusEl.className.replace(/\s*\bfocus\b/g, ''); }
        lastFocusEl = null;
        if (!dockEls.length && focus.z === Z_DOCK) { focus.z = Z_RECENT; }
        focus.i = Math.max(0, Math.min(focus.i, zoneEls(focus.z).length - 1));
        if (menu.open) {
            lastFocusEl = $('menuList').children[menu.idx]; if (lastFocusEl) { lastFocusEl.className += ' focus'; }
        } else if (settingsOpen) {
            lastFocusEl = $('setList').children[setIdx]; lastFocusEl.className += ' focus';
            var clipH = 830, top = lastFocusEl.offsetTop, listH = $('setList').offsetHeight;
            setT($('setList'), 0, -Math.max(0, Math.min(top - 320, listH - clipH)));
        } else if (drawer.open && drawerEls.length) {
            drawer.z = Math.max(0, Math.min(drawer.z, drawerEls.length - 1));
            drawer.i = Math.max(0, Math.min(drawer.i, drawerEls[drawer.z].length - 1));
            lastFocusEl = drawerEls[drawer.z][drawer.i]; lastFocusEl.className += ' focus';
            var rows = $('rowsTrack');
            setT(rows, 0, -Math.max(0, drawer.z - 1) * 262);
            for (var g = 0; g < groups.length; g++) {
                rows.children[g].className = 'row' + (g === drawer.z ? ' active' : '');
                var ci = g === drawer.z ? drawer.i : (drawer.last[g] || 0);
                setT(rows.children[g].children[1], -Math.max(0, Math.min(ci - 4, groups[g].ids.length - 9)) * 186, 0);
            }
        } else if (!drawer.open && focus.z !== Z_TOP) {
            var el = zoneEls(focus.z)[focus.i];
            if (el) { el.className += ' focus'; lastFocusEl = el; }
        }
        var di = focus.z === Z_DOCK ? focus.i : (lastCol[Z_DOCK] || 0);
        setT($('dockTrack'), -Math.max(0, Math.min(di - 3, dockEls.length - 7)) * 236, 0);
        var ri = focus.z === Z_RECENT ? focus.i : 0;
        setT($('recentTrack'), -Math.max(0, Math.min(ri - 6, recentEls.length - 10)) * 172, 0);
        var onTop = !settingsOpen && !drawer.open && !menu.open && focus.z === Z_TOP;
        for (var p = 0; p < TOP_IDS.length; p++) {
            var pc = pillClass(TOP_IDS[p], onTop && focus.i === p), pe = $(TOP_IDS[p]);
            if (pe.className !== pc) { pe.className = pc; }
        }
        $('sleepLeft').textContent = sleepEnd ? Math.max(1, Math.ceil((sleepEnd - Date.now()) / 60000)) : '';
        renderHints();
    }
    var lastHints = '';
    function renderHints() {
        var h = menu.open ? T('hMenu') : settingsOpen ? T('hSettings') : drawer.open ? T('hDrawer') : arranging ? T('hArrange') : T('hHome');
        if (h !== lastHints) { lastHints = h; $('hintText').innerHTML = h; }
    }
    function move(dx, dy) {
        if (lifted >= 0) { if (dx) { moveLifted(dx); } return; }
        if (drawer.open) {
            if (!drawerEls.length) { return; }
            if (dy) {
                var nz = drawer.z + dy;
                if (nz < 0 || nz >= drawerEls.length) { return; }
                drawer.last[drawer.z] = drawer.i; drawer.z = nz; drawer.i = drawer.last[nz] || 0;
            } else { drawer.i += dx; }
            return updateFocus();
        }
        if (dy) {
            var z = focus.z + dy;
            if (z === Z_DOCK && !dockEls.length) { z += dy; }
            if (z < Z_TOP || z > Z_RECENT) { return; }
            lastCol[focus.z] = focus.i;
            focus.z = z;
            focus.i = z === Z_TOP ? (lastCol[Z_TOP] === undefined ? TOP_IDS.length - 1 : lastCol[Z_TOP]) : (lastCol[z] || 0);
        } else { focus.i += dx; }
        updateFocus();
    }

    // ================================================================== actions
    function focusedItem() {
        if (drawer.open) { return drawerEls.length ? { kind: 'app', id: groups[drawer.z].ids[drawer.i], where: 'drawer' } : null; }
        var it = focus.z === Z_DOCK ? dockItems[focus.i] : focus.z === Z_RECENT ? recentItems[focus.i] : null;
        if (!it) { return null; }
        return { kind: it.kind, id: it.id, src: it.src, where: focus.z === Z_DOCK ? 'dock' : 'recent' };
    }
    function focusedAppId() { var it = focusedItem(); return it && it.kind === 'app' ? it.id : null; }
    function toggleFav(id) {
        id = id || focusedAppId();
        if (!id) { return toast(focus.z === Z_DOCK && !drawer.open ? T('srcStay') : T('chooseApp')); }
        if (!st.favs) { st.favs = []; }
        var at = st.favs.indexOf(id);
        if (at >= 0) { st.favs.splice(at, 1); toast(T('favRemoved', apps[id].name)); }
        else { st.favs.push(id); toast(T('favAdded', apps[id].name)); }
        save(); renderAll();
    }
    function toggleHidden(id) {
        id = id || focusedAppId();
        if (!id) { return; }
        if (apps[id].system) { return toast(T('sysStay')); }
        if (st.hidden[id]) { delete st.hidden[id]; toast(T('visibleAgain', apps[id].name)); }
        else { st.hidden[id] = 1; toast(T('hidden', apps[id].name)); }
        save(); buildGroups(); if (drawer.open) { renderDrawer(); } renderAll();
    }
    function moveLifted(dx) {
        var favs = favList(), j = lifted + dx;
        if (j < 0 || j >= favs.length) { return; }
        var tmp = favs[j]; favs[j] = favs[lifted]; favs[lifted] = tmp;
        st.favs = favs; lifted = j; focus.i = j;
        save(); renderDock(); updateFocus();
    }
    function setArrange(on, liftIdx) {
        arranging = on; lifted = on && liftIdx !== undefined ? liftIdx : -1;
        if (on) { focus.z = Z_DOCK; focus.i = liftIdx || 0; }
        renderDock(); updateFocus();
        toast(on ? T('arrangeOn') : T('favSaved'));
    }
    function openDrawer(on) {
        drawer.open = on;
        if (on) { addBody('drawer-open'); renderDrawer(); } else { remBody('drawer-open'); }
        updateFocus();
    }
    var launchTimer;
    function showLaunch(cardEl, msg, note) {
        cardEl.className += ' focus';
        cardEl.style.left = '10px';
        $('launchCard').innerHTML = '';
        $('launchCard').appendChild(cardEl);
        $('launchMsg').textContent = msg;
        $('launchNote').textContent = note || '';
        $('launch').className = 'layer on';
        clearTimeout(launchTimer);
        launchTimer = setTimeout(function () { $('launch').className = 'layer'; }, onTV ? 2500 : 1400);
    }
    function openApp(id) {
        var at = st.recent.indexOf(id);
        if (at >= 0) { st.recent.splice(at, 1); }
        st.recent.unshift(id);
        if (st.recent.length > 12) { st.recent.length = 12; }
        st.recentAt[id] = Date.now();
        save();
        showLaunch(makeCard(id, 'big'), T('opening', apps[id].name), onTV ? '' : T('previewOpen'));
        if (onTV) {
            try {
                tizen.application.launch(id, function () { }, function (e) {
                    $('launch').className = 'layer';
                    toast(T('cantOpen', apps[id].name) + ': ' + e.message);
                });
            } catch (e) { $('launch').className = 'layer'; toast(T('cantOpen', apps[id].name) + ': ' + e.message); }
        }
        setTimeout(renderRecent, 600);
    }
    function ok() {
        if (drawer.open) {
            var did = focusedAppId();
            if (did) { openDrawer(false); openApp(did); }
            return;
        }
        if (focus.z === Z_TOP) {
            var id = TOP_IDS[focus.i];
            if (id === 'btnSleep') { return sleepMenu(); }
            if (id === 'btnSound') { return soundMenu(); }
            if (id === 'btnScreen') { return screenOff(true); }
            if (id === 'btnEdit') { return setArrange(!arranging); }
            return openSettings(true);
        }
        var it = focus.z === Z_DOCK ? dockItems[focus.i] : recentItems[focus.i];
        if (!it) { return; }
        if (arranging) {
            if (it.kind === 'app' && focus.z === Z_DOCK) { lifted = lifted >= 0 ? -1 : focus.i; renderDock(); updateFocus(); }
            return;
        }
        if (it.kind === 'src') { return openSource(it.src); }
        if (it.kind === 'all') { return openDrawer(true); }
        openApp(it.id);
    }

    // ================================================================== small menu (options, quick buttons, rename)
    var menu = { open: false, items: [], idx: 0 };
    function openMenu(title, items, headHtml, startIdx) {
        menu.open = true; menu.items = items; menu.idx = startIdx || 0;
        $('menuTitle').textContent = title;
        $('menuHead').innerHTML = headHtml || '';
        $('menu').className = 'glass solid' + (headHtml ? ' withhead' : '');
        var list = $('menuList');
        list.innerHTML = '';
        for (var i = 0; i < items.length; i++) {
            var el = document.createElement('div');
            el.className = 'mi' + (items[i].sel ? ' sel' : '');
            el.textContent = items[i].label;
            list.appendChild(el);
        }
        var h = (headHtml ? 250 : 120) + items.length * 66 + 30;
        $('menu').style.height = h + 'px';
        $('menu').style.top = Math.max(60, Math.round((1080 - h) / 2)) + 'px';
        addBody('menu-open');
        syncGlass();
        updateFocus();
    }
    function closeMenu() { menu.open = false; remBody('menu-open'); updateFocus(); }
    function menuKey(k) {
        if (k === 'up' && menu.idx > 0) { menu.idx--; updateFocus(); }
        else if (k === 'down' && menu.idx < menu.items.length - 1) { menu.idx++; updateFocus(); }
        else if (k === 'ok') { var it = menu.items[menu.idx]; closeMenu(); if (it && it.act) { it.act(); } }
        else if (k === 'back' || k === 'green') { closeMenu(); }
    }
    function cardHead(el) { var w = document.createElement('div'); el.className += ' focus'; el.style.left = '0px'; w.appendChild(el); return w.innerHTML; }
    function optionsMenu() {
        var it = focusedItem();
        if (!it || it.kind === 'all') { return; }
        if (it.kind === 'src') { return sourceMenu(it.src); }
        var id = it.id, a = apps[id], items = [], isFav = st.favs && st.favs.indexOf(id) >= 0;
        items.push({ label: T('open'), act: function () { if (drawer.open) { openDrawer(false); } openApp(id); } });
        items.push({ label: isFav ? T('remFav') : T('addFav'), act: function () { toggleFav(id); } });
        if (isFav && it.where === 'dock') { items.push({ label: T('move'), act: function () { setArrange(true, favList().indexOf(id)); } }); }
        if (!a.system) { items.push({ label: st.hidden[id] ? T('unhide') : T('hide'), act: function () { toggleHidden(id); } }); }
        if (it.where === 'recent') {
            items.push({ label: T('remRecent'), act: function () {
                st.recent.splice(st.recent.indexOf(id), 1); delete st.recentAt[id]; save(); renderRecent(); updateFocus(); toast(T('recentRemoved'));
            } });
        }
        items.push({ label: T('about'), act: function () { toast(a.name + ' · ' + a.id + ' · ' + groupLabel(groupOf(a.name))); } });
        openMenu(a.name, items, cardHead(makeCard(id, 'mini')));
    }
    function sourceMenu(s) {
        var items = [
            { label: T('open'), act: function () { openSource(s); } },
            { label: T('rename'), act: function () { renameMenu(s); } },
            { label: T('hideInput'), act: function () {
                st.srcHidden[s.key] = 1; save(); filterSources(); renderDock(); updateFocus(); toast(T('inputHidden', srcName(s)));
            } }
        ];
        openMenu(srcName(s), items, cardHead(glassCard('mini', SVG[srcIcon(s)], srcName(s), '', !s.on)));
    }
    function renameMenu(s) {
        var cur = st.srcNames[s.key], items = [{ label: T('originalName') + ' (' + srcBase(s) + ')', sel: cur === undefined,
            act: function () { delete st.srcNames[s.key]; save(); renderDock(); updateFocus(); toast(T('renamed', srcBase(s))); } }];
        for (var i = 0; i < SRC_PRESETS.length; i++) {
            items.push({ label: SRC_PRESETS[i][L() === 'az' ? 1 : 0], sel: cur === i, act: (function (p) {
                return function () { st.srcNames[s.key] = p; save(); renderDock(); updateFocus(); toast(T('renamed', srcName(s))); };
            }(i)) });
        }
        openMenu(T('renameTitle', srcBase(s)), items, '', cur === undefined ? 0 : cur + 1);
    }

    // ================================================================== sleep timer + screen off
    var sleepEnd = 0;
    function sleepMenu() {
        var opts = [0, 15, 30, 45, 60, 90, 120], items = [];
        var left = sleepEnd ? Math.ceil((sleepEnd - Date.now()) / 60000) : 0;
        for (var i = 0; i < opts.length; i++) {
            items.push({ label: opts[i] ? T('min', opts[i]) : T('off'), sel: !opts[i] ? !sleepEnd : false, act: (function (m) {
                return function () {
                    sleepEnd = m ? Date.now() + m * 60000 : 0;
                    toast(m ? T('sleepSet', m) : T('sleepOff'));
                    updateFocus();
                };
            }(opts[i])) });
        }
        openMenu(T('sleepTitle') + (left ? ' · ' + T('min', left) : ''), items);
    }
    function checkSleep() {
        if (sleepEnd && Date.now() >= sleepEnd) {
            sleepEnd = 0;
            stopSound(true);
            screenOff(true);
            updateFocus();
        }
    }
    var dark = false;
    function screenOff(on) {
        dark = on;
        if (on) {
            closeSaver();
            addBody('dark');
            if (onTV) { try { if (tizen.power && tizen.power.turnScreenOff) { tizen.power.turnScreenOff(); } } catch (e) { } }
        } else {
            remBody('dark');
            if (onTV) { try { if (tizen.power && tizen.power.turnScreenOn) { tizen.power.turnScreenOn(); } } catch (e) { } }
        }
    }

    // ================================================================== soundscape (Web Audio, generated on the TV)
    // Real recordings (sounds/*.mp3, credits below) + one sound generated on the TV (brown noise).
    var SOUNDS = [['rain', 'sRain'], ['storm', 'sStorm'], ['ocean', 'sOcean'], ['stream', 'sStream'], ['fire', 'sFire'],
                  ['birds', 'sBirds'], ['night', 'sNight'], ['wind', 'sWind'], ['brown', 'sBrown']];
    var CREDITS = [['sRain', 'alex36917', 'CC BY'], ['sStorm', 'Digifish music', 'CC BY'], ['sOcean', 'Luftrum', 'CC BY'],
                   ['sStream', 'gluckose', 'CC0'], ['sFire', 'ezwa', 'Public domain'], ['sBirds', 'kvgarlic', 'CC0'],
                   ['sNight', 'Lisa Redfern', 'Public domain'], ['sWind', 'felix.blume', 'CC0']];
    var sound = { ctx: null, src: null, gain: null, kind: '', buf: null, bufKind: '', el: null, token: 0 };
    function soundMenu() {
        var items = [];
        for (var i = 0; i < SOUNDS.length; i++) {
            items.push({ label: T(SOUNDS[i][1]), sel: sound.kind === SOUNDS[i][0], act: (function (k) { return function () { playSound(k); }; }(SOUNDS[i][0])) });
        }
        items.push({ label: T('stopSound'), sel: !sound.kind, act: function () { stopSound(); } });
        items.push({ label: T('credits'), act: creditsMenu });
        openMenu(T('soundTitle'), items, '', Math.max(0, indexOfSound(sound.kind)));
    }
    function creditsMenu() {
        var items = [];
        for (var i = 0; i < CREDITS.length; i++) { items.push({ label: T(CREDITS[i][0]) + ' — ' + CREDITS[i][1] + ' · ' + CREDITS[i][2], act: soundMenu }); }
        openMenu(T('creditsTitle'), items);
    }
    function indexOfSound(k) { for (var i = 0; i < SOUNDS.length; i++) { if (SOUNDS[i][0] === k) { return i; } } return -1; }
    function brownNoise(ctx) {
        var sr = ctx.sampleRate, len = sr * 8, X = Math.round(sr * 0.05), buf = ctx.createBuffer(2, len, sr);
        for (var c = 0; c < 2; c++) {
            var d = buf.getChannelData(c), tmp = new Float32Array(len + X), b = 0, i;
            for (i = 0; i < len + X; i++) { b = (b + 0.02 * (Math.random() * 2 - 1)) / 1.02; tmp[i] = b * 2.6; }
            for (i = 0; i < len; i++) { d[i] = tmp[i]; }
            for (i = 0; i < X; i++) { var a = i / X; d[i] = tmp[i] * a + tmp[len + i] * (1 - a); }   // seamless loop
        }
        return buf;
    }
    function loopEdges(buf) {    // skip the MP3 encoder's silent padding so the loop has no gap
        var d = buf.getChannelData(0), n = d.length, s = 0, e = n - 1, lim = Math.min(n, 8192);
        while (s < lim && Math.abs(d[s]) < 1e-4) { s++; }
        while (e > n - lim && Math.abs(d[e]) < 1e-4) { e--; }
        return [s / buf.sampleRate, (e + 1) / buf.sampleRate];
    }
    function startBuffer(kind, buf) {
        var ctx = sound.ctx, src = ctx.createBufferSource(), g = ctx.createGain(), ed = kind === 'brown' ? null : loopEdges(buf);
        src.buffer = buf; src.loop = true;
        if (ed) { src.loopStart = ed[0]; src.loopEnd = ed[1]; }
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 2);
        src.connect(g); g.connect(ctx.destination);
        if (src.start) { src.start(0, ed ? ed[0] : 0); } else { src.noteOn(0); }
        sound.src = src; sound.gain = g;
    }
    function playFallback(kind) {    // if Web Audio can't decode MP3 here, use a plain looping <audio> element
        var el = new Audio('sounds/' + kind + '.mp3');
        el.loop = true; el.volume = 0.9;
        try { el.play(); } catch (e) { }
        sound.el = el;
    }
    function playSound(kind) {
        var AC = window.AudioContext || window.webkitAudioContext;
        stopSound(true);
        sound.kind = kind;
        var token = ++sound.token;
        toast(T('soundOn', T(SOUNDS[indexOfSound(kind)][1])));
        updateFocus();
        if (!AC) { if (kind === 'brown') { sound.kind = ''; updateFocus(); return toast(T('noAudio')); } return playFallback(kind); }
        try {
            if (!sound.ctx) { sound.ctx = new AC(); }
            if (sound.ctx.resume) { sound.ctx.resume(); }
            if (kind === 'brown') { return startBuffer(kind, brownNoise(sound.ctx)); }
            if (sound.bufKind === kind && sound.buf) { return startBuffer(kind, sound.buf); }
            var x = new XMLHttpRequest();
            x.open('GET', 'sounds/' + kind + '.mp3', true);
            x.responseType = 'arraybuffer';
            x.onload = function () {
                if (token !== sound.token) { return; }
                sound.ctx.decodeAudioData(x.response, function (buf) {
                    if (token !== sound.token) { return; }
                    sound.buf = buf; sound.bufKind = kind;          // keep only the last one (memory on a 2016 TV)
                    startBuffer(kind, buf);
                }, function () { if (token === sound.token) { playFallback(kind); } });
            };
            x.onerror = function () { if (token === sound.token) { playFallback(kind); } };
            x.send();
        } catch (e) { playFallback(kind); }
    }
    function stopSound(quiet) {
        sound.token++;
        if (sound.src) {
            var s = sound.src, g = sound.gain, ctx = sound.ctx;
            try { g.gain.setValueAtTime(g.gain.value, ctx.currentTime); g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1); } catch (e) { }
            setTimeout(function () { try { if (s.stop) { s.stop(0); } else { s.noteOff(0); } } catch (e) { } }, 1100);
        }
        if (sound.el) { try { sound.el.pause(); } catch (e) { } sound.el = null; }
        if (sound.kind && !quiet) { toast(T('soundOff')); }
        sound.src = null; sound.kind = '';
        updateFocus();
    }

    // ================================================================== screensaver
    var saverOn = false, saverTimer, lastInput = Date.now();
    var SAVER_SPOTS = [[120, 620], [1080, 640], [140, 120], [1060, 140], [600, 400]];
    function openSaver() {
        if (saverOn) { return; }
        saverOn = true;
        $('saverImg').style.backgroundImage = 'url(' + wallFile('') + ')';
        tick();
        var n = 0;
        function place() { var p = SAVER_SPOTS[n++ % SAVER_SPOTS.length]; setT($('saverBox'), p[0], p[1]); }
        place();
        clearInterval(saverTimer);
        saverTimer = setInterval(place, 60000);
        addBody('saver-on');
    }
    function closeSaver() { if (!saverOn) { return; } saverOn = false; clearInterval(saverTimer); remBody('saver-on'); }
    function checkIdle() {
        var mins = [0, 5, 10, 15, 30][cfg.saver];
        if (!mins || saverOn || dark || watching || document.hidden || menu.open) { return; }
        if (Date.now() - lastInput > mins * 60000) { openSaver(); }
    }

    // ================================================================== backup & restore
    function backupData() { return JSON.stringify({ app: 'Lumen', version: VERSION, at: new Date().toISOString(), state: st }); }
    function fsRoots(cb) {
        var roots = ['documents'];
        try {
            tizen.filesystem.listStorages(function (list) {
                for (var i = 0; i < list.length; i++) { if (list[i].type === 'EXTERNAL' && list[i].state === 'MOUNTED') { roots.push(list[i].label); } }
                cb(roots);
            }, function () { cb(roots); });
        } catch (e) { cb(roots); }
    }
    function backup() {
        if (!onTV) { try { localStorage.setItem('lumen.backup', backupData()); toast(T('backupOk', 'preview')); } catch (e) { toast(T('backupFail', e.message)); } return; }
        fsRoots(function (roots) {
            var i = 0;
            function next(err) {
                if (i >= roots.length) { return toast(T('backupFail', err || 'no storage')); }
                var root = roots[i++];
                try {
                    tizen.filesystem.resolve(root, function (dir) {
                        try {
                            var f;
                            try { f = dir.resolve('lumen-backup.json'); } catch (e1) { f = dir.createFile('lumen-backup.json'); }
                            f.openStream('w', function (fs) { fs.write(backupData()); fs.close(); toast(T('backupOk', root)); },
                                function (e) { next(e.message); }, 'UTF-8');
                        } catch (e2) { next(e2.message); }
                    }, function (e) { next(e.message); }, 'rw');
                } catch (e3) { next(e3.message); }
            }
            next();
        });
    }
    function applyBackup(text) {
        var p = JSON.parse(text);
        if (!p || p.app !== 'Lumen' || !p.state) { throw new Error('not a Lumen backup'); }
        st.cfg = copy(DEFAULTS); loadState(p.state); cfg = st.cfg;
        save(); buildGroups(); filterSources(); applySettings(); applyLang(); renderSettings(); renderAll();
        toast(T('restoreOk'));
    }
    function restore() {
        if (!onTV) { var t = null; try { t = localStorage.getItem('lumen.backup'); } catch (e) { } if (!t) { return toast(T('restoreNone')); } return applyBackup(t); }
        fsRoots(function (roots) {
            var i = 0;
            function next() {
                if (i >= roots.length) { return toast(T('restoreNone')); }
                var root = roots[i++];
                try {
                    tizen.filesystem.resolve(root, function (dir) {
                        try {
                            dir.resolve('lumen-backup.json').readAsText(function (text) {
                                try { applyBackup(text); } catch (e) { toast(T('backupFail', e.message)); }
                            }, next, 'UTF-8');
                        } catch (e) { next(); }
                    }, next, 'r');
                } catch (e) { next(); }
            }
            next();
        });
    }

    // ================================================================== settings
    function optLabel(o) { return typeof o === 'number' ? T('min', o) : (STR.en[o] !== undefined ? T(o) : o); }
    function valueHtml(s) {
        var v = cfg[s.key];
        if (s.type === 'range') { return '<span class="arr">◀</span>' + v + '%<span class="bar"><i style="width:' + v + '%"></i></span><span class="arr">▶</span>'; }
        if (s.type === 'choice') {
            var lab = optLabel(s.opts[v]);
            if (s.key === 'night' && v >= 2) { lab = T('oFrom', s.opts[v]); }
            if (s.key === 'fx' && v === 0) { lab += ' · ' + T(st.autoFx === 'fast' ? 'oFast' : 'oBalanced'); }
            if (s.key === 'light' && v === 0) { lab += ' · ' + T('o' + phaseNow(nowDate()).charAt(0).toUpperCase() + phaseNow(nowDate()).slice(1)); }
            return '<span class="arr">◀</span>' + lab + '<span class="arr">▶</span>';
        }
        return 'OK';
    }
    function renderSettings() {
        var list = $('setList');
        list.innerHTML = '';
        $('setSub').textContent = 'v' + VERSION + ' · ' + diag.apps + ' ' + T('apps') + ' · ' + T('weather') + ' ' + diag.weather + ' · ' + latencyText();
        for (var i = 0; i < SETTINGS.length; i++) {
            var s = SETTINGS[i], el = document.createElement('div');
            el.className = 'set' + (s.key === 'light' && cfg.wall !== 0 ? ' muted' : '');
            if (s.type === 'wall') {
                el.className += ' wallrow';
                var th = '';
                for (var w = 0; w < WALLS.length; w++) {
                    var thumb = WALLS[w][0] === 'scenic' ? 'scenic-' + phaseNow(nowDate()) : WALLS[w][0];
                    th += '<span class="' + (w === cfg.wall ? 'sel' : '') + '" style="background-image:url(wall/' + thumb + '-thumb.jpg)"></span>';
                }
                el.innerHTML = '<div class="lbl" style="line-height:40px;top:14px"></div>' +
                    '<div class="lbl" style="line-height:30px;top:56px;font-size:21px;opacity:.65"></div>' +
                    '<div class="thumbs" style="top:14px">' + th + '</div>';
                el.children[0].textContent = T(s.label);
                el.children[1].textContent = T(WALLS[cfg.wall][1]);
            } else {
                el.innerHTML = '<div class="lbl"></div><div class="val">' + valueHtml(s) + '</div>';
                el.children[0].textContent = T(s.label);
            }
            list.appendChild(el);
        }
    }
    function openSettings(on) {
        settingsOpen = on;
        if (on) { addBody('settings-open'); setIdx = 0; renderSettings(); } else { remBody('settings-open'); }
        updateFocus();
    }
    function changeSetting(dir) {
        var s = SETTINGS[setIdx];
        if (s.type === 'wall') { cfg.wall = (cfg.wall + dir + WALLS.length) % WALLS.length; }
        else if (s.type === 'range') { cfg[s.key] = Math.max(s.min, Math.min(s.max, cfg[s.key] + dir * s.step)); }
        else if (s.type === 'choice') { cfg[s.key] = (cfg[s.key] + dir + s.opts.length) % s.opts.length; }
        else { return; }
        if (s.key === 'showAll') { buildGroups(); }
        if (s.key === 'lang') { applyLang(); renderAll(); }
        applySettings(); save(); renderSettings(); updateFocus();
    }
    function settingsOk() {
        var s = SETTINGS[setIdx];
        if (s.type !== 'action') { return changeSetting(1); }
        if (s.key === 'saverNow') { openSettings(false); return openSaver(); }
        if (s.key === 'inputs') { st.srcHidden = {}; save(); filterSources(); renderAll(); return toast(T('inputsBack')); }
        if (s.key === 'backup') { return backup(); }
        if (s.key === 'restore') { return restore(); }
        st.cfg = cfg = copy(DEFAULTS); st.favs = null; st.recent = []; st.recentAt = {}; st.hidden = {}; st.srcNames = {}; st.srcHidden = {}; st.autoFx = 'balanced';
        save(); filterSources();
        loadApps(function () { applySettings(); applyLang(); renderSettings(); renderAll(); toast(T('resetDone')); });
    }
    var curPhase = '';
    function wallFile(suffix) {
        var w = WALLS[cfg.wall][0];
        return 'wall/' + (w === 'scenic' ? 'scenic-' + phaseNow(nowDate()) : w) + suffix + '.jpg';
    }
    var bgFront = 'bg', bgUrl = '';
    function setBackground(url, fade) {
        if (url === bgUrl) { return; }
        bgUrl = url;
        if (!fade) { $(bgFront).style.backgroundImage = 'url(' + url + ')'; return; }
        var back = bgFront === 'bg' ? 'bg2' : 'bg';
        $(back).style.backgroundImage = 'url(' + url + ')';
        $(back).className = 'layer front'; $(bgFront).className = 'layer';
        bgFront = back;
    }
    function applySettings(fade) {
        curPhase = phaseNow(nowDate());
        setBackground(wallFile(['', '-soft', '-frost'][cfg.blur]), fade);
        var frost = 'url(' + wallFile('-frost') + ')';
        var fr = document.querySelectorAll('.g-frost');
        for (var i = 0; i < fr.length; i++) { fr[i].style.backgroundImage = frost; }
        $('launchFrost').style.backgroundImage = frost;
        if (saverOn) { $('saverImg').style.backgroundImage = 'url(' + wallFile('') + ')'; }
        var t = cfg.transp / 100;
        var css = '.glass .g-frost{opacity:' + (1 - t * 0.78).toFixed(2) + '}' +
                  '.glass .g-tint{opacity:' + (0.30 + (1 - t) * 0.70).toFixed(2) + '}' +
                  '.glass .g-sheen{opacity:' + [0, 0.55, 1][cfg.refl] + '}' +
                  '.card .icon .gloss{opacity:' + [0, 0.55, 0.95][cfg.refl] + '}' +
                  '.glass .g-edge{opacity:' + cfg.edge + '}' +
                  '.glass.solid .g-frost{opacity:1}.glass.solid .g-tint{opacity:' + (0.55 + (1 - t) * 0.45).toFixed(2) + '}';
        $('dyn').textContent = css;
        var fx = cfg.fx === 0 ? st.autoFx : ['', 'fast', 'balanced', 'rich'][cfg.fx];
        document.body.className = document.body.className.replace(/\s*(anim-\w+|lite|fx-\w+|phase-\w+)/g, '') +
            ' anim-' + ['full', 'reduced', 'off'][cfg.anim] + ' fx-' + fx + ' phase-' + curPhase;
        syncGlass();
        tick();
    }
    function syncGlass() {
        var stage = $('stage'), panels = document.querySelectorAll('.glass');
        for (var i = 0; i < panels.length; i++) {
            var x = 0, y = 0, el = panels[i];
            while (el && el !== stage) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
            panels[i].children[0].style.backgroundPosition = (-x) + 'px ' + (-y) + 'px';
        }
    }

    // ================================================================== toast + clock
    var toastTimer;
    function toast(msg) {
        $('toastText').textContent = msg;
        $('toast').className = 'glass solid on';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { $('toast').className = 'glass solid'; }, 3200);
    }
    function clockText(d) {
        var h = d.getHours(), m = d.getMinutes(), hh = cfg.clock ? ((h + 11) % 12 + 1) : h;
        return (hh < 10 && !cfg.clock ? '0' : '') + hh + ':' + (m < 10 ? '0' : '') + m +
            (cfg.clock ? '<span class="ampm">' + (h < 12 ? 'AM' : 'PM') + '</span>' : '');
    }
    function dateText(d) {
        return L() === 'az' ? d.getDate() + ' ' + MONTHS.az[d.getMonth()] + ', ' + DAYS.az[d.getDay()]
                            : DAYS.en[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS.en[d.getMonth()];
    }
    var lastDay = -1;
    function tick() {
        var d = nowDate(), h = d.getHours();
        if (d.getDate() !== lastDay) { lastDay = d.getDate(); if (!sun.fromWeather) { var s = calcSun(d); sun.rise = s.rise; sun.set = s.set; } }
        var ct = clockText(d);
        $('time').innerHTML = ct;
        $('date').textContent = dateText(d);
        $('greet').textContent = T(h < 5 ? 'gNight' : h < 12 ? 'gMorning' : h < 18 ? 'gAfternoon' : 'gEvening');
        $('sTime').innerHTML = ct;
        $('sDate').textContent = dateText(d);
        if (phaseNow(d) !== curPhase && curPhase) { applySettings(true); return; }
        var n = nightNow(d);
        if (n !== (document.body.className.indexOf('night-mode') >= 0)) { if (n) { addBody('night-mode'); } else { remBody('night-mode'); } }
        refreshAgo();
        checkSleep();
        checkIdle();
        if (sleepEnd) { $('sleepLeft').textContent = Math.max(1, Math.ceil((sleepEnd - Date.now()) / 60000)); }
    }

    // ================================================================== input
    function handle(k) {
        lastInput = Date.now();
        if (dark) { screenOff(false); return; }
        if (saverOn) { closeSaver(); return; }
        if (watching) { if (k === 'back') { stopWatching(); } return; }
        if (menu.open) { return menuKey(k); }
        if (settingsOpen) {
            if (k === 'up' && setIdx > 0) { setIdx--; updateFocus(); }
            else if (k === 'down' && setIdx < SETTINGS.length - 1) { setIdx++; updateFocus(); }
            else if (k === 'left') { changeSetting(-1); }
            else if (k === 'right') { changeSetting(1); }
            else if (k === 'ok') { settingsOk(); }
            else if (k === 'back' || k === 'blue') { openSettings(false); }
            return;
        }
        switch (k) {
            case 'left': move(-1, 0); break;
            case 'right': move(1, 0); break;
            case 'up': move(0, -1); break;
            case 'down': move(0, 1); break;
            case 'ok': ok(); break;
            case 'options': case 'green': if (!arranging) { optionsMenu(); } break;
            case 'yellow': toggleFav(); break;
            case 'red': if (drawer.open) { toggleHidden(); } else { setArrange(!arranging); } break;
            case 'blue': openSettings(true); break;
            case 'back':
                if ($('launch').className.indexOf('on') >= 0) { $('launch').className = 'layer'; }
                else if (drawer.open) { openDrawer(false); }
                else if (lifted >= 0) { lifted = -1; renderDock(); updateFocus(); }
                else if (arranging) { setArrange(false); }
                break;
        }
    }
    var KEYMAP = { 37: 'left', 38: 'up', 39: 'right', 40: 'down', 13: 'ok', 27: 'back', 8: 'back', 10009: 'back',
                   403: 'red', 404: 'green', 405: 'yellow', 406: 'blue', 82: 'red', 71: 'green', 89: 'yellow', 66: 'blue' };
    var raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame || function (f) { return setTimeout(f, 16); };
    var lat = [];
    function measure(t0) {
        raf(function () { raf(function () {
            lat.push(Date.now() - t0);
            if (lat.length > 30) { lat.shift(); }
            autoTune();
        }); });
    }
    function median() { var s = lat.slice(0).sort(function (a, b) { return a - b; }); return s[Math.floor(s.length / 2)]; }
    function autoTune() {        // Auto effects: drop to Fast if this TV is slow (remembered)
        if (cfg.fx !== 0 || st.autoFx === 'fast' || lat.length < 20) { return; }
        if (median() > 90) { st.autoFx = 'fast'; save(); applySettings(); toast(T('fxAuto')); }
    }
    function latencyText() { return lat.length ? T('speed', median()) : T('speedFirst'); }
    // OK: short press = open, hold = options. If the TV never sends keyup, OK falls back to acting on keydown.
    var okDown = 0, okTimer = null, okHeld = false, keyupWorks = null;
    function okPress() {
        if (keyupWorks === false) { return run('ok'); }
        if (okDown) { return; }                         // auto-repeat while held
        okDown = Date.now(); okHeld = false;
        okTimer = setTimeout(function () {
            if (keyupWorks) { okHeld = true; run('options'); }
            else { keyupWorks = false; okDown = 0; run('ok'); }
        }, 650);
    }
    function okRelease() {
        if (!okDown) { return; }
        keyupWorks = true;
        clearTimeout(okTimer);
        var held = okHeld; okDown = 0;
        if (!held) { run('ok'); }
    }
    function run(k) { var t0 = Date.now(); handle(k); measure(t0); }
    document.addEventListener('keydown', function (e) {
        var k = KEYMAP[e.keyCode];
        if (!k) { return; }
        e.preventDefault();
        if (k === 'ok' && !dark && !saverOn) { return okPress(); }
        run(k);
    });
    document.addEventListener('keyup', function (e) { if (e.keyCode === 13) { e.preventDefault(); okRelease(); } });

    // ================================================================== lifecycle
    var refreshTimer;
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) { if (sound.kind) { stopSound(true); } closeSaver(); return; }
        lastInput = Date.now();
        $('launch').className = 'layer';
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(function () { loadApps(function () { loadSources(renderAll); }); }, 300);
    });

    function fit() {
        var availH = window.innerHeight - 64;
        var s = Math.min(window.innerWidth / 1920, availH / 1080), stg = $('stage'), v = 'scale(' + s + ')';
        stg.style.webkitTransform = v; stg.style.transform = v;
        stg.style.left = Math.round((window.innerWidth - 1920 * s) / 2) + 'px';
        stg.style.top = Math.max(0, Math.round((availH - 1080 * s) / 2)) + 'px';
    }

    function start() {
        var dyn = document.createElement('style');
        dyn.id = 'dyn';
        document.getElementsByTagName('head')[0].appendChild(dyn);
        if (onTV) {
            try { selfId = tizen.application.getCurrentApplication().appInfo.id; } catch (e) { }
            var keys = ['ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue'];
            for (var q = 0; q < keys.length; q++) { try { tizen.tvinputdevice.registerKey(keys[q]); } catch (e) { } }
        } else {
            addBody('preview');
            if (Q.demo || !st.recent.length) { seedDemo(); }
            if (Q.city) { CITY.name = CITY.nameAz = Q.city; }   // browser preview only: sample favourites and history
            var btns = $('remote').getElementsByTagName('button');
            for (var i = 0; i < btns.length; i++) {
                btns[i].onclick = (function (k) { return function () { run(k); }; })(btns[i].getAttribute('data-k'));
            }
            window.addEventListener('resize', fit);
            fit();
        }
        var s0 = calcSun(new Date()); sun.rise = s0.rise; sun.set = s0.set;
        applyLang();
        applySettings();
        loadApps(function () { loadSources(function () { renderAll(); applySettings(); }); });
        loadWeather();
        setInterval(tick, 20000);
        setInterval(loadWeather, WEATHER.everyMs);
        window.lumen = { handle: run, openSaver: openSaver, optionsMenu: optionsMenu, soundState: function () { return { kind: sound.kind, webAudio: !!sound.src, fallback: !!sound.el, loop: sound.src ? [sound.src.loopStart, sound.src.loopEnd] : null }; } };   // preview / testing hook
    }

    // ================================================================== preview sample data (browser only)
    var SAMPLE_APPS, SAMPLE_VIDEOSOURCE;
    function sampleApp(id, name, show) { return { id: id, name: name, iconPath: '', show: show !== false }; }
    SAMPLE_APPS = [
        sampleApp('org.tizen.netflix-app', 'Netflix'), sampleApp('111299001912', 'YouTube'), sampleApp('evKhCgZelL.AmazonIgnitionLauncher2', 'Amazon Video'),
        sampleApp('a.iPlayer', 'BBC iPlayer'), sampleApp('a.BBCNews', 'BBC News'), sampleApp('a.BBCSport', 'BBC Sport'), sampleApp('a.ITVX', 'ITVX'),
        sampleApp('a.Ch4', 'Channel 4'), sampleApp('EkzyZtmneG.My5', 'My5'), sampleApp('a.STV', 'STV Player'), sampleApp('a.U', 'U'),
        sampleApp('a.BritBox', 'BritBox'), sampleApp('a.NOW', 'NOW'), sampleApp('a.Disney', 'Disney Life'), sampleApp('a.Rakuten', 'Rakuten TV'),
        sampleApp('a.MUBI', 'MUBI'), sampleApp('a.CHILI', 'CHILI'), sampleApp('a.Curzon', 'Curzon'), sampleApp('a.Tubi', 'Tubi'),
        sampleApp('a.hayu', 'hayu'), sampleApp('a.FBW', 'Facebook Watch'), sampleApp('a.BT', 'BT Sport'), sampleApp('a.Euro', 'Eurosport Player'),
        sampleApp('a.RB', 'Red Bull TV'), sampleApp('a.Goal', 'GOAL+'), sampleApp('a.Spotify', 'Spotify'), sampleApp('a.Deezer', 'Deezer'),
        sampleApp('a.TuneIn', 'TuneIn Radio'), sampleApp('a.Vidzone', 'VIDZONE'), sampleApp('a.Pluto', 'Pluto TV'), sampleApp('a.Ketchup', 'Ketchup Kids'),
        sampleApp('a.Toon', 'Toon Goggles'), sampleApp('a.Bubble', 'Space Bubble Defender'), sampleApp('a.Weather', 'The Weather Network'),
        sampleApp('org.tizen.acr', 'acr'), sampleApp('org.tizen.AgingApp', 'AgingApp'), sampleApp('org.tizen.applist', 'applist'),
        sampleApp('org.tizen.rm-network-status', 'Network status widget')
    ];
    SAMPLE_VIDEOSOURCE = { connected: [{ type: 'TV', number: 1 }, { type: 'HDMI', number: 4 }],
                           disconnected: [{ type: 'HDMI', number: 1 }, { type: 'HDMI', number: 2 }, { type: 'HDMI', number: 3 }] };
    function seedDemo() {
        var now = Date.now();
        st.favs = ['org.tizen.netflix-app', '111299001912'];
        st.recent = ['111299001912', 'org.tizen.netflix-app', 'a.Spotify', 'evKhCgZelL.AmazonIgnitionLauncher2', 'a.Pluto'];
        st.recentAt = { '111299001912': now - 25 * 60000, 'org.tizen.netflix-app': now - 3 * 3600000, 'a.Spotify': now - 26 * 3600000,
                        'evKhCgZelL.AmazonIgnitionLauncher2': now - 3 * 86400000, 'a.Pluto': now - 5 * 86400000 };
        st.srcNames = { HDMI4: 0 };
    }

    start();
}());

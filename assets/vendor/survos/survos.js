'use strict';

/*
|------------------------------------------------------------------------------
| Define Namespace
|------------------------------------------------------------------------------
*/

window.Survos = window.Survos || {};

/*
|------------------------------------------------------------------------------
| Device Detection
|------------------------------------------------------------------------------
*/

Survos.device = {};
Survos.device.tauri = typeof window.__TAURI__ !== 'undefined';
Survos.device.native = Framework7.device.capacitor || Framework7.device.cordova || Framework7.device.electron || Survos.device.tauri;
Survos.device.pwa = Framework7.device.standalone || document.referrer.includes('android-app://');
Survos.device.browser = !Survos.device.native && !Survos.device.pwa;
Survos.device.web = Survos.device.browser || Survos.device.pwa;

/*
|------------------------------------------------------------------------------
| Package
|------------------------------------------------------------------------------
*/

Survos.package = {
    getId: function() {
        let id = window.config.app.id;
        return id;
    },
    setId: function() {
        app.id = window.config.app.id;
    },
    getVersion: function() {
        let version = window.config.app.version;
        return version;
    },
    setVersion: function() {
        app.version = window.config.app.version;
    },
    getName: function() {
        let name = window.config.app.name;
        return name;
    },
    setName: function() {
        app.name = window.config.app.name;
    },
    getDescription: function() {
        let description = window.config.app.description;
        return description;
    },
    setDescription: function() {
        app.description = window.config.app.description;
    }
}

/*
|------------------------------------------------------------------------------
| Storage
|------------------------------------------------------------------------------
*/

Survos.storage = {
    getKeyPrefix: function() {
        let keyPrefix = app?.config?.storage?.keyPrefix || 'Survos_';
        return keyPrefix;
    },
    getLocalDbName: function() {
        let localDbName = Survos.storage.getKeyPrefix() + (app?.config?.storage?.localDbName || 'Pokedex');
        return localDbName;
    },
    localDb: {
        init: async function() {
            let dbName = Survos.storage.getLocalDbName();
            let dbTables = {
                pokemon: 'id,name,image'
            }
            app.db = new Dexie(dbName);
            app.db.version(1).stores(dbTables);
            await app.db.open();
        },
        savePokemon: function(data) {
            app.db.pokemon.add(data)
                .then(function() {
                    app.toast.show({
                        text: 'Saved',
                        icon: '<iconify-icon icon="material-symbols:favorite" class="icon"></iconify-icon>',
                        position: 'center',
                        horizontalPosition: 'center',
                        cssClass: 'color-green'
                    });
                })
                .catch(function(error) {
                    app.toast.show({
                        text: 'An error occured while performing action.',
                        horizontalPosition: 'center',
                        position: 'top',
                        cssClass: 'color-red'
                    });
                });
        },
        unsavePokemon: function(id) {
            app.db.pokemon.delete(id)
                .then(function() {
                    app.toast.show({
                        text: 'Unsaved',
                        icon: '<iconify-icon icon="material-symbols:favorite" class="icon"></iconify-icon>',
                        position: 'center',
                        horizontalPosition: 'center',
                        cssClass: 'color-red'
                    });
                })
                .catch(function(error) {
                    app.toast.show({
                        text: 'An error occured while performing action.',
                        horizontalPosition: 'center',
                        position: 'top',
                        cssClass: 'color-red'
                    });
                });
        }
    }
}

/*
|------------------------------------------------------------------------------
| Theming
|------------------------------------------------------------------------------
*/

Survos.theming = {
    init: function() {
        Survos.theming.setMode(Survos.theming.getMode());
        Survos.theming.setTone(Survos.theming.getTone());
    },
    getTheme: function() {
        let currentTheme = app.theme;
        return currentTheme;
    },
    setTheme: function(theme) {
        if (window.app?.initialized) {
            return;
        }
        let allowedThemes = ['auto', 'aurora', 'ios', 'md'];
        let urlTheme = new URLSearchParams(location.search).get('theme');
        let configTheme = window?.config?.theming?.theme;
        let newTheme = allowedThemes.includes(urlTheme) ? urlTheme : allowedThemes.includes(theme) ? theme : allowedThemes.includes(configTheme) ? configTheme : 'auto';
        if (newTheme === 'auto') {
            newTheme = Framework7.device.desktop ? 'aurora' : 'auto';
        }
        return newTheme;
    },
    getColor: function() {

    },
    setColor: function(color) {

    },
    getMode: function() {
        let savedMode = localStorage.getItem(app.storage.getKeyPrefix() + 'Theme_Mode');
        let configMode = app?.config?.theming?.mode;
        let currentMode = savedMode || configMode || 'system';
        return currentMode;
    },
    setMode: function(mode) {
        let allowedModes = ['system', 'light', 'dark'];
        if (allowedModes.includes(mode)) {
            switch (mode) {
                case 'dark':
                    app.$('html').addClass('dark');
                    app.disableAutoDarkMode();
                    app.params.autoDarkMode = false;
                break;
                case 'light':
                    app.$('html').removeClass('dark');
                    app.disableAutoDarkMode();
                    app.params.autoDarkMode = false;
                break;
                case 'system':
                    app.enableAutoDarkMode();
                    app.params.autoDarkMode = true;
                break;
                default:
                    app.enableAutoDarkMode();
                    app.params.autoDarkMode = true;
            }
            app.store.dispatch('setThemeMode', mode);
            localStorage.setItem(app.storage.getKeyPrefix() + 'Theme_Mode', mode);
        }
    },
    getTone: function() {
        let savedTone = localStorage.getItem(app.storage.getKeyPrefix() + 'Theme_Tone');
        let configTone = app?.config?.theming?.tone;
        let currentTone = savedTone || configTone;
        return currentTone;
    },
    setTone: function(tone) {
        let allowedTones = ['warm', 'cool'];
        if (allowedTones.includes(tone)) {
            app.$('html').removeClass('warm-tone cool-tone');
            switch (tone) {
                case 'warm':
                    app.$('html').addClass('warm-tone');
                break;
                case 'cool':
                    app.$('html').addClass('cool-tone');
                break;
            }
            app.store.dispatch('setThemeTone', tone);
            localStorage.setItem(app.storage.getKeyPrefix() + 'Theme_Tone', tone);
        }
    }
}

/*
|------------------------------------------------------------------------------
| Check If Element Is In Viewport
|------------------------------------------------------------------------------
*/

Survos.elementInViewport = function(element) {
    let bounding = element.getBoundingClientRect();
    return (
        Math.trunc(bounding.top) >= -32 &&
        Math.trunc(bounding.left) >= 32 &&
        Math.trunc(bounding.bottom) <= (window.innerHeight + 32 || document.documentElement.clientHeight + 32) &&
        Math.trunc(bounding.right) <= (window.innerWidth + 32 || document.documentElement.clientWidth + 32)
    );
}
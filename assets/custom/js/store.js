'use strict';

/*
|------------------------------------------------------------------------------
| Initialize Store
|------------------------------------------------------------------------------
*/

window.store = Framework7.createStore({
    state: {
        themeColor: null,
        themeMode: null,
        themeTone: null
    },
    actions: {
        setThemeColor: function({state, dispatch}, color) {
            state.themeColor = color;
        },
        setThemeMode: function({state, dispatch}, mode) {
            state.themeMode = mode;
        },
        setThemeTone: function({state, dispatch}, tone) {
            state.themeTone = tone;
        }
    },
    getters: {
        themeColor: function({state}) {
            return state.themeColor;
        },
        themeMode: function({state}) {
            return state.themeMode;
        },
        themeTone: function({state}) {
            return state.themeTone;
        }
    }
});
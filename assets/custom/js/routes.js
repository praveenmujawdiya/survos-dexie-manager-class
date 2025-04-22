'use strict';

/*
|------------------------------------------------------------------------------
| Define Namespace
|------------------------------------------------------------------------------
*/

window.routes = window.routes || [];

/*
|------------------------------------------------------------------------------
| Define Routes
|------------------------------------------------------------------------------
*/

window.routes.push({
    path: '/',
    alias: ['/pokemon'],
    componentUrl: './partials/tabbar.html',
    tabs: [
        {
            id: 'tab-main',
            path: '/',
            componentUrl: './partials/all-pokemon.html',
        },
        {
            id: 'tab-saved',
            path: '/saved',
            componentUrl: './partials/saved-pokemon.html'
        },
        {
            id: 'tab-settings',
            path: '/settings',
            componentUrl: './partials/settings.html'
        }
    ]
});

window.routes.push({
    path: '/pokemon',
    componentUrl: './partials/all-pokemon.html',
    routes: [
        {
            path: '/:pokemon_id',
            componentUrl: './partials/single-pokemon.html'
        }
    ]
});

window.routes.push({
    path: '(.*)',
    componentUrl: './partials/404.html'
});
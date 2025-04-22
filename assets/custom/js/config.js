'use strict';

/*
|------------------------------------------------------------------------------
| Define Namespace
|------------------------------------------------------------------------------
*/

window.config = window.config || {};

/*
|------------------------------------------------------------------------------
| App
|------------------------------------------------------------------------------
*/

window.config.app = {
    id: 'com.survos.pokedex',
    version: '1.0.0',
    name: 'Pokédex',
    description: 'The Pokémon Encyclopedia',
    logos: {
        logomarkLight: 'assets/custom/img/logos/logomark-light.svg',
        logomarkDark: 'assets/custom/img/logos/logomark-dark.svg',
        logotypeLight: 'assets/custom/img/logos/logotype-light.svg',
        logotypeDark: 'assets/custom/img/logos/logotype-dark.svg',
        logomarkCircleLight: 'assets/custom/img/logos/logomark-circle-light.svg',
        logomarkCircleDark: 'assets/custom/img/logos/logomark-circle-dark.svg',
        logomarkSquareLight: 'assets/custom/img/logos/logomark-square-light.svg',
        logomarkSquareDark: 'assets/custom/img/logos/logomark-square-dark.svg'
    }
}

/*
|------------------------------------------------------------------------------
| Storage
|------------------------------------------------------------------------------
*/

window.config.storage = {
    keyPrefix: 'Survos_',
}

/*
|------------------------------------------------------------------------------
| Theming
|------------------------------------------------------------------------------
*/

window.config.theming = {
    theme: 'auto',
    color: '#2563EB',
    mode: 'system',
    tone: 'warm'
}

/*
|------------------------------------------------------------------------------
| Pokedex API
|------------------------------------------------------------------------------
*/

window.config.pokedexApi = {
    rest: {
        rootUrl: 'https://pokemon.survos.com/api'
    }
}

/*
|------------------------------------------------------------------------------
| Database
|------------------------------------------------------------------------------
*/

window.config.database = {
    name: 'Survos_Pokedex',
    version: 1,
    tables: [
        {
            name: 'pokemon',
            schema: 'id, meta.name',
            url: {
                root: 'https://pokemon.survos.com',
                endpoint: '/api/pokemon'
            }
        },
        {
            name: 'pokedex',
            schema: 'id, meta.name',
            url: {
                root: 'https://pokemon.survos.com',
                endpoint: '/api/pokemon'
            }
        }
    ]
}
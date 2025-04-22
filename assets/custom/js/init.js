/*
|------------------------------------------------------------------------------
| Initialize Framework7
|------------------------------------------------------------------------------
*/

window.app = new Framework7({
    el: '#app',
    componentUrl: './partials/app.html',
    theme: Survos.theming.setTheme(window.config.theming.theme),
    routes: window.routes,
    store: window.store,
    init: false,
    navbar: {
        mdCenterTitle: true
    },
    toast: {
        closeTimeout: 2500
    }
});

/*
|------------------------------------------------------------------------------
| Extend App Object
|------------------------------------------------------------------------------
*/

app.on('init', function() {
    app.utils.extend(app, {config: window.config});
    app.utils.extend(app, window.Survos);
});

/*
|------------------------------------------------------------------------------
| Set Package Info
|------------------------------------------------------------------------------
*/

app.on('init', function() {
    app.package.setId();
    app.package.setVersion();
    app.package.setName();
    app.package.setDescription();
});

/*
|------------------------------------------------------------------------------
| Register Service Worker
|------------------------------------------------------------------------------
*/

app.on('init', function() {
    app.serviceWorker.register('./service-worker.js', './');
});

/*
|------------------------------------------------------------------------------
| Initialize Dexie Manager
|------------------------------------------------------------------------------
*/

app.on('init', async function() {
    try {
        let progressDialog;
        let module = await import('dexie-manager');
        window.DexieManager = module.default;
        let dbLocale = localStorage.getItem('dbLocale') || 'en';
        let userLocale = localStorage.getItem('userLocale') || 'en';
        app.dbManager = new DexieManager(app.config.database, dbLocale, userLocale);
        progressDialog = app.dialog.progress('Initializing Database');
        app.dbManager.addEventListener('database:localeChanged', function(event) {
            console.log(event.detail);
            localStorage.setItem('dbLocale', event.detail.newLocale);
            localStorage.setItem('userLocale', event.detail.oldLocale);
        });
        app.dbManager.addEventListener('database:progress', function(event) {
            progressDialog.setText('Populating Database');
            progressDialog.setProgress(event.detail.progress * 100);
            console.log(event.detail);
        });
        app.dbManager.addEventListener('database:ready', function(event) {
            console.log('Database is ready!');
            progressDialog.close();
            app.toast.show({
                text: 'Database Ready',
                cssClass: 'color-green'
            });
        });
        app.dbManager.initializeDatabase();
    }
    catch(error) {
        throw new Error(`Failed to load Dexie Manager: ${error.message}`);
    }
});

/*
|------------------------------------------------------------------------------
| Initialize Theming
|------------------------------------------------------------------------------
*/

app.on('init', function() {
    app.theming.init();
});

/* Show Message When App Goes Online */
app.on('online', function() {
    app.toast.show({
        text: 'Connected to Internet',
        horizontalPosition: 'center',
        position: 'top',
        cssClass: 'color-green'
    });
});

/* Show Message When App Goes Offline */
app.on('offline', function() {
    app.toast.show({
        text: 'No Internet Connection',
        horizontalPosition: 'center',
        position: 'top',
        cssClass: 'color-red'
    });
});

/* Show Preloader Before Route Is Loaded */
app.on('routerAjaxStart', function(xhr, options) {
    app.preloader.show();
});

/* Hide Preloader After Route Is Loaded */
app.on('routerAjaxComplete', function(xhr, options) {
    app.preloader.hide();
});

/* Show Error If Unable To Load Route */
app.on('routerAjaxError', function(xhr, options) {
    app.toast.show({
        text: 'An error occured while loading page. Please make sure that you are connected to the Internet.',
        horizontalPosition: 'center',
        position: 'bottom',
        cssClass: 'color-red'
    });
});

/* Close Modals Before Page Is Removed */
app.on('pageBeforeRemove', function(page) {
    app.actions.close();
    app.calendar.close();
    app.dialog.close();
    app.notification.close();
    app.picker.close();
    app.popover.close();
    app.popup.close();
    app.sheet.close();
});

app.on('pageInit, pageBeforeIn', function(page) {
    setTimeout(function() {
        app.$('.navbar').each(function(navbarEl, index) {
            app.navbar.size(navbarEl);
        });
    }, 1);
});

app.on('tabMounted, tabInit', function(tabEl, tabRoute) {
    setTimeout(function() {
        app.$('.navbar').each(function(navbarEl, index) {
            app.navbar.size(navbarEl);
        });
    }, 1);
});
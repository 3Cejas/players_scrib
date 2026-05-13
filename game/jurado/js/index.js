(function registerScribRoleModule(global) {
    global.ScribRoleModules = global.ScribRoleModules || {};
    global.ScribRoleModules.jurado = {
        state: true,
        socketEvents: true
    };
})(window);

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarInterfazJurado);
} else {
    inicializarInterfazJurado();
}

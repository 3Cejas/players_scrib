(function registerScribRoleModule(global) {
    global.ScribRoleModules = global.ScribRoleModules || {};
    global.ScribRoleModules["spectator"] = {
        actions: true,
        state: true,
        socketEvents: true
    };
})(window);

(function registerScribRoleModule(global) {
    global.ScribRoleModules = global.ScribRoleModules || {};
    global.ScribRoleModules["players"] = {
        actions: true,
        state: true,
        socketEvents: true
    };
})(window);

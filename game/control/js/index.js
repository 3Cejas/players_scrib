(function registerScribRoleModule(global) {
    global.ScribRoleModules = global.ScribRoleModules || {};
    global.ScribRoleModules["control"] = {
        actions: true,
        state: true,
        socketEvents: true
    };
})(window);

function log( text ) {
    $log = $('#log');
    //Add text to log
    $log.append(($log.val()?"":'')+ text );
    //Autoscroll
    $log[0].scrollTop = $log[0].scrollHeight - $log[0].clientHeight;
}


log('<div style="font-family: monospace; white-space: pre;">' +
    "  _______                              <br>" +
    " |__   __|                             <br>" +
    "    | | ___  _ __ ___  _ __ ___  _   _ <br>" +
    "    | |/ _ \\| '_ ` _ \\| '_ ` _ \\| | | |<br>" +
    "    | | (_) | | | | | | | | | | | |_| |<br>" +
    "    |_|\\___/|_| |_| |_|_| |_| |_|\\__, |<br>" +
    "                                  __/ |<br>" +
    "                                 |___/ <br>"  +

    "<br>" +
    "</div>");
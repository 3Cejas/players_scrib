"use strict";
(() => {
  const paths = {
    "/game/bolzano/": "https://sutura-gateway.ddns.net/scrib/backstage/laboratory/bolzano/",
    "/game/bolzano/index.html": "https://sutura-gateway.ddns.net/scrib/backstage/laboratory/bolzano/",
    "/game/bolzano/musa.html": "https://sutura-gateway.ddns.net/scrib/backstage/laboratory/bolzano/musa.html",
    "/game/s7/": "https://sutura-gateway.ddns.net/scrib/#experiment/s7",
    "/game/s7/index.html": "https://sutura-gateway.ddns.net/scrib/#experiment/s7"
  };
  // The same game directory is also served at /scrib/ on Sutura.
  const path=location.pathname.replace(/^\/scrib\/(bolzano|s7)(?=\/|$)/,'/game/$1');
  const target=paths[path];
  if(!target)return;
  const url=new URL(target);
  // Only retain role/team selectors, not arbitrary old query or fragment data.
  const query=new URLSearchParams(location.search);
  if(url.pathname.includes('/bolzano/')) {
    if(['control','musa'].includes(query.get('modo')))url.searchParams.set('modo',query.get('modo'));
    if(['1','2'].includes(query.get('player')))url.searchParams.set('player',query.get('player'));
  }
  location.replace(url.href);
})();

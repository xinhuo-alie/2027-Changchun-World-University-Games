/** Stable stage 6 catalog. Venue ids and legacy engine names remain the source of truth. */
const entries = [
  ['wuhuan','wuhuan-shorttrack','弯道超越战','shorttrack-overtake',20,['speed-skater-blue','speed-skater-red','medal-iceflake','ice-burst']],
  ['speed','speed-1000','风速 1000 米','speed-pacing',20,['speed-skater-blue','speed-skater-red','stopwatch-ice']],
  ['cityhall','cityhall-curling','冰壶占营','curling-tactics',20,['curling-stone','curling-house','ice-burst']],
  ['provhall','provhall-hockey-read','读门将','hockey-shooter-vs-goalie',20,['hockey-goalie','hockey-puck','hockey-stick']],
  ['olympic','olympic-shootout','决胜点球','hockey-alternating-attack-defense',20,['hockey-goalie','hockey-puck','hockey-stick','cheering-fans']],
  ['jingyue','jingyue-cross-country','林海耐力赛','cross-country-stamina-route',20,['crosscountry-skier','stopwatch-ice','ice-burst']],
  ['lianhua','lianhua-aerial','腾空三连技','aerial-trick-combo',20,['aerial-snowboarder','landing-target','ice-burst','medal-iceflake']],
  ['sculpture','sculpture-snow-trail','雕塑雪径','winter-trail-route-choice',20,['crosscountry-skier','slalom-gate','stopwatch-ice']],
  ['songhuahu','songhuahu-parallel','双线旗门','parallel-slalom',20,['snowboarder','slalom-gate','speed-skater-red']],
  ['beidahu','beidahu-slalom','山脊极限大回转','alpine-risk-reward-slalom',20,['snowboarder','slalom-gate','stopwatch-ice','ice-burst']],
];
export const GAME_REGISTRY = Object.freeze(Object.fromEntries(entries.map(([venueId,gameId,title,variant,durationSeconds,assetKeys]) => [venueId,Object.freeze({venueId,gameId,title,variant,durationSeconds,assetKeys:Object.freeze(assetKeys),modes:Object.freeze(venueId==='wuhuan'?['practice','ranked-solo','local-2p','online-2p']:['practice','ranked-solo','local-2p']),rankedDifficulty:'standard'})])));
export const GAME_MODES = Object.freeze({practice:'自由练习', 'ranked-solo':'单人排名赛', 'local-2p':'双人轮流', 'online-2p':'跨设备实时对战'});
export function gameForVenue(venue) { const entry=GAME_REGISTRY[venue?.id]; return entry ? {...entry, legacy:venue.game} : null; }

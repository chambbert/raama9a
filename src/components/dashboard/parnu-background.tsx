export function ParnuBackground() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 pointer-events-none select-none z-0"
      style={{ height: '52vh' }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 380"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMax meet"
        className="w-full h-full"
      >
        <defs>
          {/* Sky glow near horizon */}
          <linearGradient id="db-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgb(240,249,255)" stopOpacity="0"   />
            <stop offset="80%"  stopColor="rgb(186,230,253)" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="rgb(125,211,252)" stopOpacity="0.28"/>
          </linearGradient>
          {/* Sea gradient */}
          <linearGradient id="db-sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgb(125,211,252)" stopOpacity="0.45"/>
            <stop offset="100%" stopColor="rgb(14,165,233)"  stopOpacity="0.55"/>
          </linearGradient>
          {/* Beach sand */}
          <linearGradient id="db-sand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgb(254,243,199)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="rgb(252,211,77)"  stopOpacity="0.35"/>
          </linearGradient>
          {/* Sea shimmer overlay */}
          <linearGradient id="db-shimmer" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="white" stopOpacity="0"   />
            <stop offset="40%"  stopColor="white" stopOpacity="0.1" />
            <stop offset="60%"  stopColor="white" stopOpacity="0.06"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"   />
          </linearGradient>
        </defs>

        {/* Horizon sky tint */}
        <rect x="0" y="0" width="1440" height="380" fill="url(#db-sky)" />

        {/* ── City silhouette ── */}
        <path
          fillOpacity="0.13"
          fill="rgb(28,25,23)"
          d="
            M 0,380 L 0,268

            L 4,262 L 0,268 L 8,252 L 3,258 L 14,238 L 9,245 L 20,225
            L 28,245 L 24,238 L 34,255 L 30,250 L 38,263

            L 44,256 L 38,263 L 48,244 L 43,250 L 56,228
            L 64,250 L 60,244 L 70,258 L 65,254 L 76,266

            L 84,260 L 78,266 L 88,246 L 82,254 L 94,232 L 88,240 L 100,215
            L 112,240 L 106,232 L 118,248 L 112,256 L 124,265

            L 130,268 L 130,255 L 152,255 L 152,262
            L 168,262 L 168,250 L 186,250 L 186,258
            L 202,258 L 202,247 L 220,247 L 220,255
            L 236,255 L 236,245 L 254,245 L 254,256 L 262,256

            L 262,240 L 282,240 L 282,248
            L 296,248 L 296,234 L 314,234 L 314,246
            L 328,246 L 328,236 L 344,236 L 344,248
            L 358,248 L 358,238 L 375,238 L 375,252
            L 388,252 L 388,242 L 404,242 L 404,255 L 414,255

            L 414,230 L 420,224 L 424,216 L 428,206
            L 430,196 L 432,188 L 434,196
            L 436,206 L 440,216 L 444,224 L 450,230 L 450,255

            L 462,255 L 462,243 L 480,243 L 480,252
            L 496,252 L 496,240 L 514,240 L 514,250
            L 528,250 L 528,240 L 544,240 L 544,254
            L 556,254 L 556,244 L 572,244 L 572,256
            L 585,256 L 585,246 L 600,246 L 600,258
            L 614,258 L 614,246 L 630,246 L 630,238
            L 648,238 L 648,252 L 662,252 L 662,240
            L 680,240 L 680,256 L 695,256 L 695,218

            L 718,218 L 718,230 L 735,230 L 735,220
            L 754,220 L 754,232 L 770,232 L 770,218 L 785,218 L 785,195

            L 798,182
            L 808,176 L 808,158
            L 810,152 L 813,136 L 816,118 L 819,98
            L 821,78  L 823,60  L 824,50
            L 825,60  L 827,78  L 829,98
            L 832,118 L 835,136 L 838,152
            L 840,158 L 840,176
            L 852,182
            L 866,195 L 866,218 L 895,218 L 895,230 L 912,230

            L 912,218 L 928,218 L 928,228
            L 944,228 L 944,220 L 960,220 L 960,232
            L 976,232 L 976,224 L 994,224 L 994,238
            L 1010,238 L 1010,248 L 1028,248 L 1028,256
            L 1048,256 L 1048,264 L 1072,264 L 1072,270
            L 1100,270 L 1100,275 L 1132,275 L 1132,279
            L 1172,279 L 1172,282 L 1220,282
            L 1280,282 L 1340,283 L 1440,284

            L 1440,380 Z
          "
        />

        {/* ── Beach sand between the town and the water ── */}
        <path
          fill="url(#db-sand)"
          d="M 0,284
             C 240,274 480,286 720,276
             C 960,266 1200,278 1440,270
             L 1440,296
             C 1200,303 960,292 720,300
             C 480,308 240,298 0,306
             Z"
        />

        {/* ── Sea / water body ── */}
        <path
          fill="url(#db-sea)"
          d="M 0,306
             C 240,298 480,308 720,300
             C 960,292 1200,303 1440,296
             L 1440,380 L 0,380 Z"
        />

        {/* Sea shimmer */}
        <path
          fill="url(#db-shimmer)"
          d="M 0,306
             C 240,298 480,308 720,300
             C 960,292 1200,303 1440,296
             L 1440,380 L 0,380 Z"
        />

        {/* Wave line 1 */}
        <path
          stroke="rgb(186,230,253)"
          strokeOpacity="0.7"
          strokeWidth="1.5"
          fill="none"
          d="M 0,316 Q 180,308 360,316 Q 540,324 720,316 Q 900,308 1080,316 Q 1260,324 1440,316"
        />
        {/* Wave line 2 */}
        <path
          stroke="rgb(186,230,253)"
          strokeOpacity="0.45"
          strokeWidth="1"
          fill="none"
          d="M 0,332 Q 150,326 300,332 Q 450,338 600,332 Q 750,326 900,332 Q 1050,338 1200,332 Q 1350,326 1440,332"
        />
        {/* Wave line 3 */}
        <path
          stroke="rgb(186,230,253)"
          strokeOpacity="0.25"
          strokeWidth="1"
          fill="none"
          d="M 0,352 Q 120,347 240,352 Q 360,357 480,352 Q 600,347 720,352 Q 840,357 960,352 Q 1080,347 1200,352 Q 1320,357 1440,352"
        />

        {/* Shoreline — thin glowing stripe where sand meets sea */}
        <line
          x1="0" y1="304" x2="1440" y2="298"
          stroke="rgb(186,230,253)"
          strokeOpacity="0.5"
          strokeWidth="1"
        />

        {/* ── Pärnu city flag on the beach ── */}
        <g>
          <line x1="1150" y1="297" x2="1150" y2="226" stroke="rgb(68,64,60)" strokeWidth="1.4" strokeOpacity="0.8" />
          <g fillOpacity="0.9">
            <rect x="1150.7" y="227" width="32" height="19" fill="rgb(0,102,180)" />
            <rect x="1158.7" y="227" width="4.8" height="19" fill="white" />
            <rect x="1150.7" y="234.2" width="32" height="4.8" fill="white" />
          </g>
        </g>

        {/* ── Pärnu county crest: gold shield, black rampant bear ── */}
        <g transform="translate(285,188) scale(0.6)" opacity="0.9">
          <path
            d="M2,2 L34,2 L34,28 Q34,40 18,44 Q2,40 2,28 Z"
            fill="rgb(253,224,71)"
            stroke="rgb(28,25,23)"
            strokeOpacity="0.6"
            strokeWidth="1.2"
          />
          <path
            fill="rgb(28,25,23)"
            d="M 8.5,11.5
               Q 9,9.8 11,8.6
               Q 12.2,7.8 13.2,7.6
               Q 13.5,6.4 14.6,6.8
               Q 15.6,7.2 16.4,8.4
               Q 19.5,10 21.5,13.5
               Q 23.6,17 24,21.5
               Q 24.2,24.5 23.6,26.2
               L 25.4,27 Q 25.9,28.4 24.4,29.2
               Q 23.9,31.8 22.4,34.4
               L 23,38 L 19.4,38 L 19.9,34.4
               Q 18.7,32.2 17.6,30.6
               L 16,34 L 16.5,38 L 12.9,38 L 13.5,33
               Q 12,28 12.5,23
               L 9,21.5 L 7.4,19.4 L 10.6,18.6
               Q 11.4,17.2 11.9,15.6
               L 8,14 L 7,11.8 L 10.2,11.4
               Q 9.3,11.5 8.5,11.5 Z"
          />
        </g>
      </svg>
    </div>
  )
}

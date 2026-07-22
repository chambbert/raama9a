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

        {/* ── River mouth beside the pier, running inland — the town reads as an island ── */}
        <path
          fill="url(#db-sea)"
          d="M 1252,301 Q 1295,278 1345,272 Q 1395,268 1440,266
             L 1440,278 Q 1392,280 1348,284 Q 1310,290 1318,301 Z"
        />

        {/* ── Beachgoers: sun umbrellas, towels, sunbathers ── */}
        <g transform="translate(340,296) scale(1.8)">
          <line x1="0" y1="0" x2="0" y2="-11" stroke="rgb(87,83,78)" strokeWidth="0.9" strokeOpacity="0.75" />
          <path d="M -8,-10 Q 0,-17 8,-10 Z" fill="rgb(239,110,80)" fillOpacity="0.8" />
        </g>
        <rect x="352" y="292" width="16" height="6" rx="1" transform="rotate(-8 352 292)" fill="rgb(56,170,190)" fillOpacity="0.6" />
        <g stroke="rgb(41,37,36)" strokeOpacity="0.7">
          <line x1="355" y1="295" x2="364" y2="295" strokeWidth="2.2" />
          <circle cx="366" cy="295" r="1.7" fill="rgb(41,37,36)" fillOpacity="0.7" stroke="none" />
        </g>
        <rect x="548" y="291" width="16" height="6" rx="1" transform="rotate(5 548 291)" fill="rgb(250,180,80)" fillOpacity="0.6" />
        <g stroke="rgb(41,37,36)" strokeOpacity="0.7">
          <line x1="550" y1="293" x2="559" y2="293" strokeWidth="2.2" />
          <circle cx="561" cy="293" r="1.7" fill="rgb(41,37,36)" fillOpacity="0.7" stroke="none" />
        </g>
        <g transform="translate(760,292) scale(1.6)">
          <line x1="0" y1="0" x2="0" y2="-11" stroke="rgb(87,83,78)" strokeWidth="0.9" strokeOpacity="0.75" />
          <path d="M -8,-10 Q 0,-17 8,-10 Z" fill="rgb(56,170,190)" fillOpacity="0.8" />
        </g>
        <rect x="768" y="290" width="16" height="6" rx="1" transform="rotate(-5 768 290)" fill="rgb(239,110,80)" fillOpacity="0.6" />
        <g transform="translate(150,299) scale(1.5)">
          <line x1="0" y1="0" x2="0" y2="-11" stroke="rgb(87,83,78)" strokeWidth="0.9" strokeOpacity="0.75" />
          <path d="M -8,-10 Q 0,-17 8,-10 Z" fill="rgb(250,180,80)" fillOpacity="0.8" />
        </g>

        {/* ── Kitesurfers ── */}
        <g transform="translate(430,336) scale(1.3)">
          <path d="M -22,-24 Q -12,-33 -1,-26 Q -12,-29 -22,-24 Z" fill="rgb(239,110,80)" fillOpacity="0.8" />
          <line x1="-20.5" y1="-24.5" x2="-1.5" y2="-5" stroke="rgb(68,64,60)" strokeWidth="0.4" strokeOpacity="0.5" />
          <line x1="-3" y1="-26" x2="-1.5" y2="-5" stroke="rgb(68,64,60)" strokeWidth="0.4" strokeOpacity="0.5" />
          <path d="M 0,-1 Q -1,-3 -1.5,-5.5" stroke="rgb(41,37,36)" strokeWidth="1.3" fill="none" strokeOpacity="0.8" />
          <circle cx="-1.7" cy="-6.8" r="1.3" fill="rgb(41,37,36)" fillOpacity="0.8" />
          <line x1="-4.5" y1="0.8" x2="4.5" y2="-0.4" stroke="rgb(41,37,36)" strokeWidth="1.4" strokeOpacity="0.8" />
        </g>
        <g transform="translate(650,354) scale(1.5)">
          <path d="M -22,-24 Q -12,-33 -1,-26 Q -12,-29 -22,-24 Z" fill="rgb(56,170,190)" fillOpacity="0.8" />
          <line x1="-20.5" y1="-24.5" x2="-1.5" y2="-5" stroke="rgb(68,64,60)" strokeWidth="0.4" strokeOpacity="0.5" />
          <line x1="-3" y1="-26" x2="-1.5" y2="-5" stroke="rgb(68,64,60)" strokeWidth="0.4" strokeOpacity="0.5" />
          <path d="M 0,-1 Q -1,-3 -1.5,-5.5" stroke="rgb(41,37,36)" strokeWidth="1.3" fill="none" strokeOpacity="0.8" />
          <circle cx="-1.7" cy="-6.8" r="1.3" fill="rgb(41,37,36)" fillOpacity="0.8" />
          <line x1="-4.5" y1="0.8" x2="4.5" y2="-0.4" stroke="rgb(41,37,36)" strokeWidth="1.4" strokeOpacity="0.8" />
        </g>
        <g transform="translate(890,324) scale(1.05)">
          <path d="M -22,-24 Q -12,-33 -1,-26 Q -12,-29 -22,-24 Z" fill="rgb(250,180,80)" fillOpacity="0.8" />
          <line x1="-20.5" y1="-24.5" x2="-1.5" y2="-5" stroke="rgb(68,64,60)" strokeWidth="0.4" strokeOpacity="0.5" />
          <line x1="-3" y1="-26" x2="-1.5" y2="-5" stroke="rgb(68,64,60)" strokeWidth="0.4" strokeOpacity="0.5" />
          <path d="M 0,-1 Q -1,-3 -1.5,-5.5" stroke="rgb(41,37,36)" strokeWidth="1.3" fill="none" strokeOpacity="0.8" />
          <circle cx="-1.7" cy="-6.8" r="1.3" fill="rgb(41,37,36)" fillOpacity="0.8" />
          <line x1="-4.5" y1="0.8" x2="4.5" y2="-0.4" stroke="rgb(41,37,36)" strokeWidth="1.4" strokeOpacity="0.8" />
        </g>

        {/* ── Harbor pier ── */}
        <g>
          <line x1="1140" y1="296" x2="1140" y2="314" stroke="rgb(87,83,78)" strokeWidth="2.4" strokeOpacity="0.55" />
          <line x1="1170" y1="296" x2="1170" y2="317" stroke="rgb(87,83,78)" strokeWidth="2.4" strokeOpacity="0.55" />
          <line x1="1200" y1="296" x2="1200" y2="319" stroke="rgb(87,83,78)" strokeWidth="2.4" strokeOpacity="0.55" />
          <line x1="1228" y1="296" x2="1228" y2="321" stroke="rgb(87,83,78)" strokeWidth="2.4" strokeOpacity="0.55" />
          <rect x="1132" y="292" width="104" height="5" fill="rgb(120,90,60)" fillOpacity="0.65" rx="1" />
          <rect x="1230" y="286" width="3.4" height="7" fill="rgb(87,83,78)" fillOpacity="0.7" rx="1" />
        </g>

        {/* ── Moored boat off the pier end ── */}
        <g fillOpacity="0.5" strokeOpacity="0.5">
          <path d="M 1250,306 L 1282,306 Q 1278,314 1268,314 L 1258,314 Q 1252,311 1250,306 Z" fill="rgb(87,83,78)" />
          <line x1="1266" y1="306" x2="1266" y2="288" stroke="rgb(87,83,78)" strokeWidth="1.6" />
        </g>

        {/* ── Pärnu city flag ── */}
        <g>
          <line x1="1150" y1="293" x2="1150" y2="226" stroke="rgb(68,64,60)" strokeWidth="1.4" strokeOpacity="0.8" />
          <g fillOpacity="0.9">
            <rect x="1150.7" y="227" width="32" height="19" fill="rgb(0,102,180)" />
            <rect x="1158.7" y="227" width="4.8" height="19" fill="white" />
            <rect x="1150.7" y="234.2" width="32" height="4.8" fill="white" />
          </g>
        </g>

        {/* ── Estonian flag ── */}
        <g>
          <line x1="1192" y1="293" x2="1192" y2="226" stroke="rgb(68,64,60)" strokeWidth="1.4" strokeOpacity="0.8" />
          <g fillOpacity="0.9">
            <rect x="1192.7" y="227" width="32" height="6.33" fill="rgb(0,114,206)" />
            <rect x="1192.7" y="233.33" width="32" height="6.33" fill="rgb(28,25,23)" />
            <rect x="1192.7" y="239.66" width="32" height="6.34" fill="white" />
            <rect x="1192.7" y="227" width="32" height="19" fill="none" stroke="rgb(28,25,23)" strokeOpacity="0.3" strokeWidth="0.6" />
          </g>
        </g>
      </svg>
    </div>
  )
}

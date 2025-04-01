import { formatTextAsTspan } from "../utils/tools";
import { Player, PlayerManager } from "./PlayerManager";




const profileCache = new Map<string, Profile>();
export class ProfileMaker {
    static async createProfile(id: string, force: boolean = false): Promise<Profile | null> {
        if (profileCache.has(id) && !force) {
            return profileCache.get(id)!;
        }
        const player = await PlayerManager.getUser(id, true);
        if (!player) return null
        const profile = new Profile(player);
        profileCache.set(id, profile);
        return profile;
    }





}


class Profile {
    player: Player;
    get badgeFilter(): Record<string, (xOffSet: number, yOffSet: number) => { svg: string; offset?: number } | null> {
        return {
            decay: (xOffSet: number = 0, yOffSet: number = 0) => {
                if (!this.player.rank?.name) return null;

                const badgeWidth = 80;
                return {
                    offset: badgeWidth,
                    svg: `<g  transform="translate(${xOffSet},${yOffSet})">

                        <path id="Shape_7" fill="#E33A3A" fill-rule="evenodd" 
                            d="${this.generateBadgePath(badgeWidth)}"/>
                        <text x="5" y="14.5" text-anchor="middle" 
                            dominant-baseline="middle" class="rankBadgeDown"  style="font-size: 10px;" >
                          Losing Points
       
                        </text>
                      
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" ill="none" stroke="#fff" x="-45" y="7" height="12" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-down w-3.5 h-3.5 mr-1"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg>


                 
                    </g>
                    
                    <g  transform="translate(65,10)">

                        <path id="Shape_7" fill="#E33A3A" fill-rule="evenodd" 
                            d="${this.generateBadgePath(badgeWidth,12,20)}"/>
                        <text x="5" y="12.5" text-anchor="middle" 
                            dominant-baseline="middle" class="rankBadgeDown"  style="font-size: 10px;" >
                          Decay Active       
                        </text>
                      
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" ill="none" stroke="#fff" x="-42" y="5" height="12" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-down w-3.5 h-3.5 mr-1"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg>


                 
                    </g>
                    `
                };
            },
            rank: (xOffSet: number = 0, yOffSet: number = 0) => {
                if (!this.player.rank?.name) return null;

                const badgeWidth = 40;
                const secondBadge = 60;
                const ranked = true 
                return {
                    offset: badgeWidth,
                    svg: `<g id="Rank" transform="translate(${xOffSet},${yOffSet})">
                        <path class="s4" d="${this.generateBadgePath(badgeWidth)}" id="Shape_7"  
                            />
                        <text x="5" y="14.5" text-anchor="middle" 
                            dominant-baseline="middle" class="rankBadgeDown" style="font-size: 10px;">
                            <tspan>${this.player.rank.name}</tspan>
                        </text>
                                           <svg xmlns="http://www.w3.org/2000/svg" width="12" x="-24" y="7" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkle w-3.5 h-3.5 mr-1">
                                           // <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path></svg>

                    </g>
                    <g id="Rank" transform="translate(${this.svgWidth-(secondBadge-((secondBadge/2)/3))},10)">
                        <path class="s4" d="${this.generateBadgePath(secondBadge,12,20)}" id="Shape_7"  
                            />
                        <text x="${ranked ? 3 : 5}" y="12.5" text-anchor="middle" 
                            dominant-baseline="middle" class="rankBadgeDown" style="font-size: 10px;">
                            <tspan>${this.player.rank.name}${ranked ? " #25" : ""}</tspan>
                        </text>
                                           <svg xmlns="http://www.w3.org/2000/svg" width="12" x="-35" y="5" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkle w-3.5 h-3.5 mr-1">
                                           // <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path></svg>

                    </g>
                    `
                };
            },
            onFire: (xOffSet: number = 0, yOffSet: number = 0) => {
                //if (this.player.rank?.name) return null;

                const badgeWidth = 40;
                return {
                    offset: badgeWidth,
                    svg: `<g id="Rank" transform="translate(${xOffSet},${yOffSet})">
                        <path id="Shape_7" class="fire"
                            d="${this.generateBadgePath(badgeWidth)}"/>
                        <text x="5" y="14.5" text-anchor="middle" 
                            dominant-baseline="middle" class="rankBadgeDown" style="font-size: 10px;">
                            On fire
                        </text>
                        <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" x="-24" y="7" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-flame w-3.5 h-3.5 mr-1"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
                    </g>`
                };
            },




        }
    }
    constructor(player: Player) {
        this.player = player;
    }

    generateBadgePath(width: number,customCurve:number=14,customheight:number=14): string {
        // The original design has a fixed "pill" shape with rounded ends.
        // We'll scale the width while keeping the height (28 units) and curvature consistent.

        const halfWidth = width / 2;
        const height = customheight; // Fixed height (from y=0 to y=28 in your original)
        const curveRadius = customCurve; // Radius of the rounded ends

        // Construct the path data dynamically
        return `
            M-${halfWidth} 0
            H${halfWidth}
            c${curveRadius} 0 ${curveRadius} ${curveRadius} ${curveRadius} ${curveRadius}
            s0 ${curveRadius} -${curveRadius} ${curveRadius}
            H-${halfWidth}
            c-${curveRadius} 0 -${curveRadius} -${curveRadius} -${curveRadius} -${curveRadius}
            s0 -${curveRadius} ${curveRadius} -${curveRadius}
            z
        `.replace(/\s+/g, ' ').trim();
    }
    private generateProgressPath(value: number, fillColor: string): string {
        const maxWidth = 304; // Max width of progress bar
        const progressWidth = (value / 100) * maxWidth; // Scale width based on value

        return `
            <path fill="${fillColor}" fill-rule="evenodd" d="
                M39.5 377
                h${progressWidth} 
                c4.7 0 8.5 3.8 8.5 8.5 
                0 4.7-3.8 8.5-8.5 8.5 
                h-${progressWidth} 
                c-4.7 0-8.5-3.8-8.5-8.5 
                0-4.7 3.8-8.5 8.5-8.5
            "/>
        `;
    }

    get colors() {

        return {
            mainColor: "EFA819",
            secondaryColor: "846E1F",
        }


    }
    get Progress(): string {

        const progress = this.player.progressToNextLevel;
        const progressValue = progress.progress;




        // Full background bar (gray)
        const fullBar = `
            <path fill="#ccc" fill-rule="evenodd" d="
                M39.5 377
                h304 
                c4.7 0 8.5 3.8 8.5 8.5 
                0 4.7-3.8 8.5-8.5 8.5 
                h-304 
                c-4.7 0-8.5-3.8-8.5-8.5 
                0-4.7 3.8-8.5 8.5-8.5
            "/>
        `;

        // Progress bar (dynamic width)
        const progressBar = this.generateProgressPath(progressValue, `#${this.colors.mainColor}`); // Orange progress bar

        return `${fullBar}${progressBar}`;
    }



    get svgWidth(): number {
        return 385

    }
    get badges(): string {
        if (!this?.badgeFilter || Object.keys(this.badgeFilter)?.length === 0) return "";
        let text = ``;

        // Collect valid badges
        const badgeEntries = Object.entries(this.badgeFilter)
            .map(([key, fn]) => {
                const badge = fn(0, 0);
                return badge?.svg && badge.offset ? { key, badge } : null;
            })
            .filter((entry): entry is { key: string; badge: { svg: string; offset: number } } => !!entry);

        if (badgeEntries.length === 0) return "";

        const BADGE_SPACING = 10; // Horizontal spacing between badges
        const LINE_HEIGHT = 55;   // Vertical spacing between lines
        let yPosition = 296;      // Starting Y position

        // Group badges into lines
        const lines: typeof badgeEntries[] = [];
        let currentLine: typeof badgeEntries = [];
        let currentLineWidth = 0;

        badgeEntries.forEach(entry => {
            const badgeWidth = entry.badge.offset;
            const newWidth = currentLine.length > 0
                ? currentLineWidth + BADGE_SPACING + badgeWidth
                : badgeWidth;

            if (newWidth > this.svgWidth && currentLine.length > 0) {
                lines.push(currentLine);
                currentLine = [entry];
                currentLineWidth = badgeWidth;
            } else {
                if (currentLine.length > 0) {
                    currentLineWidth += BADGE_SPACING;
                }
                currentLine.push(entry);
                currentLineWidth += badgeWidth;
            }
        });

        if (currentLine.length > 0) {
            lines.push(currentLine);
        }

        // Render each centered line
        lines.forEach(line => {
            const totalLineWidth = line.reduce((sum, { badge }) => sum + badge.offset, 0) +
                (line.length - 1) * BADGE_SPACING;

            // Calculate starting X position for perfect centering
            let xPosition = Math.max(0, (this.svgWidth - totalLineWidth) / 2) + (LINE_HEIGHT / 2)

            line.forEach(({ key, badge }, index) => {
                const badgeSvg = this.badgeFilter[key](xPosition, yPosition)?.svg;
                if (badgeSvg) {
                    text += badgeSvg;
                    xPosition += badge.offset + BADGE_SPACING + (BADGE_SPACING * index * 2);
                }
            });

            yPosition += LINE_HEIGHT;
        });

        return text;
    }



    get svg(): string {





        return `<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.svgWidth} 585" width="385" height="585">
	<title>Silver_card</title>
	<defs>
		<clipPath clipPathUnits="userSpaceOnUse" id="cp1">
			<path d="m16.74 3l351.24 0.13c8.29 0 15 6.72 15 15l-0.21 548.53c0 8.29-6.72 15-15 15l-351.24-0.13c-8.28 0-15-6.72-14.99-15.01l0.2-548.53c0-8.28 6.72-14.99 15-14.99z"/>
		</clipPath>
        <linearGradient id="g3" x2="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(126,0,0,28,242,30)">
			<stop offset="0" stop-color="#${this.colors.mainColor}"/>
			<stop offset="1" stop-color="#${this.colors.mainColor}"/>
		</linearGradient>
		<linearGradient id="g1" x2="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(0,578.659,-381.439,0,192.256,3)">
			<stop offset="0" stop-color="#1f2937"/>
			<stop offset="1" stop-color="#111827"/>
		</linearGradient>
		<filter x="-50%" y="-50%" width="200%" height="200%" id="f1" ><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#434c5a" flood-opacity=".5"/></filter>
		<linearGradient id="g2" x2="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(385,0,0,6,0,3)">
			<stop offset="0" stop-color="#${this.colors.mainColor}"/>
			<stop offset=".5" stop-color="#${this.colors.secondaryColor}"/>
			<stop offset="1" stop-color="#${this.colors.mainColor}"/>
		</linearGradient>
   <linearGradient id="onFire" gradientUnits="userSpaceOnUse" gradientTransform="matrix(-0.1,-0.1,1,-5,-0,-1)">
  <stop offset="0" stop-color="#f97316"/>
  <stop offset=".5" stop-color="#ef4444"/>
<stop offset="1" stop-color="#f97316"/>
<stop offset="1.5" stop-color="#ef4444"/>
</linearGradient>
		<image width="48" height="48" id="img1" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1zcGFya2xlIj48cGF0aCBkPSJNOS45MzcgMTUuNUEyIDIgMCAwIDAgOC41IDE0LjA2M2wtNi4xMzUtMS41ODJhLjUuNSAwIDAgMSAwLS45NjJMOC41IDkuOTM2QTIgMiAwIDAgMCA5LjkzNyA4LjVsMS41ODItNi4xMzVhLjUuNSAwIDAgMSAuOTYzIDBMMTQuMDYzIDguNUEyIDIgMCAwIDAgMTUuNSA5LjkzN2w2LjEzNSAxLjU4MWEuNS41IDAgMCAxIDAgLjk2NEwxNS41IDE0LjA2M2EyIDIgMCAwIDAtMS40MzcgMS40MzdsLTEuNTgyIDYuMTM1YS41LjUgMCAwIDEtLjk2MyAweiIvPjwvc3ZnPg=="/>
		<linearGradient id="g4" x2="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(73.379,0,0,28,155,310)">
			<stop offset="0" stop-color="#4b5563"/>
			<stop offset="1" stop-color="#6b7280"/>
		</linearGradient>
	</defs>
	<style>

		tspan { white-space:pre } 
		.borderLeft { fill: url(#g1);stroke: #${this.colors.secondaryColor};stroke-miterlimit:100;stroke-width: 7 } 
		.s1 { filter: url(#f1);fill: url(#g2) } 
		.xpTitle { 
        font-size: 13px;fill:
         #ffffff;
        font-weight="500";
        --tw-text-opacity: 1;
        font-family: Arial, Helvetica, sans-serif; } 
		.pointDot { fill: #${this.colors.mainColor} } 
		.s4 { fill: url(#g3) } 
        .fire { fill: url(#onFire)
        }
        .Rank {ill: url(#g3)}
		.topBadge { font-size: 14px;fill: #ffffff;font-weight: 700;             font-family: Arial, Helvetica, sans-serif; } 
		.t6 { font-size: 14px;fill: #ffffff;font-weight: 400;font-family: "DejaVuSans", "DejaVu Sans" } 
		.statsBackground { fill: #242d3c } 
        .pointText {
            font-size: 12px;
            fill: #ccc;
            font-weight: 500;
            font-family: Arial, Helvetica, sans-serif;
        }
        .statsText { font-size: 13px;
        fill: #ccc;
        font-weight: 500;
           font-family: Arial, Helvetica, sans-serif; } 
		.underAvatarBadgeText { 
        font-size: 12px;
        fill: #ffffff;
        font-weight: 700;
        font-family: Arial, Helvetica, sans-serif } 
		.playerName { 
        font-size: 14px;
        fill: #${this.colors.mainColor};
        font-weight: 700;
        font-family: Arial, Helvetica, sans-serif 
        } 
		.s12 { fill: url(#g4) } 
		.rankBadgeDown { fill: url(#g2);font-size: 12px;fill: #ffffff;font-weight: 700;font-family: "Arial", "Helvetica","sans-serif" } 
		.avatarBorder { fill: none;stroke: #${this.colors.mainColor};stroke-miterlimit:100;stroke-width: 3.5 } 
		.badge { fill: #${this.colors.mainColor};stroke: #ffffff;stroke-miterlimit:100;stroke-width: 2 } 

        .xpText {
    line-height: 1.5;
    text-size-adjust: 100%;
    tab-size: 4;
    font-feature-settings: normal;
    font-variation-settings: normal;
    -webkit-tap-highlight-color: transparent;
    line-height: 1rem;       
    font-family: Arial, Helvetica, sans-serif;
    font-size: 0.75rem;
 

        }
        </style>
	<g id="Folder 2">
		<g clip-path="url(#cp1)">
			<path id="Shape 1" fill-rule="evenodd" class="borderLeft" d="m16.7 3l351.3 0.1c8.3 0 15 6.8 15 15l-0.2 548.6c0 8.2-6.7 15-15 15l-351.3-0.2c-8.3 0-15-6.7-15-15l0.2-548.5c0-8.3 6.8-15 15-15z"/>
			<path id="Shape 2" fill-rule="evenodd" class="s1" d="m385 0v6h-385v-6z"/>
		</g>
	</g>
	<g id="progress">
		<text id="XP Progress" style="transform: matrix(1,0,0,1,30.369,360.847)" >
			<tspan  class="xpTitle" x="${this.svgWidth - 95}" stroke="#${this.colors.mainColor}">${this.player.progressToNextLevel.progress.toFixed(0)}%</tspan>
			<tspan x="1" y="0" class="xpTitle">XP Progress
			
</tspan>
<tspan  class="xpText" y="55"  x="${1}" style="font-size: 10px;" stroke="#ccc">${this.player.progressToNextLevel.currentLevel.toLocaleString()}/${this.player.progressToNextLevel.nextLevelXP.toLocaleString()} XP</tspan>		

<tspan  class="xpText" y="55"  x="${this.svgWidth - 130}" style="font-size: 10px;" stroke="#ccc">Next Level: ${(this.player?.level || 0) + 1}</tspan>		
</text>

		${this.Progress}

	</g>
	
	<g id="stats">
		<path id="Shape 8" fill-rule="evenodd" class="statsBackground" d="m38 464h307c3.9 0 7 3.1 7 7v59c0 3.9-3.1 7-7 7h-307c-3.9 0-7-3.1-7-7v-59c0-3.9 3.1-7 7-7z"/>
		<path id="Shape 9" fill-rule="evenodd" class="pointDot" d="m52 517c-2.2 0-4-1.8-4-4 0-2.2 1.8-4 4-4 2.2 0 4 1.8 4 4 0 2.2-1.8 4-4 4z"/>
		<text id="Points:" style="transform: matrix(1,0,0,1,64,516.6)" >
				<tspan x="0" y="0" class="pointText">Points: ${this.player.points}</tspan>
             

		</text>
           ${true ? `<path id="Shape 9" fill-rule="evenodd"  fill="#ef4444" d="m200 517c-2.2 0-4-1.8-4-4 0-2.2 1.8-4 4-4 2.2 0 4 1.8 4 4 0 2.2-1.8 4-4 4z"/>
		<text id="Points:" style="transform: matrix(1,0,0,1,64,516.6)" >
				<tspan x="147" y="0" class="pointText">Decay: -10/day</tspan>
             

		</text>` : ""}
		<text  style="transform: matrix(1,0,0,1,159.549,483.399)" >
			
            <tspan x="0" y="0" class="statsText">${this.player.rank?.name} Stats
           

</tspan>
		</text>
	</g>
	<g id="Level">
        <path id="Shape 6" fill-rule="evenodd" class="pointDot" d="m125.5 256h${49 + (this.player.level.toString().length)}c2.2 0 4 1.8 4 4v17c0 2.2-1.8 4-4 4h-${49 + (this.player.level.toString().length)}c-2.2 0-4-1.8-4-4v-17c0-2.2 1.8-4 4-4z"/>
		<text id="LVL" style="transform: matrix(1,0,0,1,129.9,272.5)" >
			<tspan x="0" y="0" class="underAvatarBadgeText">LVL ${this.player.level.toString().padStart(2, '0')}
</tspan>
		</text>
	    <text  style="transform: matrix(1,0,0,1,184.194,272.791)" >
			<tspan x="${this.player.level.toString().length}" y="0" class="playerName">${this.player?.rank?.name} Player
</tspan>
		</text>
	</g>
	${this.badges}
	<g id="Profile Pic">
		<path id="Shape 3" fill-rule="evenodd" class="avatarBorder" d="m192.5 190.5c-34.3 0-62-27.7-62-62 0-34.3 27.7-62 62-62 34.3 0 62 27.7 62 62 0 34.3-27.7 62-62 62z"/>
		      <text x="${this.svgWidth/2}" y="229"  text-anchor="middle" 
                            dominant-baseline="middle" class="rankBadgeDown" style="font-size: 24px;">
                              7xr                            
                        </text>
        <path id="Shape 5" fill-rule="evenodd" class="badge" d="m246.8 199.4c-9.3 0-16.8-7.2-16.8-16.2 0-9 7.5-16.2 16.8-16.2 9.3 0 16.7 7.2 16.7 16.2 0 9-7.4 16.2-16.7 16.2z"/>
		<use id="sparkle copy 2" href="#img1" transform="matrix(.545,0,0,.545,234,170)"/>
	</g>
</svg>`
    }
}




export default {
    embedColor: "0099ff",
    cacheCleanUp: "15m",


    // default decay rate/interval for ranks 
    decay: {
        decay: false,
        decayRate: 1, // 1% decay
        decayInterval: 3600000, // will decay every 1 hour
        inActiveTime: 3600000  // 12 hours


    },
    leaderboard: {

        interval: 60 *  1000 // 5 minutes


    },
    // default xp and scaling faction  for levels
    rankConfig: {
        perMessage: {
            wordRequirement: 1,
            charRequirement: 1,
            cooldown: 1000,
            baseXP: 15,
            wordBonus: 1.1,
            charBonus: 1.05
        },
    },
    levels: {
        initialXP: 100,
        scalingFactor: 15,
        perMessageXP: {
            wordRequirement: 1,
            charRequirement: 5,
            cooldown: 1000,
            baseXP: 15,
            wordBonus: 1.1,
            charBonus: 1.05

        },
    },

    ranks: [
        {
            rankId: "bronze",
            name: "Bronze",
            pointsRequirement: 100,


            special: false,
            decay: null, // No decay for Bronze
            rewards: []
        },
        {
            rankId: "silver",
            name: "Silver",
            pointsRequirement: 200,
            special: false,
            decay: null, // No decay for Silver
            rewards: []
        },
        {
            rankId: "gold",
            name: "Gold",
            pointsRequirement: 400,
            special: false,
            decay: null, // No decay for Gold
            rewards: []
        },
        {
            rankId: "platinum",
            name: "Platinum",
            pointsRequirement: 600,


            special: false,
            decay: {
                decay: true,
                decayRate: 50, // Example: Lose 50 XP per decay interval
                decayInterval: 48 * 60 * 60 * 1000, // 48h in milliseconds
                inActiveTime: 48 * 60 * 60 * 1000 // 48h before decay starts
            },
            rewards: []
        },
        {
            rankId: "diamond",
            name: "Diamond",
            pointsRequirement: 1000,


            special: false,
            decay: {
                decay: true,
                decayRate: 50,
                decayInterval: 24 * 60 * 60 * 1000, // 24h in milliseconds
                inActiveTime: 24 * 60 * 60 * 1000 // 24h before decay starts
            },
            rewards: []
        },
        {
            rankId: "master",
            name: "Master",
            pointsRequirement: 1500,


            special: true,
            decay: {
                decay: true,
                decayRate: 50,
                decayInterval: 24 * 60 * 60 * 1000,
                inActiveTime: 24 * 60 * 60 * 1000
            },
            rewards: [],
            promotion: {
                type: "auto",
                interval: 12 * 60 * 60 * 1000 // Every 12 hours
            }
        },
        {
            rankId: "elite",
            name: "Elite",
            pointsRequirement: 1500, // Same as Master, but limited slots


            special: true,
            decay: {
                decay: true,
                decayRate: 50,
                decayInterval: 24 * 60 * 60 * 1000,
                inActiveTime: 24 * 60 * 60 * 1000
            },
            maxUsers: 10, // Set limit as needed
            rewards: [],
            promotion: {
                type: "competitive", // Master with highest messages replaces Elite with lowest messages
                interval: 12 * 60 * 60 * 1000 // Every 12 hours
            }
        },

    ]

}
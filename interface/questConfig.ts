export interface QuestConfig {



    name: string
    filterKey: Function,
    config: Function,
    requireVoiceChannel?: boolean,
    requireLogin?: boolean,
    requireStream?: boolean,


    run: Function

}
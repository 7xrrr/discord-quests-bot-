import {
    ApplicationCommandOptionType,
    CacheType,
    ClientEvents,
    Events, Interaction
} from "discord.js";
import { baseDiscordEvent } from "../core/Event";
export default class commandsEvents extends baseDiscordEvent {
    name: keyof ClientEvents = Events.InteractionCreate;
    once = false;

    async executeEvent(interaction: Interaction<CacheType>) {
        if (!interaction.isAutocomplete()) return;

        const subcommand = interaction.options.data.find(e => [ApplicationCommandOptionType.Subcommand, ApplicationCommandOptionType.SubcommandGroup].includes(e.type));
        const commandName = subcommand ? `${interaction.commandName}-${subcommand.name}`.toLowerCase() : interaction.commandName;
        console.log(commandName)
        const command = this.customClient.commands.get(commandName);
       
        if (!command || !command?.autocomplete) return;



        if (command.ownerOnly && interaction.user.id !== process.env?.OWNER_ID) return
        command.autocomplete(interaction);








    }
}

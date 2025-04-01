import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChatInputCommandInteraction, Interaction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../core/Command";
import { EmbedBuilder } from "../../class/customEmbed";
import { ms } from "../../utils/ms";
import { disabledInteraction, errorMessage, generateUniqueNumber } from "../../utils/tools";
import { server, serverManager } from "../../class/guildManager";

export default class configSeason extends Command {
    public cooldown = this.client.config.channels.cooldown;
    public category = this.client.config.channels.category;
  

    public data = new SlashCommandBuilder()
        .setName("channels")
        .setDescription(`set ranking notification channel`);


    public async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.inCachedGuild()) return;
        await interaction.deferReply({ flags: "Ephemeral" });
        const key = interaction.id;
        const server = await serverManager.getServer(interaction.guildId.toString(), true);
        if (!server) return errorMessage("Server not found", interaction.editReply.bind(interaction));
        await genrateReplyMessage(interaction, server, { key: key, editReply: true });
        const collcter = interaction.channel?.createMessageComponentCollector({ filter: (i) => i.customId.endsWith(`_${key}`) && i.user.id === interaction.user.id, max: 0, time: ms("5m") })
        if (!collcter) return;
        collcter?.on("collect", async (i: Interaction) => {

            if (i.isButton()) {
                const id = i.customId.split("_")[0];
                switch (id) {
                    case "rankUp":
                        const menu = channelMenu("Select Rank Up Channel", server.rankUpChannel || null);
                        await i.reply({ content: "Select Rank Up Channel", components: [new ActionRowBuilder<any>().addComponents(menu)],flags:["Ephemeral"]  });

                        const response = await i.channel?.awaitMessageComponent({ filter: (m) => m.customId === menu.data.custom_id && m.user.id === i.user.id, time: ms("2m") });
                        if (!response?.id || !response.isChannelSelectMenu()) return;
                        const selectedChannel = response.values[0];
                        server.rankUpChannel = selectedChannel;
                        i.deleteReply();
                        await genrateReplyMessage(interaction, server, { key, editReply: true });
                        break;
                    case "rankDown":
                        const menuDown = channelMenu("Select Rank Down Channel", server.rankDownChannel || null);
                        await i.reply({ content: "Select Rank Down Channel", components: [new ActionRowBuilder<any>().addComponents(menuDown)],flags:["Ephemeral"]  });

                        const responseDown = await i.channel?.awaitMessageComponent({ filter: (m) => m.customId === menuDown.data.custom_id && m.user.id === i.user.id, time: ms("2m") });
                        if (!responseDown?.id || !responseDown.isChannelSelectMenu()) return;
                        const selectedChannelDown = responseDown.values[0];
                        server.rankDownChannel = selectedChannelDown;
                        i.deleteReply();
                        await genrateReplyMessage(interaction, server, { key, editReply: true });
                        break;

                    case "highPlayerRankUp":
                        const menuHighPlayerRankUp = channelMenu("Select High Player Rank Up Channel", server.highPlayerRankUpChannel || null);
                        await i.reply({ content: "Select High Player Rank Up Channel", components: [new ActionRowBuilder<any>().addComponents(menuHighPlayerRankUp)],flags:["Ephemeral"]  });

                        const responseHighPlayerRankUp = await i.channel?.awaitMessageComponent({ filter: (m) => m.customId === menuHighPlayerRankUp.data.custom_id && m.user.id === i.user.id, time: ms("2m") });
                        if (!responseHighPlayerRankUp?.id || !responseHighPlayerRankUp.isChannelSelectMenu()) return;
                        const selectedChannelHighPlayerRankUp = responseHighPlayerRankUp.values[0];
                        server.highPlayerRankUpChannel = selectedChannelHighPlayerRankUp;
                        i.deleteReply();
                        await genrateReplyMessage(interaction, server, { key, editReply: true });
                        break;
                    case "highPlayerRankDown":
                        const menuHighPlayerRankDown = channelMenu("Select High Player Rank Down Channel", server.highPlayerRankDownChannel || null);
                        await i.reply({ content: "Select High Player Rank Down Channel", components: [new ActionRowBuilder<any>().addComponents(menuHighPlayerRankDown)],flags:["Ephemeral"] });
                        const responseHighPlayerRankDown = await i.channel?.awaitMessageComponent({ filter: (m) => m.customId === menuHighPlayerRankDown.data.custom_id && m.user.id === i.user.id, time: ms("2m") });
                        if (!responseHighPlayerRankDown?.id || !responseHighPlayerRankDown.isChannelSelectMenu()) return;
                        const selectedChannelHighPlayerRankDown = responseHighPlayerRankDown.values[0];
                        server.highPlayerRankDownChannel = selectedChannelHighPlayerRankDown;
                        i.deleteReply();
                        await genrateReplyMessage(interaction, server, { key, editReply: true });
                        break;
                }
            }

        })
        const updateWatcher = async () => {

            await genrateReplyMessage(interaction, server, { key, editReply: true });
        };
        server.on("update", updateWatcher);
        collcter?.on("end", () => {

            server.removeListener("update", updateWatcher);
            disabledInteraction(interaction);
        });




    }
}

const channelMenu = (placeHodler: string, defaultValue: string | null): ChannelSelectMenuBuilder => {
    const menu = new ChannelSelectMenuBuilder().setCustomId(generateUniqueNumber()).setPlaceholder(placeHodler).setMinValues(0).setMaxValues(1);
    if(defaultValue) menu.setDefaultChannels(defaultValue);
    return menu;
}
const genrateReplyMessage = async (interaction: Interaction, server: server, messageConfig: { key: string, editReply?: boolean, update?: boolean, reply?: boolean }) => {
    if (!interaction.inCachedGuild()) return;

    const embed = new EmbedBuilder().setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() });
    let comp: any[] = [];
    let buttons: any = [];
    let disc = `## Ranking Alerts\n`;
    let rankUpChannel = server.rankUpChannel ? interaction.guild.channels.cache.get(server.rankUpChannel) : null;
    let rankDownChannel = server.rankDownChannel ? interaction.guild.channels.cache.get(server.rankDownChannel) : null;
    let rankUpHighPlayer = server.highPlayerRankUpChannel ? interaction.guild.channels.cache.get(server.highPlayerRankUpChannel) : null;
    let rankDownHighPlayer = server.highPlayerRankDownChannel ? interaction.guild.channels.cache.get(server.highPlayerRankDownChannel) : null;
    disc += `-# Ranking notifications are sent to the following channels\n`;
    disc += `- **Rank Up:** ${rankUpChannel ? rankUpChannel.toString() : `Not Set`}\n`;
    disc += `- **Rank Down:** ${rankDownChannel ? rankDownChannel.toString() : `Not Set`}\n`;
    disc += `- **High Player Rank Up:** ${rankUpHighPlayer ? rankUpHighPlayer.toString() : `Not Set`}\n`;
    disc += `- **High Player Rank Down:** ${rankDownHighPlayer ? rankDownHighPlayer.toString() : `Not Set`}\n`;
    disc += `-# To set a channel click on the button below\n`;




    const rankUp = new ButtonBuilder().setCustomId(`rankUp_${messageConfig.key}`).setLabel(`Rank Up`).setStyle(ButtonStyle.Primary);
    const rankDown = new ButtonBuilder().setCustomId(`rankDown_${messageConfig.key}`).setLabel(`Rank Down`).setStyle(ButtonStyle.Primary);
    const highPlayerRankUp = new ButtonBuilder().setCustomId(`highPlayerRankUp_${messageConfig.key}`).setLabel(`High Player Rank Up`).setStyle(ButtonStyle.Primary);
    const highPlayerRankDown = new ButtonBuilder().setCustomId(`highPlayerRankDown_${messageConfig.key}`).setLabel(`High Player Rank Down`).setStyle(ButtonStyle.Primary);
    buttons.push(rankUp, rankDown, highPlayerRankUp, highPlayerRankDown)


    embed.setDescription(disc);
    buttons.chunk(5).forEach((row: any) => {
        comp.push(new ActionRowBuilder<any>().addComponents(row));
    });
    comp = comp.slice(0, 5)

    if (messageConfig.editReply && interaction.isChatInputCommand()) {
        await interaction.editReply({ embeds: [embed], components: comp });
    }
    else if (messageConfig.update && (interaction.isButton() || interaction.isAnySelectMenu())) {
        await interaction.update({ embeds: [embed], components: comp });
    }
    else if (messageConfig.reply && interaction.isChatInputCommand()) {
        await interaction.reply({ embeds: [embed], components: comp, flags: ["Ephemeral"] });

    }

}


import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Interaction, ModalBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../core/Command";
import { settingsMain, SettingsManager } from "../../class/settingsManager";
import { EmbedBuilder } from "../../class/customEmbed";
import { ms } from "../../utils/ms";
import { disabledInteraction, errorMessage, formatDiscordTimestamp, generateUniqueNumber, textInput } from "../../utils/tools";
import { client } from "../../bot";

export default class configSeason extends Command {
    public cooldown = this.client.config.settings.cooldown;
    public category = this.client.config.settings.category;
    public ownerOnly = true;

    public data = new SlashCommandBuilder()
        .setName("settings")
        .setDescription("Configure season settings, leaderboard time, and decay options")



    public async execute(interaction: ChatInputCommandInteraction) {

        const key = interaction.id

        await genrateReplyMessage(interaction, { key, reply: true });
        const collcter = interaction.channel?.createMessageComponentCollector({ filter: (i) => i.customId.endsWith(`_${key}`) && i.user.id === interaction.user.id, max: 0, time: ms("5m") })
        if (!collcter) return;
        collcter?.on("collect", async (i: Interaction) => {

            if (i.isButton()) {
                const id = i.customId.split("_")[0];
                switch (id) {
                    case "decay":
                        SettingsManager.decay = !SettingsManager.decay;
                        settingsMain.emit("update", true);
                        await genrateReplyMessage(i, { key, update: true });


                        break;
                    case "forceRefresh":
                        const lastRefresh = SettingsManager._data?.lastRefresh || 0;
                        if (Date.now() - lastRefresh < ms("1h")) return errorMessage("You can only force refresh once every hour", i.reply.bind(i));
                        this.client.emit("leaderboardUpdate");
                        settingsMain.emit("update", true);
                        await genrateReplyMessage(i, { key, update: true });
                        break;
                    case "globalLock":
                        SettingsManager.disabled = !SettingsManager.disabled;
                        settingsMain.emit("update", true);
                        await genrateReplyMessage(i, { key, update: true });
                        break;
                    case "refreshTime":

                        const oldTIme: string = SettingsManager._data?.refreshTime && ms(SettingsManager._data?.refreshTime) || "0"

                        const modal = new ModalBuilder().setTitle(`Change Leaderboard refresh time`).setCustomId(generateUniqueNumber()).addComponents(
                            textInput("Time", `${oldTIme}`, `refreshtime`, 5, 1, "Type The new refresh time", true),

                        )

                        await i.showModal(modal);
                        const response = await i.awaitModalSubmit({ filter: (m) => m.customId === modal.data.custom_id && i.user.id === m.user.id, time: ms("2m") })
                        if (!response?.id) return;
                        const timeFiled = response.fields.getField("refreshtime")?.value as string
                        const time = timeFiled ? ms(timeFiled) : 0;
                        if (!timeFiled || !time || time < ms("5m") || isNaN(time)) return errorMessage("Invalid time provided", response.deferUpdate.bind(response));
                        response.deferUpdate().catch((err) => null);
                        if (timeFiled.toLowerCase().trim() === oldTIme.toLowerCase().trim()) return;
                        SettingsManager.refreshTime = time;
                        settingsMain.emit("update", true);
                        await genrateReplyMessage(interaction, { key, editReply: true });
                        break;
                        
                }
            }

        })
        const updateWatcher = async () => {

            await genrateReplyMessage(interaction, { key, editReply: true });
        };
        settingsMain.on("update", updateWatcher);
        collcter?.on("end", () => {

            settingsMain.removeListener("update", updateWatcher);
          disabledInteraction(interaction);
        });



    }
}
const genrateReplyMessage = async (interaction: Interaction, messageConfig: { key: string, editReply?: boolean, update?: boolean, reply?: boolean }) => {
    if (!interaction.inCachedGuild()) return;
    const settings = SettingsManager;
    const embed = new EmbedBuilder().setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() }).setThumbnail(`${client.user?.displayAvatarURL()}`)
    let comp: any[] = [];
    let buttons: any = [];
    let disc = `## Global Bot Settings\n\n`;
    disc += `- **Decay:** \`${settings.decay ? `Enabled` : "Disabled"}\`\n`;
    // @ts-ignore
    disc += `- **Leaderboard Refresh Time:** \`${ms(settings._data?.refreshTime, { long: true })}\`\n`;
    disc += `- **Force Disable:** \`${settings.disabled ? `Enabled` : "Disabled"}\`\n`;
    disc += `- **Last Refresh:** ${settings._data?.lastRefresh ? formatDiscordTimestamp(settings._data?.lastRefresh, "Date") : `-`}\n`;
    disc += `- **First Load:** \`${settings._data?.firstLoad ? `Yes` : `No`}\`\n`;

    disc += `-# Changes made to these settings will apply to all other servers. Be careful!`


    const decayButton = new ButtonBuilder().setCustomId(`decay_${messageConfig.key}`).setLabel(`Decay: ${settings.decay ? `Enabled` : "Disabled"}`).setStyle(settings.decay ? ButtonStyle.Danger : ButtonStyle.Success);
    const forceRefresh = new ButtonBuilder().setCustomId(`forceRefresh_${messageConfig.key}`).setLabel(`Force Refresh`).setStyle(ButtonStyle.Primary);
    const globalLock = new ButtonBuilder().setCustomId(`globalLock_${messageConfig.key}`).setLabel(`Force Disable: ${settings.disabled ? `Enabled` : "Disabled"}`).setStyle(settings.disabled ? ButtonStyle.Danger : ButtonStyle.Success);
    const refreshTime = new ButtonBuilder().setCustomId(`refreshTime_${messageConfig.key}`).setLabel(`Refresh Time`).setStyle(ButtonStyle.Primary);
    buttons.push(decayButton, forceRefresh, globalLock, refreshTime);











































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


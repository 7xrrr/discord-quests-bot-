

import { ActionRowBuilder, AutocompleteInteraction, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Interaction, MessageComponentInteraction, ModalBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, TextInputBuilder, TextInputStyle } from "discord.js";
import configSeason from "./config";
import { Rank, rankManager } from "../../class/RankManager";
import { disableComponents, disabledInteraction, errorMessage, generateUniqueNumber, guildIcon, isHexColor, textInput } from "../../utils/tools";
import { EmbedBuilder } from "../../class/customEmbed";

import config from "../../config";
import { ms } from "../../utils/ms";
import { RewardManager } from "../../class/rewardManager";


export default class startSeason extends configSeason {

    public cooldown = this.client.config.seasonStart.cooldown;
    public category = this.client.config.seasonStart.category;



    public ownerOnly: boolean = true
    public isSubcommand: boolean = true;
    public subCommandName?: string = "edit";

    public data = new SlashCommandBuilder()
        .setName("ranks")
        .setDescription("edit specific rank")


    public async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const focusedValue = interaction.options.getFocused();
        const choices = await (await rankManager.getRanks()).map(rank => ({ name: rank.name, value: rank.rankId }));
        const filtered = focusedValue.trim().length > 0 ? choices.filter(choice => choice.name.toLowerCase().includes(focusedValue)).slice(0, 25) : choices.slice(0, 25);
  
        await interaction.respond(
            filtered
        );
    }





    public async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: "Ephemeral" });
        const rankId = interaction.options.getString("name", true);
        const rank = rankId && await rankManager.getRank(rankId);
        if (!rankId || !rank) return await errorMessage("Rank not found", interaction.editReply.bind(interaction));
        const key = interaction.id;
        await genrateReplyMessage(interaction, rank, { key, editReply: true });


        const collcter = interaction.channel?.createMessageComponentCollector({ filter: (i) => i.customId.endsWith(`_${key}`) && i.user.id === interaction.user.id, max: 0, time: ms("5m") })
        if (!collcter) return;
        collcter?.on("collect", async (i: Interaction) => {

            if (i.isButton()) {
                const id = i.customId.split("_")[0];
                switch (id) {
                    case "changeMode":
                        rank.promoteMode = rank.promoteMode === "auto" ? "competitive" : "auto";
                        await genrateReplyMessage(i, rank, { key, update: true });
                        break;
                    case "editPoints":
                        const modal = new ModalBuilder().setTitle(`Edit ${rank.name} Points Requirements`)
                            .setCustomId(generateUniqueNumber())
                            .addComponents(new ActionRowBuilder<any>().addComponents(new TextInputBuilder().setCustomId(`points`).setLabel(`Points`).setValue(`${rank.pointsrequirements || 0}`).setMaxLength(5).setMinLength(1).setRequired(true).setStyle(TextInputStyle.Short).setPlaceholder("Type The new Points Value")))
                        await i.showModal(modal);
                        const response = await i.awaitModalSubmit({ filter: (m) => m.customId === modal.data.custom_id && i.user.id === m.user.id, time: ms("2m") })
                        if (!response?.id) return;

                        const value = Number(response.fields.getField("points")?.value?.trim());
                        if (isNaN(value)) return errorMessage("Invalid Number", response.reply.bind(i), true);
                        if (value <= 0) return errorMessage("Points must be greater than 0", response.reply.bind(i), true);
                        const samePointsRank = (await rankManager.getRanks()).filter(e => e.pointsrequirements === value);
                        if (samePointsRank) return errorMessage("You can't add two ranks with the same points requirement", response.reply.bind(i), true);
                        response.deferUpdate().catch((err) => null);
                        rank.pointsrequirements = value;
                        await genrateReplyMessage(interaction, rank, { key, editReply: true });
                        break
                    case "toggleDecay":
                        rank.decay = !rank.decay === true;
                        await genrateReplyMessage(i, rank, { key, update: true });
                        break;
                    case "editLimit":
                        (async () => {
                            const modal = new ModalBuilder().setTitle(`Edit ${rank.name} User Limit`)
                                .setCustomId(generateUniqueNumber())
                                .addComponents(
                                    textInput("Limit", `${rank.limit || 0}`, `limit`, 5, 1, "Type The new User Limit Value", true))
                            await i.showModal(modal);
                            const response = await i.awaitModalSubmit({ filter: (m) => m.customId === modal.data.custom_id && i.user.id === m.user.id, time: ms("2m") })
                            if (!response?.id) return;
                            const value = Number(response.fields.getField("limit")?.value?.trim());
                            if (isNaN(value)) return errorMessage("Invalid Number", response.reply.bind(i), true);
                            if (value <= 0) return errorMessage("Points must be greater than 0", response.reply.bind(i), true);
                            response.deferUpdate().catch((err) => null);
                            rank.limit = value;
                            await genrateReplyMessage(interaction, rank, { key, editReply: true });



                        })()
                        break;
                    case "editName":
                        (async () => {
                            const modal = new ModalBuilder().setTitle(`Edit ${rank.name} Name`)
                                .setCustomId(generateUniqueNumber())
                                .addComponents(
                                    textInput("Name", `${rank.name}`, `name`, 50, 1, "Type The new rank name", true))
                            await i.showModal(modal);
                            const response = await i.awaitModalSubmit({ filter: (m) => m.customId === modal.data.custom_id && i.user.id === m.user.id, time: ms("2m") })
                            if (!response?.id) return;
                            const value = response.fields.getField("name")?.value?.trim()
                            if (value === rank.name) return errorMessage("Name is the same", response.reply.bind(i), true);
                            if (!value) return errorMessage("Invalid Name", response.reply.bind(i), true);
                            const sameName = (await rankManager.getRanks()).find(e => e.name === value);
                            if (sameName) return errorMessage("You can't add two ranks with the same name", response.reply.bind(i), true);
                            rank.name = value;
                            response.deferUpdate().catch((err) => null);
                            await genrateReplyMessage(interaction, rank, { key, editReply: true });



                        })()
                        break;
                    case "deleteRank":
                        (async () => {
                            const confirmButton: any = new ButtonBuilder().setCustomId(`confirmDelete_${i.id}`).setLabel(`Confirm`).setStyle(ButtonStyle.Danger);
                            const cancelButton: any = new ButtonBuilder().setCustomId(`cancelDelete_${i.id}`).setLabel(`Cancel`).setStyle(ButtonStyle.Secondary);
                            const embed = new EmbedBuilder().setDescription(`Are you sure you want to delete ${rank.name}? there's no go back`);
                            const comp = [new ActionRowBuilder<any>().addComponents(confirmButton, cancelButton)]
                            await i.reply({ embeds: [embed], components: comp, flags: ["Ephemeral"] });

                            const response = await i.channel?.awaitMessageComponent({ filter: (c) => [confirmButton.data.custom_id, cancelButton.data.custom_id].includes(c.customId) && c.isButton() && c.user.id === i.user.id, time: ms("2m") });
                            if (!response?.id) return;
                            const deleteRank = response.customId === confirmButton.data.custom_id;

                            if (!deleteRank) {
                                response.deferReply();
                                i.deleteReply();
                                return
                            }
                            rank.delete();
                            response.update({ embeds: [new EmbedBuilder().setDescription(`Rank ${rank.name} Deleted`)], components: disableComponents(comp) })







                        })()
                        break
                    case "decaySettings":
                        (async () => {
                            const oldInterval = ms(rank.rankDoc.decay?.decayInterval || config.decay.decayInterval);
                            const oldInActive = ms(rank.rankDoc.decay?.inActiveTime || config.decay.inActiveTime);
                            const oldRate = rank.rankDoc.decay?.decayRate || config.decay.decayRate;
                            const modal = new ModalBuilder().setTitle(`Change Decay Settings For ${rank.name}`).setCustomId(generateUniqueNumber()).addComponents(
                                textInput("Decay Rate", `${oldRate}%`, `decayRate`, 3, 1, "Type The new Decay Rate", true),
                                textInput("Decay Interval", `${oldInterval}`, `decayInterval`, 50, 1, "Type The new Decay Interval", true),
                                textInput("Inactivity Timeout", `${oldInActive}`, "inActiveTime", 50, 1, "Type The New Inactivity Timeout", true))
                            await i.showModal(modal);
                            const response = await i.awaitModalSubmit({ filter: (m) => m.customId === modal.data.custom_id && i.user.id === m.user.id, time: ms("2m") })
                            if (!response?.id) return;
                            let decayRate = parseInt(response.fields.getField("decayRate")?.value?.trim());
                            if (isNaN(decayRate)) return errorMessage("Invalid Number", response.reply.bind(i), true);
                            if (decayRate < 0 || decayRate > 100) return errorMessage("Decay Rate must be between 0 and 100", response.reply.bind(i), true);
                            const decayIntervalFiled = response.fields.getField("decayInterval")?.value?.toLowerCase();
                            const inActiveFiled = response.fields.getField("inActiveTime")?.value?.toLowerCase();



                            const decayInterval = decayIntervalFiled && typeof decayIntervalFiled === "string" ? ms(decayIntervalFiled) : undefined;
                            if (decayInterval === undefined) { return errorMessage("Invalid Decay Time", response.reply.bind(i), true); }
                            if (!decayInterval) return errorMessage("Invalid Time", response.reply.bind(i), true);
                            if (decayInterval <= ms("5m")) return errorMessage("Decay Interval must be greater than 5 minutes", response.reply.bind(i), true);

                            const inActiveTime = inActiveFiled && typeof inActiveFiled === "string" ? ms(inActiveFiled) : undefined;
                            if (inActiveTime === undefined || !inActiveTime) { return errorMessage("Invalid Inactivity Timeout", response.reply.bind(i), true) };
                            if (inActiveTime <= ms("5m")) return errorMessage("Inactivity Timeout must be greater than 5 minutes", response.reply.bind(i), true);
                            if (decayInterval && decayIntervalFiled !== oldInterval.trim().toLowerCase()) {
                                rank.decayInterval = decayInterval;
                            }
                            if (inActiveTime && inActiveFiled !== oldInActive.trim().toLowerCase()) rank.inActiveTime = inActiveTime;
                            if (inActiveTime && inActiveFiled !== oldInActive.trim().toLowerCase()) rank.inActiveTime = inActiveTime;
                            if (decayRate && decayRate !== oldRate) rank.decayRate = decayRate;
                            response.deferUpdate().catch((err) => null);
                            await genrateReplyMessage(interaction, rank, { key, editReply: true });

                        })()
                        break
                    case "theme":
                        (async () => {
                            const oldMainColor = rank.colorMain;
                            const oldSecondryColor = rank.colorSecondary;

                            const modal = new ModalBuilder().setTitle(`Change Decay Settings For ${rank.name}`).setCustomId(generateUniqueNumber()).addComponents(
                                textInput("Main Color", `${oldMainColor}`, `mainColor`, 50, 1, "Type The new Main Color", true),
                                textInput("Secondry Color", `${oldSecondryColor}`, `secondryColor`, 50, 1, "Type The new Secondry Color", true))

                            await i.showModal(modal);
                            const response = await i.awaitModalSubmit({ filter: (m) => m.customId === modal.data.custom_id && i.user.id === m.user.id, time: ms("2m") })
                            if (!response?.id) return;
                            let mainColor = response.fields.getField("mainColor")?.value?.trim();
                            let secondryColor = response.fields.getField("secondryColor")?.value?.trim();
                            if (!mainColor || !secondryColor) return errorMessage("Invalid Color", response.reply.bind(i), true);
                            if (!mainColor.startsWith("#")) mainColor = `#${mainColor}`;
                            if (!secondryColor.startsWith("#")) secondryColor = `#${secondryColor}`;
                            if (!isHexColor(mainColor) || !isHexColor(secondryColor)) return errorMessage("Invalid Color", response.reply.bind(i), true);
                            response.deferUpdate().catch((err) => null);
                            if (mainColor === oldMainColor && secondryColor === oldSecondryColor) return
                            if (mainColor !== oldMainColor) rank.colorMain = mainColor;
                            if (secondryColor !== oldSecondryColor) rank.colorSecondary = secondryColor;
                            response.deferUpdate().catch((err) => null);
                            await genrateReplyMessage(interaction, rank, { key, editReply: true });
                        })()
                        break
                        case "editRewards":
                            (async () => {
                                const rewards = await RewardManager.getRewards();
                                const rewardsKeys = rewards.map(reward => ({ label: reward.name, value: reward.id,emoji: `🎁`,default:rank.rewards?.includes(reward.id) }));
                                const rewardsKeysFiltered = rewardsKeys.slice(0, 25);
                                const menu = new StringSelectMenuBuilder().setCustomId(`rewards_${key}`).setPlaceholder("Select a reward").addOptions(rewardsKeysFiltered).setMinValues(0).setMaxValues(rewardsKeysFiltered.length)
                                await i.reply({ content: "Select the rewards you want to add", components: [new ActionRowBuilder<any>().addComponents(menu)], ephemeral: true });
                                const response = await i.channel?.awaitMessageComponent({ filter: (m) => m.customId === menu.data.custom_id && m.user.id === i.user.id, time: ms("2m") });
                                if (!response?.id || !response.isStringSelectMenu()) return;
                                const selectedRewards = response.values;
                                if(!selectedRewards) return errorMessage("No rewards selected", response.reply.bind(response), true);
                                rank.rewards = selectedRewards;
                                i.deleteReply();
                                
                               
                                await genrateReplyMessage(interaction, rank, { key, editReply: true });
                            })()
                            break
                }






            }

        });
        const updateWatcher = async () => {

            await genrateReplyMessage(interaction, rank, { key, editReply: true });
        };



        rank.on("update", updateWatcher);
        rank.on("delete", () => { disabledInteraction(interaction); collcter.stop(); });
        collcter?.on("end", () => {
            if (rank.deleted) return;
            disabledInteraction(interaction);
            rank.removeListener("update", updateWatcher);
        });






    }


}

const genrateReplyMessage = async (interaction: Interaction, rank: Rank, messageConfig: { key: string, editReply?: boolean, update?: boolean }) => {
    if (!interaction.inCachedGuild()) return;
    const embed = new EmbedBuilder().setColor(`#${rank.colorMain.replace("#", "")}`).setThumbnail(guildIcon(interaction.guild)).setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
    let comp: any[] = []
    let buttons = []
    let disc = ``;

    disc += `- **Name:** \`${rank.name}\`\n`
    disc += `- **ID:** \`${rank.rankId}\`\n`
    disc += `- **Points:** \`${rank.pointsrequirements.toLocaleString()}\`\n`;
    disc += `- **Mode:** \`${rank.promoteMode}\`\n`;
    if (rank.promoteMode === "competitive") {
        disc += `- **Max Users:** \`${rank.limit}\`\n`;
    }
    disc += `- **rewards :** \`${rank.rewards?.length || 0}\`\n`;


    disc += `\n## Decay System\n`;
    disc += `- **Decay:** \`${rank.decay === true ? "Enabled" : "Disabled"}\`\n`;
    disc += `- **Decay Rate:** \`${rank.decayRate}%\`\n`;
    disc += `- **Decay Interval:** \`${ms(rank.rankDoc.decay?.decayInterval || config.decay.decayInterval)}\`\n`;
    disc += `- **Inactive Limit:** \`${ms(rank.rankDoc.decay?.inActiveTime || config.decay.inActiveTime)}\`\n`

    embed.setDescription(disc);
    const editName = new ButtonBuilder().setCustomId(`editName_${messageConfig.key}`).setLabel(`Edit Name`).setStyle(ButtonStyle.Primary);
    const changeModeButton = new ButtonBuilder().setCustomId(`changeMode_${messageConfig.key}`).setLabel(`Mode: ${rank.promoteMode}`).setStyle(rank.promoteMode === "auto" ? ButtonStyle.Primary : ButtonStyle.Danger);
    const editPoints = new ButtonBuilder().setCustomId(`editPoints_${messageConfig.key}`).setLabel(`Edit Points`).setStyle(ButtonStyle.Secondary);
    const toggleDecay = new ButtonBuilder().setCustomId(`toggleDecay_${messageConfig.key}`).setLabel(`Decay: ${rank.decay ? "enabled" : "disabled"}`).setStyle(rank.decay ? ButtonStyle.Danger : ButtonStyle.Success);
    const decaySettings = new ButtonBuilder().setCustomId(`decaySettings_${messageConfig.key}`).setLabel(`Decay Settings`).setStyle(ButtonStyle.Secondary).setDisabled(!rank.decay);
    const editRewards = new ButtonBuilder().setCustomId(`editRewards_${messageConfig.key}`).setLabel(`Edit Rewards`).setStyle(ButtonStyle.Secondary);
    const deleteRank = new ButtonBuilder().setCustomId(`deleteRank_${messageConfig.key}`).setLabel(`Delete`).setStyle(ButtonStyle.Danger);
    const editLimit = new ButtonBuilder().setCustomId(`editLimit_${messageConfig.key}`).setLabel(`Edit Limit`).setStyle(ButtonStyle.Secondary).setDisabled(rank.promoteMode !== "competitive");
    const themeButton = new ButtonBuilder().setCustomId(`theme_${messageConfig.key}`).setLabel(`Theme`).setStyle(ButtonStyle.Secondary);
    buttons.push(editName, changeModeButton, editPoints, toggleDecay, decaySettings, editRewards, editLimit, themeButton, deleteRank);
    buttons.chunk(5).forEach(row => {
        comp.push(new ActionRowBuilder<any>().addComponents(row));
    });
    comp = comp.slice(0, 5)







    if (messageConfig.editReply && interaction.isChatInputCommand()) {
        await interaction.editReply({ embeds: [embed], components: comp });
    }
    else if (messageConfig.update && (interaction.isButton() || interaction.isAnySelectMenu())) {
        await interaction.update({ embeds: [embed], components: comp });
    }







}
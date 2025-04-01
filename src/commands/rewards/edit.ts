import { ActionRowBuilder, AutocompleteInteraction, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Interaction, ModalBuilder, SlashCommandBuilder } from "discord.js";
import configSeason from "./config";
import { Reward, RewardManager } from "../../class/rewardManager";
import { disableComponents, disabledInteraction, errorMessage, fetchDiscohookUrl, formatDiscordTimestamp, generateUniqueNumber, getUserValues, guildIcon, replaceKeysWithValues, successMessage, textInput } from "../../utils/tools";
import { ms } from "../../utils/ms";
import { EmbedBuilder } from "../../class/customEmbed";
import rewardKeys from "../../config/rewardKeys";
import { PlayerManager } from "../../class/PlayerManager";


export default class startSeason extends configSeason {

    public cooldown = this.client.config.rewardCreate.cooldown;
    public category = this.client.config.rewardCreate.category;

    public ownerOnly: boolean = true
    public isSubcommand: boolean = true;
    public subCommandName?: string = "points";

    public data = new SlashCommandBuilder()
        .setName("reward")
        .setDescription("Edit/View/Create the rewards of the server")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("create")
                .setDescription("Create a new reward")
                .addStringOption((option) =>
                    option.setName("name")
                        .setDescription("Name of the reward")
                        .setRequired(true)
                        .setMinLength(2)
                )
                .addIntegerOption((option) =>
                    option.setName("requirement_points")
                        .setDescription("Required points for this reward")
                        .setRequired(true)
                        .setMinValue(0) // Ensures positive numbers
                        .setMaxValue(10000) // Ensures a reasonable cap
                )
                .addStringOption((option) =>
                    option.setName("color")
                        .setDescription("Color of the reward (hex or name)")
                        .setRequired(true)
                )
        )

    public async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const focusedValue = interaction.options.getFocused();

        const choices = (await RewardManager.getRewards()).map(reward => ({ name: `${reward.name}`, value: reward.id }));

        const filtered = focusedValue.trim().length > 0 ? choices.filter(choice => choice.name.toLowerCase().includes(focusedValue)).slice(0, 25) : choices.slice(0, 25);
  
        await interaction.respond(
            filtered
        );
    }

    public async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: "Ephemeral" });
        const rewardName = interaction.options.getString("name");
        const reward = rewardName ? await RewardManager.getReward(rewardName) : null;
        if (!reward) return errorMessage("Reward not found", interaction.editReply.bind(interaction));
        const key = interaction.id;
        await genrateReplyMessage(interaction, reward, { key, editReply: true });


        const collcter = interaction.channel?.createMessageComponentCollector({ filter: (i) => i.customId.endsWith(`_${key}`) && i.user.id === interaction.user.id, max: 0, time: ms("5m") })
        if (!collcter) return;
        collcter?.on("collect", async (i: Interaction) => {

            if (i.isButton()) {
                const id = i.customId.split("_")[0];
                switch (id) {
                    case "editName":
                        (async () => {
                            const modal = new ModalBuilder().setTitle(`Edit ${reward.name} Name`)
                                .setCustomId(generateUniqueNumber())
                                .addComponents(
                                    textInput("Name", `${reward.name}`, `name`, 50, 1, "Type The new reward name", true))
                            await i.showModal(modal);
                            const response = await i.awaitModalSubmit({ filter: (m) => m.customId === modal.data.custom_id && i.user.id === m.user.id, time: ms("2m") })
                            if (!response?.id) return;
                            const value = response.fields.getField("name")?.value?.trim()
                            if (!value) return errorMessage("Invalid Name", response.reply.bind(response), true);
                            const sameName = (await RewardManager.getRewards()).find(e => e.name === value);
                            if (sameName) return errorMessage("You can't add two ranks with the same name", response.reply.bind(response), true);
                            reward.name = value;
                            response.deferUpdate().catch((err) => null);
                            await genrateReplyMessage(interaction, reward, { key, editReply: true });
                        })()
                        break;
                    case "editMessage":
                        (async () => {
                            const oldLink = reward.messageURL;
                            const modal = new ModalBuilder().setTitle(`Edit ${reward.name} Message`)
                                .setCustomId(generateUniqueNumber())
                                .addComponents(
                                    textInput(`Message`, `${reward.messageURL}`, `message`, 2000, 5, "Type The new reward link", true)
                                )
                            await i.showModal(modal);
                            const response = await i.awaitModalSubmit({ filter: (m) => m.customId === modal.data.custom_id && i.user.id === m.user.id, time: ms("2m") })
                            if (!response?.id) return;
                            const value = response.fields.getField("message")?.value?.trim()
                            if (value === oldLink) return response.deferUpdate().catch((err) => null);
                            const link = await fetchDiscohookUrl(value);
                            if (!link || link.code === 1 || !link.link || !link.shortLink || !link.content) return errorMessage("Invalid Link", response.reply.bind(response), true);
                            reward.messageURL = link.shortLink;
                            reward.payload = link.content;

                            response.deferUpdate();
                            await genrateReplyMessage(interaction, reward, { key, editReply: true });
                        })()
                        break;
                    case "previewButton":
                        (async () => {
                            await i.deferReply({
                                flags: ["Ephemeral"]
                            })
                            const user = interaction.user;
                            const player = await PlayerManager.getUser(user.id, true);
                            if (!player) return errorMessage("You are not registered in the database", interaction.editReply.bind(interaction));
                            const values = getUserValues(user, player);
                            const finalMessage = replaceKeysWithValues(reward.payload, values);
                            i.editReply(finalMessage);




                        })()
                        break;
                    case "deleteButton":
                        (async () => {
                            const confirmButton: any = new ButtonBuilder().setCustomId(generateUniqueNumber()).setLabel(`Confirm`).setStyle(ButtonStyle.Danger);
                            const cancelButton: any = new ButtonBuilder().setCustomId(generateUniqueNumber()).setLabel(`Cancel`).setStyle(ButtonStyle.Secondary);
                            const embed = new EmbedBuilder().setDescription(`Are you sure you want to delete ${reward.name}? there's no go back`);
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
                            reward.delete();
                            response.update({ embeds: [new EmbedBuilder().setDescription(`reward ${reward.name} Deleted`)], components: disableComponents(comp) })

                        })()
                        break
                        case "sentDm":
                            (async () => {
                                reward.dmMessage = reward.dmMessage ? false : true;
                                await genrateReplyMessage(i, reward, { key, update: true });
                            })()
                            break
                            case "keysButton":
                                (async () => {
                                    const keys = Object.keys(rewardKeys).map(key => `- \`${key}\`: ${rewardKeys[key].description}`).join("\n");
                                    const disc = `## Variables List:\n\n${keys}\n\n-# You can use variables in your message to personalize it for each user. Simply include the variable inside \`{}\` brackets, and it will be replaced with the actual value.`
                                    const embed = new EmbedBuilder().setDescription(disc);
                                    await i.reply({ embeds: [embed], flags: ["Ephemeral"] })
                                })()
                                break
                }
            }


        });
        const updateWatcher = async () => {

            await genrateReplyMessage(interaction, reward, { key, editReply: true });
        };



        reward.on("update", updateWatcher);
        reward.on("delete", () => { disabledInteraction(interaction); collcter.stop(); });
        collcter?.on("end", () => {
            if (reward.rewardDoc.deleted) return;
            reward.removeListener("update", updateWatcher);
            disabledInteraction(interaction);
        });
    }
}
const genrateReplyMessage = async (interaction: Interaction, reward: Reward, messageConfig: { key: string, editReply?: boolean, update?: boolean }) => {
    if (!interaction.inCachedGuild()) return;
    const embed = new EmbedBuilder().setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
    const hasMessage = reward.messageURL && reward.payload ? true : false;
    let comp: any[] = []
    let buttons: any[] = []



    let disc = `## Reward Manager\n\n`;
    disc += `- **Name:** \`${reward.name}\`\n`;
    disc += `- **ID: ** \`${reward.id}\`\n`;
    //@ts-ignore
    disc += `- **Create Date:** ${formatDiscordTimestamp(reward.rewardDoc.createdAt?.getTime(), "Date")}\n`;
    //@ts-ignore
    disc += `- **Update Date:** ${formatDiscordTimestamp(reward.rewardDoc.updatedAt?.getTime(), "Date")}\n`;
    disc += `- **Has Message:** \`${hasMessage ? "Yes" : "No"}\`\n`;

    disc += `\n-# You can use dynamic values in your message. Click the Variables List button to see available options!`







    const editName = new ButtonBuilder().setCustomId(`editName_${messageConfig.key}`).setLabel(`Edit Name`).setStyle(ButtonStyle.Primary);
    const editMessage = new ButtonBuilder().setCustomId(`editMessage_${messageConfig.key}`).setLabel(`Edit Message`).setStyle(ButtonStyle.Primary)
    const previewButton = new ButtonBuilder().setCustomId(`previewButton_${messageConfig.key}`).setLabel(`Preview`).setStyle(ButtonStyle.Primary).setDisabled(!hasMessage);
    const deleteButton = new ButtonBuilder().setCustomId(`deleteButton_${messageConfig.key}`).setLabel(`Delete`).setStyle(ButtonStyle.Danger);
    const messageLink = new ButtonBuilder().setURL(reward.messageURL).setLabel(`Message Link`).setStyle(ButtonStyle.Link);
    const sentDm = new ButtonBuilder().setCustomId(`sentDm_${messageConfig.key}`).setLabel(`DM: ${reward.dmMessage ? "Enabled" : "Disabled"}`).setStyle(reward.dmMessage ? ButtonStyle.Primary : ButtonStyle.Danger).setDisabled(!hasMessage);
    const keysButton = new ButtonBuilder().setCustomId(`keysButton_${messageConfig.key}`).setLabel(`Variables List`).setStyle(ButtonStyle.Primary);
    buttons.push(editName, previewButton, editMessage, sentDm, keysButton, deleteButton);
    if (reward.messageURL) buttons.push(messageLink);



































    embed.setDescription(disc);
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


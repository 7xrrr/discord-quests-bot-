

import { ActionRowBuilder, ChatInputCommandInteraction, GuildMember, Interaction, SlashCommandBuilder } from "discord.js";
import configSeason from "../config";
import { Player, PlayerManager } from "../../../class/PlayerManager";
import { errorMessage, formatDiscordTimestamp } from "../../../utils/tools";
import { EmbedBuilder } from "../../../class/customEmbed";
import { ms } from "../../../utils/ms";



export default class startSeason extends configSeason {

    public cooldown = this.client.config.playerEditor.cooldown;
    public category = this.client.config.playerEditor.category;
    public ownerOnly: boolean = true
    public isSubcommand: boolean = true;
    public subCommandName?: string = "player";

    public data = new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Admin commands for managing the ranking system")

        .addSubcommand((subcommand) =>
            subcommand.setName("player").setDescription("Manage player data")
                .addUserOption((option) => option.setName("user").setDescription("User to manage").setRequired(true))
        )

    public async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.inCachedGuild()) return;
        await interaction.deferReply({ flags: "Ephemeral" });

        const member = interaction.options.getMember("user");

        if (!member) return errorMessage("Member not found", interaction.editReply.bind(interaction));
        if (member.user.bot) return errorMessage("Bots are not allowed", interaction.editReply.bind(interaction));
        const player = await PlayerManager.getUser(member.user.id, true);
        if (!player) return errorMessage("Player not found", interaction.editReply.bind(interaction));
        await player.loadSeason();
        const key = interaction.id;
        await genrateReplyMessage(interaction, player, member, { key: key, editReply: true });

        const collcter = interaction.channel?.createMessageComponentCollector({ filter: (i) => i.customId.endsWith(`_${key}`) && i.user.id === interaction.user.id, max: 0, time: ms("5m") })
        if (!collcter) return;
        collcter?.on("collect", async (i: Interaction) => {

            if (i.isButton()) {
                const id = i.customId.split("_")[0];
                switch (id) {
                    case "decay":



                        break;


                }
            }

        })
        /*
        const updateWatcher = async () => {

            await genrateReplyMessage(interaction, { key, editReply: true });
        };
        settingsMain.on("update", updateWatcher);
        collcter?.on("end", () => {

            settingsMain.removeListener("update", updateWatcher);
          disabledInteraction(interaction);
        });


*/







    }


}
const genrateReplyMessage = async (interaction: Interaction, player: Player, member: GuildMember, messageConfig: { key: string, editReply?: boolean, update?: boolean, reply?: boolean }) => {
    if (!interaction.inCachedGuild()) return;

    const embed = new EmbedBuilder().setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() }).setThumbnail(`${member.user?.displayAvatarURL()}`)
    let comp: any[] = [];
    let buttons: any = [];
    let disc = `## ${member.user.displayName} Profile\n\n`;

    disc += `## User Info:\n`
    disc += `- **Total Messages:** \`${player?.userDoc?.ranking?.totalMessages || 0}\`\n`;
    disc += `- **Active Days:** \`${player.ActiveDaysCount}\`\n`;
    disc += `- **Suspended:** \`${player.suspended ? "Yes" : "No"} ${player.suspendedSeason ? "(Season)" : player.suspendedGlobal ? "(Global)" : ""}\`\n`;


    disc += `## Rankings:\n`
    disc += `- **Rank:** \`${player.rank?.name || "-"}\`\n`;
    disc += `- **Points:** \`${player.points}\`\n`;
    disc += `- **Decay:** \`${player.decay ? "Enabled": "Disabled"}\`\n`;






    disc += `## Levels:\n`
    disc += `- **Level:** \`${player.level}\`\n`;
    disc += `- **XP:** \`${player.xp.toLocaleString()}\`\n`;
    disc += `## Dates:\n`
    disc += `- **Created**: ${formatDiscordTimestamp(new Date(player.userDoc.createdAt).getTime(),"Date")}\n`; 
    disc += `- **Last Active**: ${formatDiscordTimestamp(player.lastActive.getTime(),"Date")}\n`;


  



    













































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


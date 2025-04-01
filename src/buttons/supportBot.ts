import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder } from "discord.js";
import config from "../config.js";

export default {
    id: "supportbot", // button custom id here
 

    function: async function (interaction:ButtonInteraction) {
          const buttonsRow = new ActionRowBuilder<any>()
          const comp = [];
        if (config.withButtons.active && config.withButtons.buttons.length > 0) {
            for (let index = 0; index < config.withButtons.buttons.length; index++) {
              const button = config.withButtons.buttons[index];
              let emoji = button?.emoji;
              if (emoji && typeof (emoji) == "function") {
                // @ts-ignore
                emoji = emoji(client);
              }
              const buttonBuilder = new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
              if (button.text) buttonBuilder.setLabel(button.text);
              if (button.url) buttonBuilder.setURL(button.url);
              if (emoji) buttonBuilder.setEmoji(`${emoji}`);
              buttonsRow.addComponents(buttonBuilder);
            }
            comp.push(buttonsRow);
        
          }
   
          
          interaction.reply({
            ephemeral: true,
            embeds: [new EmbedBuilder().setDescription("This button means that you can use our bot to solve this quest.").setColor("DarkRed")],
            components: comp
        })

       
    },
} as any;
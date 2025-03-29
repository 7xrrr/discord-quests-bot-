const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ChannelType, PermissionFlagsBits, TextInputBuilder, TextInputStyle, ModalBuilder } = require('discord.js');
const db = require('pro.db');
const client = require('../..');
const Tickets = require('../../Settings/Tickets.json');
const transcripts = require('discord-html-transcripts');
const db2 = require('../../Settings/Setup.json');

// معرفات الرتب (تأكد من استبدالها بالقيم الصحيحة)
const sportRoleId = '1083147746720100513'; // معرف رتبة سبورت
const adminRoleId = '1306679427219853342'; // معرف رتبة أدمن

client.on('interactionCreate', async (interaction) => {
    if (interaction.customId && interaction.customId.startsWith('closeTicket')) {
        const data = db2[`ticket_${interaction.guild.id}`];
        if (!data) return interaction.reply({ content: '** ❌ | لم يتم إعداد التذكرة.**', ephemeral: true });

        const tickets = db.get('tickets') || [];
        const ticket = tickets.find(ticket => ticket.channel === interaction.channel.id);
        const channel = interaction.guild.channels.cache.get(data.transcripts);
        if (!ticket) return interaction.reply({ content: '** ❌ | لم يتم العثور على التذكرة.**', ephemeral: true });

        // تحقق من صلاحيات المستخدم باستخدام معرّف الرتبة
        const member = interaction.guild.members.cache.get(interaction.user.id);
        if (!member || (!member.roles.cache.has(sportRoleId) && !member.roles.cache.has(adminRoleId) && !member.permissions.has(PermissionFlagsBits.Administrator))) {
            return interaction.reply({ content: '** ❌ | لديك صلاحيات غير كافية لإغلاق هذه التذكرة.**', ephemeral: true });
        }



        const attachment = await transcripts.createTranscript(interaction['channel'], { 
            'limit': -1, 
            'returnType': 'attachment', 
            'filename': 'transcript.html', 
            'saveImages': false, 
            'footerText': 'Powered By iModz7', 
            'poweredBy': false, 
            'ssr': true 
        });

        const Panel = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`transcript_${interaction.channel.id}`)
                    .setLabel('إنشاء رابط سجل التذكرة')
                    .setStyle(4)
                    .setEmoji('🔗')
            );

        const Embed = new EmbedBuilder()
            .setDescription(`تم إغلاق التذكرة بواسطة ${interaction.user}`)
            .setColor("Red");

        const Embed1 = new EmbedBuilder()
            .setDescription('** لوحة الإدارة **')
            .setColor("Red");

        const Owner = interaction.client.users.cache.get(ticket.user);

        switch (interaction.customId) {
            case 'closeTicket':
                interaction.reply({ embeds: [Embed] });
                interaction.channel.delete();
                Embed.setTimestamp().setFooter({ text: `تم إغلاق التذكرة بواسطة ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setFields(
                        { name: 'Ticket ID', value: `${interaction.channel.name.split('-')[1]}`, inline: true },
                        { name: 'Closed By', value: `${interaction.user}`, inline: true },
                        { name: 'Opened By', value: `<@${Owner.id}>`, inline: true },
                        { name: 'Reason', value: 'No Reason', inline: true },
                        { name: 'Closing Time', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                        { name: 'Is Claimed', value: `${ticket.claim || false}`, inline: true }
                    ).setThumbnail(interaction.guild.iconURL({ dynamic: true }));

                Owner.send({ embeds: [Embed], components: [Panel] });
                channel.send({ embeds: [Embed], components: [Panel] });

                // Remove the ticket data from the database
                db.set('tickets', tickets.filter(t => t.channel !== interaction.channel.id));

                break;

            case 'closeTicket_':
                const modal = new ModalBuilder()
                    .setCustomId('closeTicketForm')
                    .setTitle('إغلاق التذكرة');

                const reasonInput = new TextInputBuilder()
                    .setCustomId('reasonInput')
                    .setLabel("سبب إغلاق التذكرة")
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
                modal.addComponents(firstActionRow);

                await interaction.showModal(modal);

                const filter = (i) => i.customId === 'closeTicketForm' && i.user.id === interaction.user.id;
                interaction.awaitModalSubmit({ filter, time: 600000 })
                    .then(async (modalInteraction) => {
                        const reason = modalInteraction.fields.getTextInputValue('reasonInput');
                        const Embed = new EmbedBuilder()
                            .setDescription(`تم إغلاق التذكرة بواسطة ${interaction.user}\nسبب: ${reason}`)
                            .setColor("Red");

                        await modalInteraction.reply({ embeds: [Embed] });
                        interaction.channel.delete();

                        Embed.setTimestamp().setFooter({ text: `تم إغلاق التذكرة بواسطة ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                            .setFields(
                                { name: 'Ticket ID', value: `${interaction.channel.name.split('-')[1]}`, inline: true },
                                { name: 'Closed By', value: `${interaction.user}`, inline: true },
                                { name: 'Opened By', value: `<@${Owner.id}>`, inline: true },
                                { name: 'Reason', value: reason, inline: true },
                                { name: 'Closing Time', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                                { name: 'Is Claimed', value: `${ticket.claim || false}`, inline: true }
                            ).setThumbnail(interaction.guild.iconURL({ dynamic: true }));

                        Owner.send({files: [attachment], embeds: [Embed], components: [Panel] });
                        channel.send({files: [attachment], embeds: [Embed], components: [Panel] });

                        // Remove the ticket data from the database
                        db.set('tickets', tickets.filter(t => t.channel !== interaction.channel.id));
                    })
                    .catch(console.error);
                break;
        }
    }
});

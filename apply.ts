//#region Die IDs
var channel1 = 'ID'; // the channel there the answers are sended
var channels: Array<string> = [
  channel1,
  'ID',
  'ID'
]; // the channels, were the command can be used

var serverGuild = 'GUILD ID';
var rightsForCloseApply = 'ROLE ID';

//#endregion

//#region Die Variablen
var theQuestions: Array<string> = [
  `Question1`, `Question2`, `What is the meaning of life?` //etc...
  
];

var state = false;
var channelId = '';
var oldQuestionId: string = '';
var questionNr = 0;
var theAnswers: Array<string> = [];
//#endregion

const Commands = new discord.command.CommandGroup();

// apply command
Commands.raw('apply', async (msg) => {
  if (channels.includes(msg.channelId)) {
    if (state) {
      await msg.reply(msg.member.toMention() + ' Try it later!');
    } else {
      const guild = await discord.getGuild(serverGuild);
      state = true;

      const permissions = [
        {
          type: discord.Channel.PermissionOverwriteType.ROLE,
          id: guild?.id,
          deny: 0x00000400
        },
        {
          type: discord.Channel.PermissionOverwriteType.MEMBER,
          id: msg.author.id,
          allow: 0x00000800 && 0x00000400
        }
      ];

      const theNewChannel = await guild?.createChannel({
        name: 'Application test',
        type: discord.Channel.Type.GUILD_TEXT,
        permissionOverwrites: permissions
      });

      channelId = theNewChannel!.id;

      const theChannel = await discord.getGuildTextChannel(channelId);
      const theMsg = await theChannel?.sendMessage(theQuestions[questionNr]);
      oldQuestionId = theMsg!.id;
      questionNr++;

      const aMsg = await msg.reply(
        'Answer the questions in: <#' + channelId + '>'
      );

      setTimeout(() => aMsg.delete(), 10000);
    }
  } else {
    await msg.reply("You can't use this command in this channel...");
  }
});

// close apply command
Commands.raw('closeApply', async (msg) => {
  if (msg.member.roles.includes(rightsForCloseApply)) {
    const toDeleteChannel = await discord.getGuildTextChannel(channelId);
    await toDeleteChannel?.delete();
    await resetVariables();

    await msg.reply('Apply has been reseted!');
  } else {
    await msg.reply("You don't have the permission to use this command!");
  }
});

// apply command was written
discord.registerEventHandler('MESSAGE_CREATE', async (msg) => {
  if (msg.channelId == channelId) {
    const msgChannel = await discord.getGuildTextChannel(msg.channelId);
    const oldMsg = await msgChannel!.getMessage(oldQuestionId);
    await oldMsg?.delete();

    theAnswers.push(msg.content);

    await msg.delete();

    if (theQuestions.length == questionNr) {
      const channel = await discord.getGuildTextChannel(channel1);

      await msg.reply(msg.member!.toMention() + ' The test is now over!');
      setTimeout(() => msgChannel?.delete(), 10000);

      const embed = new discord.Embed();
      embed.setTitle('Application of ' + msg.author!.username);
      embed.setColor(0x3f888f);

      for (let i = 0; i < theAnswers.length; i++) {
        if (i == 0) {
          embed.addField({
            name: 'Agreed with the terms and conditions:',
            value: theAnswers[i]
          });
        } else {
          if (theAnswers[i].length <= 1023) {
            embed.addField({
              name: theQuestions[i],
              value: theAnswers[i]
            });
          } else {
            embed.addField({
              name: theQuestions[i] + ' *(part 1)*',
              value: theAnswers[i].slice(0, 1023)
            });
            embed.addField({
              name: theQuestions[i] + ' *(part 2)*',
              value: theAnswers[i].slice(1023, theAnswers[i].length)
            });
          }
        }
      }

      await channel?.sendMessage(embed);

      await resetVariables();
    } else {
      const newQuestion = await msg.reply(theQuestions[questionNr]);
      oldQuestionId = newQuestion.id;

      questionNr++;
    }
  }
});

// Alle 24h

// reset the variables
function resetVariables() {
  state = false;
  channelId = '';
  oldQuestionId = '';
  questionNr = 0;
  theAnswers = [];
}

const { MessageButton, MessageActionRow, MessageMenuOption, MessageMenu } = require("discord-buttons");
const { RequiredArg, Command } = require("./commands.js")

class Poll {
    constructor(message, options, title, time) {
        this.message = message
        this.options = options
        this.users = {}
        this.title = title || "Unnamed Poll"
        this.time = time
    }

    update() {
        let newmsg = new Discord.MessageEmbed()
            .setColor(this.message.member.displayHexColor)
            .setTitle(this.title)
            .setFooter("Expires after " + this.time + " minutes")
            .setTimestamp();
        let voters = "People who voted:\n"
        for (let userid of Object.keys(this.users)) {
            if (this.users[userid]) {
                voters = voters + "<@" + userid + "> "
            }
        }
        if (voters == "People who voted:\n") {
            voters = voters + "`none`"
        }
        newmsg.setDescription(voters)
        for (let buttonname of Object.keys(this.options)) {
            newmsg.addField(buttonname, this.options[buttonname], true)
        }
        this.message.edit("", newmsg)
    }
}

Polls = {}

Commands.poll = new Command("Creates a poll where anyone can vote, you can have 5 different options at max", (message, args) => {
    if (args[5]) {
        throw ("You can only have 5 different options at max.")
    }
    let options = {}
    let buttons = new MessageActionRow()
    let argnum = -1
    for (let buttonname of args) {
        argnum = argnum + 1
        if (argnum < 2) continue
        options[buttonname] = 0
        let button = new MessageButton()
            .setStyle("blurple")
            .setLabel(buttonname)
            .setID(message.id + "-" + buttonname);
        buttons.addComponent(button)
    }
    if (args.length == 0 || !args[2]) {
        buttons.addComponent(new MessageButton()
            .setStyle("green")
            .setLabel("Yes")
            .setID(message.id + "-Yes"))
        buttons.addComponent(new MessageButton()
            .setStyle("red")
            .setLabel("No")
            .setID(message.id + "-No"))
        options["Yes"] = 0
        options["No"] = 0
    }
    message.channel.send("Creating poll...", buttons).then(pollmessage => {
        Polls[message.id] = new Poll(pollmessage, options, args[0] || message.author.username + "'s poll", parseFloat(args[1]) || 5)
        Polls[message.id].update()
        setTimeout(() => {
            pollmessage.edit("[This poll is closed.]", pollmessage.embeds)
            Polls[message.id] = undefined
        }, parseFloat(args[1]) * 60 * 1000 || 300000)
    })
})

client.on('clickButton', async (button) => {
    let split = button.id.split("-")
    let buttonid = split[0]
    let buttonname = split.slice(1).join('-')
    if (Polls[buttonid]) {
        let options = Polls[buttonid].options
        if (options[buttonname] != undefined) {
            await button.reply.defer()
            options[buttonname] = options[buttonname] + 1
            if (Polls[buttonid].users[button.clicker.id] && options[Polls[buttonid].users[button.clicker.id]]) {
                options[Polls[buttonid].users[button.clicker.id]] = options[Polls[buttonid].users[button.clicker.id]] - 1
            }
            if (Polls[buttonid].users[button.clicker.id] == buttonname) {
                options[Polls[buttonid].users[button.clicker.id]] = options[Polls[buttonid].users[button.clicker.id]] - 1
                Polls[buttonid].users[button.clicker.id] = undefined
            } else {
                Polls[buttonid].users[button.clicker.id] = buttonname
            }
            Polls[buttonid].update()
        } else {
            await button.reply.send("Somehow, that isn't one of the poll's option.", true)
        }
    } else {
        await button.reply.send("This poll is closed.", true)
    }
});
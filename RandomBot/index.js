const Discord = require("discord.js");
const bot = new Discord.Client;
const ytdl = require("ytdl-core");
const moment = require("moment");

const token = 'NzM3OTEzODc0OTQyMjYzMzk3.XyER2Q.3WFSWM_KxBRx3vxSDNkvvDWVksA';

const prefix = ">";

var version = "1.0.0";

var servers = {};
var commands = ['help:Displays this message', 'Music', ['play [url]:Plays the audio of the given url', 'skip:Skips the current track', 'stop:Stops audio and leaves voice'],'Information', ['user-info [user ping]:Displays information for pinged user', 'server-info:Displays server information', 'bot-info:Displays bot information']];

bot.on('ready', () => {
    console.log("Bot is up and running")
})

bot.on('message', msg=>{

    bot.user.setActivity();
    
    let args = msg.content.substring(prefix.length).split(" ");
    if (!msg.content.startsWith(prefix)) return;

    switch(args[0]){
        case 'play':



            function play(connection, msg) {
                var server = servers[msg.guild.id];
                if(!server.queue[1]){
                    server.dispatcher = connection.play(ytdl(server.queue[0], {filter: "audio"}));
                }

                server.dispatcher.on("finish", function(){
                    server.queue.shift();
                    if(server.queue[0]){
                        play(connection, msg);
                    } else{
                        connection.disconnect;
                        msg.member.voice.channel.leave();
                    }
                });
            }

            if(!args[1]){
                msg.channel.send('Please provide a link');
                return;
            }

            if(!msg.member.voice.channel){
                msg.channel.send("You must be in a voice channel to play music");
                return;
            }

            if(!servers[msg.guild.id]) servers[msg.guild.id] = {
                queue: []
            }

            var server = servers[msg.guild.id];

            server.queue.push(args[1]);

            const connection = msg.member.voice.channel.join().then(connection =>{
                play(connection, msg);
            });
            break;

        case 'skip':
            var server = servers[msg.guild.id];
            if(server.dispatcher) server.dispatcher.end();
            msg.channel.send("Skipping song");
            break;
        
        case 'stop':
            var server = servers[msg.guild.id];
            if(msg.guild.voice.connection){
                for(var i = server.queue.length -1; i >= 0; i--){
                    server.queue.splice(i, 1);

                }

                server.dispatcher.end();
                msg.channel.send("Ending queue, leaving voice");
                console.log('Left voice');  
            }

            if(msg.guild.connection) msg.guild.voice.connection.disconnect();
            break;

        case 'user-info':

            var mmbr = msg.mentions.members.first() || msg.member;
            var usr = mmbr.user;
            var permBitfield = parseInt(mmbr.permissions.toJSON().toString());

            function toBinary(number) {
                var binaryForm = '+0';
                while (number >= 1) {
                    var newNum = Math.floor(number / 2);
                    if (number != 2 * newNum){
                        binaryForm = '1' + binaryForm;
                    }

                    else if (number / 2 == newNum){
                        binaryForm = '0' + binaryForm;
                    }

                    number = Math.floor(number / 2);
                }

                binaryForm = binaryForm.split('+')[0];
                return(binaryForm);
            }
            
            function getPerms(bitfield) {
                for (let key in Discord.Permissions.FLAGS) 
                    if (Discord.Permissions.FLAGS[key] == bitfield) return key;
                return null;
            }

            var individualPermBits = toBinary(permBitfield).split("");
            var permissionNames = [];

            for (i = 0; i < individualPermBits.length; i++){
                permissionNames[i] = (Math.pow(2, individualPermBits.length - 1 - i)).toString();
                permissionNames[i] = getPerms(permissionNames[i]).toString();
            }
        

            if (mmbr._roles == ""){
                var memberRoles = "No Roles";
            }
            else{
                var memberRoles = "<@&" + mmbr._roles.join("> <@&") + ">";
            }

            var usrStatus = usr.presence.status;
            if(usrStatus == 'online'){
                usrStatus = "Online";
            }
            if(usrStatus == 'idle'){
                usrStatus = "Idle";
            }
            if(usrStatus == 'dnd'){
                usrStatus = "Do Not Disturb";
            }
            if(usrStatus == 'offline'){
                usrStatus = "Offline";
            }


            for (permission in permissionNames){
                permissionNames[permission] = permissionNames[permission].replace("_", " ");
                permissionNames[permission] = permissionNames[permission].replace("_", " ");
                permissionNames[permission] = permissionNames[permission].toLowerCase();
                uppercased = permissionNames[permission].split(" ")
                for (i = 0; i < uppercased.length; i++){
                    firstLetter = uppercased[i].charAt(0);
                    uppercased[i] = uppercased[i].replace(firstLetter, firstLetter.toUpperCase());
                }
                permissionNames[permission] = uppercased.join(" ");
                if (permissionNames[permission] == "Use Vad" || permissionNames[permission] == "Send Tts Messages"){
                    words = permissionNames[permission].split(" ");
                    letterOne = words[1].charAt(0);
                    words[1] = words[1].toUpperCase();
                    permissionNames[permission] = words.join(" ");
                }
            }
            var permList = permissionNames.join(", ");

            const usrinfoEmbed = new Discord.MessageEmbed()
            .setTitle("User Info for " + usr.username)
            .setDescription("User ID: " + usr.id)
            .setThumbnail(usr.avatarURL())
            .setColor(mmbr.roles.highest.color)
            .addField("Created On", moment.utc(usr.createdAt).format('dddd, MMMM Do YYYY'))
            .addField("Joined On", moment.utc(mmbr.joinedAt).format('dddd, MMMM Do YYYY'))
            .addField("Status", usrStatus)
            .addField("Roles", memberRoles)
            .addField("Permissions", permList);
            msg.channel.send(usrinfoEmbed);
            

            break;


        case 'server-info':
            //msg.channel.send("Still working on this, please wait.");


            const gld = msg.guild;
            const guildRoles = gld.roles.cache.array();
            guildRoles.shift();
            

            const serverInfoEmbed = new Discord.MessageEmbed()
            .setTitle("Server Info")
            .setDescription("Information about this server.")
            .setThumbnail(gld.iconURL())
            .setColor(0xCFB53B)
            .addField("Created On:", moment.utc(gld.createdAt).format("dddd, MMMM Do YYYY"))
            .addField("Member Count:", gld.memberCount)
            .addField("Highest Role:", gld.roles.highest)
            .addField("Total Roles:", guildRoles.length);

            msg.channel.send(serverInfoEmbed);

            break;
        
        case 'bot-info':
            msg.channel.send("Still working on this, please wait.");
            break;

        case 'help':
            const helpEmbed = new Discord.MessageEmbed()
            .setTitle("Commands")
            .setColor(0xCFB53B);

            var fieldCount = 0;

            for (var i = 0; i < commands.length; i++){
                if(Array.isArray(commands[i])) {
                    continue;
                } 
                
                else if(Array.isArray(commands[i + 1])){
                    helpEmbed.addField("**" + commands[i] + "**", "All " + commands[i] + " Commands");

                    fieldCount++

                    for(var j = 0; j < commands[i + 1].length; j++){

                        nestedCmd = commands[i + 1][j].split(":");

                        if(j == commands[i+1].length - 1){
                            helpEmbed.addField("```" + prefix + nestedCmd[0] + "```", nestedCmd[1] + "\n -----------------")
                        }

                        else{
                            helpEmbed.addField("```" + prefix + nestedCmd[0] + "```", nestedCmd[1])
                        }

                        fieldCount++;
                        
                    }
                }

                else if(Array.isArray(commands[i+2])){
                    var lastInSection = commands[i].split(":");

                    helpEmbed.addField("```" + prefix + lastInSection[0] + "```", lastInSection[1] +"\n -----------------");

                    fieldCount++;
                }
                
                else {
                    var cmd = commands[i].split(":");
                    
                    helpEmbed.addField("```" + prefix + cmd[0] + "```", cmd[1]);

                    fieldCount++
                }
                
            }
            helpEmbed.setFooter("Field Count: " + fieldCount);
            msg.channel.send(helpEmbed);
            break;
    }
})

bot.login(token);
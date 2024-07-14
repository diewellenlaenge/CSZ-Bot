import type { ProcessableMessage } from "../service/commandService.js";
import type { MessageCommand } from "./command.js";
import type { BotContext } from "../context.js";

/**
 * Info command. Displays some useless information about the bot.
 *
 * This command is both - a slash command (application command) and a message command
 */
export default class GibMirIdsCommand implements MessageCommand {
    name = "gitmirids";
    description = "Listet IDs auf dem Server für einfachere Config";

    async handleMessage(message: ProcessableMessage, context: BotContext) {
        const lines = [`Guild: \`${context.guild.id}\``, ""];

        const channels = [...context.guild.channels.cache.values()];
        const channelsByType = Object.groupBy(channels, c => c.type);
        for (const [type, channels] of Object.entries(channelsByType)) {
            lines.push(`**${type}**`);
            lines.push(...channels.map(c => `${c.name}: \`${c.id}\``));
        }

        lines.push("");

        const roles = [...context.guild.roles.cache.values()].sort(
            (a, b) => b.position - a.position,
        );
        lines.push(...roles.map(r => `${r.name}: \`${r.id}\``));

        for (const chunk of splitInChunks(lines, 2000)) {
            await message.author.send(chunk.join("\n"));
        }

        await message.react("⚙️");
    }
}

function splitInChunks(lines: readonly string[], charLimitPerChunk: number): string[][] {
    let charsInChunk = 0;
    let currentChunk: string[] = [];
    const chunks = [currentChunk];
    for (const line of lines) {
        const appendedChars = line.length + 1; // + 1 for line ending
        if (charsInChunk + appendedChars > charLimitPerChunk) {
            charsInChunk = 0;
            currentChunk = [];
            chunks.push(currentChunk);
        }
        currentChunk.push(line);
        charsInChunk += appendedChars;
    }

    return chunks;
}
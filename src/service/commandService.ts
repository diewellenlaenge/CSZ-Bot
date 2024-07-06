import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { BotContext } from "../context.js";
import type { Command } from "../commands/command.js";
import type { LegacyCommand } from "../types.js";

import log from "@log";

const commandExtensions = [".ts", ".js"];

export async function readAvailableCommands(
    context: BotContext,
): Promise<Command[]> {
    const modules = loadRawCommandModules(context, context.commandDir);

    const res = [];
    for await (const module of modules) {
        if (!module.default) {
            continue;
        }
        res.push(new module.default());
    }
    return res;
}

export async function readAvailableLegacyCommands(
    context: BotContext,
    type: "mod" | "pleb",
): Promise<LegacyCommand[]> {
    const dir = type === "mod" ? context.modCommandDir : context.commandDir;
    const modules = loadRawCommandModules(context, dir);

    const res = [];
    for await (const module of modules) {
        if (
            !module.description ||
            module.description !== "string" ||
            typeof module.run !== "function"
        ) {
            continue;
        }
        res.push(module);
    }
    return res;
}

async function* loadRawCommandModules(context: BotContext, commandDir: string) {
    const commandFiles = await fs.readdir(commandDir);

    for (const file of commandFiles) {
        if (!commandExtensions.some(extension => file.endsWith(extension))) {
            continue;
        }

        const moduleUrl = new URL("file://");
        moduleUrl.pathname = path.join(context.commandDir, file);
        log.debug(`Trying to load ${moduleUrl}`);

        yield await import(moduleUrl.toString());
    }
}

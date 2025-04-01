import { EmbedBuilder as builder } from "discord.js";
import config from "../config";
export class EmbedBuilder extends builder {
    constructor() {
        super();
        this.setColor(`#${config.embedColor}`);

    }
}
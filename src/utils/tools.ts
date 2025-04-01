import moment from "moment-timezone";
import { AlartType, AlertCreator, TextAlignment } from "./AlertCreator";
import { HumanizeDuration, HumanizeDurationLanguage } from "humanize-duration-ts";
import { ActionRowBuilder, APIMessage, ButtonStyle, ChatInputCommandInteraction, ComponentType, EmbedBuilder, Guild, TextInputBuilder, TextInputStyle, User } from "discord.js";
import { client } from "../bot";
import axios, { AxiosResponse } from "axios";
import { Player } from "../class/PlayerManager";
import rewardKeys from "../config/rewardKeys";

import ExcelJS, { Column } from "exceljs";


export function getCurrentDayInUSA(timezone: string = "America/New_York"): string {
    return moment().tz(timezone).format("YYYY-MM-DD");
}

export async function convertJsonToExcel(json: any[]): Promise<Buffer | undefined> {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sheet1");

        if (json.length > 0) {
            // Add column headers based on JSON keys
            const columns:any[] = Object.keys(json[0]).map((key) => {

                let value = json[0][key]
                if (value instanceof Date || (!isNaN(Date.parse(value)) && typeof value === "string")) {
                    value = moment(value).format("DD/MM/YYYY HH:mm");
                }
                if(typeof(value) === "boolean"){
                    value = value ? "Yes" : "No";
                }
            
                const textValue = value ? value.toString() : "";
                const diff = textValue.length - key.length;
            
                let size = Math.max(key.length, textValue.length) + 5
                if (diff > 0) size += (diff);
              

                
                
                
                
                
                return { collapsed:false,style: {alignment:{
                horizontal: "center",
              shrinkToFit:true,
                
                vertical: "middle"
            }},header: key, key,width:(size),alignment:{horizontal:"centerContinuous","vertical":"middle","shrinkToFit":true,wrapText:true} }});
            worksheet.columns = columns;
            
            
            

            // Add rows
            json.forEach((row) => {
                worksheet.addRow(row);
            });
        }

        // Convert to ArrayBuffer
        const arrayBuffer = await workbook.xlsx.writeBuffer();

        // Convert ArrayBuffer to Node.js Buffer
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error("Error converting JSON to Excel:", error);
        return undefined;
    }
}

export async function successMessage(
    message: string,
    reply: (payload: any) => Promise<any>,
    Ephemeral: boolean = false

): Promise<void> {
    try {
        const errorImage = await AlertCreator.alert(
            AlartType.SUCCESS,
            TextAlignment.CENTER,
            message
        );

        await reply({ files: [errorImage], flags: Ephemeral ? [`Ephemeral`] : [] });
    } catch (error) {
        console.error("[errorMessage] Failed to send error message:", error);
    }


}
export function formatTextAsTspan(text: string, className: string = "t8"): string {
    return text
        .split("")
        .map(char => `<tspan x="0" y="0" class="${className}">${char}</tspan>`)
        .join("");
}
export function calculatePercentage(current: number, max: number): number {
    if (max <= 0) return 0; // Prevent division by zero or negative max values
    return Math.min(100, Math.max(0, (current / max) * 100)); // Clamp between 0-100
}
const service = new HumanizeDuration(new HumanizeDurationLanguage());

export const duration = (time: number) => service.humanize(time, { round: true, units: ["y", "mo", "w", "d", "h", "m", "s"] });

export const guildIcon = (guild: Guild): string | null => {
    return guild.icon ? guild.iconURL() ?? null : client.user?.displayAvatarURL() ?? null;
};
export const textInput = (label: string, value: string, customId: string, max: number = 5, min: number = 1, placeholder: string, required: boolean = true, style: TextInputStyle = TextInputStyle.Short) => {
    return new ActionRowBuilder<any>().addComponents(new TextInputBuilder().setCustomId(customId).setLabel(label).setValue(value).setMaxLength(max).setMinLength(min).setRequired(required).setStyle(style).setPlaceholder(placeholder))
}
export async function errorMessage(
    message: string,
    reply: (payload: any) => Promise<any>,
    Ephemeral: boolean = false
): Promise<void> {
    try {
        const errorImage = await AlertCreator.alert(
            AlartType.ERROR,
            TextAlignment.CENTER,
            message
        );

        await reply({ files: [errorImage], flags: Ephemeral ? [`Ephemeral`] : [] });
    } catch (error) {
        console.error("[errorMessage] Failed to send error message:", error);
    }
}
export function getUserValues(user: User, player: Player): Record<string, string> {
    const values: Record<string, string> = {};

    for (const key in rewardKeys) {
        const { pass, key: getValue } = rewardKeys[key];

        if (pass === "user") {
            values[key] = getValue(user)?.toString() ?? `{${key}}`;
        } else if (pass === "player") {
            values[key] = getValue(player)?.toString() ?? `{${key}}`;
        }
    }

    return values;
}
export function replaceKeysWithValues(data: any, values: Record<string, string>): any {
    if (typeof data === "string") {
        // Replace placeholders like {key} with actual values from the values object
        return data.replace(/{(.*?)}/g, (_, key) => values[key] ?? `{${key}}`);
    }

    if (typeof data === "object" && data !== null) {
        if (Array.isArray(data)) {
            return data.map(item => replaceKeysWithValues(item, values));
        }

        const updatedObject: Record<string, any> = {};
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                // If the key is 'timestamp', replace with the current time
                if (key === "timestamp") {
                    updatedObject[key] = new Date().toISOString();
                } else {
                    updatedObject[key] = replaceKeysWithValues(data[key], values);
                }
            }
        }
        return updatedObject;
    }

    return data; // Return unchanged if it's neither string, object, nor array
}

export function generateUniqueNumber(length: number = 35): string {
    if (length < 1) throw new Error("Length must be at least 1");

    const timestamp = Date.now().toString();
    if (length <= timestamp.length) return timestamp.slice(-length); // Trim timestamp if needed

    const randomPart = Math.floor(Math.random() * 10 ** (length - timestamp.length)).toString();
    return timestamp + randomPart.padStart(length - timestamp.length, '0'); // Ensure exact length
}
export function isHexColor(color: string): boolean {
    return /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(color);
}

declare global {
    interface Array<T> {
        chunk(size: number): T[][];
    }
}

Array.prototype.chunk = function <T>(size: number): T[][] {
    if (size <= 0) throw new Error("Chunk size must be greater than zero.");

    const result: T[][] = [];
    for (let i = 0; i < this.length; i += size) {
        result.push(this.slice(i, i + size));
    }
    return result;
};
export const disabledInteraction = async (interaction: ChatInputCommandInteraction): Promise<void> => {
    const reply = await interaction.fetchReply();
    if (!reply) return;
    interaction.editReply({ components: disableComponents(reply.components) });
}
export function disableComponents(components: any, defult?: String | String[]) {
    let componentsArray = components.map((d: any) => {

        let x = d.components.map((c: any) => {
            c.data.disabled = true

            if (c.type === ComponentType.StringSelect && defult && c.data.options.find((d: any) => defult.includes(d.value))) {
                c.data.options = c.data.options.map((o: any) => ({ ...o, default: defult.includes(o.value) }));
            };
            return c;
        });
        return new ActionRowBuilder<any>().setComponents(x);
    })
    return componentsArray

}

export const base64Encode = (utf8: string) => {
    if (typeof window === "undefined") {
        return Buffer.from(utf8, "utf8").toString("base64")
    }

    const encoded = encodeURIComponent(utf8)

    const escaped = encoded.replace(/%[\dA-F]{2}/g, hex => {
        return String.fromCharCode(Number.parseInt(hex.slice(1), 16))
    })

    return btoa(escaped)
}

let encodeBase64 = (utf8: string) => {
    return base64Encode(utf8)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "")
}
interface DiscohookData {
    code: number;  // Present if there's an error (code: 1)
    content?: APIMessage;  // The fetched message content from Discohook
    link?: string;  // The modified Discohook URL with encoded data
    shortLink?: string;  // The shortened Discohook URL
}
export async function fetchDiscohookUrl(url: string): Promise<DiscohookData> {
    if (!url) {
        return ({
            code: 1
        })
    }
    const urlPattern = /^https:\/\/discohook\.app\/\?share=[a-zA-Z0-9]+$/;

    if (!urlPattern.test(url)) {
        return ({
            code: 1
        })
    };

    let shareID = url.split("https://discohook.app/?share=").filter((d) => d.length > 3);
    if (shareID.length < 1) return ({
        code: 1
    })

    let apiurl = `https://discohook.app/api/v1/share/${shareID[0]}`;

    const response: AxiosResponse = await axios.get(apiurl, {
        headers: {

            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "referer": url,
        },

        maxRedirects: 1,
    }).catch((err) => err.response);

    let data = response?.data?.data;

    if (!data) return ({
        code: 1
    })
    let message: APIMessage = data?.messages[0]?.data;
    if (!message) return ({
        code: 1
    });
    // @ts-ignore
    message.components = message.components?.map(e => {
        return e.components.filter(a => a.type === ComponentType.Button && [ButtonStyle.Link,ButtonStyle.Premium].includes(a.style))
    }).filter(e => e.length > 0)
    console.log(message.components)

    let encooder = encodeBase64(JSON.stringify(data));
    let link = `https://discohook.app/?data=${encooder}`;
    const shortLink =  await generateShortLink(link);
    return message ? {
        content: message,
        link,
        shortLink,
        code: 200
    } : ({
        code: 1
    });

};
export async function generateShortLink(longUrl: string): Promise<any> {
    const apiUrl = "https://is.gd/create.php";
    try {
        // Ensure the URL is properly encoded
        const encodedUrl = encodeURIComponent(longUrl);

        const response = await axios.get(`${apiUrl}?format=simple&url=${encodedUrl}`);
        return response.data; // The response contains the shortened URL
    } catch (error) {
        // Better error handling
        return null;
    }
}

const customFormats: Record<string, (timestampSeconds: number) => string> = {
    Date: (timestampSeconds) => `<t:${timestampSeconds}:d> <t:${timestampSeconds}:t> `, 
};



export function formatDiscordTimestamp(
    timestampMs: number,
    styleOrFormat: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R' | string | ((timestampSeconds: number) => string) = 'R',
    additionalFormats: Record<string, (timestampSeconds: number) => string> = {}
): string {
    const timestampSeconds = Math.floor(timestampMs / 1000);


    const allFormats = { ...customFormats, ...additionalFormats };


    if (typeof styleOrFormat === 'function') {
        return styleOrFormat(timestampSeconds);
    }


    if (allFormats[styleOrFormat]) {
        return allFormats[styleOrFormat](timestampSeconds);
    }


    if (['t', 'T', 'd', 'D', 'f', 'F', 'R'].includes(styleOrFormat)) {
        return `<t:${timestampSeconds}:${styleOrFormat}>`;
    }

  
    return `<t:${timestampSeconds}:R>`;
}
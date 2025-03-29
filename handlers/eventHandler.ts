import fs from "fs";
import path from "path";
import { client } from "../index.js";
import { fileURLToPath } from 'url';
import { convertURLs } from "../utils/windowsUrlConvertor.js";

export default {
	function: async function () {
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = path.dirname(__filename);
		const load_dir = async (dirs: string) => {
			dirs = path.resolve(__dirname, `../events/${dirs}/`);
			const event_files = fs.readdirSync(dirs).filter(file => file.endsWith(".js") || file.endsWith(".ts"));
			for (const file of event_files) {
				const windowsDirs = convertURLs(dirs);
				const fileToImport = process.platform === "win32" ? `${windowsDirs}/${file}` : `${dirs}/${file}`;
				const event = await import(fileToImport);

				const event_name = event.default.name;
				if (event_name == "ready") {
					if (client.isReady()) {
						event.default.function();
						continue;
					}
				}
				if (event.default.once === true) client.once(event_name, event.default.function.bind(null));
				else client.on(event_name, event.default.function.bind(null));
			}
		};
		["client", "guild"].forEach(async e => await load_dir(e));
	}
};

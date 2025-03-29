import { client } from "../../index.js";
import imageData from "../../models/images.js";


export default {
	name: "ready",
	description: "client ready event",
	once: false,
	function: async function () {
        const images = await imageData.find();
        images.forEach((image) => {
            const imageKey = `${image.questID}-${image.imageName.split(".")[0]}`;
            client.images.set(imageKey, image.toObject());
        });
        console.log("Images cache loaded");
    }

} as any;

import { Schema, model, Document } from 'mongoose';

export interface questImagesInterface  {
    messageID: string,
    questID: string,
    imageName: string,
    link: string,
 
}
interface questImagesInterfaceDocument extends questImagesInterface, Document {}

const questImages = new Schema({
    messageID: { type: String, required: true },
    questID: { type: String, required: true },

    imageName: { type: String, required: true },
    link: { type: String, required: true },
   

}, {
    timestamps: true
});

const imageData = model<questImagesInterfaceDocument>('images', questImages)

export default imageData;

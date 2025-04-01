import { Schema, model, Document } from 'mongoose';

export interface questImagesInterface  {
    messageID: string,
    questID: string,
 
}
interface questImagesInterfaceDocument extends questImagesInterface, Document {}

const questsNotifcation = new Schema({
     questID: { type: String, required: true },
    messageID: { type: String, required: true },
  
    
   

}, {
    timestamps: true
});

const questsNotifcationShema = model<questImagesInterfaceDocument>('questsNotifcation', questsNotifcation)

export default questsNotifcationShema;

import { AxiosInstance } from "axios";
import { Quest } from "../interface/quest.js";


export async function fetchQuests(axiosInstance:AxiosInstance): Promise<Quest[] | null> {
  try {
    const response = await axiosInstance.get('/quests/@me');
    return response?.data?.quests;
  } catch (error) {
    console.error('Error fetching quests:', error);
    return null;
  }
}
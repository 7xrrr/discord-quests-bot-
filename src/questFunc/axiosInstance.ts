import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { generateHeaders } from "./genrateHeaders.js";


export const makeAxiosInstance = (token: string): AxiosInstance => {
  
  const headers = generateHeaders(token);

  
  const axiosInstance: AxiosInstance = axios.create({
    baseURL: "https://discord.com/api/v9/",
    headers: headers, 
    timeout: 10000, 
  });

  
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      
     
      return config;
    },
    (error) => {
      
    
      return Promise.reject(error);
    }
  );

  
  axiosInstance.interceptors.response.use(
    (response) => {
      
     
      return response;
    },
    (error) => {
      
   
      return Promise.reject(error);
    }
  );

  
  return axiosInstance;
};
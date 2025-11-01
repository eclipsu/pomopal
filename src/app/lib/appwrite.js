import { Client, Account, Databases, ID } from "appwrite";

const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1") 
  .setProject("68f95f3f000ba74e0c35");

export const account = new Account(client);
export const databases = new Databases(client);
export { ID };

export default client;

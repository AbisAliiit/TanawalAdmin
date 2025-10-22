import { APP_NAMES } from "./enums";

// Server Host based on environment
const SERVER_HOST = "https://tanawal-apim.azure-api.net/";

export const SERVER_URL = `${SERVER_HOST}`;

export type TAppConfig = {
  PORT?: number;
  PREFIX: string;
};

export type TRoute =
  | string
  | {
      route: string;
      description: string;
    }
  | {
      prefix: string;
      postfix: string;
      description: string;
    };

export type TEndpoint = { [controller: string]: { [route: string]: TRoute } };

const AppConfigs: Record<APP_NAMES, TAppConfig> = {
  [APP_NAMES.USER]: {
    PREFIX: "FoodUserManagement",
  },
  [APP_NAMES.FOOD]: {
    PREFIX: "food-management",
  },
  [APP_NAMES.PURCHASE]: {
    PREFIX: "food-purchase-management",
  },
};

const getAppConfig = (appName: APP_NAMES): TAppConfig => {
  const config = AppConfigs[appName];
  return {
    ...config,
  };
};

const createUrl = (appConfig: TAppConfig): string => {
  console.log(`${SERVER_HOST}${appConfig.PREFIX}`, "Here i am");
  return `${SERVER_HOST}${appConfig.PREFIX}`;
};

const AuthAppConfig = getAppConfig(APP_NAMES.USER);
const FoodApp = getAppConfig(APP_NAMES.FOOD);
const PurchaseApp = getAppConfig(APP_NAMES.PURCHASE);

const AuthUrl = createUrl(AuthAppConfig);
const FoodUrl = createUrl(FoodApp);
const PurchaseUrl = createUrl(PurchaseApp);

export const BaseUrl = `${SERVER_URL}`;

export const AdminEndpoint = {
  USER: {
    AUTHENTICATE: `${AuthUrl}/AuthenticateUser`,
    GET_USERS: `${AuthUrl}/GetUserList`,
    UPDATE_USER: `${AuthUrl}/UpdateFoodUser`,
    DELETE_USER: `${AuthUrl}/DeleteFoodUser`,
    ADD_ADDRESS: `${AuthUrl}/AddAddress`,
    GET_ADDRESS: `${AuthUrl}/GetAddressByUserId`,
    UPDATE_USER_STATUS:`${AuthUrl}/ChangeUserStatus`
  },
  PURCHASE: {
    GET_ORDERS: `${PurchaseUrl}/GetFoodPurchaseList`,
    UPDATE_ORDER: `${PurchaseUrl}/UpdateOrder`,
    DELETE_ORDER: `${PurchaseUrl}/DeleteOrder`,
    GET_ORDER_BY_ID: `${PurchaseUrl}/GetOrderById`,
  },
};

export const FoodEndpoint = {
  FOOD: {
    ADDFOOD: `${FoodUrl}/AddFoodList`,
    DELETEFOOD: `${FoodUrl}/DeleteFoodList`,
    UPDATEFOOD: `${FoodUrl}/UpdateFoodList`,
    GETFOOD: `${FoodUrl}/GetFoodList?admin=true`,
  },
};
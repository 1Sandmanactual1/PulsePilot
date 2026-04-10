import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

type StorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

function createWebStorage(): StorageAdapter {
  return {
    async getItem(key) {
      if (typeof window === "undefined") {
        return null;
      }

      return window.localStorage.getItem(key);
    },
    async setItem(key, value) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, value);
      }
    },
    async removeItem(key) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    }
  };
}

export const appStorage: StorageAdapter =
  Platform.OS === "web" ? createWebStorage() : AsyncStorage;

export async function getJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await appStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setJson<T>(key: string, value: T) {
  await appStorage.setItem(key, JSON.stringify(value));
}

export async function removeItem(key: string) {
  await appStorage.removeItem(key);
}

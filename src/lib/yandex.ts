/**
 * Мост к Yandex Games SDK.
 *
 * На платформе Яндекс Игр SDK подключается их загрузчиком и доступен как window.YaGames.
 * В обычном браузере SDK нет — тогда игра работает в демо-режиме: показываем
 * собственный рекламный экран и сообщаем, что покупка не списана.
 */

type AdOutcome = boolean | "unavailable";

type YandexSDK = {
  adv?: {
    showFullscreenAdv?: (options: {
      callbacks?: {
        onClose?: (wasShown: boolean) => void;
        onError?: (error: unknown) => void;
        onOpen?: () => void;
      };
    }) => void;
    showRewardedVideo?: (options: {
      callbacks?: {
        onRewarded?: () => void;
        onClose?: () => void;
        onError?: (error: unknown) => void;
        onOpen?: () => void;
      };
    }) => void;
  };
  features?: {
    LoadingAPI?: { ready?: () => void };
    GameplayAPI?: { start?: () => void; stop?: () => void };
  };
  getPlayer?: (options?: { scopes?: boolean }) => Promise<{
    getName?: () => string;
    getMode?: () => string;
  }>;
  getPayments?: (options?: { signed?: boolean }) => Promise<{
    getCatalog?: () => Promise<{
      id: string;
      title: string;
      price: string;
      priceValue: string;
      priceCurrencyCode: string;
    }[]>;
    getPurchases?: () => Promise<{ productID?: string; productId?: string; consume?: () => Promise<void> }[]>;
    purchase?: (options: { id: string }) => Promise<{ consume?: () => Promise<void> } | void>;
  }>;
  screen?: {
    fullscreen?: {
      request?: () => Promise<void>;
      exit?: () => Promise<void>;
      status?: string;
    };
  };
};

declare global {
  interface Window {
    YaGames?: { init: () => Promise<YandexSDK> };
  }
}

let sdkPromise: Promise<YandexSDK | null> | null = null;

function timeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise.catch(() => null),
    new Promise<null>((resolve) => window.setTimeout(() => resolve(null), ms)),
  ]);
}

/**
 * Официально рекомендованное подключение SDK для собственного домена:
 * https://sdk.games.s3.yandex.net/sdk.js
 * В браузере вне платформы скрипт может быть недоступен — тогда игра работает в демо-режиме.
 */
function loadSdkScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YaGames) return Promise.resolve();
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-yandex-sdk="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => resolve());
      window.setTimeout(resolve, 5000);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.games.s3.yandex.net/sdk.js";
    script.async = true;
    script.dataset.yandexSdk = "true";
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
    window.setTimeout(resolve, 5000);
  });
}

export function getYandexSDK(): Promise<YandexSDK | null> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = (async () => {
    await loadSdkScript();
    if (typeof window === "undefined" || !window.YaGames) return null;
    try {
      const sdk = await timeout(window.YaGames.init(), 6000);
      if (!sdk) return null;
      try {
        sdk.features?.LoadingAPI?.ready?.();
      } catch {
        // необязательный вызов
      }
      try {
        await sdk.getPlayer?.({ scopes: false });
      } catch {
        // игрок может быть не авторизован
      }
      return sdk;
    } catch {
      return null;
    }
  })();
  return sdkPromise;
}

export async function isYandexPlatform(): Promise<boolean> {
  const sdk = await getYandexSDK();
  return Boolean(sdk);
}

export function gameplayStart() {
  void getYandexSDK().then((sdk) => {
    try {
      sdk?.features?.GameplayAPI?.start?.();
    } catch {
      // ignore
    }
  });
}

export function gameplayStop() {
  void getYandexSDK().then((sdk) => {
    try {
      sdk?.features?.GameplayAPI?.stop?.();
    } catch {
      // ignore
    }
  });
}

export function showFullscreenAdv(): Promise<AdOutcome> {
  return new Promise((resolve) => {
    void getYandexSDK().then((sdk) => {
      if (!sdk?.adv?.showFullscreenAdv) {
        resolve("unavailable");
        return;
      }
      try {
        sdk.adv.showFullscreenAdv({
          callbacks: {
            onClose: () => resolve(true),
            onError: () => resolve("unavailable"),
          },
        });
      } catch {
        resolve("unavailable");
      }
    });
  });
}

export function showRewardedVideo(): Promise<AdOutcome> {
  return new Promise((resolve) => {
    void getYandexSDK().then((sdk) => {
      if (!sdk?.adv?.showRewardedVideo) {
        resolve("unavailable");
        return;
      }
      let rewarded = false;
      try {
        sdk.adv.showRewardedVideo({
          callbacks: {
            onRewarded: () => {
              rewarded = true;
            },
            onClose: () => resolve(rewarded),
            onError: () => resolve("unavailable"),
          },
        });
      } catch {
        resolve("unavailable");
      }
    });
  });
}

export async function purchaseYandexProduct(
  id: string,
  consumable = false
): Promise<"unavailable" | boolean> {
  const sdk = await getYandexSDK();
  if (!sdk?.getPayments) return "unavailable";
  try {
    const payments = await sdk.getPayments({ signed: false });
    const purchase = await payments.purchase?.({ id });
    if (consumable && purchase?.consume) await purchase.consume();
    return true;
  } catch {
    return false;
  }
}

/** Восстанавливает постоянные покупки (например, «без рекламы») при запуске. */
export async function restoreYandexPurchases(): Promise<string[]> {
  const sdk = await getYandexSDK();
  if (!sdk?.getPayments) return [];
  try {
    const payments = await sdk.getPayments({ signed: false });
    const purchases = await payments.getPurchases?.();
    return (purchases ?? []).map((item) => item.productID ?? item.productId ?? "").filter(Boolean);
  } catch {
    return [];
  }
}

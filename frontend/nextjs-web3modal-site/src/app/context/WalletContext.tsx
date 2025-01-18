/* app/context/WalletContext.tsx */
"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  PropsWithChildren,
} from "react";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers } from "ethers";

// Dynamically import Web3Modal
let Web3Modal: any = null;
if (typeof window !== "undefined") {
  Web3Modal = require("web3modal").default;
}

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      rpc: { 1029: "https://pre-rpc.bt.io/" }, // your chain ID or RPC
    },
  },
};

interface WalletContextValue {
  hasMetamask: boolean;
  isConnected: boolean;
  signer: ethers.JsonRpcSigner | null;
  connect: () => Promise<void>;
}

/** Default context */
const WalletContext = createContext<WalletContextValue>({
  hasMetamask: false,
  isConnected: false,
  signer: null,
  connect: async () => {},
});

export function WalletProvider({ children }: PropsWithChildren) {
  const [hasMetamask, setHasMetamask] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  // Check for Metamask on mount
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      setHasMetamask(true);
    }
  }, []);

  // If there's a cached provider, automatically connect
  useEffect(() => {
    if (!Web3Modal) return;

    const web3Modal = new Web3Modal({
      cacheProvider: true, // <-- ensures the provider is cached
      providerOptions,
    });

    // If user has previously connected (cached provider), reconnect automatically
    if (web3Modal.cachedProvider) {
      void connect();
    }
  }, []);

  async function connect(): Promise<void> {
    if (typeof window.ethereum === "undefined" || !Web3Modal) {
      setIsConnected(false);
      return;
    }

    try {
      // Instantiate Web3Modal
      const web3Modal = new Web3Modal({
        cacheProvider: true,
        providerOptions,
      });

      // Open modal or auto-connect if cached
      await web3Modal.connect();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const _signer = await provider.getSigner();

      console.log("Signer address:", await _signer.getAddress());

      setSigner(_signer);
      setIsConnected(true);
    } catch (err) {
      console.error(err);
      setIsConnected(false);
    }
  }

  const value: WalletContextValue = {
    hasMetamask,
    isConnected,
    signer,
    connect,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWalletContext() {
  return useContext(WalletContext);
}

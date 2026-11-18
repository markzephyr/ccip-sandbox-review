/**
 * CCIP Send — Server-side module to trigger a real ccipSend() on Sepolia.
 * Requires CCIP_PRIVATE_KEY environment variable with a funded Sepolia wallet.
 * The wallet needs ETH for gas and LINK/native ETH for CCIP fees.
 */
import { createWalletClient, createPublicClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { CCIP_ROUTERS, CCIP_CHAIN_SELECTORS } from "../ccip-config";

export interface CCIPSendResult {
  success: boolean;
  transactionHash?: string;
  messageId?: string;
  error?: string;
  explorerUrl?: string;
  ccipExplorerUrl?: string;
}

const CCIP_SEND_ABI = [
  {
    inputs: [
      { name: "destinationChainSelector", type: "uint64" },
      {
        name: "message",
        type: "tuple",
        components: [
          { name: "receiver", type: "bytes" },
          { name: "data", type: "bytes" },
          {
            name: "tokenAmounts",
            type: "tuple[]",
            components: [
              { name: "token", type: "address" },
              { name: "amount", type: "uint256" },
            ],
          },
          { name: "feeToken", type: "address" },
          { name: "extraArgs", type: "bytes" },
        ],
      },
    ],
    name: "ccipSend",
    outputs: [{ name: "messageId", type: "bytes32" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { name: "destinationChainSelector", type: "uint64" },
      {
        name: "message",
        type: "tuple",
        components: [
          { name: "receiver", type: "bytes" },
          { name: "data", type: "bytes" },
          {
            name: "tokenAmounts",
            type: "tuple[]",
            components: [
              { name: "token", type: "address" },
              { name: "amount", type: "uint256" },
            ],
          },
          { name: "feeToken", type: "address" },
          { name: "extraArgs", type: "bytes" },
        ],
      },
    ],
    name: "getFee",
    outputs: [{ name: "fee", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Trigger a real CCIP cross-chain message on Sepolia → Arbitrum Sepolia.
 * Sends an arbitrary data payload (the transaction ID) as a cross-chain message.
 * Fee is paid in native ETH (feeToken = address(0)).
 */
export async function sendCCIPMessage(
  transactionId: string,
  destChainSelector: bigint = CCIP_CHAIN_SELECTORS.ARBITRUM_SEPOLIA,
): Promise<CCIPSendResult> {
  const privateKey = process.env.CCIP_PRIVATE_KEY;
  if (!privateKey) {
    return {
      success: false,
      error:
        "CCIP_PRIVATE_KEY not set. Add a funded Sepolia wallet private key to .env to enable real CCIP transfers.",
    };
  }

  try {
    const formattedKey = (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as Hex;
    const account = privateKeyToAccount(formattedKey);
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
    });
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
    });

    const routerAddress = CCIP_ROUTERS.SEPOLIA;
    const encodedData = new TextEncoder().encode(
      JSON.stringify({ txId: transactionId, action: "approve", timestamp: Date.now() }),
    );
    const dataHex = ("0x" +
      Array.from(encodedData)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")) as Hex;

    // Encode receiver as sender's address padded to 32 bytes (standard abi.encode(address))
    const receiverEncoded = ("0x" + account.address.slice(2).padStart(64, "0")) as Hex;

    const message = {
      receiver: receiverEncoded,
      data: dataHex,
      tokenAmounts: [] as readonly { token: `0x${string}`; amount: bigint }[],
      feeToken: "0x0000000000000000000000000000000000000000" as `0x${string}`,
      extraArgs: "0x" as Hex,
    };

    // Estimate CCIP fee
    const fee = await publicClient.readContract({
      address: routerAddress,
      abi: CCIP_SEND_ABI,
      functionName: "getFee",
      args: [destChainSelector, message],
    });

    // Execute ccipSend() on-chain
    const hash = await walletClient.writeContract({
      address: routerAddress,
      abi: CCIP_SEND_ABI,
      functionName: "ccipSend",
      args: [destChainSelector, message],
      value: fee + fee / 10n, // 10% safety buffer for gas fluctuation
    });

    // Await receipt to retrieve CCIP messageId
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const ccipLog = receipt.logs.find(
      (l) => l.topics[0] === "0x8c324ce1367b83031769f6a813e3bb4c117aba2185789d66b98b791405be6df2",
    );
    const messageId = ccipLog?.topics[3] || hash;

    return {
      success: true,
      transactionHash: hash,
      messageId,
      explorerUrl: `https://sepolia.etherscan.io/tx/${hash}`,
      ccipExplorerUrl: `https://ccip.chain.link/msg/${messageId}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "CCIP send failed",
    };
  }
}

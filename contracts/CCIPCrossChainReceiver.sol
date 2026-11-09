// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";

/**
 * @title CCIPCrossChainReceiver
 * @notice Real receiving contract on destination EVM network.
 * Verifies inbound messages delivered by the CCIP OffRamp and updates local settlement state.
 */
contract CCIPCrossChainReceiver is CCIPReceiver {
    struct ReceivedMessage {
        bytes32 messageId;
        uint64 sourceChainSelector;
        address sender;
        string payload;
        uint256 receivedAt;
    }

    ReceivedMessage[] public receivedMessages;

    event SettlementMessageReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address sender,
        string payload,
        uint256 receivedAt
    );

    constructor(address router) CCIPReceiver(router) {}

    /**
     * @notice Internal handler called by CCIP Router on message arrival.
     */
    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) internal override {
        bytes32 messageId = any2EvmMessage.messageId;
        uint64 sourceChainSelector = any2EvmMessage.sourceChainSelector;
        address sender = abi.decode(any2EvmMessage.sender, (address));
        string memory payload = abi.decode(any2EvmMessage.data, (string));

        receivedMessages.push(
            ReceivedMessage({
                messageId: messageId,
                sourceChainSelector: sourceChainSelector,
                sender: sender,
                payload: payload,
                receivedAt: block.timestamp
            })
        );

        emit SettlementMessageReceived(
            messageId,
            sourceChainSelector,
            sender,
            payload,
            block.timestamp
        );
    }

    function getReceivedMessagesCount() external view returns (uint256) {
        return receivedMessages.length;
    }

    function getReceivedMessage(uint256 index) external view returns (ReceivedMessage memory) {
        require(index < receivedMessages.length, "Index out of bounds");
        return receivedMessages[index];
    }
}


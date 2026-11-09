// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";

/**
 * @title CCIPCrossChainSender
 * @notice Real implementation of cross-chain settlement messages via Chainlink CCIP 2.0.
 * Can be triggered directly or via CRE (Chainlink Runtime Environment) workflows
 * listening to institutional bank settlement events (FAST / BI-FAST / PayNow).
 */
contract CCIPCrossChainSender {
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees);
    error DestinationChainNotSupported(uint64 chainSelector);

    address public immutable router;
    address public immutable linkToken;

    event MessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address receiver,
        string payload,
        address feeToken,
        uint256 fees
    );

    constructor(address _router, address _linkToken) {
        router = _router;
        linkToken = _linkToken;
    }

    /**
     * @notice Send a cross-chain settlement instruction payload to a receiver contract on another EVM network.
     * @param destinationChainSelector CCIP selector of destination EVM (e.g., Arbitrum Sepolia).
     * @param receiver Address of the receiving contract on the destination chain.
     * @param payload Settlement metadata (e.g., ISO20022 camt.053 reconciliation ID, CRE trigger ID).
     * @param payWithLink If true, fees are paid with LINK; otherwise in native gas token.
     */
    function sendCrossChainMessage(
        uint64 destinationChainSelector,
        address receiver,
        string calldata payload,
        bool payWithLink
    ) external payable returns (bytes32 messageId) {
        if (!IRouterClient(router).isChainSupported(destinationChainSelector)) {
            revert DestinationChainNotSupported(destinationChainSelector);
        }

        address feeToken = payWithLink ? linkToken : address(0);

        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: abi.encode(payload),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            feeToken: feeToken
        });

        uint256 fees = IRouterClient(router).getFee(destinationChainSelector, evm2AnyMessage);

        if (payWithLink) {
            uint256 linkBalance = IERC20(linkToken).balanceOf(address(this));
            if (fees > linkBalance) {
                revert NotEnoughBalance(linkBalance, fees);
            }
            IERC20(linkToken).approve(router, fees);
            messageId = IRouterClient(router).ccipSend(destinationChainSelector, evm2AnyMessage);
        } else {
            if (msg.value < fees) {
                revert NotEnoughBalance(msg.value, fees);
            }
            messageId = IRouterClient(router).ccipSend{value: fees}(
                destinationChainSelector,
                evm2AnyMessage
            );
        }

        emit MessageSent(
            messageId,
            destinationChainSelector,
            receiver,
            payload,
            feeToken,
            fees
        );

        return messageId;
    }

    receive() external payable {}
}


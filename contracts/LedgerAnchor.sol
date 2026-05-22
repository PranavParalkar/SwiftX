// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title LedgerAnchor
/// @notice Periodically anchors the SHA-256 root of the off-chain hash-chained
///         ledger to Polygon. Provides public verifiability for the audit story
///         without paying per-transaction gas.
contract LedgerAnchor {
    mapping(uint256 => bytes32) public anchors;
    uint256 public latestAnchorId;
    address public owner;

    event Anchored(uint256 indexed id, bytes32 hash, uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function anchor(bytes32 chainHash) external onlyOwner {
        unchecked { latestAnchorId++; }
        anchors[latestAnchorId] = chainHash;
        emit Anchored(latestAnchorId, chainHash, block.timestamp);
    }

    function verify(uint256 id, bytes32 expectedHash) external view returns (bool) {
        return anchors[id] == expectedHash;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

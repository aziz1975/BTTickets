export const abi = [
    {
        "type": "constructor",
        "inputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "addNewIntegration",
        "inputs": [
            {
                "name": "_projectName",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "_description",
                "type": "string",
                "internalType": "string"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "addNewIssue",
        "inputs": [
            {
                "name": "_issueTitle",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "_issueDescription",
                "type": "string",
                "internalType": "string"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "getIntegrationStatusFromID",
        "inputs": [
            {
                "name": "",
                "type": "uint128",
                "internalType": "uint128"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint8",
                "internalType": "uint8"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getIntegrationsList",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "tuple[]",
                "internalType": "struct OnchainTicket.Ticket[]",
                "components": [
                    {
                        "name": "uniqueIDString",
                        "type": "string",
                        "internalType": "string"
                    },
                    {
                        "name": "title",
                        "type": "string",
                        "internalType": "string"
                    },
                    {
                        "name": "description",
                        "type": "string",
                        "internalType": "string"
                    },
                    {
                        "name": "status",
                        "type": "uint8",
                        "internalType": "uint8"
                    },
                    {
                        "name": "voteCount",
                        "type": "uint16",
                        "internalType": "uint16"
                    },
                    {
                        "name": "raisedBy",
                        "type": "address",
                        "internalType": "address"
                    }
                ]
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getIssueDescriptionFromID",
        "inputs": [
            {
                "name": "",
                "type": "uint128",
                "internalType": "uint128"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "string",
                "internalType": "string"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getIssueRaisedByAddressFromID",
        "inputs": [
            {
                "name": "",
                "type": "uint128",
                "internalType": "uint128"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "string",
                "internalType": "string"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getIssueStatusFromID",
        "inputs": [
            {
                "name": "",
                "type": "uint128",
                "internalType": "uint128"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint8",
                "internalType": "uint8"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getIssueTitleFromID",
        "inputs": [
            {
                "name": "",
                "type": "uint128",
                "internalType": "uint128"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "string",
                "internalType": "string"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getIssueUniqueIDFromID",
        "inputs": [
            {
                "name": "",
                "type": "uint128",
                "internalType": "uint128"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "string",
                "internalType": "string"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getIssueVotesFromID",
        "inputs": [
            {
                "name": "",
                "type": "uint128",
                "internalType": "uint128"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint16",
                "internalType": "uint16"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getPRList",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "tuple[]",
                "internalType": "struct OnchainTicket.Ticket[]",
                "components": [
                    {
                        "name": "uniqueIDString",
                        "type": "string",
                        "internalType": "string"
                    },
                    {
                        "name": "title",
                        "type": "string",
                        "internalType": "string"
                    },
                    {
                        "name": "description",
                        "type": "string",
                        "internalType": "string"
                    },
                    {
                        "name": "status",
                        "type": "uint8",
                        "internalType": "uint8"
                    },
                    {
                        "name": "voteCount",
                        "type": "uint16",
                        "internalType": "uint16"
                    },
                    {
                        "name": "raisedBy",
                        "type": "address",
                        "internalType": "address"
                    }
                ]
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getProjectDescriptionFromID",
        "inputs": [
            {
                "name": "",
                "type": "uint128",
                "internalType": "uint128"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "string",
                "internalType": "string"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getProjectRaisedByAddressFromID",
        "inputs": [
            {
                "name": "",
                "type": "uint128",
                "internalType": "uint128"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "string",
                "internalType": "string"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getProjectTitleFromID",
        "inputs": [
            {
                "name": "",
                "type": "uint128",
                "internalType": "uint128"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "string",
                "internalType": "string"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getProjectUniqueIDFromID",
        "inputs": [
            {
                "name": "",
                "type": "uint128",
                "internalType": "uint128"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "string",
                "internalType": "string"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getProjectVotesFromID",
        "inputs": [
            {
                "name": "",
                "type": "uint128",
                "internalType": "uint128"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint16",
                "internalType": "uint16"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "integrationIndex",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "uint128",
                "internalType": "uint128"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "issueIndex",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "uint128",
                "internalType": "uint128"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "listOfIntegrations",
        "inputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "uniqueIDString",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "title",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "description",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "status",
                "type": "uint8",
                "internalType": "uint8"
            },
            {
                "name": "voteCount",
                "type": "uint16",
                "internalType": "uint16"
            },
            {
                "name": "raisedBy",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "listOfIssues",
        "inputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "uniqueIDString",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "title",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "description",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "status",
                "type": "uint8",
                "internalType": "uint8"
            },
            {
                "name": "voteCount",
                "type": "uint16",
                "internalType": "uint16"
            },
            {
                "name": "raisedBy",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "owner",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "removeIntegration",
        "inputs": [
            {
                "name": "_integrationIndex",
                "type": "uint8",
                "internalType": "uint8"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "removeProblemReport",
        "inputs": [
            {
                "name": "_problemReportIndex",
                "type": "uint8",
                "internalType": "uint8"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "renounceOwnership",
        "inputs": [],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "transferOwnership",
        "inputs": [
            {
                "name": "newOwner",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "upVoteIR",
        "inputs": [
            {
                "name": "_integrationIndex",
                "type": "uint8",
                "internalType": "uint8"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "upVotePR",
        "inputs": [
            {
                "name": "_problemReportIndex",
                "type": "uint8",
                "internalType": "uint8"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "updateIRStatus",
        "inputs": [
            {
                "name": "_integrationIndex",
                "type": "uint128",
                "internalType": "uint128"
            },
            {
                "name": "_newStatus",
                "type": "uint8",
                "internalType": "uint8"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "updatePRStatus",
        "inputs": [
            {
                "name": "_problemReportIndex",
                "type": "uint128",
                "internalType": "uint128"
            },
            {
                "name": "_newStatus",
                "type": "uint8",
                "internalType": "uint8"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "event",
        "name": "OwnershipTransferred",
        "inputs": [
            {
                "name": "previousOwner",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "newOwner",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            }
        ],
        "anonymous": false
    },
    {
        "type": "error",
        "name": "OwnableInvalidOwner",
        "inputs": [
            {
                "name": "owner",
                "type": "address",
                "internalType": "address"
            }
        ]
    },
    {
        "type": "error",
        "name": "OwnableUnauthorizedAccount",
        "inputs": [
            {
                "name": "account",
                "type": "address",
                "internalType": "address"
            }
        ]
    }
];
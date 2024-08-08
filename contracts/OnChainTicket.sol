// SPDX-License-Identifier: UNLICENSED

/*This smart contract will do the following:
Collect Integration and Collaboration proposals for TRON/BTTC ecosystem and use a basic voting system for anyone with a BTTC wallet to vote by:

1) Add new Integration proposal and attach unique ID to it
2) Vote for any integration proposal based on unique ID
3) Remove spam or scam integration proposal (Contract owner only)
4) Add TRON ecosystem issue
5) Remove TRON ecosystem issue (Contract owner only)
6) Upvote for issue
7) Get contributors Address list
8) Modify ticket Status

*/
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract OnchainTicket is Ownable {
    uint128 public integrationIndex; //Integration projects index to serve as unique ID counter for Projects integrations
    uint128 public issueIndex; //Issue index to serve as unique ID counter for issues
    uint8 internal constant NEW = 0;
    uint8 internal constant IN_REVIEW = 1;
    uint8 internal constant DEF = 2;
    uint8 internal constant DONE = 3;
    uint8 internal constant REJ = 4;

    struct Ticket {
        //Struct for Integration proposals and their unique IDs

        //uint128 uniqueID; //Unique ID as number
        string uniqueIDString; //Unique ID adding a prefix for either Issue or Integration
        string title; //Ticket Title
        string description; //Ticket description
        uint8 status; //Ticket Status(Suggested): 0: New, 1: Under Analysis, 2: Defered, 3: Done, 4: Rejected
    }

    Ticket[] public listOfIntegrations; //Array to store all Integrations
    Ticket[] public listOfIssues; //Array to store all issues raised

    mapping(uint128 => string) public getProjectFromID;
    mapping(uint128 => uint8) public getIntegrationStatusFromID;
    mapping(uint128 => string) public getIssueTitleFromID;
    mapping(uint128 => uint8) public getIssueStatusFromID;

    constructor() Ownable(msg.sender) {
        integrationIndex = 1; //Initialize integration index so we can start unique IDs from 1
        issueIndex = 1; //Initialize issue indexso we can start unique IDs from 1
    }

    function addNewIntegration(
        string memory _projectName,
        string memory _description
    ) external {
        string memory strUniqueID = Strings.toString(integrationIndex);
        strUniqueID = string.concat("IR-", strUniqueID);
        listOfIntegrations.push(
            Ticket(strUniqueID, _projectName, _description, NEW)
        );

        getProjectFromID[integrationIndex] = _projectName;
        integrationIndex++;
    }

    function addNewIssue(string memory _issueTitle,string memory _issueDescription) external {
        string memory strUniqueID = Strings.toString(issueIndex);
        strUniqueID = string.concat("PR-", strUniqueID);
        listOfIssues.push(
            Ticket(strUniqueID, _issueTitle, _issueDescription, NEW)
        );

        getIssueTitleFromID[issueIndex] = _issueTitle;
        issueIndex++;
    }

    function removeIntegration(uint8 _integrationIndex) external onlyOwner {
        listOfIntegrations[_integrationIndex] = listOfIntegrations[
            listOfIntegrations.length - 1
        ];
        listOfIntegrations.pop();
    }
}

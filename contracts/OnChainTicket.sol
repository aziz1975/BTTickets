// SPDX-License-Identifier: MIT

/*This smart contract will do the following:
Collect Integration and Collaboration proposals for TRON/BTTC ecosystem and use a basic voting system for anyone with a BTTC wallet to vote by:

1) Add new Integration proposal and attach unique ID to it --> Done
2) Vote for any integration proposal based on unique ID --> Done
3) Remove spam or scam integration proposal (Contract owner only) -> Done
4) Add TRON ecosystem Problem Reports --> Done
5) Remove TRON ecosystem Problem Reports (Contract owner only) --> Done
6) Upvote for Problem Reports --> Done
7) Get contributors Address list --> Done
8) Modify ticket Status --> Done

BTTickets v1 Contract
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
        uint16 voteCount; //Ticket vote Counter
        address raisedBy;   //This variable will store the address of the ticketOwner
    }

    Ticket[] public listOfIntegrations; //Array to store all Integrations
    Ticket[] public listOfIssues; //Array to store all issues raised

    mapping(uint128 => string) public getProjectFromID;
    mapping(uint128 => uint8) public getIntegrationStatusFromID;
    mapping(uint128 => string) public getIssueTitleFromID;
    mapping(uint128 => uint8) public getIssueStatusFromID;

    constructor() Ownable(msg.sender) {
        integrationIndex = 0; //Initialize integration index so we can start unique IDs from 1
        issueIndex = 0; //Initialize Problem Report index we can start unique IDs from 1
    }

    function addNewIntegration(string memory _projectName, string memory _description) external {
        string memory strUniqueID = Strings.toString(integrationIndex);
        strUniqueID = string.concat("IR-", strUniqueID);
        listOfIntegrations.push(
            Ticket(strUniqueID, _projectName, _description, NEW,0,msg.sender)
        );

        getProjectFromID[integrationIndex] = _projectName;
        integrationIndex++;
    }

    function addNewIssue(string memory _issueTitle,string memory _issueDescription) external {
        string memory strUniqueID = Strings.toString(issueIndex);
        strUniqueID = string.concat("PR-", strUniqueID);
        listOfIssues.push(
            Ticket(strUniqueID, _issueTitle, _issueDescription, NEW,0,msg.sender)
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

    function removeProblemReport(uint8 _problemReportIndex) external onlyOwner {
        listOfIssues[_problemReportIndex] = listOfIssues[
            listOfIssues.length - 1
        ];
        listOfIssues.pop();
    }

    function updatePRStatus (uint8 _problemReportIndex, uint8 _newStatus) external onlyOwner {
        Ticket storage updatedPR = listOfIssues[_problemReportIndex];   //create a new struct of Ticket type and assign selected listOfissues array
        updatedPR.status = _newStatus;  //Update selected PR status

    }

    function upVotePR (uint8 _problemReportIndex) external {
        Ticket storage updatedVoteCounter = listOfIssues[_problemReportIndex];
        updatedVoteCounter.voteCount ++;

    }

    function updateIRStatus (uint8 _integrationIndex, uint8 _newStatus) external onlyOwner {
        Ticket storage updatedIR = listOfIntegrations[_integrationIndex];   //create a new struct of Ticket type and assign selected listOfissues array
        updatedIR.status = _newStatus;  //Update selected PR status

    }

    function upVoteIR (uint8 _integrationIndex) external {
        Ticket storage updatedVoteCounter = listOfIntegrations[_integrationIndex];
        updatedVoteCounter.voteCount ++;

    }
}

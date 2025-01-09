// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";

contract addNewProjectTest is Test {
    uint private amount = 20;

    function setUp() external {}

    function testAmountis20() public view {
        assertEq(amount, 20);
    }
}

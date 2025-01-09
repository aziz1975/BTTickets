"use client";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers } from "ethers";
//import { Button, ButtonGroup } from "@nextui-org/button";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenuToggle, NavbarMenu, NavbarMenuItem } from "@nextui-org/navbar";
import { Link } from "@nextui-org/link";
import { Image } from "@nextui-org/image";
import React from "react";
import { useEffect, useState, useCallback } from "react";
//import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, User, Chip, Tooltip, getKeyValue } from "@nextui-org/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Checkbox, Tooltip } from "@nextui-org/react";
import { EditIcon } from "./EditIcon";
import { DeleteIcon } from "./DeleteIcon";
import { EyeIcon } from "./EyeIcon";
import { EcosystemLogo } from "./EcosystemLogo";
//import { columns, users } from "./data";
import { abi } from "./constants/abi";
import { Divider } from "@nextui-org/divider";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Chip,
  User,
  Pagination,
} from "@nextui-org/react";

import { PlusIcon } from "./assets/PlusIcon";
import { VerticalDotsIcon } from "./assets/VerticalDotsIcon";
import { SearchIcon } from "./assets/SearchIcon";
import { ChevronDownIcon } from "./assets/ChevronDownIcon";
import { columns, statusOptions } from "./data";
import { capitalize } from "./utils/utils";

let web3Modal: any;

const statusColorMap: any = {
  "0": "primary", //NEW
  "1": "warning", //IN_REVIEW
  "2": "default", //DEFERRED
  "3": "success", //DONE
  "4": "danger",  //REJ
  "5": "default",  //HIDE
};

var users: Array<Record<string, any>> = [];



const INITIAL_VISIBLE_COLUMNS = ["id", "title", "description", "status", "votes", "raisedby", "actions"];

const providerOptions = {

  walletconnect: {

    package: WalletConnectProvider,
    options: {
      rpc: { 199: "https://rpc.bt.io/" }, //Assigning BTTC Mainnet chain ID and public RPC

    }
  },
}



export default function Home() {


  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasMetamask, setHasMetamask] = useState(false);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const { isOpen: isPRModalOpen, onOpen: onPRModalOpen, onOpenChange: onPRModalChange } = useDisclosure();
  const { isOpen: isIntegrationModalOpen, onOpen: onIntegrationModalOpen, onOpenChange: onIntegrationModalChange } = useDisclosure();
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [statusFilter, setStatusFilter] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState({
    column: "status",
    direction: "ascending",
  });
  const [page, setPage] = useState(1);
  const [issueTitleValue, setissueTitleValue] = useState("");
  const [issueDescriptionValue, setissueDescriptionValue] = useState("");
  const [projectDescriptionValue, setprojectDescriptionValue] = useState("");
  const [projectNameValue, setprojectNameValue] = useState("");
  const [hookusers, sethookusers] = useState([]);




  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns.size === columns.length) return columns;

    return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredUsers = [...users];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        user.title.toLowerCase().includes(filterValue.toLowerCase()),
      );
    }
    if (statusFilter !== "all" && Array.from(statusFilter).length !== statusOptions.length) {
      filteredUsers = filteredUsers.filter((user) =>
        Array.from(statusFilter).includes(user.status),
      );
    }

    return filteredUsers;
  }, [users, filterValue, statusFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column];
      const second = b[sortDescriptor.column];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);




  const menuItems = [
    "Integrations",
    "Problem Reports",
    "Ecosystem Map"

  ];

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      setHasMetamask(true);
    }
  });

  useEffect(() => {
    console.log(`Wallet connection status changed to ${isConnected}`);
    if (isConnected) {
      getIntegrationStatus();
    }


    return () => {
      // Optional cleanup
    };
  }, [isConnected]);  // Effect re-runs whenever `count` changes


  async function connect() {
    if (typeof window.ethereum !== "undefined") {
      web3Modal = new Web3Modal({
        cacheProvider: false,
        providerOptions, // This is required

      })
      try {
        const web3ModalProvider = await web3Modal.connect();


        const provider = new ethers.BrowserProvider(window.ethereum);
        setSigner(await provider.getSigner());  //WAIT UNTIL signer is obtained before setting flags, etc
        setIsConnected(true); //Set connection flag to true after signer is obtained
        //getIntegrationStatus(); //Get List of Integrations from contract
      }
      catch (e) {
        console.log(e);
      }

    }
    else {
      setIsConnected(false);
    }
  }

  async function addNewIntegration(_IRTitle: string, _IRDescription: string) {
    if (isConnected) {
      const contractAddress = "0x28471b32E700c13e96cD807839899b1D51190064";  //New: 0x28471b32E700c13e96cD807839899b1D51190064
      const contract = new ethers.Contract(contractAddress, abi, signer);
      try {
        if (_IRTitle != null || _IRDescription != null) { //No empty title OR description are allowed
          setprojectNameValue("");
          setprojectDescriptionValue("");
          await contract.addNewIntegration(_IRTitle, _IRDescription);
        }
        else {
          console.log("Either Title or Description are empty")
        }

      } catch (error) {
        console.log(error);
      }
    } else {
      console.log("addIntegration Please connect your wallet");
    }

  }

  async function addNewProblemReport(_PRTitle: string, _PRDescription: string) {
    if (isConnected) {
      const contractAddress = "0x28471b32E700c13e96cD807839899b1D51190064";  //New: 0x28471b32E700c13e96cD807839899b1D51190064
      const contract = new ethers.Contract(contractAddress, abi, signer);
      try {
        if (_PRTitle != null || _PRDescription != null) { //No empty title OR description are allowed
          await contract.addNewIssue(_PRTitle, _PRDescription);
        }
        else {
          console.log("Either Title or Description are empty")
        }

      } catch (error) {
        console.log(error);
      }
    } else {
      console.log("addNewIssue, Please connect your wallet");
    }

  }

  async function getIntegrationStatus() {
    //TODO: I don't understand why this funciton works properly when calling it from a Modal window but not from a hook or a normal button!!


    if (isConnected) {
      const contractAddress = "0x28471b32E700c13e96cD807839899b1D51190064";  //new: 0x28471b32E700c13e96cD807839899b1D51190064
      const contract = new ethers.Contract(contractAddress, abi, signer);
      try {
        users = await contract.getIntegrationsList();
        //console.log(users);
        // Function to rename keys
        users = users.map(obj => {
          let newObj = { ...obj };

          // Rename the keys
          newObj["id"] = newObj["0"];
          newObj["title"] = newObj["1"];
          newObj["description"] = newObj["2"];
          newObj["status"] = newObj["3"];
          newObj["votes"] = newObj["4"];
          newObj["raisedby"] = newObj["5"];

          // Remove old keys
          delete newObj["0"];
          delete newObj["1"];
          delete newObj["2"];
          delete newObj["3"];
          delete newObj["4"];
          delete newObj["5"];

          return newObj;
        });
        console.log("Calling getIntegrationsList function from Contract ;)...")
        console.log(users);

      }
      catch (error) {
        console.log(error);
      }


    }
    else {
      console.log("Please connect your wallet");
    }

  }

  const renderCell = useCallback((user: any, columnKey: any) => {
    const cellValue = user[columnKey];

    switch (columnKey) {

      case "id":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{user.id}</p>
          </div>
        );
      case "votes":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{user.votes.toString()}</p>
          </div>
        );
      case "title":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize text-default-400">{user.title}</p>
          </div>
        );
      case "status":
        return (
          <Chip
            className="capitalize border-none gap-1 text-default-600"
            color={statusColorMap[user.status]}
            size="sm"
            variant="dot"
          >
            {cellValue}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex justify-end items-center gap-2">
            <Dropdown className="dark bg-background border-1 border-default-200">
              <DropdownTrigger>
                <Button isIconOnly radius="full" size="sm" variant="light">
                  <VerticalDotsIcon className="text-default-400" width={undefined} height={undefined} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem>Up Vote</DropdownItem>
                <DropdownItem>Change Status</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

  const onRowsPerPageChange = React.useCallback((e: any) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);


  const onSearchChange = React.useCallback((value: any) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const topContent = React.useMemo(() => {

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            classNames={{
              base: "w-full sm:max-w-[34%]",
              inputWrapper: "border-1",
            }}
            placeholder="Search..."
            size="sm"
            startContent={<SearchIcon className="text-default-300" />}
            value={filterValue}
            variant="bordered"
            onClear={() => setFilterValue("")}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown className="dark">
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDownIcon className="text-small" />}
                  size="sm"
                  variant="flat"
                >
                  Status
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode="multiple"
                onSelectionChange={setStatusFilter}
                className="dark"
              >
                {statusOptions.map((status) => (
                  <DropdownItem key={status.uid} className="capitalize">
                    {capitalize(status.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown className="dark">
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDownIcon className="text-small" />}
                  size="sm"
                  variant="flat"
                >
                  Columns
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode="multiple"
                onSelectionChange={setVisibleColumns}
                className="dark"
              >
                {columns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {capitalize(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            <div><Button
              className="bg-foreground text-background"
              endContent={<PlusIcon width={undefined} height={undefined} />}
              size="sm"
              onPress={onIntegrationModalOpen}>
              Request Integration
            </Button></div>
            <div><Button
              className="bg-foreground text-background"
              endContent={<PlusIcon width={undefined} height={undefined} />}
              size="sm"
              onPress={onPRModalOpen}>
              Create PR
            </Button></div>


          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">Total {users.length} Integration Requests</span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              onChange={onRowsPerPageChange}
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>


            </select>
          </label>
        </div>
      </div>
    );
  }, [
    filterValue,
    statusFilter,
    visibleColumns,
    onSearchChange,
    onRowsPerPageChange,
    users.length,
    hasSearchFilter,
  ]);
  const bottomContent = React.useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <Pagination
          showControls
          classNames={{
            cursor: "bg-foreground text-background",
          }}
          color="default"
          isDisabled={hasSearchFilter}
          page={page}
          total={pages}
          variant="light"
          onChange={setPage}
        />
        <span className="text-small text-default-400">
          {selectedKeys.size === columns.length
            ? "All items selected"
            : `${selectedKeys.size} of ${items.length} selected`}
        </span>
      </div>
    );
  }, [selectedKeys, items.length, page, pages, hasSearchFilter]);


  const classNames = React.useMemo(
    () => ({
      wrapper: ["max-h-[382px]", "max-w-3xl"],
      th: ["bg-transparent", "text-default-500", "border-b", "border-divider"],
      td: [
        // changing the rows border radius
        // first
        "group-data-[first=true]:first:before:rounded-none",
        "group-data-[first=true]:last:before:rounded-none",
        // middle
        "group-data-[middle=true]:before:rounded-none",
        // last
        "group-data-[last=true]:first:before:rounded-none",
        "group-data-[last=true]:last:before:rounded-none",
      ],
    }),
    [],
  );


  return (
    <main color="primary" className="dark flex min-h-screen flex-col items-center justify-between p-3">
      <Navbar isBordered disableAnimation classNames={{
        base: "bg-default-500/15 shadow-lg",
      }}>
        <NavbarContent className="sm:hidden" justify="start">
          <NavbarMenuToggle />
        </NavbarContent>

        <NavbarContent className="sm:hidden pr-3" justify="center">
          <NavbarBrand>
            <EcosystemLogo />
            <p className="font-bold text-inherit">TRON | BitTorrent</p>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarBrand>
            <EcosystemLogo />
            <p className="font-bold text-inherit">|TRON | BitTorrent</p>
          </NavbarBrand>
          <NavbarItem>
            <Link href="#1" aria-current="page">
              Integrations
            </Link>
          </NavbarItem>
          <NavbarItem isActive>
            <Link color="foreground" href="#2" >
              Issues
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="#3">
              Eco Map
            </Link>
          </NavbarItem>
        </NavbarContent>

        <NavbarContent justify="end">
          <NavbarItem>
            {hasMetamask ? (
              isConnected ? (
                <Button isDisabled color="success" variant="ghost" onClick={() => connect()}>Connected</Button>
              ) : (
                <Button color="warning" variant="ghost" onClick={() => connect()}>Connect Wallet</Button>
              )
            ) : (
              <Button isDisabled color="default" variant="ghost" onClick={() => connect()}>Wallet Not Detected</Button>
            )}
          </NavbarItem>
        </NavbarContent>

        <NavbarMenu>
          {menuItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link
                className="w-full"
                color="primary"
                href="#"
                size="lg"
              >
                {item}
              </Link>
            </NavbarMenuItem>
          ))}
        </NavbarMenu>
      </Navbar>


      <>
        <Modal
          isOpen={isIntegrationModalOpen}
          onOpenChange={onIntegrationModalChange}
          placement="top-center"
          className="dark"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">Project Integration Request</ModalHeader>
                <ModalBody>
                  <Input
                    autoFocus
                    label="Project name"
                    placeholder="Enter project name"
                    variant="bordered"
                    value={projectNameValue}
                    onValueChange={setprojectNameValue}
                  />
                  <Input

                    label="Description"
                    placeholder="Enter project description"
                    type="description"
                    variant="faded"
                    size="md"
                    value={projectDescriptionValue}
                    onValueChange={setprojectDescriptionValue}
                  />

                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="flat" onPress={onClose}>
                    Close
                  </Button>
                  <Button color="primary" onClick={() => addNewIntegration(projectNameValue, projectDescriptionValue)} onPress={onClose}>
                    Store in blockchain
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>


      <>
        <Modal
          isOpen={isPRModalOpen}
          onOpenChange={onPRModalChange}
          placement="top-center"
          className="dark"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">New Problem Report</ModalHeader>
                <ModalBody>
                  <Input
                    autoFocus
                    label="Issue title"
                    placeholder="Enter issue title"
                    variant="bordered"
                    value={issueTitleValue}
                    onValueChange={setissueTitleValue}
                  />
                  <Input

                    label="Description"
                    placeholder="Enter problem description"
                    type="description"
                    variant="faded"
                    value={issueDescriptionValue}
                    onValueChange={setissueDescriptionValue}
                  />

                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="flat" onPress={onClose} >
                    Close
                  </Button>
                  <Button color="primary" onPress={onClose} onClick={() => addNewProblemReport(issueTitleValue, issueDescriptionValue)}>
                    Store in blockchain
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>



      <Table
        isCompact
        layout="auto"
        aria-label="Integrations Request List"
        bottomContent={bottomContent}
        className="dark"
        bottomContentPlacement="outside"
        checkboxesProps={{
          classNames: {
            wrapper: "after:bg-foreground after:text-background text-background",
          },
        }}
        classNames={classNames}
        className="dark flex min-h-screen items-center justify-between p-2"
        selectedKeys={selectedKeys}
        selectionMode="single"
        sortDescriptor={sortDescriptor}
        topContent={topContent}
        topContentPlacement="inside"
        onSelectionChange={setSelectedKeys}
        onSortChange={setSortDescriptor}
      >
        <TableHeader columns={headerColumns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === "actions" ? "center" : "start"}
              allowsSorting={column.sortable}
              className="dark"
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={"No Integrations found"} items={sortedItems}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>


    </main>
  );
}

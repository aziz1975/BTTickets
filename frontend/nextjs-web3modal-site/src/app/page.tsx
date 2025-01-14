"use client";
import React, {
  useEffect,
  useState,
  useCallback,
  ReactNode,
  Key,
  ChangeEvent,
} from "react";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers } from "ethers";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@nextui-org/navbar";
import { Link } from "@nextui-org/link";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
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
  Pagination,
} from "@nextui-org/react";

import { abi } from "./constants/abi";
import { EcosystemLogo } from "./EcosystemLogo";
import { PlusIcon } from "./assets/Plusicon";
import { VerticalDotsIcon } from "./assets/VerticalDotsIcon";
import { SearchIcon } from "./assets/Searchicon";
import { ChevronDownIcon } from "./assets/ChevronDownIcon";
import { columns, statusOptions } from "./data";
import { capitalize } from "./utils/utils";

/* ------------------------------------------------------------------
   Type definitions
   ------------------------------------------------------------------ */

// Define what each row from the contract looks like *after* mapping:
interface IntegrationRequest {
  id: string;           // e.g., obj[0].toString()
  title: string;        // e.g., obj[1]
  description: string;  // e.g., obj[2]
  status: string;       // e.g., obj[3].toString() => "0", "1", ...
  votes: bigint;        // e.g., obj[4] as bigint (or string/number as needed)
  raisedby: string;     // e.g., obj[5]
}

// For sorting
type SortDirection = "ascending" | "descending";
interface SortDescriptor {
  column: keyof IntegrationRequest;
  direction: SortDirection;
}

// The possible columns we can render (including "actions")
type ColumnKey = keyof IntegrationRequest | "actions";

// For mapping status codes to NextUI Chip colors
type StatusColorKey = "0" | "1" | "2" | "3" | "4" | "5";
type StatusColorValue = "primary" | "warning" | "default" | "success" | "danger";
type StatusColorMap = Record<StatusColorKey, StatusColorValue>;

const statusColorMap: StatusColorMap = {
  "0": "primary", // NEW
  "1": "warning", // IN_REVIEW
  "2": "default", // DEFERRED
  "3": "success", // DONE
  "4": "danger",  // REJ
  "5": "default", // HIDE
};

/* ------------------------------------------------------------------
   Constants
   ------------------------------------------------------------------ */

const INITIAL_VISIBLE_COLUMNS: ColumnKey[] = [
  "id",
  "title",
  "description",
  "status",
  "votes",
  "raisedby",
  "actions",
];

// NOTE: Adjust this to your actual contract address
const CONTRACT_ADDRESS = "0xf4b6085ae33f073ee7D20ab4F6b79158C8F7889E";

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      rpc: { 1029: "https://pre-rpc.bt.io/" }, // Assigning BTTC testnet chain ID and RPC
    },
  },
};

export default function TronBitTorrentIssues(): JSX.Element {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [hasMetamask, setHasMetamask] = useState<boolean>(false);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  const {
    isOpen: isPRModalOpen,
    onOpen: onPRModalOpen,
    onOpenChange: onPRModalChange,
  } = useDisclosure();

  const {
    isOpen: isIntegrationModalOpen,
    onOpen: onIntegrationModalOpen,
    onOpenChange: onIntegrationModalChange,
  } = useDisclosure();

  const [users, setUsers] = useState<IntegrationRequest[]>([]);

  // For filtering
  const [filterValue, setFilterValue] = useState<string>("");
  // We'll allow multiple statuses, or the special "all"
  const [statusFilter, setStatusFilter] = useState<"all" | Set<string>>("all");

  // For pagination
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // For columns
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(INITIAL_VISIBLE_COLUMNS),
  );
  const [selectedKeys, setSelectedKeys] = useState<Set<Key>>(new Set());

  // For sorting
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "status",
    direction: "ascending",
  });

  // For modal inputs
  const [issueTitleValue, setIssueTitleValue] = useState<string>("");
  const [issueDescriptionValue, setIssueDescriptionValue] = useState<string>("");
  const [projectNameValue, setProjectNameValue] = useState<string>("");
  const [projectDescriptionValue, setProjectDescriptionValue] = useState<string>(
    "",
  );

  // Used to display Navbar items in mobile menu
  const menuItems = ["Integrations", "Problem Reports", "Ecosystem Map"];

  /* ------------------------------------------------------------------
     Lifecycle
     ------------------------------------------------------------------ */

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      setHasMetamask(true);
    }
  }, []);

  useEffect(() => {
    console.log(`Wallet connection status changed to ${isConnected}`);
    if (isConnected) {
      void getIntegrationStatus();
    }
  }, [isConnected]);

  /* ------------------------------------------------------------------
     Web3 / Contract calls
     ------------------------------------------------------------------ */

  async function connect(): Promise<void> {
    if (typeof window.ethereum === "undefined") {
      setIsConnected(false);
      return;
    }

    const web3Modal = new Web3Modal({
      cacheProvider: false,
      providerOptions,
    });

    try {
      await web3Modal.connect();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const _signer = await provider.getSigner();
      setSigner(_signer);
      setIsConnected(true);
    } catch (e) {
      console.log(e);
      setIsConnected(false);
    }
  }

  async function addNewIntegration(
    _IRTitle: string,
    _IRDescription: string,
  ): Promise<void> {
    if (!isConnected || !signer) {
      console.log("Please connect your wallet before adding an integration.");
      return;
    }

    if (!_IRTitle || !_IRDescription) {
      console.log("Either Title or Description is empty.");
      return;
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
    try {
      // Send transaction
      await contract.addNewIntegration(_IRTitle, _IRDescription);

      // Clear fields
      setProjectNameValue("");
      setProjectDescriptionValue("");

      // Optionally refresh the list
      void getIntegrationStatus();
    } catch (error) {
      console.log(error);
    }
  }

  async function addNewProblemReport(
    _PRTitle: string,
    _PRDescription: string,
  ): Promise<void> {
    if (!isConnected || !signer) {
      console.log("Please connect your wallet before adding a problem report.");
      return;
    }

    if (!_PRTitle || !_PRDescription) {
      console.log("Either Title or Description is empty.");
      return;
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
    try {
      // Send transaction
      await contract.addNewIssue(_PRTitle, _PRDescription);

      // Clear fields
      setIssueTitleValue("");
      setIssueDescriptionValue("");

      // Optionally refresh the list
      void getIntegrationStatus();
    } catch (error) {
      console.log(error);
    }
  }

  async function getIntegrationStatus(): Promise<void> {
    if (!isConnected || !signer) {
      console.log("Please connect your wallet");
      return;
    }

    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      let fetchedUsers = await contract.getIntegrationsList();

      /*
        The shape of `fetchedUsers` from the contract might be something like:
        [
          [bigint, string, string, bigint, bigint, string],
          [bigint, string, string, bigint, bigint, string],
          ...
        ]
      */

      const mapped = fetchedUsers.map((obj: any) => {
        return {
          id: obj[0].toString(),
          title: obj[1],
          description: obj[2],
          status: obj[3].toString(),
          votes: obj[4],
          raisedby: obj[5],
        } as IntegrationRequest;
      });

      console.log("Calling getIntegrationsList from the contract...");
      console.log(mapped);

      setUsers(mapped);
    } catch (error) {
      console.log(error);
    }
  }

  /* ------------------------------------------------------------------
     Table filtering, pagination, sorting
     ------------------------------------------------------------------ */

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns.size === columns.length) return columns;
    return columns.filter((column) => visibleColumns.has(column.uid as ColumnKey));
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filtered = [...users];

    // Text search
    if (hasSearchFilter) {
      filtered = filtered.filter((u) =>
        u.title.toLowerCase().includes(filterValue.toLowerCase()),
      );
    }

    // Status filter
    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      filtered = filtered.filter((u) => statusFilter.has(u.status));
    }

    return filtered;
  }, [users, filterValue, statusFilter, hasSearchFilter]);

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
      if (first < second) return sortDescriptor.direction === "descending" ? 1 : -1;
      if (first > second) return sortDescriptor.direction === "descending" ? -1 : 1;
      return 0;
    });
  }, [sortDescriptor, items]);

  /* ------------------------------------------------------------------
     Table renderCell
     ------------------------------------------------------------------ */

  const renderCell = useCallback(
    (user: IntegrationRequest, columnKey: ColumnKey): ReactNode => {
      const cellValue = user[columnKey as keyof IntegrationRequest];

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
              <p className="text-bold text-small capitalize">
                {user.votes.toString()}
              </p>
            </div>
          );

        case "title":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-sm capitalize text-default-400">
                {user.title}
              </p>
            </div>
          );

        case "status":
          return (
            <Chip
              className="capitalize border-none gap-1 text-default-600"
              color={statusColorMap[user.status as StatusColorKey]}
              size="sm"
              variant="dot"
            >
              {user.status}
            </Chip>
          );

        case "actions":
          return (
            <div className="relative flex justify-end items-center gap-2">
              <Dropdown className="dark bg-background border-1 border-default-200">
                <DropdownTrigger>
                  <Button isIconOnly radius="full" size="sm" variant="light">
                    <VerticalDotsIcon
                      className="text-default-400"
                      width={undefined}
                      height={undefined}
                    />
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
    },
    [],
  );

  /* ------------------------------------------------------------------
     Handlers
     ------------------------------------------------------------------ */

  const onRowsPerPageChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = useCallback((value: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  /* ------------------------------------------------------------------
     Table topContent & bottomContent
     ------------------------------------------------------------------ */

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
                selectedKeys={
                  statusFilter === "all" ? new Set<string>() : statusFilter
                }
                selectionMode="multiple"
                onSelectionChange={(keys) => setStatusFilter(keys as Set<string>)}
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
                onSelectionChange={(keys) =>
                  setVisibleColumns(keys as Set<ColumnKey>)
                }
                className="dark"
              >
                {columns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {capitalize(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            <Button
              className="bg-foreground text-background"
              endContent={<PlusIcon width={undefined} height={undefined} />}
              size="sm"
              onPress={onIntegrationModalOpen}
            >
              Request Integration
            </Button>

            <Button
              className="bg-foreground text-background"
              endContent={<PlusIcon width={undefined} height={undefined} />}
              size="sm"
              onPress={onPRModalOpen}
            >
              Create PR
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {users.length} Integration Requests
          </span>
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
    onIntegrationModalOpen,
    onPRModalOpen,
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
          {selectedKeys.size === items.length
            ? "All items selected"
            : `${selectedKeys.size} of ${items.length} selected`}
        </span>
      </div>
    );
  }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

  /* ------------------------------------------------------------------
     Table classNames
     ------------------------------------------------------------------ */

  const classNames = React.useMemo(() => {
    return {
      wrapper: ["max-h-[382px]", "max-w-3xl"],
      th: ["bg-transparent", "text-default-500", "border-b", "border-divider"],
      td: [
        // row border radius, etc.
        // first
        "group-data-[first=true]:first:before:rounded-none",
        "group-data-[first=true]:last:before:rounded-none",
        // middle
        "group-data-[middle=true]:before:rounded-none",
        // last
        "group-data-[last=true]:first:before:rounded-none",
        "group-data-[last=true]:last:before:rounded-none",
      ],
    };
  }, []);

  /* ------------------------------------------------------------------
     Render
     ------------------------------------------------------------------ */

  return (
    <main className="dark flex min-h-screen flex-col items-center justify-between p-3">
      <Navbar
        isBordered
        disableAnimation
        classNames={{
          base: "bg-default-500/15 shadow-lg",
        }}
      >
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
            <Link color="foreground" href="#2">
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
                <Button isDisabled color="success" variant="ghost">
                  Connected
                </Button>
              ) : (
                <Button color="warning" variant="ghost" onClick={connect}>
                  Connect Wallet
                </Button>
              )
            ) : (
              <Button isDisabled color="default" variant="ghost">
                Wallet Not Detected
              </Button>
            )}
          </NavbarItem>
        </NavbarContent>

        <NavbarMenu>
          {menuItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link className="w-full" color="primary" href="#" size="lg">
                {item}
              </Link>
            </NavbarMenuItem>
          ))}
        </NavbarMenu>
      </Navbar>

      {/* Integration Modal */}
      <Modal
        isOpen={isIntegrationModalOpen}
        onOpenChange={onIntegrationModalChange}
        placement="top-center"
        className="dark"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Project Integration Request
              </ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  label="Project name"
                  placeholder="Enter project name"
                  variant="bordered"
                  value={projectNameValue}
                  onValueChange={setProjectNameValue}
                />
                <Input
                  label="Description"
                  placeholder="Enter project description"
                  type="description"
                  variant="faded"
                  size="md"
                  value={projectDescriptionValue}
                  onValueChange={setProjectDescriptionValue}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  onClick={() => {
                    void addNewIntegration(projectNameValue, projectDescriptionValue);
                    onClose();
                  }}
                >
                  Store in blockchain
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Problem Report Modal */}
      <Modal
        isOpen={isPRModalOpen}
        onOpenChange={onPRModalChange}
        placement="top-center"
        className="dark"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                New Problem Report
              </ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  label="Issue title"
                  placeholder="Enter issue title"
                  variant="bordered"
                  value={issueTitleValue}
                  onValueChange={setIssueTitleValue}
                />
                <Input
                  label="Description"
                  placeholder="Enter problem description"
                  type="description"
                  variant="faded"
                  value={issueDescriptionValue}
                  onValueChange={setIssueDescriptionValue}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  onClick={() => {
                    void addNewProblemReport(issueTitleValue, issueDescriptionValue);
                    onClose();
                  }}
                >
                  Store in blockchain
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Table of Integrations */}
      <Table
        isCompact
        layout="auto"
        aria-label="Integration Requests List"
        bottomContent={bottomContent}
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
        <TableBody emptyContent="No Integrations found" items={sortedItems}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey as ColumnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </main>
  );
}

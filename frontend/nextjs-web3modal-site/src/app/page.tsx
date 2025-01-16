/* eslint-disable */
"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  ReactNode,
  ChangeEvent,
  useMemo,
} from "react";
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
  SortDescriptor,
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

// IMPORTANT: import `Key` from @react-types/shared
import type { Key } from "@react-types/shared";

import { abi } from "./constants/abi";
import { EcosystemLogo } from "./EcosystemLogo";
import { PlusIcon } from "./assets/Plusicon";
import { VerticalDotsIcon } from "./assets/VerticalDotsIcon";
import { SearchIcon } from "./assets/Searchicon";
import { ChevronDownIcon } from "./assets/ChevronDownIcon";
import { capitalize } from "./utils/utils";

/* ------------------------------------------------------------------
   Columns & data
   ------------------------------------------------------------------ */

// Make sure each column has a `sortable` boolean:
const columns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "Title", uid: "title", sortable: true },
  { name: "Description", uid: "description", sortable: false },
  { name: "Status", uid: "status", sortable: true },
  { name: "Votes", uid: "votes", sortable: true },
  { name: "Raised By", uid: "raisedby", sortable: false },
  { name: "Actions", uid: "actions", sortable: false },
];

// We'll use the same structure for the PR table:
const prColumns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "Title", uid: "title", sortable: true },
  { name: "Description", uid: "description", sortable: false },
  { name: "Status", uid: "status", sortable: true },
  { name: "Votes", uid: "votes", sortable: true },
  { name: "Raised By", uid: "raisedby", sortable: false },
  { name: "Actions", uid: "actions", sortable: false },
];

const statusOptions = [
  { name: "new", uid: "0" },
  { name: "in_review", uid: "1" },
  { name: "deferred", uid: "2" },
  { name: "done", uid: "3" },
  { name: "rej", uid: "4" },
  { name: "hide", uid: "5" },
];

/* ------------------------------------------------------------------
   Type definitions
   ------------------------------------------------------------------ */

interface IntegrationRequest {
  id: string;          // e.g. "IR-0" or "PR-2"
  title: string;       // e.g. obj[1]
  description: string; // e.g. obj[2]
  status: string;      // e.g. "0", "1", ...
  votes: bigint;       // e.g. obj[4]
  raisedby: string;    // e.g. obj[5]
}

// The possible columns we can render (including "actions")
type ColumnKey = keyof IntegrationRequest | "actions";

// Map status codes to NextUI Chip colors
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

// This object is fine for specifying the RPC for WalletConnect
const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      rpc: { 1029: "https://pre-rpc.bt.io/" }, // BTTC testnet chain ID and RPC
    },
  },
};

/**
 * We cannot directly import web3modal with next/dynamic, because web3modal is
 * not a React component. Instead, we'll conditionally require it in the client.
 */
let Web3Modal: any = null;
if (typeof window !== "undefined") {
  // Conditionally load in the browser only
  Web3Modal = require("web3modal").default;
}

export default function TronBitTorrentIssues(): JSX.Element {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [hasMetamask, setHasMetamask] = useState<boolean>(false);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  // New state to track transaction pending
  const [isTransactionPending, setIsTransactionPending] = useState<boolean>(false);

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

  // For Integrations
  const [users, setUsers] = useState<IntegrationRequest[]>([]);

  // For Problem Reports
  const [prRequests, setPrRequests] = useState<IntegrationRequest[]>([]);

  // For filtering (Integrations)
  const [filterValue, setFilterValue] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | Set<string>>("all");

  // For filtering (Problem Reports)
  const [prFilterValue, setPrFilterValue] = useState<string>("");
  const [prStatusFilter, setPrStatusFilter] = useState<"all" | Set<string>>("all");

  // For pagination (Integrations)
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // For pagination (Problem Reports)
  const [prRowsPerPage, setPrRowsPerPage] = useState<number>(10);
  const [prPage, setPrPage] = useState<number>(1);

  // For columns (Integrations)
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(INITIAL_VISIBLE_COLUMNS),
  );

  // For columns (Problem Reports)
  const [prVisibleColumns, setPrVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(INITIAL_VISIBLE_COLUMNS),
  );

  // NextUI selection: can be "all" or Set<Key>.
  const [selectedKeys, setSelectedKeys] = useState<"all" | Set<Key>>(
    new Set<Key>(),
  );
  const [prSelectedKeys, setPrSelectedKeys] = useState<"all" | Set<Key>>(
    new Set<Key>(),
  );

  // NextUI's sorting descriptor (column + direction) for Integrations
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "status",
    direction: "ascending",
  });

  // NextUI's sorting descriptor (column + direction) for PR
  const [prSortDescriptor, setPrSortDescriptor] = useState<SortDescriptor>({
    column: "status",
    direction: "ascending",
  });

  // For modal inputs
  const [issueTitleValue, setIssueTitleValue] = useState<string>("");
  const [issueDescriptionValue, setIssueDescriptionValue] = useState<string>("");
  const [projectNameValue, setProjectNameValue] = useState<string>("");
  const [projectDescriptionValue, setProjectDescriptionValue] =
    useState<string>("");

  // Used to display Navbar items in mobile menu
  const menuItems = ["Integrations", "Problem Reports", "Ecosystem Map"];

  /* ------------------------------------------------------------------
     Lifecycle
     ------------------------------------------------------------------ */

  useEffect(() => {
    // Check for Metamask on client side
    if (typeof window.ethereum !== "undefined") {
      setHasMetamask(true);
    }
  }, []);

  // Once connected changes, if connected, fetch data
  useEffect(() => {
    if (isConnected) {
      void getIntegrationStatus();
      void getProblemReports();
    }
  }, [isConnected]);

  /* ------------------------------------------------------------------
     Web3 / Contract calls
     ------------------------------------------------------------------ */

  async function connect(): Promise<void> {
    if (typeof window.ethereum === "undefined" || !Web3Modal) {
      setIsConnected(false);
      return;
    }

    try {
      const web3Modal = new Web3Modal({
        cacheProvider: false,
        providerOptions,
      });

      await web3Modal.connect();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const _signer = await provider.getSigner();
      setSigner(_signer);
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    }
  }

  async function addNewIntegration(
    _IRTitle: string,
    _IRDescription: string,
  ): Promise<void> {
    if (!isConnected || !signer) {
      return;
    }
    if (!_IRTitle || !_IRDescription) {
      return;
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
    try {
      // Show "It's working..." overlay
      setIsTransactionPending(true);

      // Send transaction
      const tx = await contract.addNewIntegration(_IRTitle, _IRDescription);
      // Wait for confirmation
      await tx.wait();

      // Hide overlay
      setIsTransactionPending(false);

      setProjectNameValue("");
      setProjectDescriptionValue("");
      void getIntegrationStatus();
    } catch (error) {
      console.error(error);
      setIsTransactionPending(false);
    }
  }

  async function addNewProblemReport(
    _PRTitle: string,
    _PRDescription: string,
  ): Promise<void> {
    if (!isConnected || !signer) {
      return;
    }
    if (!_PRTitle || !_PRDescription) {
      return;
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
    try {
      // Show "It's working..." overlay
      setIsTransactionPending(true);

      // Send transaction
      const tx = await contract.addNewIssue(_PRTitle, _PRDescription);
      // Wait for confirmation
      await tx.wait();

      // Hide overlay
      setIsTransactionPending(false);

      setIssueTitleValue("");
      setIssueDescriptionValue("");
      void getProblemReports();
    } catch (error) {
      console.error(error);
      setIsTransactionPending(false);
    }
  }

  async function getIntegrationStatus(): Promise<void> {
    if (!isConnected || !signer) {
      return;
    }
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      const fetchedUsers = await contract.getIntegrationsList();

      // Convert each object in the array
      const mapped: IntegrationRequest[] = fetchedUsers.map((obj: any) => {
        return {
          id: obj[0].toString(),       // e.g. "IR-0"
          title: obj[1],
          description: obj[2],
          status: obj[3].toString(),
          votes: obj[4],
          raisedby: obj[5],
        };
      });

      setUsers(mapped);
    } catch (error) {
      console.error(error);
    }
  }

  async function getProblemReports(): Promise<void> {
    if (!isConnected || !signer) {
      return;
    }
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      const fetchedIssues = await contract.getPRList();

      const mapped: IntegrationRequest[] = fetchedIssues.map((obj: any) => {
        return {
          id: obj[0].toString(),       // e.g. "PR-0"
          title: obj[1],
          description: obj[2],
          status: obj[3].toString(),
          votes: obj[4],
          raisedby: obj[5],
        };
      });

      setPrRequests(mapped);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * ------------------------------------------------------------------
   * ADDITION 1: handleIntegrationAction
   * Called whenever user picks "Up Vote" or "Change Status" from dropdown
   * ------------------------------------------------------------------
   */
  const handleIntegrationAction = useCallback(
    async (actionKey: Key, integrationId: string) => {
      if (!signer) return;

      // integrationId is something like "IR-0", "IR-1", etc.
      // We need the numeric index from the end of the string:
      const indexString = integrationId.replace("IR-", ""); // remove "IR-"
      const index = parseInt(indexString, 10);

      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      try {
        setIsTransactionPending(true);

        if (actionKey === "upvote") {
          // Up Vote
          const tx = await contract.upVoteIR(index);
          await tx.wait();
        } else if ((actionKey as string).startsWith("status-")) {
          // "status-0", "status-1", etc.
          const newStatus = parseInt((actionKey as string).split("-")[1], 10);
          const tx = await contract.updateIRStatus(index, newStatus);
          await tx.wait();
        }

        setIsTransactionPending(false);
        await getIntegrationStatus();
      } catch (error) {
        setIsTransactionPending(false);
        console.error(error);
      }
    },
    [signer, getIntegrationStatus],
  );

  /**
   * ------------------------------------------------------------------
   * ADDITION 2: handlePRAction
   * Called whenever user picks "Up Vote" or "Change Status" from dropdown
   * ------------------------------------------------------------------
   */
  const handlePRAction = useCallback(
    async (actionKey: Key, prId: string) => {
      if (!signer) return;

      // prId is something like "PR-0", "PR-1", etc.
      // We need the numeric index from the end of the string:
      const indexString = prId.replace("PR-", ""); // remove "PR-"
      const index = parseInt(indexString, 10);

      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      try {
        setIsTransactionPending(true);

        if (actionKey === "upvote") {
          // Up Vote
          const tx = await contract.upVotePR(index);
          await tx.wait();
        } else if ((actionKey as string).startsWith("status-")) {
          // "status-0", "status-1", etc.
          const newStatus = parseInt((actionKey as string).split("-")[1], 10);
          const tx = await contract.updatePRStatus(index, newStatus);
          await tx.wait();
        }

        setIsTransactionPending(false);
        await getProblemReports();
      } catch (error) {
        setIsTransactionPending(false);
        console.error(error);
      }
    },
    [signer, getProblemReports],
  );

  /* ------------------------------------------------------------------
     Table filtering, pagination, sorting (Integrations)
     ------------------------------------------------------------------ */

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = useMemo(() => {
    if (visibleColumns.size === columns.length) return columns;
    return columns.filter((column) => visibleColumns.has(column.uid as ColumnKey));
  }, [visibleColumns]);

  // Computed items after filtering (Integrations)
  const filteredItems = useMemo(() => {
    let filtered = [...users];

    if (hasSearchFilter) {
      filtered = filtered.filter((u) =>
        u.title.toLowerCase().includes(filterValue.toLowerCase()),
      );
    }

    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      filtered = filtered.filter((u) => statusFilter.has(u.status));
    }

    return filtered;
  }, [users, filterValue, statusFilter, hasSearchFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  // Final items for current page (Integrations)
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  // Sorting (Integrations)
  const sortedItems = useMemo(() => {
    if (!sortDescriptor.column) return items;
    const colKey = sortDescriptor.column as keyof IntegrationRequest;
    return [...items].sort((a, b) => {
      const first = a[colKey];
      const second = b[colKey];
      if (first < second) {
        return sortDescriptor.direction === "descending" ? 1 : -1;
      }
      if (first > second) {
        return sortDescriptor.direction === "descending" ? -1 : 1;
      }
      return 0;
    });
  }, [sortDescriptor, items]);

  /* ------------------------------------------------------------------
     Table filtering, pagination, sorting (Problem Reports)
     ------------------------------------------------------------------ */

  const hasPRSearchFilter = Boolean(prFilterValue);

  const prHeaderColumns = useMemo(() => {
    if (prVisibleColumns.size === prColumns.length) return prColumns;
    return prColumns.filter((column) =>
      prVisibleColumns.has(column.uid as ColumnKey),
    );
  }, [prVisibleColumns]);

  // Computed items after filtering (PR)
  const prFilteredItems = useMemo(() => {
    let filtered = [...prRequests];

    if (hasPRSearchFilter) {
      filtered = filtered.filter((u) =>
        u.title.toLowerCase().includes(prFilterValue.toLowerCase()),
      );
    }

    if (
      prStatusFilter !== "all" &&
      Array.from(prStatusFilter).length !== statusOptions.length
    ) {
      filtered = filtered.filter((u) => prStatusFilter.has(u.status));
    }

    return filtered;
  }, [prRequests, prFilterValue, prStatusFilter, hasPRSearchFilter]);

  const prPages = Math.ceil(prFilteredItems.length / prRowsPerPage);

  // Final items for current page (PR)
  const prItems = useMemo(() => {
    const start = (prPage - 1) * prRowsPerPage;
    const end = start + prRowsPerPage;
    return prFilteredItems.slice(start, end);
  }, [prPage, prFilteredItems, prRowsPerPage]);

  // Sorting (PR)
  const prSortedItems = useMemo(() => {
    if (!prSortDescriptor.column) return prItems;
    const colKey = prSortDescriptor.column as keyof IntegrationRequest;
    return [...prItems].sort((a, b) => {
      const first = a[colKey];
      const second = b[colKey];
      if (first < second) {
        return prSortDescriptor.direction === "descending" ? 1 : -1;
      }
      if (first > second) {
        return prSortDescriptor.direction === "descending" ? -1 : 1;
      }
      return 0;
    });
  }, [prSortDescriptor, prItems]);

  /* ------------------------------------------------------------------
     Table renderCell (Integrations)
     ------------------------------------------------------------------ */

  const renderCell = useCallback(
    (user: IntegrationRequest, columnKey: ColumnKey): ReactNode => {
      const cellValue = user[columnKey as keyof IntegrationRequest];

      switch (columnKey) {
        case "id":
          return (
            <div className="flex flex-col text-white">
              <p className="text-bold text-small capitalize">{user.id}</p>
            </div>
          );

        case "votes":
          return (
            <div className="flex flex-col text-white">
              <p className="text-bold text-small capitalize">
                {user.votes.toString()}
              </p>
            </div>
          );

        case "title":
          return (
            <div className="flex flex-col text-white">
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
            <div className="relative flex justify-end items-center gap-2 text-white">
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

                {/* Updated: use onAction to handle "Up Vote" & "Change Status" */}
                <DropdownMenu
                  aria-label="Integration actions"
                  onAction={(key) => handleIntegrationAction(key, user.id)}
                >
                  <DropdownItem key="upvote" style={{ color: "white" }}>
                    Up Vote
                  </DropdownItem>
                  {/* 6 statuses: new (0), in_review (1), deferred (2), done (3), rej (4), hide (5) */}
                  <DropdownItem key="status-0" style={{ color: "white" }}>
                    Change to NEW
                  </DropdownItem>
                  <DropdownItem key="status-1" style={{ color: "white" }}>
                    Change to IN_REVIEW
                  </DropdownItem>
                  <DropdownItem key="status-2" style={{ color: "white" }}>
                    Change to DEFERRED
                  </DropdownItem>
                  <DropdownItem key="status-3" style={{ color: "white" }}>
                    Change to DONE
                  </DropdownItem>
                  <DropdownItem key="status-4" style={{ color: "white" }}>
                    Change to REJ
                  </DropdownItem>
                  <DropdownItem key="status-5" style={{ color: "white" }}>
                    Change to HIDE
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          );

        default:
          return <span className="text-white">{cellValue}</span>;
      }
    },
    [handleIntegrationAction],
  );

  /* ------------------------------------------------------------------
     Table renderCell (Problem Reports)
     ------------------------------------------------------------------ */

  const renderPRCell = useCallback(
    (pr: IntegrationRequest, columnKey: ColumnKey): ReactNode => {
      const cellValue = pr[columnKey as keyof IntegrationRequest];

      switch (columnKey) {
        case "id":
          return (
            <div className="flex flex-col text-white">
              <p className="text-bold text-small capitalize">{pr.id}</p>
            </div>
          );

        case "votes":
          return (
            <div className="flex flex-col text-white">
              <p className="text-bold text-small capitalize">
                {pr.votes.toString()}
              </p>
            </div>
          );

        case "title":
          return (
            <div className="flex flex-col text-white">
              <p className="text-bold text-sm capitalize text-default-400">
                {pr.title}
              </p>
            </div>
          );

        case "status":
          return (
            <Chip
              className="capitalize border-none gap-1 text-default-600"
              color={statusColorMap[pr.status as StatusColorKey]}
              size="sm"
              variant="dot"
            >
              {pr.status}
            </Chip>
          );

        case "actions":
          return (
            <div className="relative flex justify-end items-center gap-2 text-white">
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

                {/* Updated: use onAction to handle "Up Vote" & "Change Status" */}
                <DropdownMenu
                  aria-label="PR actions"
                  onAction={(key) => handlePRAction(key, pr.id)}
                >
                  <DropdownItem key="upvote" style={{ color: "white" }}>
                    Up Vote
                  </DropdownItem>
                  <DropdownItem key="status-0" style={{ color: "white" }}>
                    Change to NEW
                  </DropdownItem>
                  <DropdownItem key="status-1" style={{ color: "white" }}>
                    Change to IN_REVIEW
                  </DropdownItem>
                  <DropdownItem key="status-2" style={{ color: "white" }}>
                    Change to DEFERRED
                  </DropdownItem>
                  <DropdownItem key="status-3" style={{ color: "white" }}>
                    Change to DONE
                  </DropdownItem>
                  <DropdownItem key="status-4" style={{ color: "white" }}>
                    Change to REJ
                  </DropdownItem>
                  <DropdownItem key="status-5" style={{ color: "white" }}>
                    Change to HIDE
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          );

        default:
          return <span className="text-white">{cellValue}</span>;
      }
    },
    [handlePRAction],
  );

  /* ------------------------------------------------------------------
     Handlers (Integrations)
     ------------------------------------------------------------------ */

  const onRowsPerPageChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = useCallback((value: string) => {
    setFilterValue(value);
    setPage(1);
  }, []);

  /* ------------------------------------------------------------------
     Handlers (Problem Reports)
     ------------------------------------------------------------------ */

  const onPRRowsPerPageChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setPrRowsPerPage(Number(e.target.value));
      setPrPage(1);
    },
    [],
  );

  const onPRSearchChange = useCallback((value: string) => {
    setPrFilterValue(value);
    setPrPage(1);
  }, []);

  /* ------------------------------------------------------------------
     Table topContent & bottomContent (Integrations)
     ------------------------------------------------------------------ */

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            style={{ color: "white" }} // search box text color
            classNames={{
              base: "w-full sm:max-w-[34%]",
              inputWrapper: "border-1",
              input: "text-white", // ensure text is white
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
                  style={{ color: "white" }} // "Status" text color = white
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
                  <DropdownItem
                    key={status.uid}
                    className="capitalize"
                    style={{ color: "white" }}
                  >
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
                  style={{ color: "white" }} // "Columns" text color = white
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
                  <DropdownItem
                    key={column.uid}
                    className="capitalize"
                    style={{ color: "white" }}
                  >
                    {capitalize(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            {/* Removed the "Create PR" button from here */}
            <Button
              className="bg-foreground text-background"
              endContent={<PlusIcon width={undefined} height={undefined} />}
              size="sm"
              onPress={onIntegrationModalOpen}
            >
              Request Integration
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
  ]);

  const bottomContent = useMemo(() => {
    const currentItemsCount =
      selectedKeys === "all" ? items.length : selectedKeys.size;

    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <Pagination
          showControls
          classNames={{
            cursor: "bg-foreground text-background",
          }}
          color="default"
          page={page}
          total={pages}
          variant="light"
          onChange={setPage}
        />
        <span className="text-small text-default-400">
          {currentItemsCount === items.length
            ? "All items selected"
            : `${currentItemsCount} of ${items.length} selected`}
        </span>
      </div>
    );
  }, [selectedKeys, items, page, pages]);

  /* ------------------------------------------------------------------
     Table topContent & bottomContent (Problem Reports)
     ------------------------------------------------------------------ */

  const prTopContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            style={{ color: "white" }} // search box text color
            classNames={{
              base: "w-full sm:max-w-[34%]",
              inputWrapper: "border-1",
              input: "text-white", // ensure text is white
            }}
            placeholder="Search..."
            size="sm"
            startContent={<SearchIcon className="text-default-300" />}
            value={prFilterValue}
            variant="bordered"
            onClear={() => setPrFilterValue("")}
            onValueChange={onPRSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown className="dark">
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDownIcon className="text-small" />}
                  size="sm"
                  variant="flat"
                  style={{ color: "white" }} // "Status" text color = white
                >
                  Status
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={
                  prStatusFilter === "all" ? new Set<string>() : prStatusFilter
                }
                selectionMode="multiple"
                onSelectionChange={(keys) =>
                  setPrStatusFilter(keys as Set<string>)
                }
                className="dark"
              >
                {statusOptions.map((status) => (
                  <DropdownItem
                    key={status.uid}
                    className="capitalize"
                    style={{ color: "white" }}
                  >
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
                  style={{ color: "white" }} // "Columns" text color = white
                >
                  Columns
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={prVisibleColumns}
                selectionMode="multiple"
                onSelectionChange={(keys) =>
                  setPrVisibleColumns(keys as Set<ColumnKey>)
                }
                className="dark"
              >
                {prColumns.map((column) => (
                  <DropdownItem
                    key={column.uid}
                    className="capitalize"
                    style={{ color: "white" }}
                  >
                    {capitalize(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            {/* Moved "Create PR" button here */}
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
            Total {prRequests.length} Problem Reports
          </span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              onChange={onPRRowsPerPageChange}
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
    prFilterValue,
    prStatusFilter,
    prVisibleColumns,
    onPRSearchChange,
    onPRRowsPerPageChange,
    prRequests.length,
    onPRModalOpen,
  ]);

  const prBottomContent = useMemo(() => {
    const currentItemsCount =
      prSelectedKeys === "all" ? prItems.length : prSelectedKeys.size;

    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <Pagination
          showControls
          classNames={{
            cursor: "bg-foreground text-background",
          }}
          color="default"
          page={prPage}
          total={prPages}
          variant="light"
          onChange={setPrPage}
        />
        <span className="text-small text-default-400">
          {currentItemsCount === prItems.length
            ? "All items selected"
            : `${currentItemsCount} of ${prItems.length} selected`}
        </span>
      </div>
    );
  }, [prSelectedKeys, prItems, prPage, prPages]);

  /* ------------------------------------------------------------------
     Table classNames
     ------------------------------------------------------------------ */

  const classNames = useMemo(() => {
    return {
      // We removed "max-w-3xl" so columns are visible without horizontal scrolling
      wrapper: ["max-h-[382px]", "w-[90vw]"],
      th: ["bg-transparent", "text-default-500", "border-b", "border-divider"],
      td: [
        "text-white",
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

  // If a transaction is pending, show a simple overlay
  return (
    <main className="dark flex min-h-screen flex-col items-center justify-between p-3">
      {isTransactionPending && (
        <div
          className="fixed top-0 left-0 flex items-center justify-center w-screen h-screen bg-black bg-opacity-70 z-50"
          style={{ backdropFilter: "blur(3px)" }}
        >
          <p className="text-white text-lg">It's working...</p>
        </div>
      )}

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
          {/* "Issues" -> color blue */}
          <NavbarItem isActive>
            <Link style={{ color: "blue" }} href="#2">
              Issues
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link style={{ color: "blue" }} href="#3">
              Eco Map
            </Link>
          </NavbarItem>
        </NavbarContent>

        <NavbarContent justify="end">
          <NavbarItem>
            {hasMetamask ? (
              isConnected ? (
                <Button
                  style={{ backgroundColor: "#00008B", color: "#ffffff" }}
                >
                  Connected
                </Button>
              ) : (
                <Button
                  style={{ backgroundColor: "#8B0000", color: "#ffffff" }}
                  onClick={connect}
                >
                  Connect Wallet
                </Button>
              )
            ) : (
              <Button isDisabled color="danger" variant="ghost">
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
              <ModalHeader className="flex flex-col gap-1 text-white">
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
                  style={{ color: "white" }}
                />
                <Input
                  label="Description"
                  placeholder="Enter project description"
                  type="description"
                  variant="faded"
                  size="md"
                  value={projectDescriptionValue}
                  onValueChange={setProjectDescriptionValue}
                  style={{ color: "white" }}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    void addNewIntegration(
                      projectNameValue,
                      projectDescriptionValue,
                    );
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
              <ModalHeader className="flex flex-col gap-1 text-white">
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
                  style={{ color: "white" }}
                />
                <Input
                  label="Description"
                  placeholder="Enter problem description"
                  type="description"
                  variant="faded"
                  value={issueDescriptionValue}
                  onValueChange={setIssueDescriptionValue}
                  style={{ color: "white" }}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    void addNewProblemReport(
                      issueTitleValue,
                      issueDescriptionValue,
                    );
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

      {/* -------------------------------------------
          Headings & Integrations Table
          -----------------------------------------*/}
      <h3 style={{ color: "Black", marginTop: "1rem" }}>
        Integration Requests
      </h3>
      <div className="flex justify-center w-full mt-5">
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
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          sortDescriptor={sortDescriptor}
          onSortChange={(descriptor) => setSortDescriptor(descriptor)}
          topContent={topContent}
          topContentPlacement="inside"
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
                  <TableCell>
                    {renderCell(item, columnKey as ColumnKey)}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* -------------------------------------------
          Headings & Problem Reports Table
          -----------------------------------------*/}
      <h3 style={{ color: "Black", marginTop: "1rem" }}>Problem Reports</h3>
      <div className="flex justify-center w-full mt-12">
        <Table
          isCompact
          layout="auto"
          aria-label="Problem Reports List"
          bottomContent={prBottomContent}
          bottomContentPlacement="outside"
          checkboxesProps={{
            classNames: {
              wrapper: "after:bg-foreground after:text-background text-background",
            },
          }}
          classNames={classNames}
          selectionMode="multiple"
          selectedKeys={prSelectedKeys}
          onSelectionChange={setPrSelectedKeys}
          sortDescriptor={prSortDescriptor}
          onSortChange={(descriptor) => setPrSortDescriptor(descriptor)}
          topContent={prTopContent}
          topContentPlacement="inside"
        >
          <TableHeader columns={prHeaderColumns}>
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
          <TableBody emptyContent="No Problem Reports found" items={prSortedItems}>
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => (
                  <TableCell>
                    {renderPRCell(item, columnKey as ColumnKey)}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}

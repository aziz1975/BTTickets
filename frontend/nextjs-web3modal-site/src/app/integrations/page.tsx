/* app/integrations/page.tsx */
/* eslint-disable */
"use client";

import React, {
  useEffect,
  useState,
  ReactNode,
  ChangeEvent,
  useMemo,
} from "react";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers, getAddress } from "ethers";
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

import type { Key } from "@react-types/shared";

import { abi } from "../constants/abi"; // Adjust path if needed
import { PlusIcon } from "../assets/Plusicon"; // Adjust path
import { VerticalDotsIcon } from "../assets/VerticalDotsIcon"; // Adjust path
import { SearchIcon } from "../assets/Searchicon"; // Adjust path
import { ChevronDownIcon } from "../assets/ChevronDownIcon"; // Adjust path
import { capitalize } from "../utils/utils"; // Adjust path

import { useWalletContext } from "../context/WalletContext";
import dotenv from "dotenv";

// Load environment variables from .env and .env.local
dotenv.config({ path: "../../../.env" });

const columns = [
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

interface IntegrationRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  votes: bigint;
  raisedby: string;
}

type ColumnKey = keyof IntegrationRequest | "actions";

type StatusColorKey = "0" | "1" | "2" | "3" | "4" | "5";
type StatusColorValue = "primary" | "warning" | "default" | "success" | "danger";
type StatusColorMap = Record<StatusColorKey, StatusColorValue>;

const statusColorMap: StatusColorMap = {
  "0": "primary",
  "1": "warning",
  "2": "default",
  "3": "success",
  "4": "danger",
  "5": "default",
};

const INITIAL_VISIBLE_COLUMNS: ColumnKey[] = [
  "id",
  "title",
  "description",
  "status",
  "votes",
  "raisedby",
  "actions",
];

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS as string;

// Helper to parse "IR-4" -> BigInt(4)
function parseIntegrationId(idStr: string): bigint {
  if (idStr.startsWith("IR-")) {
    return BigInt(idStr.slice(3));
  }
  return BigInt(idStr);
}

export default function IntegrationsPage() {
  const { isConnected, signer } = useWalletContext();

  const [isTransactionPending, setIsTransactionPending] = useState<boolean>(false);

  const {
    isOpen: isIntegrationModalOpen,
    onOpen: onIntegrationModalOpen,
    onOpenChange: onIntegrationModalChange,
  } = useDisclosure();

  const [users, setUsers] = useState<IntegrationRequest[]>([]);
  const [filterValue, setFilterValue] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | Set<string>>("all");
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(INITIAL_VISIBLE_COLUMNS),
  );
  const [selectedKeys, setSelectedKeys] = useState<"all" | Set<Key>>(
    new Set<Key>(),
  );
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "status",
    direction: "ascending",
  });

  const [projectNameValue, setProjectNameValue] = useState<string>("");
  const [projectDescriptionValue, setProjectDescriptionValue] = useState<string>(
    "",
  );

  // State to track if connected user is owner
  const [isOwner, setIsOwner] = useState<boolean>(false);

  useEffect(() => {
    if (isConnected) {
      void getIntegrationStatus();
    }
  }, [isConnected]);

  async function addNewIntegration(_IRTitle: string, _IRDescription: string) {
    if (!isConnected || !signer || !_IRTitle || !_IRDescription) return;
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      setIsTransactionPending(true);
      const tx = await contract.addNewIntegration(_IRTitle, _IRDescription);
      await tx.wait();
      setIsTransactionPending(false);
      setProjectNameValue("");
      setProjectDescriptionValue("");
      void getIntegrationStatus();
    } catch (error) {
      console.error(error);
      setIsTransactionPending(false);
    }
  }

  async function getIntegrationStatus() {
    if (!isConnected || !signer) return;
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      const fetchedUsers = await contract.getIntegrationsList();

      const mapped: IntegrationRequest[] = fetchedUsers.map((obj: any) => {
        return {
          id: obj[0].toString(),
          title: obj[1],
          description: obj[2],
          status: obj[3].toString(),
          votes: obj[4],
          raisedby: obj[5],
        };
      });

      setUsers(mapped);

      const owner = await contract.owner();
      const userAddr = await signer.getAddress();

      // Debug logs
      console.log("----- IntegrationsPage Debug -----");
      console.log("Raw contract owner from contract:", owner);
      console.log("Raw user address from signer:", userAddr);
      console.log("Checksummed owner:", getAddress(owner));
      console.log("Checksummed user:", getAddress(userAddr));
      console.log(
        "Comparing checksummed addresses: ",
        getAddress(owner) === getAddress(userAddr),
      );

      setIsOwner(getAddress(owner) === getAddress(userAddr));
    } catch (error) {
      console.error(error);
    }
  }

  // REMOVED useCallback to ensure updated state is used
  async function handleIntegrationAction(actionKey: Key, integrationId: string) {
    console.log("handleIntegrationAction => isOwner:", isOwner, "action:", actionKey);

    if (!signer) return;
    try {
      setIsTransactionPending(true);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      const index = parseIntegrationId(integrationId);

      if (actionKey === "upvote") {
        const tx = await contract.upVoteIR(index);
        await tx.wait();
      } else if ((actionKey as string).startsWith("status-")) {
        if (!isOwner) {
          alert("Only the owner can change the status");
          setIsTransactionPending(false);
          return;
        }
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
  }

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = useMemo(() => {
    if (visibleColumns.size === columns.length) return columns;
    return columns.filter((column) => visibleColumns.has(column.uid as ColumnKey));
  }, [visibleColumns]);

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
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

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

  function renderCell(user: IntegrationRequest, columnKey: ColumnKey): ReactNode {
    const cellValue = user[columnKey as keyof IntegrationRequest];
    switch (columnKey) {
      case "id":
        return (
          <div className="flex flex-col text-gray-900 dark:text-gray-100">
            <p className="text-sm font-bold">{user.id}</p>
          </div>
        );
      case "votes":
        return (
          <div className="flex flex-col text-gray-900 dark:text-gray-100">
            <p className="text-sm font-bold">{user.votes.toString()}</p>
          </div>
        );
      case "title":
        return (
          <div className="flex flex-col text-gray-900 dark:text-gray-100">
            <p className="text-sm font-semibold">{user.title}</p>
          </div>
        );
      case "status":
        return (
          <Chip
            className="capitalize gap-1 text-gray-900 dark:text-gray-100"
            color={statusColorMap[user.status as StatusColorKey]}
            size="sm"
            variant="dot"
          >
            {user.status}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex justify-end items-center gap-2 text-gray-900 dark:text-gray-100">
            <Dropdown
              className="border-1 border-default-200"
              placement="bottom-end"
            >
              <DropdownTrigger>
                <Button isIconOnly radius="full" size="sm" variant="light">
                  <VerticalDotsIcon
                    className="text-gray-900 dark:text-gray-200"
                    width={undefined}
                    height={undefined}
                  />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Integration actions"
                onAction={(key) => handleIntegrationAction(key, user.id)}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <DropdownItem key="upvote">Up Vote</DropdownItem>
                <DropdownItem key="status-0">Change to NEW</DropdownItem>
                <DropdownItem key="status-1">Change to IN_REVIEW</DropdownItem>
                <DropdownItem key="status-2">Change to DEFERRED</DropdownItem>
                <DropdownItem key="status-3">Change to DONE</DropdownItem>
                <DropdownItem key="status-4">Change to REJ</DropdownItem>
                <DropdownItem key="status-5">Change to HIDE</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return (
          <span className="text-gray-900 dark:text-gray-100">{cellValue}</span>
        );
    }
  }

  function onRowsPerPageChange(e: ChangeEvent<HTMLSelectElement>) {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }

  function onSearchChange(value: string) {
    setFilterValue(value);
    setPage(1);
  }

  const topContent = useMemo(() => {
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
            <Dropdown>
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
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {statusOptions.map((status) => (
                  <DropdownItem key={status.uid} className="capitalize">
                    {capitalize(status.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            <Dropdown>
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
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {users.length} Integration Requests
          </span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small ml-1"
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

  const classNames = useMemo(() => {
    return {
      wrapper: ["max-h-[382px]", "w-[90vw]"],
      table: "bg-white dark:bg-[#1f1f1f]",
      th: [
        "bg-transparent",
        "border-b",
        "border-divider",
        "text-gray-900 dark:text-gray-100",
      ],
      td: [
        "border-b",
        "border-divider",
        "text-gray-900 dark:text-gray-100",
        "group-data-[first=true]:before:rounded-none",
      ],
    };
  }, []);

  return (
    <>
      {isTransactionPending && (
        <div
          className="fixed top-0 left-0 flex items-center justify-center w-screen h-screen bg-black bg-opacity-70 z-50"
          style={{ backdropFilter: "blur(3px)" }}
        >
          <p className="text-white text-lg">It's working...</p>
        </div>
      )}

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
      </div>

      <Modal
        isOpen={isIntegrationModalOpen}
        onOpenChange={onIntegrationModalChange}
        placement="top-center"
        className="dark:bg-[#1f1f1f]"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-gray-900 dark:text-gray-100">
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
                  className="text-gray-900 dark:text-gray-100"
                />
                <Input
                  label="Description"
                  placeholder="Enter project description"
                  type="description"
                  variant="faded"
                  size="md"
                  value={projectDescriptionValue}
                  onValueChange={setProjectDescriptionValue}
                  className="text-gray-900 dark:text-gray-100"
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
    </>
  );
}

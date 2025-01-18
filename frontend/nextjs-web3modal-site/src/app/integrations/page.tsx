/* app/integrations/page.tsx */
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

const CONTRACT_ADDRESS = "0xf4b6085ae33f073ee7D20ab4F6b79158C8F7889E";

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
  const [projectDescriptionValue, setProjectDescriptionValue] = useState<string>("");

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
    } catch (error) {
      console.error(error);
    }
  }

  const handleIntegrationAction = useCallback(
    async (actionKey: Key, integrationId: string) => {
      if (!signer) return;
      const index = parseInt(integrationId, 10);
      try {
        setIsTransactionPending(true);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

        if (actionKey === "upvote") {
          const tx = await contract.upVoteIR(index);
          await tx.wait();
        } else if ((actionKey as string).startsWith("status-")) {
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
                <DropdownMenu
                  aria-label="Integration actions"
                  onAction={(key) => handleIntegrationAction(key, user.id)}
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
    [handleIntegrationAction],
  );

  const onRowsPerPageChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = useCallback((value: string) => {
    setFilterValue(value);
    setPage(1);
  }, []);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            style={{ color: "white" }}
            classNames={{
              base: "w-full sm:max-w-[34%]",
              inputWrapper: "border-1",
              input: "text-white",
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
                  style={{ color: "white" }}
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
                  style={{ color: "white" }}
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

  const classNames = useMemo(() => {
    return {
      wrapper: ["max-h-[382px]", "w-[90vw]"],
      th: ["bg-transparent", "text-default-500", "border-b", "border-divider"],
      td: [
        "text-white",
        "group-data-[first=true]:first:before:rounded-none",
        "group-data-[first=true]:last:before:rounded-none",
        "group-data-[middle=true]:before:rounded-none",
        "group-data-[last=true]:first:before:rounded-none",
        "group-data-[last=true]:last:before:rounded-none",
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
    </>
  );
}

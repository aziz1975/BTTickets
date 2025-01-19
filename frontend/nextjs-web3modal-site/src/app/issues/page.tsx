/* app/issues/page.tsx */
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

import { abi } from "../constants/abi"; // Adjust path
import { PlusIcon } from "../assets/Plusicon"; // Adjust path
import { VerticalDotsIcon } from "../assets/VerticalDotsIcon"; // Adjust path
import { SearchIcon } from "../assets/Searchicon"; // Adjust path
import { ChevronDownIcon } from "../assets/ChevronDownIcon"; // Adjust path
import { capitalize } from "../utils/utils"; // Adjust path

import { useWalletContext } from "../context/WalletContext";

import dotenv from "dotenv";

// Load environment variables from .env and .env.local
dotenv.config({ path: "../../../.env" });

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

interface ProblemReport {
  id: string;
  title: string;
  description: string;
  status: string;
  votes: bigint;
  raisedby: string;
}

type PRColumnKey = keyof ProblemReport | "actions";

type StatusColorKey = "0" | "1" | "2" | "3" | "4" | "5";
type StatusColorValue =
  | "primary"
  | "warning"
  | "default"
  | "success"
  | "danger";
type StatusColorMap = Record<StatusColorKey, StatusColorValue>;

const statusColorMap: StatusColorMap = {
  "0": "primary",
  "1": "warning",
  "2": "default",
  "3": "success",
  "4": "danger",
  "5": "default",
};

const INITIAL_VISIBLE_COLUMNS: PRColumnKey[] = [
  "id",
  "title",
  "description",
  "status",
  "votes",
  "raisedby",
  "actions",
];

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS as string;

// Helper to parse "PR-4" -> 4n
function parseIssueId(idStr: string): bigint {
  if (idStr.startsWith("PR-")) {
    return BigInt(idStr.slice(3));
  }
  return BigInt(idStr);
}

export default function IssuesPage() {
  const { isConnected, signer } = useWalletContext();

  const [isTransactionPending, setIsTransactionPending] = useState<boolean>(false);

  const {
    isOpen: isPRModalOpen,
    onOpen: onPRModalOpen,
    onOpenChange: onPRModalChange,
  } = useDisclosure();

  const [prRequests, setPrRequests] = useState<ProblemReport[]>([]);
  const [prFilterValue, setPrFilterValue] = useState<string>("");
  const [prStatusFilter, setPrStatusFilter] = useState<"all" | Set<string>>("all");
  const [prRowsPerPage, setPrRowsPerPage] = useState<number>(10);
  const [prPage, setPrPage] = useState<number>(1);
  const [prVisibleColumns, setPrVisibleColumns] = useState<Set<PRColumnKey>>(
    new Set(INITIAL_VISIBLE_COLUMNS),
  );
  const [prSelectedKeys, setPrSelectedKeys] = useState<"all" | Set<Key>>(
    new Set<Key>(),
  );
  const [prSortDescriptor, setPrSortDescriptor] = useState<SortDescriptor>({
    column: "status",
    direction: "ascending",
  });

  const [issueTitleValue, setIssueTitleValue] = useState<string>("");
  const [issueDescriptionValue, setIssueDescriptionValue] = useState<string>("");

  useEffect(() => {
    if (isConnected) {
      void getProblemReports();
    }
  }, [isConnected]);

  async function addNewProblemReport(_PRTitle: string, _PRDescription: string) {
    if (!isConnected || !signer || !_PRTitle || !_PRDescription) return;

    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      setIsTransactionPending(true);
      const tx = await contract.addNewIssue(_PRTitle, _PRDescription);
      await tx.wait();
      setIsTransactionPending(false);
      setIssueTitleValue("");
      setIssueDescriptionValue("");
      void getProblemReports();
    } catch (error) {
      console.error(error);
      setIsTransactionPending(false);
    }
  }

  async function getProblemReports() {
    if (!isConnected || !signer) return;
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      const fetchedIssues = await contract.getPRList();

      const mapped: ProblemReport[] = fetchedIssues.map((obj: any) => {
        return {
          id: obj[0].toString(),
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

  const handlePRAction = useCallback(
    async (actionKey: Key, prId: string) => {
      if (!signer) return;

      try {
        setIsTransactionPending(true);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

        const index = parseIssueId(prId);

        if (actionKey === "upvote") {
          const tx = await contract.upVotePR(index);
          await tx.wait();
        } else if ((actionKey as string).startsWith("status-")) {
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

  const hasPRSearchFilter = Boolean(prFilterValue);

  const prHeaderColumns = useMemo(() => {
    if (prVisibleColumns.size === prColumns.length) return prColumns;
    return prColumns.filter((column) =>
      prVisibleColumns.has(column.uid as PRColumnKey),
    );
  }, [prVisibleColumns]);

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
  const prItems = useMemo(() => {
    const start = (prPage - 1) * prRowsPerPage;
    const end = start + prRowsPerPage;
    return prFilteredItems.slice(start, end);
  }, [prPage, prFilteredItems, prRowsPerPage]);

  const prSortedItems = useMemo(() => {
    if (!prSortDescriptor.column) return prItems;
    const colKey = prSortDescriptor.column as keyof ProblemReport;
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

  // --- Design improvement: switch from text-white to text-gray-900/dark:text-gray-100
  const renderPRCell = useCallback(
    (pr: ProblemReport, columnKey: PRColumnKey): ReactNode => {
      const cellValue = pr[columnKey as keyof ProblemReport];
      switch (columnKey) {
        case "id":
          return (
            <div className="flex flex-col text-gray-900 dark:text-gray-100">
              <p className="text-sm font-bold">{pr.id}</p>
            </div>
          );
        case "votes":
          return (
            <div className="flex flex-col text-gray-900 dark:text-gray-100">
              <p className="text-sm font-bold">{pr.votes.toString()}</p>
            </div>
          );
        case "title":
          return (
            <div className="flex flex-col text-gray-900 dark:text-gray-100">
              <p className="text-sm font-semibold">{pr.title}</p>
            </div>
          );
        case "status":
          return (
            <Chip
              className="capitalize gap-1 text-gray-900 dark:text-gray-100"
              color={statusColorMap[pr.status as StatusColorKey]}
              size="sm"
              variant="dot"
            >
              {pr.status}
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
                  aria-label="PR actions"
                  onAction={(key) => handlePRAction(key, pr.id)}
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
    },
    [handlePRAction],
  );

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

  // --- Top content with improved styling
  const prTopContent = useMemo(() => {
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
            value={prFilterValue}
            variant="bordered"
            onClear={() => setPrFilterValue("")}
            onValueChange={onPRSearchChange}
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
                  prStatusFilter === "all" ? new Set<string>() : prStatusFilter
                }
                selectionMode="multiple"
                onSelectionChange={(keys) => setPrStatusFilter(keys as Set<string>)}
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
                selectedKeys={prVisibleColumns}
                selectionMode="multiple"
                onSelectionChange={(keys) =>
                  setPrVisibleColumns(keys as Set<PRColumnKey>)
                }
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {prColumns.map((column) => (
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
              className="bg-transparent outline-none text-default-400 text-small ml-1"
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

  // --- Bottom content with pagination
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

  // --- Table class overrides for better readability
  const classNames = useMemo(() => {
    return {
      wrapper: ["max-h-[382px]", "w-[90vw]"],
      table: "bg-white dark:bg-[#1f1f1f]",
      th: ["bg-transparent", "border-b", "border-divider", "text-gray-900 dark:text-gray-100"],
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
                    {renderPRCell(item, columnKey as PRColumnKey)}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={isPRModalOpen}
        onOpenChange={onPRModalChange}
        placement="top-center"
        className="dark:bg-[#1f1f1f]"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-gray-900 dark:text-gray-100">
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
                  className="text-gray-900 dark:text-gray-100"
                />
                <Input
                  label="Description"
                  placeholder="Enter problem description"
                  type="description"
                  variant="faded"
                  value={issueDescriptionValue}
                  onValueChange={setIssueDescriptionValue}
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
    </>
  );
}

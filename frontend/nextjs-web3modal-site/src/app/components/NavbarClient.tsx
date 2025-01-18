/* app/components/NavbarClient.tsx */
"use client";

import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@nextui-org/navbar";
import { Link as NextUILink } from "@nextui-org/link";
import { Button } from "@nextui-org/react";
import NextLink from "next/link"; // <-- Import Next.js Link
import { EcosystemLogo } from "../EcosystemLogo"; // Adjust if needed

import { useWalletContext } from "../context/WalletContext";

export default function NavbarClient() {
  const { hasMetamask, isConnected, connect } = useWalletContext();

  // Example menu items (mobile)
  const menuItems = ["Integrations", "Problem Reports", "Ecosystem Map"];

  return (
    <Navbar
      isBordered
      disableAnimation
      classNames={{
        base: "bg-default-500/15 shadow-lg",
      }}
    >
      {/* Mobile: Left side toggler */}
      <NavbarContent className="sm:hidden" justify="start">
        <NavbarMenuToggle />
      </NavbarContent>

      {/* Mobile: Center brand */}
      <NavbarContent className="sm:hidden pr-3" justify="center">
        <NavbarBrand>
          <EcosystemLogo />
          <p className="font-bold text-inherit">TRON | BitTorrent</p>
        </NavbarBrand>
      </NavbarContent>

      {/* Desktop: brand + links */}
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarBrand>
          <EcosystemLogo />
          <p className="font-bold text-inherit">|TRON | BitTorrent</p>
        </NavbarBrand>

        {/* Use Next.js Link for actual navigation (client-side), 
            but still keep NextUI styling via as={NextLink} */}
        <NavbarItem>
          <NextUILink as={NextLink} href="/integrations" aria-current="page">
            Integrations
          </NextUILink>
        </NavbarItem>
        <NavbarItem>
          <NextUILink as={NextLink} href="/issues" style={{ color: "blue" }}>
            Issues
          </NextUILink>
        </NavbarItem>
        <NavbarItem>
          <NextUILink as={NextLink} href="#3" style={{ color: "blue" }}>
            Eco Map
          </NextUILink>
        </NavbarItem>
      </NavbarContent>

      {/* Right side: Connect wallet button */}
      <NavbarContent justify="end">
        <NavbarItem>
          {hasMetamask ? (
            isConnected ? (
              <Button
                style={{ backgroundColor: "#006400", color: "#ffffff" }}
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

      {/* Mobile: collapsible menu items */}
      <NavbarMenu>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item}-${index}`}>
            <NextUILink
              as={NextLink}
              className="w-full"
              color="primary"
              href="#"
              size="lg"
            >
              {item}
            </NextUILink>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
}

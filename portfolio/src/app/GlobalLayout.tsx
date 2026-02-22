"use client";

import React, { ReactNode, useState, useRef } from "react";
import styled from "styled-components";
import Link from "next/link";

export const GlobalLayout: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      touchCurrentX.current = e.touches[0].clientX;
      const deltaX = touchCurrentX.current - touchStartX.current;

      // 왼쪽 스와이프 (닫기)
      if (isSidebarVisible && deltaX < -50) {
        setIsSidebarVisible(false);
        touchStartX.current = null;
      }

      // 오른쪽 스와이프 (열기)
      if (!isSidebarVisible && deltaX > 50) {
        setIsSidebarVisible(true);
        touchStartX.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    touchCurrentX.current = 0;
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
    <Container
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AppBar>
        <ToggleButton onClick={toggleSidebar}>☰</ToggleButton>
        <Title>My Portfolio</Title>
      </AppBar>

      <MainContent>
        <SidebarOverlay
          $isVisible={isSidebarVisible}
          onClick={() => setIsSidebarVisible(false)}
        />

        <Sidebar
          $isVisible={isSidebarVisible}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <SidebarContent>
            <SidebarItem href="/">Home</SidebarItem>
            <SidebarItem href="/about">About</SidebarItem>
            <SidebarItem href="/projects">Projects</SidebarItem>
            <SidebarItem href="/threejs">Threejs</SidebarItem>
            <SidebarItem href="/othello">Othello</SidebarItem>
            <SidebarItem href="/contact">Contact</SidebarItem>
          </SidebarContent>
        </Sidebar>

        <Content>{children}</Content>
      </MainContent>

      <Footer>© 2026 My Portfolio</Footer>
    </Container>
  );
};

export default GlobalLayout;

// ================= Styled Components =================

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const AppBar = styled.header`
  background-color: #333;
  color: white;
  display: flex;
  align-items: center;
  padding: 10px 20px;
  position: sticky;
  top: 0;
  z-index: 1100;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  margin-right: 20px;
  cursor: pointer;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 24px;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  min-height: 0;
  position: relative;
`;

const SidebarOverlay = styled.div<{ $isVisible: boolean }>`
  display: none;
  @media (max-width: 768px) {
    display: ${(p) => (p.$isVisible ? "block" : "none")};
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 900;
  }
`;

const Sidebar = styled.aside<{ $isVisible: boolean }>`
  flex: 0 0 ${(p) => (p.$isVisible ? "200px" : "0px")};
  transition: flex-basis 0.3s ease;
  overflow: hidden;
  background: #f4f4f4;

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 200px;
    transform: ${(p) => (p.$isVisible ? "translateX(0)" : "translateX(-100%)")};
    transition: transform 0.3s ease;
    z-index: 1000;
  }
`;

const SidebarContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
`;

const SidebarItem = styled(Link)`
  text-decoration: none;
  color: #333;
  margin: 10px 0;
  font-size: 18px;
  &:hover {
    color: #0070f3;
  }
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
  padding: 20px;
  overflow: auto;
  background-color: #fff;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const Footer = styled.footer`
  background-color: #333;
  color: white;
  text-align: center;
  padding: 10px;
`;
